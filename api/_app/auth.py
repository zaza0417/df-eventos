"""Quem está chamando a API.

O Angular faz login no Supabase Auth e envia o token em `Authorization: Bearer <token>`.
Aqui o token é conferido no próprio Supabase e o perfil (nome, papel) é carregado.
Uso nas rotas:  usuario: dict = Depends(usuario_atual)   ou   Depends(exige_admin)
"""
from fastapi import Depends, Header, HTTPException

from .db import db


def _token(authorization: str | None) -> str | None:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip() or None
    return None


def usuario_opcional(authorization: str | None = Header(default=None)) -> dict | None:
    """Perfil do usuário logado, ou None para visitante (RN02)."""
    token = _token(authorization)
    if not token:
        return None
    try:
        resposta = db().auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Sessão expirada. Entre novamente.")
    if not resposta or not resposta.user:
        raise HTTPException(status_code=401, detail="Sessão expirada. Entre novamente.")

    perfil = db().table("perfis").select("*").eq("id", resposta.user.id).limit(1).execute()
    if not perfil.data:
        raise HTTPException(status_code=401, detail="Perfil não encontrado.")
    return perfil.data[0]


def usuario_atual(usuario: dict | None = Depends(usuario_opcional)) -> dict:
    """Exige login (RN02, RN08, RN23)."""
    if usuario is None:
        raise HTTPException(status_code=401, detail="Entre na sua conta para continuar.")
    return usuario


def exige_admin(usuario: dict = Depends(usuario_atual)) -> dict:
    """Exige papel de administrador (RN14, RN21)."""
    if usuario["papel"] != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem fazer isso.")
    return usuario
