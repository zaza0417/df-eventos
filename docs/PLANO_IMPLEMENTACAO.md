# DF Evento**S** — Plano de Implementação do Protótipo (escopo reduzido)

> **DF EventoS** (o **S** é de *Social*) — plataforma que centraliza eventos e ações sociais de **saúde e bem-estar** no Distrito Federal.
> Base: documento *"DF EventoS – Documentação de Negócios, Requisitos e Modelagem UML"* (UDF, Análise e Projeto de Sistemas, 2026.2).
>
> **Objetivo do protótipo:** demonstrar o fluxo central do sistema funcionando de ponta a ponta — **encontrar evento → interagir → divulgar evento → validar → publicar → notificar** — com o menor número possível de telas e tabelas.

## Situação atual (02/11/2026)

| Fase | Situação |
|---|---|
| 0. Preparação | ✅ Supabase criado, schema e seed rodados |
| 1. Público | ✅ |
| 2. Contas | ✅ |
| 3. Divulgar e validar | ✅ |
| 4. Interação e notificações | ✅ |
| 5. Acabamento | ✅ Identidade visual de Brasília, `supabase/demo.sql` e [roteiro da apresentação](ROTEIRO_APRESENTACAO.md) |
| Publicar na Vercel | a fazer |

O que mudou em relação a este plano durante a implementação:
- **Visual:** a identidade passou a ser de Brasília. Saíram os emojis e as cores de arco-íris por categoria; entraram ícones de linha, azulejos inspirados em Athos Bulcão, a silhueta do Congresso, as regiões como placas de rua e a programação em formato de agenda (detalhes no README).
- **Notificações:** saem para todos os usuários quando um evento novo é publicado; não há escolha de categorias de interesse.
- **Admin:** a tela se chama "Validar eventos". Remover comentários acontece na própria página do evento.

---

## 1. O que é e para que serve

| Item | Resumo |
|---|---|
| **Problema** | Ações sociais de saúde no DF ficam espalhadas em redes sociais e sites de órgãos; é difícil saber *o que*, *quando* e *onde* acontece. |
| **Solução** | Um site único onde a população **encontra**, **filtra** e **interage** com eventos de saúde e bem-estar, com publicações **validadas** por um administrador. |
| **Público** | Visitante (consulta) · Usuário cadastrado (divulga, curte, comenta) · Administrador (valida e gerencia). |
| **Regra de ouro** | Evento cadastrado fica **pendente**; só aparece para o público depois de **aprovado** pelo admin (RN05, RN06, RN27). |

---

## 2. O que entra e o que fica fora do protótipo

### ✅ Entra (o que será demonstrado)

| Funcionalidade | Requisitos |
|---|---|
| Lista de eventos com busca e filtro por categoria, data e região | RF06, RF07, RF08, RF21 |
| Detalhe do evento | RF07 |
| Cadastro e login de usuário (Supabase Auth) | RF01, RF02 |
| Divulgar evento (vai como pendente) e editar enquanto pendente | RF03, RF04, RF12 |
| "Meus eventos" com status (Em análise / Publicado / Rejeitado) | RF20 |
| Admin: aprovar ou rejeitar (com motivo), editar e excluir eventos | RF05, RF15, RF19 |
| Curtir (1 por usuário) e comentar | RF09 |
| Admin remove comentário direto na página do evento | RF10 |
| Compartilhar (WhatsApp / copiar link) | RF22 |
| Notificações simples no sino | RF11 |

### ⏭ Fica para trabalhos futuros (citar na apresentação)

| Funcionalidade | Requisitos | Como fica no protótipo |
|---|---|---|
| Coleta automática em sites oficiais | RF13, RF14 | Não implementada (ver seção 9, "Extra") |
| Detecção de eventos duplicados | RF26 | Admin confere manualmente na validação |
| Denúncias de evento/comentário | RF23 | Admin remove comentários diretamente |
| Registro/histórico de alterações | RF24 | Só `criado_em` / `atualizado_em` |
| Tela de gestão de usuários e permissões | RF25 | Admin definido direto no painel do Supabase |
| Recuperação de senha, edição de perfil, exclusão de conta | RF16, RF17, RF18 | Não implementadas |
| MFA no login | diagrama de login | Não implementado |
| Revalidação ao editar evento publicado | RN19 | Usuário só edita evento pendente; admin edita qualquer um |

---

## 3. Arquitetura

```
                 ┌──────────────────────── Vercel ─────────────────────┐
 Navegador ─────▶│  Angular (site estático)      /api/*  →  FastAPI    │
 (PC / celular)  │  - telas e rotas              (Python serverless)   │
                 │  - login com supabase-js      - regras de negócio   │
                 └────────────┬──────────────────────────┬─────────────┘
                              │ Auth (token JWT)         │ banco
                              ▼                          ▼
                 ┌──────────────────────── Supabase ───────────────────┐
                 │  Auth (cadastro/login)    Postgres (5 tabelas)      │
                 └─────────────────────────────────────────────────────┘
```

- **Um repositório e um deploy só** na Vercel: `frontend/` (Angular) + `api/` (Python).
- **Login com Supabase Auth**, feito no Angular. As senhas são guardadas com hash pelo próprio Supabase (RNF11, RNF18).
- **Todo o resto passa pelo FastAPI.** O Angular manda o token no header `Authorization`, e o Python confere quem é o usuário e se ele é admin (RN21).
- **Sem upload de imagem:** cada categoria tem um ícone e uma cor, e o card usa esse visual. Isso elimina o Storage.
- **Notificações:** o sino consulta `/api/notificacoes` ao abrir a página. Sem tempo real.

| Camada | Tecnologia |
|---|---|
| Front-end | Angular 20 (standalone), Angular Material, SCSS |
| Back-end | Python 3.12, FastAPI, `supabase-py`, `pyjwt` |
| Banco / Auth | Supabase |
| Hospedagem | Vercel (deploy automático a cada push no GitHub) |

---

## 4. Perfis de acesso

| Ação | Visitante | Usuário | Admin |
|---|:-:|:-:|:-:|
| Ver, buscar e compartilhar eventos | ✅ | ✅ | ✅ |
| Curtir e comentar | — | ✅ | ✅ |
| Divulgar evento / ver "Meus eventos" | — | ✅ | ✅ |
| Aprovar, rejeitar, editar e excluir qualquer evento | — | — | ✅ |
| Remover comentários | — | — | ✅ |

---

## 5. Telas (7 telas + 1 componente)

```
/                 Início              (público)
/eventos/:id      Detalhe do evento   (público)
/entrar           Login               (público)
/cadastro         Cadastro            (público)
/divulgar         Divulgar evento     (logado)   — também usada para editar: /divulgar/:id
/meus-eventos     Meus eventos        (logado)
/admin            Validação e gestão  (admin)
🔔 Sino de notificações — componente na barra do topo (sem página própria)
```

Barra do topo: logo *DF Evento**S***, campo de busca, botão **"＋ Divulgar evento"**, 🔔 e Entrar/Sair. No celular, a busca fica abaixo do logo (RNF10).

### 5.1 Início (`/`)

```
┌────────────────────────────────────────────────────────────┐
│ DF EventoS   [🔍 Buscar evento ou local]  ＋Divulgar  🔔 Sair │
├────────────────────────────────────────────────────────────┤
│ Saúde e bem-estar perto de você, no DF                     │
│ [Todos] [💉Vacinação] [🧠Saúde mental] [🏃Atividade] [🩸Doação]│
│ Quando: [Qualquer data ▾]    Região: [Todo o DF ▾]          │
├────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│ │ 💉 VACIN.│ │ 🏃 ATIV. │ │ 🩸 DOAÇÃO│  ← faixa na cor da   │
│ │ Campanha │ │ Caminhada│ │ Doação de│    categoria         │
│ │ 12/11 9h │ │ 15/11 7h │ │ 20/11 8h │                     │
│ │ Ceilândia│ │ Pq. Cidade│ │ Asa Sul │                     │
│ │ ♥ 24 💬 5│ │ ♥ 10 💬 2│ │ ♥ 3  💬 0│                     │
│ └──────────┘ └──────────┘ └──────────┘                     │
│ Não encontrou? [Divulgue um evento]                        │
└────────────────────────────────────────────────────────────┘
```

- Mostra só eventos **publicados** com data de hoje em diante, ordenados pela data (RN06).
- A busca procura no título, na descrição e no local (RN07).
- Se nada for encontrado, aparece "Nenhum evento encontrado" e o botão "Divulgue um evento", seguindo o diagrama de consulta.

### 5.2 Detalhe do evento (`/eventos/:id`)

```
┌────────────────────────────────────────────────────────────┐
│ ← Voltar                                                   │
│ 💉 VACINAÇÃO                                               │
│ Campanha de vacinação contra gripe                         │
│ 📅 12/11/2026 · 09h às 17h                                 │
│ 📍 UBS 5 – QNN 13, Ceilândia      [Ver no mapa]            │
│ Descrição ................................................ │
│ [♥ Curtir 24]  [WhatsApp]  [Copiar link]                   │
│ ─── Comentários (5) ───                                    │
│ [Escreva um comentário...]                     [Enviar]    │
│ Ana · 2h atrás: "Precisa levar cartão do SUS?"   [🗑 admin] │
└────────────────────────────────────────────────────────────┘
```

- **Curtir:** liga e desliga, uma curtida por usuário (RN22). O visitante que clicar é mandado para "Entrar" (RN08, RN23).
- **Ver no mapa:** é só um link do Google Maps com o endereço.
- **WhatsApp:** link `https://wa.me/?text=...` com o título e o link do evento.
- **🗑:** aparece só para o admin e remove o comentário (RN09).

### 5.3 Entrar e Cadastro

- **Cadastro:** nome, e-mail, senha (mínimo 8 caracteres) e confirmação. Se o e-mail já existir, aparece "Este e-mail já está cadastrado" (RN01, RN15, diagrama de cadastramento).
- **Entrar:** e-mail e senha. Se falhar, aparece "E-mail ou senha inválidos" (RN02).

### 5.4 Divulgar evento (`/divulgar`, `/divulgar/:id`)

| Campo | Regra |
|---|---|
| Nome do evento* | 5 a 120 caracteres |
| Categoria* | lista |
| Descrição* | mínimo de 20 caracteres |
| Data* | hoje ou depois (RN17) |
| Horário de início* e de fim | fim depois do início |
| Local* e endereço* | texto |
| Região administrativa* | lista das RAs do DF |

- O botão **"Enviar para análise"** só fica ativo com todos os campos obrigatórios válidos (RN03, RN16).
- Depois de enviar, aparece a mensagem "Recebemos seu evento! Ele aparecerá no site após a análise", e o usuário vai para "Meus eventos".
- O usuário só edita evento **pendente** ou **rejeitado**. Ao reenviar, o evento volta a ficar pendente.

### 5.5 Meus eventos (`/meus-eventos`)

Lista dos eventos do usuário com uma etiqueta de status: 🟡 **Em análise**, 🟢 **Publicado** e 🔴 **Rejeitado** (junto com o motivo). Pendentes e rejeitados têm os botões **Editar** e **Excluir**.

### 5.6 Admin (`/admin`)

Uma única tela com duas abas:

```
[ Pendentes (4) ]  [ Todos os eventos ]
┌──────────────────────────────┬─────────────────────────────────┐
│ ▸ Campanha de vacinação      │ Campanha de vacinação – gripe   │
│   Yoga no parque             │ Enviado por: maria@... em 30/10 │
│   Feira de saúde             │ 12/11 · 09h · UBS 5 – Ceilândia │
│   Palestra sobre ansiedade   │ Descrição completa...           │
│                              │ [✓ Aprovar] [✕ Rejeitar] [✎]    │
└──────────────────────────────┴─────────────────────────────────┘
```

- **Pendentes:** a lista começa pelos mais antigos. **Aprovar** publica o evento (RF05, RF06, RN26). **Rejeitar** abre uma caixa em que o motivo é obrigatório (RN04).
- **Todos os eventos:** tabela com filtro por status e as ações editar e excluir (RF15, RF19, RN14, RN28).

### 5.7 Sino de notificações (componente)

Mostra um contador de não lidas e uma lista curta. Ao abrir o sino, todas ficam marcadas como lidas. Quatro tipos de notificação:
1. "Seu evento **X** foi aprovado e já está no site", para o autor.
2. "Seu evento **X** foi rejeitado: *motivo*", para o autor.
3. "Novo evento em **Vacinação**: X", para todos os usuários quando um evento é publicado (RN10).
4. "O evento **X**, que você curtiu, foi alterado", quando o admin edita um evento publicado.

---

## 6. Banco de dados (5 tabelas)

| Tabela | Colunas |
|---|---|
| **perfis** | `id` (= auth.users.id), `nome`, `email`, `papel` (`usuario` / `admin`), `criado_em` |
| **eventos** | `id`, `titulo`, `descricao`, `categoria` (texto: `vacinacao`, `saude_mental`…), `data`, `hora_inicio`, `hora_fim`, `local_nome`, `endereco`, `regiao`, `status` (`pendente` / `publicado` / `rejeitado`), `motivo_rejeicao`, `criado_por`, `validado_por`, `criado_em`, `atualizado_em` |
| **curtidas** | `usuario_id`, `evento_id` — chave primária composta, o que garante 1 curtida por usuário (RN22) |
| **comentarios** | `id`, `evento_id`, `usuario_id`, `texto`, `criado_em` |
| **notificacoes** | `id`, `usuario_id`, `titulo`, `link`, `lida`, `criado_em` |

- **Categorias e regiões ficam fixas no código** (um arquivo `constantes.ts` no front e `constantes.py` no back), em vez de virar tabela. Para adicionar uma categoria, basta mudar uma linha.
  - Categorias: Vacinação, Saúde mental, Atividade física, Nutrição, Doação de sangue, Saúde da mulher, Saúde do idoso, Prevenção e exames.
  - Regiões: Plano Piloto, Ceilândia, Taguatinga, Samambaia, Gama, Planaltina, Sobradinho, Águas Claras, Guará, Recanto das Emas, entre outras.
- **Trigger no Supabase:** quando alguém se cadastra, cria automaticamente a linha em `perfis` com `papel = 'usuario'`.
- **Para criar o admin:** no painel do Supabase, mude o `papel` do usuário para `admin`.
- **Segurança:** RLS ligado em todas as tabelas e sem políticas públicas. Só o Python, com a *service role key* guardada nas variáveis da Vercel, acessa os dados (RNF02, RNF06).
- **Status:** o protótipo usa 3 status. No documento, "aprovado" e "publicado" valem como o mesmo status.

---

## 7. API (FastAPI)

| Rota | Quem | O que faz |
|---|---|---|
| `GET /api/eventos?q=&categoria=&regiao=&data=` | todos | Lista os eventos publicados |
| `GET /api/eventos/{id}` | todos | Detalhe, curtidas, comentários e se o usuário já curtiu |
| `POST /api/eventos` | usuário | Cria evento pendente |
| `PUT /api/eventos/{id}` | autor (se pendente/rejeitado) ou admin | Edita evento |
| `DELETE /api/eventos/{id}` | autor (se não publicado) ou admin | Exclui evento |
| `GET /api/meus-eventos` | usuário | Eventos do usuário |
| `POST /api/eventos/{id}/curtir` | usuário | Liga ou desliga a curtida |
| `POST /api/eventos/{id}/comentarios` | usuário | Comenta |
| `DELETE /api/comentarios/{id}` | admin | Remove comentário |
| `GET /api/notificacoes` · `POST /api/notificacoes/lidas` | usuário | Sino |
| `GET /api/admin/eventos?status=` | admin | Lista por status |
| `POST /api/admin/eventos/{id}/aprovar` · `/rejeitar` | admin | Valida e gera as notificações |

São 13 rotas no total. O Swagger em `/api/docs` vem pronto do FastAPI e é bom mostrar na apresentação.

---

## 8. Estrutura do repositório

```
df-eventos/
├─ frontend/src/app/
│  ├─ core/       supabase.service.ts, api.service.ts, auth.guard.ts, admin.guard.ts, constantes.ts
│  ├─ shared/     evento-card, status-badge, sino-notificacoes
│  ├─ pages/      inicio, evento-detalhe, entrar, cadastro, divulgar, meus-eventos, admin
│  └─ app.routes.ts
├─ api/
│  ├─ index.py     app FastAPI
│  ├─ auth.py      lê o token e devolve o usuário; exige_admin()
│  ├─ db.py        cliente Supabase
│  ├─ constantes.py
│  └─ rotas/       eventos.py, interacoes.py, notificacoes.py, admin.py
├─ supabase/
│  ├─ schema.sql   tabelas, trigger, RLS
│  └─ seed.sql     ~15 eventos de exemplo
├─ requirements.txt
├─ vercel.json
└─ README.md
```

`vercel.json`:

```json
{
  "buildCommand": "cd frontend && npm ci && npm run build",
  "outputDirectory": "frontend/dist/df-eventos/browser",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Variáveis na Vercel: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_JWT_SECRET`. No Angular ficam só a `supabaseUrl` e a `supabaseAnonKey`, que podem ser públicas.

---

## 9. Fases

| Fase | Entregas | Pronto quando… |
|---|---|---|
| **0. Preparação** | Projeto Supabase, repositório no GitHub, projeto na Vercel, `schema.sql` + `seed.sql`, Angular e `/api/eventos` no ar | O site publicado lista os eventos do seed |
| **1. Público** | Layout, Início com busca e filtros, Detalhe, compartilhar | Visitante encontra e abre um evento pelo celular |
| **2. Contas** | Cadastro, Entrar, Sair, guards | Usuário cria conta e entra |
| **3. Divulgar e validar** | Formulário, Meus eventos, tela Admin | Evento enviado só aparece no Início após aprovação |
| **4. Interação e notificações** | Curtir, comentar, remover comentário, sino | Usuário curte e comenta e recebe aviso de aprovação |
| **5. Acabamento** | Visual (cores das categorias, logo), responsividade, ensaio do roteiro | Roteiro da seção 10 roda sem erro |
| *Extra (se sobrar tempo)* | Coleta automática simples: botão "Importar eventos oficiais" no admin lê um arquivo JSON do projeto, simulando uma fonte oficial, e cria os eventos como **pendentes** | Mostra o conceito do RF13/RF14 |

**Divisão sugerida (5 pessoas):**

| Pessoa | Frente |
|---|---|
| 1 | Supabase (schema, trigger, seed), deploy na Vercel, README |
| 2 | API: eventos, validação, notificações |
| 3 | API: curtidas e comentários + parte de autenticação no Python |
| 4 | Front: Início, Detalhe, Entrar e Cadastro |
| 5 | Front: Divulgar, Meus eventos, Admin, sino + identidade visual |

---

## 10. Roteiro da demonstração (≈ 5 minutos)

1. **Visitante** no celular: filtra "Vacinação" + "Ceilândia", abre um evento e compartilha no WhatsApp.
2. Tenta curtir, cai no **Cadastro**, cria a conta, curte e comenta.
3. **Divulga um evento**. Ele aparece em "Meus eventos" como 🟡 *Em análise* e **não** aparece no Início.
4. Entra como **admin**, rejeita um evento com motivo e **aprova** o evento do passo 3.
5. Volta ao usuário: o 🔔 mostra "Seu evento foi aprovado" e o evento já está no Início.
6. Mostra rapidamente o `/api/docs` e as tabelas no Supabase.
7. Fecha com o slide "Trabalhos futuros", usando a tabela da seção 2.

---

## 11. Cuidados

- **O Supabase gratuito pausa o projeto depois de cerca de uma semana sem uso.** Abra o site alguns dias antes da apresentação e no dia.
- A `SUPABASE_SERVICE_ROLE_KEY` **nunca** vai para o Angular nem para o GitHub. Ela fica só nas variáveis da Vercel.
- A primeira chamada ao Python na Vercel pode demorar 1 a 2 segundos. Abra o site uma vez antes de apresentar.
- Deixe um usuário **admin** e um **comum** de teste criados antes da apresentação. Use senhas só de teste.
- Guarde o `seed.sql` atualizado. Se algo der errado, dá para recriar o banco em minutos.
