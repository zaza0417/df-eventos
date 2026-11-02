"""Ponto de entrada da API na Vercel (e no uvicorn local).

A Vercel transforma cada arquivo .py de /api em uma função. Por isso o código
fica em /api/_app: pastas que começam com "_" não viram funções.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from _app.main import app  # noqa: E402,F401
