-- =====================================================================
-- DF EventoS — dados de exemplo (FICTÍCIOS, só para o protótipo)
-- Rode depois do schema.sql. As datas são relativas a hoje (current_date),
-- então os eventos continuam "futuros" mesmo se rodar de novo semanas depois.
-- =====================================================================

delete from public.eventos;

insert into public.eventos
  (titulo, descricao, categoria, data, hora_inicio, hora_fim, local_nome, endereco, regiao, status, motivo_rejeicao)
values
  ('Campanha de vacinação contra a gripe',
   'Vacinação gratuita contra influenza para idosos, gestantes, crianças e profissionais de saúde. Leve documento com foto e cartão de vacinação.',
   'vacinacao', current_date + 3, '08:00', '17:00', 'UBS 5 de Ceilândia', 'QNN 13, Área Especial, Ceilândia Norte', 'Ceilândia', 'publicado', null),

  ('Dia D de atualização da caderneta infantil',
   'Equipes de saúde verificam e atualizam a caderneta de vacinação de crianças e adolescentes até 15 anos. Traga a caderneta e o cartão do SUS.',
   'vacinacao', current_date + 10, '09:00', '16:00', 'Escola Classe 15', 'QNM 34, Taguatinga Norte', 'Taguatinga', 'publicado', null),

  ('Roda de conversa: ansiedade no dia a dia',
   'Encontro aberto com psicólogos voluntários para falar sobre ansiedade, sinais de alerta e onde buscar ajuda gratuita no DF.',
   'saude_mental', current_date + 5, '19:00', '21:00', 'Biblioteca Pública de Brasília', 'Setor Bancário Sul, Quadra 1', 'Plano Piloto', 'publicado', null),

  ('Grupo de apoio para cuidadores',
   'Espaço de escuta e acolhimento para familiares e cuidadores de pessoas com doenças crônicas. Encontros mediados por assistente social.',
   'saude_mental', current_date + 12, '15:00', '17:00', 'Centro de Convivência do Guará', 'QE 23, Área Especial, Guará II', 'Guará', 'publicado', null),

  ('Caminhada pela saúde do coração',
   'Caminhada coletiva de 5 km com aquecimento orientado por educadores físicos e aferição de pressão arterial antes e depois.',
   'atividade_fisica', current_date + 4, '07:00', '09:00', 'Parque da Cidade Sarah Kubitschek', 'Estacionamento 10, Asa Sul', 'Plano Piloto', 'publicado', null),

  ('Aulão de ginástica ao ar livre',
   'Aula gratuita de ginástica funcional para todas as idades, com professores voluntários. Leve água e roupa confortável.',
   'atividade_fisica', current_date + 6, '08:00', '10:00', 'Parque Ecológico de Águas Claras', 'Av. Castanheiras, Águas Claras', 'Águas Claras', 'publicado', null),

  ('Oficina de alimentação saudável com pouco dinheiro',
   'Nutricionistas ensinam a montar um cardápio semanal saudável e barato, com aproveitamento integral dos alimentos e degustação.',
   'nutricao', current_date + 8, '14:00', '17:00', 'CRAS Samambaia', 'QS 406, Samambaia Norte', 'Samambaia', 'publicado', null),

  ('Mutirão de doação de sangue',
   'Mutirão para reforçar os estoques do hemocentro. Doadores devem ter entre 16 e 69 anos, pesar mais de 50 kg e estar alimentados.',
   'doacao_sangue', current_date + 2, '07:30', '18:00', 'Fundação Hemocentro de Brasília', 'SMHN, Quadra 3, Asa Norte', 'Plano Piloto', 'publicado', null),

  ('Coleta itinerante de sangue no Gama',
   'Unidade móvel de coleta de sangue estacionada no centro do Gama. Leve documento oficial com foto.',
   'doacao_sangue', current_date + 15, '08:00', '14:00', 'Praça do Cine Itapuã', 'Setor Central, Gama', 'Gama', 'publicado', null),

  ('Mutirão de exames preventivos para mulheres',
   'Realização de exame preventivo (Papanicolau), orientação sobre mamografia e saúde sexual. Atendimento por ordem de chegada.',
   'saude_mulher', current_date + 7, '08:00', '12:00', 'UBS 1 de Planaltina', 'Setor Hospitalar Oeste, Planaltina', 'Planaltina', 'publicado', null),

  ('Feira de saúde da pessoa idosa',
   'Aferição de pressão e glicemia, orientação sobre uso de medicamentos, atividades de memória e dança sênior.',
   'saude_idoso', current_date + 9, '09:00', '15:00', 'Centro de Convivência do Idoso de Sobradinho', 'Quadra Central, Sobradinho', 'Sobradinho', 'publicado', null),

  ('Testagem rápida de HIV, sífilis e hepatites',
   'Testes rápidos gratuitos e sigilosos, com resultado em até 30 minutos e aconselhamento por profissionais de saúde.',
   'prevencao', current_date + 11, '10:00', '16:00', 'Rodoviária do Plano Piloto', 'Plataforma superior, Eixo Monumental', 'Plano Piloto', 'publicado', null),

  -- Pendentes: aparecem só na tela do admin (servem para demonstrar a validação)
  ('Yoga gratuito no Recanto',
   'Aula de yoga para iniciantes com foco em respiração e redução do estresse. Leve um tapete ou toalha.',
   'atividade_fisica', current_date + 14, '07:30', '08:30', 'Praça Central do Recanto das Emas', 'Quadra 103, Recanto das Emas', 'Recanto das Emas', 'pendente', null),

  ('Palestra sobre prevenção ao diabetes',
   'Palestra com endocrinologista sobre prevenção, sintomas e cuidados com o diabetes tipo 2, seguida de teste de glicemia.',
   'prevencao', current_date + 13, '19:00', '20:30', 'Auditório da Administração de Taguatinga', 'Praça do Relógio, Taguatinga Centro', 'Taguatinga', 'pendente', null),

  -- Rejeitado: exemplo de evento fora da finalidade da plataforma (RN04)
  ('Promoção de suplementos na loja',
   'Venha conhecer nossa nova linha de suplementos com 30% de desconto durante todo o fim de semana.',
   'nutricao', current_date + 5, '09:00', '18:00', 'Loja FitMais', 'Shopping de Águas Claras', 'Águas Claras', 'rejeitado',
   'Divulgação comercial; não é uma ação social de saúde.');
