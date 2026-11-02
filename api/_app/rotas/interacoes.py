from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import usuario_atual
from ..db import db
from .eventos import buscar_evento

router = APIRouter(tags=["interações"])


class NovoComentario(BaseModel):
    texto: str


def _evento_publicado(evento_id: UUID) -> dict:
    evento = buscar_evento(evento_id)
    if evento["status"] != "publicado":
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return evento


@router.post("/api/eventos/{evento_id}/curtir")
def curtir(evento_id: UUID, usuario: dict = Depends(usuario_atual)):
    """Liga/desliga a curtida (RF09). Uma por usuário por evento, garantida pela chave da tabela (RN22)."""
    _evento_publicado(evento_id)
    chave = {"usuario_id": usuario["id"], "evento_id": str(evento_id)}
    existente = db().table("curtidas").select("usuario_id").match(chave).execute().data

    if existente:
        db().table("curtidas").delete().match(chave).execute()
    else:
        db().table("curtidas").insert(chave).execute()

    total = db().table("curtidas").select("usuario_id", count="exact").eq("evento_id", str(evento_id)).execute().count
    return {"curtiu": not existente, "total_curtidas": total}


@router.get("/api/eventos/{evento_id}/comentarios")
def listar_comentarios(evento_id: UUID):
    """Comentários do evento, do mais antigo para o mais novo."""
    _evento_publicado(evento_id)
    resposta = (
        db().table("comentarios")
        .select("id, texto, criado_em, usuario_id, autor:perfis(nome)")
        .eq("evento_id", str(evento_id)).order("criado_em").execute()
    )
    return resposta.data


@router.post("/api/eventos/{evento_id}/comentarios", status_code=201)
def comentar(evento_id: UUID, dados: NovoComentario, usuario: dict = Depends(usuario_atual)):
    """Comentar exige login (RN08, RN23)."""
    texto = dados.texto.strip()
    if not 1 <= len(texto) <= 1000:
        raise HTTPException(status_code=400, detail="O comentário deve ter entre 1 e 1000 caracteres.")
    _evento_publicado(evento_id)
    novo = db().table("comentarios").insert(
        {"evento_id": str(evento_id), "usuario_id": usuario["id"], "texto": texto}
    ).execute().data[0]
    return novo | {"autor": {"nome": usuario["nome"]}}


@router.delete("/api/comentarios/{comentario_id}", status_code=204)
def remover_comentario(comentario_id: UUID, usuario: dict = Depends(usuario_atual)):
    """O autor apaga o próprio comentário; o admin remove qualquer um (RF10, RN09)."""
    resposta = db().table("comentarios").select("usuario_id").eq("id", str(comentario_id)).limit(1).execute()
    if not resposta.data:
        raise HTTPException(status_code=404, detail="Comentário não encontrado")
    if usuario["papel"] != "admin" and resposta.data[0]["usuario_id"] != usuario["id"]:
        raise HTTPException(status_code=403, detail="Você não pode remover este comentário.")
    db().table("comentarios").delete().eq("id", str(comentario_id)).execute()
