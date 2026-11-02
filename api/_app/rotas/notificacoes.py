"""Notificações do sino (RF11, RN10).

Avisos gerados automaticamente:
1. Autor: "seu evento foi aprovado"            → admin.aprovar
2. Autor: "seu evento foi rejeitado: motivo"    → admin.rejeitar
3. Todos os usuários: "novo evento em <categoria>" → admin.aprovar
4. Quem curtiu: "o evento que você curtiu foi alterado" → eventos.editar_evento (admin)
"""
from fastapi import APIRouter, Depends

from ..auth import usuario_atual
from ..constantes import CATEGORIAS
from ..db import db

router = APIRouter(prefix="/api/notificacoes", tags=["notificações"])


def notificar(usuario_ids, titulo: str, link: str | None = None) -> None:
    """Cria a mesma notificação para vários usuários de uma vez."""
    linhas = [{"usuario_id": uid, "titulo": titulo, "link": link} for uid in set(usuario_ids) if uid]
    if linhas:
        db().table("notificacoes").insert(linhas).execute()


def avisar_aprovacao(evento: dict) -> None:
    link = f"/eventos/{evento['id']}"
    notificar([evento["criado_por"]], f'Seu evento "{evento["titulo"]}" foi aprovado e já está no site.', link)

    nome_categoria = next((c["nome"] for c in CATEGORIAS if c["slug"] == evento["categoria"]), "saúde")
    todos = db().table("perfis").select("id").neq("id", evento["criado_por"] or "").execute().data
    notificar([p["id"] for p in todos], f'Novo evento em {nome_categoria}: {evento["titulo"]}', link)


def avisar_rejeicao(evento: dict) -> None:
    notificar(
        [evento["criado_por"]],
        f'Seu evento "{evento["titulo"]}" não foi aprovado: {evento["motivo_rejeicao"]}',
        "/meus-eventos",
    )


def avisar_alteracao(evento: dict) -> None:
    curtidas = db().table("curtidas").select("usuario_id").eq("evento_id", evento["id"]).execute().data
    notificar(
        [c["usuario_id"] for c in curtidas],
        f'O evento "{evento["titulo"]}", que você curtiu, teve as informações atualizadas.',
        f"/eventos/{evento['id']}",
    )


@router.get("")
def minhas_notificacoes(usuario: dict = Depends(usuario_atual)):
    """As 20 notificações mais recentes e quantas ainda não foram lidas."""
    itens = (
        db().table("notificacoes").select("*")
        .eq("usuario_id", usuario["id"]).order("criado_em", desc=True).limit(20).execute().data
    )
    nao_lidas = (
        db().table("notificacoes").select("id", count="exact")
        .eq("usuario_id", usuario["id"]).eq("lida", False).execute().count
    )
    return {"itens": itens, "nao_lidas": nao_lidas}


@router.post("/lidas", status_code=204)
def marcar_como_lidas(usuario: dict = Depends(usuario_atual)):
    db().table("notificacoes").update({"lida": True}).eq("usuario_id", usuario["id"]).eq("lida", False).execute()
