# DF EventoS: roteiro da apresentação

Demonstração de cerca de 6 minutos, mostrando o fluxo central do sistema funcionando de ponta a ponta:
**encontrar → interagir → divulgar → validar → publicar → avisar**.

---

## 1. Preparação

### Dois ou três dias antes
- [ ] Entrar no painel do Supabase e conferir se o projeto está **ativo**. O plano gratuito pausa depois de cerca de uma semana sem uso; se estiver pausado, clique em *Restore*.
- [ ] Ter duas contas criadas pelo site:
  - **Admin:** a sua. No Supabase, em *Table Editor › perfis*, o `papel` deve estar como `admin`.
  - **Usuária comum:** por exemplo, "Maria", com outro e-mail.
- [ ] Rodar [`supabase/seed.sql`](../supabase/seed.sql) e depois [`supabase/demo.sql`](../supabase/demo.sql) no *SQL Editor*. Assim as datas dos eventos ficam futuras e aparecem curtidas e comentários.
- [ ] Ensaiar o roteiro abaixo uma vez, do começo ao fim, cronometrando.

### No dia, 30 minutos antes
- [ ] Abrir o site (Vercel ou `localhost`) uma vez para "acordar" a API. A primeira chamada pode demorar alguns segundos.
- [ ] Deixar **duas janelas** do navegador abertas: uma normal, logada como **Maria**, e uma anônima, logada como **admin**. Assim não se perde tempo entrando e saindo da conta.
- [ ] Deixar uma aba com o celular emulado (F12 › ícone de celular) para mostrar que o site é responsivo.
- [ ] Ter este texto pronto para colar, que evita digitar na frente da turma:
  - **Nome:** Feira de saúde na praça
  - **Categoria:** Prevenção e exames
  - **Descrição:** Aferição de pressão, teste de glicemia e orientação com enfermeiros voluntários. Aberto a todas as idades.
  - **Local:** Praça do Relógio · **Endereço:** Taguatinga Centro · **Região:** Taguatinga

---

## 2. Roteiro

| Tempo | Quem fala | O que fazer na tela | O que dizer |
|---|---|---|---|
| 0:00 | Abertura | Página inicial | "No DF, ações de saúde ficam espalhadas em redes sociais e sites de órgãos. O DF EventoS junta tudo num lugar só." Mostre os azulejos e a silhueta do Congresso: "a identidade visual é de Brasília: as cores da bandeira, os azulejos de Athos Bulcão e as placas de rua das regiões." |
| 0:45 | Buscar (RF07, RF08, RF21) | Clique em **Vacinação**, escolha a região **Ceilândia** e abra o evento | "O cidadão filtra por assunto, data e região administrativa. A busca fica no link, então dá para mandar para alguém." |
| 1:30 | Detalhe (RF22) | Mostre data, local, **Ver no mapa** e **Enviar no WhatsApp** | "O evento parece um ingresso, com tudo o que a pessoa precisa saber: quando, onde e como chegar." |
| 2:00 | Interagir (RF09, RN08) | Na janela da Maria: **Curtir** e escrever um comentário | "Curtir e comentar exigem login, e cada pessoa curte uma vez só." |
| 2:30 | Divulgar (RF03, RF04, RN16) | Maria clica em **Divulgar evento** e cola o texto preparado. Tente enviar primeiro com um campo vazio para mostrar o erro, depois envie de verdade | "Qualquer pessoa cadastrada pode divulgar, mas o evento não aparece direto: ele vai para análise." Mostre **Meus eventos** com a etiqueta *Em análise* e volte ao início para mostrar que ele **não** aparece. |
| 3:30 | Validar (RF05, RF06, RN04) | Na janela do admin: menu › **Validar eventos** | "Um responsável confere se é mesmo uma ação de saúde." Não aprove um dos pendentes do seed, escrevendo um motivo, e **aprove** o da Maria. |
| 4:30 | Avisar (RF11, RN10) | Volte para a Maria e abra o sino | "A Maria recebe o aviso de que o evento foi aprovado, e os outros usuários são avisados de que há um evento novo." Clique no aviso: o evento já está na programação. |
| 5:00 | Por dentro | Abra `/api/docs` (Swagger) e, se der tempo, as tabelas no Supabase | "O front é Angular, a API é Python com FastAPI e o banco é o Supabase. Tudo está publicado na Vercel." |
| 5:30 | Fechamento | Slide de trabalhos futuros | "O protótipo cobre o fluxo central. O que ficou para a próxima versão está aqui." |

---

## 3. Slide de trabalhos futuros

O protótipo implementa o fluxo central. Ficaram para uma próxima versão:

| Funcionalidade | Requisito |
|---|---|
| Coleta automática de eventos em sites oficiais de saúde | RF13, RF14, RN12, RN13 |
| Detecção de eventos duplicados | RF26, RN20 |
| Denúncia de evento ou comentário | RF23, RN24 |
| Histórico detalhado de alterações | RF24 |
| Tela de gestão de usuários e permissões | RF25 |
| Recuperação de senha, edição de perfil e exclusão de conta | RF16, RF17, RF18 |
| Login com segundo fator (MFA) | Diagrama de atividades de login |
| Nova validação quando um evento publicado muda | RN19 |

---

## 4. Perguntas que a banca pode fazer

**Como o sistema garante que só eventos aprovados aparecem?**
Todo evento nasce com o status `pendente`. A consulta pública da API filtra `status = publicado`, e só a rota de aprovação, que exige o papel `admin`, muda esse status (RN05, RN06, RN27).

**Onde ficam as senhas?**
No Supabase Auth, com hash; o nosso código nunca vê a senha (RNF18). O site recebe um token, e a API em Python confere esse token a cada pedido (RNF11).

**E se alguém tentar acessar o banco direto?**
As tabelas têm RLS ligado e nenhuma regra pública. Só a API, com a chave secreta que fica nas variáveis da Vercel, consegue ler e gravar (RNF02, RNF06).

**Como uma pessoa não curte duas vezes?**
A tabela `curtidas` tem chave primária composta por usuário e evento, então o próprio banco recusa uma segunda curtida (RN22).

**Por que Python e Angular separados?**
As regras de negócio ficam todas num lugar só, a API, e o front só cuida das telas. A divisão do trabalho no grupo também fica mais fácil (RNF07, RNF19).

**Funciona no celular?**
Sim: todas as telas se adaptam (RNF10). Mostre com o F12.

---

## 5. Plano B

| Problema | O que fazer |
|---|---|
| A lista aparece vazia ou dá erro | O Supabase pode estar pausado. Reative no painel (leva cerca de 1 minuto). |
| A Vercel está lenta ou fora do ar | Rode no computador, seguindo o README, e apresente em `localhost:4200`. |
| A internet da sala caiu | Use o roteadorzinho do celular. Sem internet nenhuma, mostre os prints da seção 6. |
| Os eventos do seed "passaram" de data | Rode o `seed.sql` de novo: as datas são contadas a partir do dia em que ele roda. |

## 6. Prints de segurança

Tire e guarde, antes do dia, prints destas telas:
- início
- filtro aplicado
- página do evento
- formulário de divulgar
- Meus eventos com *Em análise*
- tela de validação
- sino com aviso
- página no celular
