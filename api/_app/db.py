import os
from functools import lru_cache

from dotenv import load_dotenv
from fastapi import HTTPException
from supabase import Client, create_client

load_dotenv()


@lru_cache
def _cliente() -> Client:
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])


def db() -> Client:
    """Cliente do Supabase com a service role key (só existe no servidor)."""
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_SERVICE_ROLE_KEY"):
        raise HTTPException(
            status_code=503,
            detail="Banco não configurado: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env",
        )
    return _cliente()
