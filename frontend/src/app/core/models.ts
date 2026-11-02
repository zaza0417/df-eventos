export type StatusEvento = 'pendente' | 'publicado' | 'rejeitado';

export interface Perfil {
  id: string;
  nome: string;
  email: string;
  papel: 'usuario' | 'admin';
}

export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  data: string; // AAAA-MM-DD
  hora_inicio: string; // HH:MM:SS
  hora_fim: string | null;
  local_nome: string;
  endereco: string;
  regiao: string;
  status: StatusEvento;
  motivo_rejeicao: string | null;
  criado_por: string | null;
  criado_em: string;
  total_curtidas: number;
  total_comentarios: number;
  /** Só vem no detalhe: se o usuário logado curtiu. */
  curtiu?: boolean;
}

export interface Comentario {
  id: string;
  texto: string;
  criado_em: string;
  usuario_id: string;
  autor: { nome: string } | null;
}

export interface Notificacao {
  id: string;
  titulo: string;
  link: string | null;
  lida: boolean;
  criado_em: string;
}

/** Evento como o admin vê: com o nome de quem divulgou (null = eventos do seed). */
export interface EventoAdmin extends Evento {
  autor: { nome: string; email: string } | null;
}

/** Campos do formulário "Divulgar evento". */
export interface EventoEntrada {
  titulo: string;
  descricao: string;
  categoria: string;
  data: string; // AAAA-MM-DD
  hora_inicio: string; // HH:MM
  hora_fim: string | null; // HH:MM
  local_nome: string;
  endereco: string;
  regiao: string;
}

/** Como cada status aparece para as pessoas. */
export const STATUS_EVENTO: Record<StatusEvento, { nome: string; cor: string; fundo: string }> = {
  pendente: { nome: 'Em análise', cor: '#7a5600', fundo: '#fff3cd' },
  publicado: { nome: 'Publicado', cor: '#00602f', fundo: '#e3f3e9' },
  rejeitado: { nome: 'Não aprovado', cor: '#9b1c1c', fundo: '#fde8e8' },
};

export interface FiltrosEventos {
  q?: string;
  categoria?: string;
  regiao?: string;
  de?: string; // AAAA-MM-DD
  ate?: string; // AAAA-MM-DD
}
