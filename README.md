# DF Evento**S**

Plataforma que reúne eventos e ações sociais de **saúde e bem-estar** no Distrito Federal.
Protótipo acadêmico da disciplina Análise e Projeto de Sistemas, curso de Sistemas de Informação da UDF, 2026.2.

| Parte | Tecnologia | Pasta |
|---|---|---|
| Front-end | Angular 20 | `frontend/` |
| Back-end | Python 3.12 + FastAPI | `api/` |
| Banco e login | Supabase (Postgres + Auth) | `supabase/` |
| Hospedagem | Vercel | `vercel.json` |

**Documentos:**
- [Plano de implementação](docs/PLANO_IMPLEMENTACAO.md)
- [Roteiro da apresentação](docs/ROTEIRO_APRESENTACAO.md), com a preparação, as falas, o slide de trabalhos futuros e as perguntas prováveis da banca

---

## O que o sistema faz

| Quem | Pode |
|---|---|
| Visitante | Ver a programação, filtrar por categoria, data e região administrativa, abrir o evento, ver no mapa e compartilhar |
| Usuário com conta | Tudo acima, mais: curtir, comentar, **divulgar eventos** (que entram como *Em análise*), acompanhar em *Meus eventos* e receber avisos no sino |
| Admin | Tudo acima, mais: **aprovar ou não aprovar** eventos (com motivo), editar e excluir qualquer evento e remover comentários |

Avisos automáticos do sino:
- Para quem divulgou: o evento foi aprovado, ou não foi aprovado (com o motivo).
- Para todos os usuários: saiu um evento novo numa categoria.
- Para quem curtiu: o evento foi alterado.

---

## 1. Criar o banco no Supabase (uma vez)

1. Crie uma conta em <https://supabase.com> e clique em **New project**. Escolha a região **South America (São Paulo)**.
2. No menu lateral, abra **SQL Editor**, clique em **New query**, cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
3. Faça o mesmo com [`supabase/seed.sql`](supabase/seed.sql). Ele cria 15 eventos de exemplo fictícios, com datas contadas a partir de hoje.
4. Em **Authentication › Sign In / Providers › Email**, desligue **Confirm email**. Assim o cadastro entra direto, sem esperar e-mail; o plano gratuito envia poucos e-mails por hora.
5. Em **Project Settings › API Keys**, pegue as chaves:
   - A chave **secret** (`sb_secret_...`, chamada de *service_role* em projetos antigos) vai no `.env` e na Vercel. **Ela é secreta:** nunca a coloque no Angular nem no GitHub.
   - A chave **publishable** (`sb_publishable_...`, ou *anon*) vai em `frontend/src/environments/environment.ts`. Essa pode ficar pública.
6. A **Project URL** vai nos dois lugares, no formato `https://xxxx.supabase.co`, sem `/rest/v1` no final.
7. **Para virar admin:** crie sua conta pelo site e, no Supabase, em **Table Editor › perfis**, troque o `papel` para `admin`. Depois saia e entre de novo no site.
8. *(Opcional, para a apresentação)* Com pelo menos duas contas criadas, rode [`supabase/demo.sql`](supabase/demo.sql). Ele coloca curtidas e comentários de exemplo nos eventos.

## 2. Rodar no computador

Pré-requisitos: **Node 20.19+ ou 22**, **Python 3.12** e Git.

> **Windows com nvm:** se o terminal disser `Node.js version v14... detected`, rode `nvm use 22.23.2` antes. O Angular 20 não funciona no Node 14.

Terminal 1, a API, na pasta `df-eventos`:

```bash
# SÓ NA PRIMEIRA VEZ (se o .env ainda não existir), senão apaga as chaves já coladas:
cp .env.example .env          # depois edite o .env com a URL e a chave secreta

py -3.12 -m venv .venv        # Windows (no Mac/Linux: python3.12 -m venv .venv)
.venv\Scripts\pip install -r requirements.txt uvicorn
.venv\Scripts\python -m uvicorn api.index:app --port 8000
```

Terminal 2, o site, na pasta `df-eventos\frontend`:

```bash
npm install
npm start
```

- **Site:** <http://localhost:4200>. O Angular repassa `/api/*` para o Python; veja `frontend/proxy.conf.json`.
- **Documentação da API (Swagger):** <http://localhost:8000/api/docs>
- **Mudou algo no Python?** Pare a API (Ctrl+C) e rode de novo. O `--reload` automático trava com frequência dentro do OneDrive, por isso ele não está no comando.

## 3. Publicar na Vercel

1. Suba o projeto para um repositório no GitHub. O `.gitignore` já deixa de fora o `.env` e as pastas `node_modules` e `.venv`.
2. Em <https://vercel.com>, clique em **Add New › Project** e importe o repositório. As configurações de build já estão no `vercel.json`, então não precisa mudar nada.
3. Antes do deploy, abra **Environment Variables** e cadastre:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (com a chave **secret**)
4. Clique em **Deploy**. Depois disso, cada `git push` na `main` publica sozinho.

Para testar se deu certo, abra `https://SEU-SITE.vercel.app/api/saude`; a resposta deve ser `{"status":"ok"}`. A página inicial deve listar os eventos do seed.

## Estrutura

```
api/
  index.py              entrada da API (Vercel / uvicorn)
  _app/                 código da API ("_" impede a Vercel de criar uma função por arquivo)
    main.py             cria o app e registra as rotas
    auth.py             confere o token do usuário e exige login ou admin
    db.py               conexão com o Supabase
    constantes.py       categorias e regiões administrativas
    rotas/
      eventos.py        programação, detalhe, divulgar, editar, excluir, meus eventos
      admin.py          fila de validação: aprovar e não aprovar
      interacoes.py     curtidas e comentários
      notificacoes.py   sino e avisos automáticos
frontend/src/app/
  core/                 serviços (API, login), guards, modelos e constantes
  shared/               logo, ícones, azulejos, silhueta do Congresso, placa de região, card da agenda, sino
  pages/                uma pasta por tela: inicio, evento-detalhe, entrar, cadastro, divulgar, meus-eventos, admin
supabase/
  schema.sql            tabelas, gatilhos e segurança (RLS)
  seed.sql              eventos de exemplo
  demo.sql              curtidas e comentários de exemplo (usa as contas existentes)
docs/
  PLANO_IMPLEMENTACAO.md
  ROTEIRO_APRESENTACAO.md
```

## Identidade visual

- **Cores:** as da bandeira do DF, verde `#006c35`, amarelo-ouro `#ffc72c` e branco.
- **Fontes:** *Saira Condensed* nos títulos, que lembram as placas de rua, e *Public Sans* no texto.
- **Referências de Brasília:** os azulejos geométricos da página inicial e do ingresso homenageiam Athos Bulcão; o rodapé tem a silhueta do Congresso Nacional; as regiões administrativas aparecem como placas verdes de rua.
- **Ícones:** [Lucide](https://lucide.dev), de licença livre, desenhados pelo componente `shared/icone`.

## Avisos

- **O Supabase gratuito pausa o projeto depois de cerca de uma semana sem acesso.** Entre no painel e reative se o site parar de listar eventos.
- Categorias e regiões existem em dois lugares: `api/_app/constantes.py` e `frontend/src/app/core/constantes.ts`. Ao mudar um, mude o outro. O ícone de cada categoria fica em `shared/icone/icone.ts`, com o mesmo nome do slug.
