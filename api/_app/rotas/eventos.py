import re
from datetime import date, datetime, time
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import usuario_atual, usuario_opcional
from ..constantes import REGIOES, SLUGS_CATEGORIAS
from ..db import db
from .notificacoes import avisar_alteracao

router = APIRouter(prefix="/api/eventos", tags=["eventos"])
router_meus = APIRouter(tags=["eventos"])

CAMPOS = "*, curtidas(count), comentarios(count)"


def hoje() -> date:
    return datetime.now(ZoneInfo("America/Sao_Paulo")).date()


def achatar_contagens(evento: dict) -> dict:
    """O Supabase devolve curtidas: [{"count": 3}]; transformamos em total_curtidas: 3."""
    evento["total_curtidas"] = (evento.pop("curtidas", None) or [{"count": 0}])[0]["count"]
    evento["total_comentarios"] = (evento.pop("comentarios", None) or [{"count": 0}])[0]["count"]
    return evento


def buscar_evento(evento_id: UUID) -> dict:
    resposta = db().table("eventos").select(CAMPOS).eq("id", str(evento_id)).limit(1).execute()
    if not resposta.data:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return achatar_contagens(resposta.data[0])


class EventoEntrada(BaseModel):
    """Dados do formulário "Divulgar evento" (RF03)."""

    titulo: str
    descricao: str
    categoria: str
    data: date
    hora_inicio: time
    hora_fim: time | None = None
    local_nome: str
    endereco: str
    regiao: str


def validar(dados: EventoEntrada) -> dict:
    """Regras RN03, RN16 e RN17. Devolve os dados limpos ou um erro 400 em português."""
    limpo = dados.model_dump()
    for campo in ("titulo", "descricao", "local_nome", "endereco"):
        limpo[campo] = limpo[campo].strip()

    erros = []
    if not 5 <= len(limpo["titulo"]) <= 120:
        erros.append("O nome do evento deve ter entre 5 e 120 caracteres.")
    if len(limpo["descricao"]) < 20:
        erros.append("A descrição deve ter pelo menos 20 caracteres.")
    if limpo["categoria"] not in SLUGS_CATEGORIAS:
        erros.append("Escolha uma categoria válida.")
    if limpo["regiao"] not in REGIOES:
        erros.append("Escolha uma região administrativa válida.")
    if not limpo["local_nome"] or not limpo["endereco"]:
        erros.append("Informe o local e o endereço.")
    if dados.data < hoje():
        erros.append("A data do evento não pode estar no passado.")
    if dados.hora_fim and dados.hora_fim <= dados.hora_inicio:
        erros.append("O horário de término deve ser depois do início.")
    if erros:
        raise HTTPException(status_code=400, detail=" ".join(erros))

    # O Supabase recebe data e hora como texto
    limpo["data"] = dados.data.isoformat()
    limpo["hora_inicio"] = dados.hora_inicio.strftime("%H:%M")
    limpo["hora_fim"] = dados.hora_fim.strftime("%H:%M") if dados.hora_fim else None
    return limpo


@router.get("")
def listar_eventos(
    q: str | None = None,
    categoria: str | None = None,
    regiao: str | None = None,
    de: date | None = None,
    ate: date | None = None,
):
    """Eventos publicados de hoje em diante (RN06), com filtros opcionais (RF08, RF21)."""
    consulta = (
        db().table("eventos").select(CAMPOS)
        .eq("status", "publicado")
        .gte("data", max(de or hoje(), hoje()).isoformat())
    )
    if ate:
        consulta = consulta.lte("data", ate.isoformat())
    if categoria:
        consulta = consulta.eq("categoria", categoria)
    if regiao:
        consulta = consulta.eq("regiao", regiao)
    if q:
        # Remove caracteres que têm significado especial no filtro do Supabase
        termo = re.sub(r'[,()%*\\"]', " ", q).strip()
        if termo:
            consulta = consulta.or_(
                f"titulo.ilike.%{termo}%,descricao.ilike.%{termo}%,local_nome.ilike.%{termo}%"
            )
    resposta = consulta.order("data").order("hora_inicio").execute()
    return [achatar_contagens(e) for e in resposta.data]


@router.get("/{evento_id}")
def detalhar_evento(evento_id: UUID, usuario: dict | None = Depends(usuario_opcional)):
    """Detalhe do evento (RF07). Pendentes e rejeitados só aparecem para o autor e o admin (RN05)."""
    evento = buscar_evento(evento_id)
    e_autor = usuario is not None and evento["criado_por"] == usuario["id"]
    e_admin = usuario is not None and usuario["papel"] == "admin"
    if evento["status"] != "publicado" and not (e_autor or e_admin):
        raise HTTPException(status_code=404, detail="Evento não encontrado")

    evento["curtiu"] = False
    if usuario is not None:
        curtida = (
            db().table("curtidas").select("usuario_id")
            .match({"usuario_id": usuario["id"], "evento_id": str(evento_id)}).execute()
        )
        evento["curtiu"] = bool(curtida.data)
    return evento


@router.post("", status_code=201)
def criar_evento(dados: EventoEntrada, usuario: dict = Depends(usuario_atual)):
    """Divulgar evento: entra como pendente e vai para a validação (RF03, RF04)."""
    novo = validar(dados) | {"status": "pendente", "criado_por": usuario["id"]}
    resposta = db().table("eventos").insert(novo).execute()
    return resposta.data[0]


@router.put("/{evento_id}")
def editar_evento(evento_id: UUID, dados: EventoEntrada, usuario: dict = Depends(usuario_atual)):
    """Editar evento (RF12).
    - Autor: só enquanto pendente ou rejeitado; ao salvar, volta para a fila de validação.
    - Admin: qualquer evento; o status não muda (RN14).
    """
    evento = buscar_evento(evento_id)
    alteracoes = validar(dados)

    if usuario["papel"] == "admin":
        pass
    elif evento["criado_por"] == usuario["id"]:
        if evento["status"] == "publicado":
            raise HTTPException(status_code=403, detail="Eventos já publicados só podem ser alterados pela administração.")
        alteracoes |= {"status": "pendente", "motivo_rejeicao": None}
    else:
        raise HTTPException(status_code=403, detail="Você só pode editar os eventos que divulgou.")

    resposta = db().table("eventos").update(alteracoes).eq("id", str(evento_id)).execute()
    atualizado = resposta.data[0]
    if evento["status"] == "publicado":
        avisar_alteracao(atualizado)  # RN10: quem curtiu fica sabendo da mudança
    return atualizado


@router.delete("/{evento_id}", status_code=204)
def excluir_evento(evento_id: UUID, usuario: dict = Depends(usuario_atual)):
    """Excluir evento (RN28): o autor exclui os seus que não estão publicados; o admin exclui qualquer um."""
    evento = buscar_evento(evento_id)
    e_autor = evento["criado_por"] == usuario["id"]
    if usuario["papel"] != "admin" and not (e_autor and evento["status"] != "publicado"):
        raise HTTPException(status_code=403, detail="Você não pode excluir este evento.")
    db().table("eventos").delete().eq("id", str(evento_id)).execute()


@router_meus.get("/api/meus-eventos")
def meus_eventos(usuario: dict = Depends(usuario_atual)):
    """Eventos divulgados pelo usuário, de todos os status (RF20)."""
    resposta = (
        db().table("eventos").select(CAMPOS)
        .eq("criado_por", usuario["id"])
        .order("criado_em", desc=True).execute()
    )
    return [achatar_contagens(e) for e in resposta.data]
