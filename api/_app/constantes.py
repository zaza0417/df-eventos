# Mantenha igual a frontend/src/app/core/constantes.ts

CATEGORIAS = [
    {"slug": "vacinacao", "nome": "Vacinação"},
    {"slug": "saude_mental", "nome": "Saúde mental"},
    {"slug": "atividade_fisica", "nome": "Atividade física"},
    {"slug": "nutricao", "nome": "Nutrição"},
    {"slug": "doacao_sangue", "nome": "Doação de sangue"},
    {"slug": "saude_mulher", "nome": "Saúde da mulher"},
    {"slug": "saude_idoso", "nome": "Saúde do idoso"},
    {"slug": "prevencao", "nome": "Prevenção e exames"},
]

REGIOES = [
    "Plano Piloto", "Águas Claras", "Brazlândia", "Ceilândia", "Cruzeiro", "Gama", "Guará",
    "Itapoã", "Lago Norte", "Lago Sul", "Núcleo Bandeirante", "Paranoá", "Planaltina",
    "Recanto das Emas", "Riacho Fundo", "Samambaia", "Santa Maria", "São Sebastião",
    "Sobradinho", "Sudoeste/Octogonal", "Taguatinga", "Vicente Pires",
]

SLUGS_CATEGORIAS = {c["slug"] for c in CATEGORIAS}
