from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import exige_admin
from ..db import db
from .eventos import CAMPOS, achatar_contagens, buscar_evento
from .notificacoes import avisar_aprovacao, avisar_rejeicao

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Há duas ligações de eventos com perfis (criado_por e validado_por); aqui escolhemos a do autor
CAMPOS_ADMIN = f"{CAMPOS}, autor:perfis!eventos_criado_por_fkey(nome, email)"


class Rejeicao(BaseModel):
    motivo: str


@router.get("/eventos")
def listar_eventos(
    status: Literal["pendente", "publicado", "rejeitado"] | None = None,
    _admin: dict = Depends(exige_admin),
):
    """Todos os eventos, de qualquer status (RF15, RF19). Pendentes vêm dos mais antigos para os mais novos."""
    consulta = db().table("eventos").select(CAMPOS_ADMIN)
    if status:
        consulta = consulta.eq("status", status)
    consulta = consulta.order("criado_em", desc=status != "pendente")
    return [achatar_contagens(e) for e in consulta.execute().data]


@router.post("/eventos/{evento_id}/aprovar")
def aprovar(evento_id: UUID, admin: dict = Depends(exige_admin)):
    """Aprova e publica o evento (RF05, RF06, RN26) e avisa o autor e os usuários (RN10)."""
    anterior = buscar_evento(evento_id)
    resposta = (
        db().table("eventos")
        .update({"status": "publicado", "motivo_rejeicao": None, "validado_por": admin["id"]})
        .eq("id", str(evento_id)).execute()
    )
    evento = resposta.data[0]
    if anterior["status"] != "publicado":
        avisar_aprovacao(evento)
    return evento


@router.post("/eventos/{evento_id}/rejeitar")
def rejeitar(evento_id: UUID, dados: Rejeicao, admin: dict = Depends(exige_admin)):
    """Rejeita o evento com um motivo obrigatório, que o autor verá em "Meus eventos" (RN04)."""
    motivo = dados.motivo.strip()
    if len(motivo) < 5:
        raise HTTPException(status_code=400, detail="Explique o motivo da rejeição (mínimo de 5 caracteres).")
    buscar_evento(evento_id)
    resposta = (
        db().table("eventos")
        .update({"status": "rejeitado", "motivo_rejeicao": motivo, "validado_por": admin["id"]})
        .eq("id", str(evento_id)).execute()
    )
    evento = resposta.data[0]
    avisar_rejeicao(evento)
    return evento
