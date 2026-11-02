from fastapi import Depends, FastAPI

from .auth import usuario_atual
from .constantes import CATEGORIAS, REGIOES
from .rotas import admin, eventos, interacoes, notificacoes

app = FastAPI(
    title="DF EventoS API",
    description="API do protótipo DF EventoS — eventos de saúde e bem-estar no DF.",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.include_router(eventos.router)
app.include_router(eventos.router_meus)
app.include_router(admin.router)
app.include_router(interacoes.router)
app.include_router(notificacoes.router)


@app.get("/api/saude", tags=["sistema"])
def saude():
    """Confirma que a API está no ar."""
    return {"status": "ok"}


@app.get("/api/eu", tags=["conta"])
def meu_perfil(usuario: dict = Depends(usuario_atual)):
    """Perfil do usuário logado (nome, e-mail e papel)."""
    return usuario


@app.get("/api/categorias", tags=["sistema"])
def listar_categorias():
    return CATEGORIAS


@app.get("/api/regioes", tags=["sistema"])
def listar_regioes():
    return REGIOES
