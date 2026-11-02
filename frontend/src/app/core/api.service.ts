import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Comentario,
  Evento,
  EventoAdmin,
  EventoEntrada,
  FiltrosEventos,
  Notificacao,
  StatusEvento,
} from './models';

/** Mensagem de erro da API (campo "detail") ou uma mensagem padrão. */
export function mensagemDaApi(erro: unknown, padrao = 'Algo deu errado. Tente novamente.'): string {
  const detalhe = (erro as HttpErrorResponse)?.error?.detail;
  return typeof detalhe === 'string' ? detalhe : padrao;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  // ---------- Público ----------
  listarEventos(filtros: FiltrosEventos = {}): Observable<Evento[]> {
    let params = new HttpParams();
    for (const [chave, valor] of Object.entries(filtros)) {
      if (valor) params = params.set(chave, valor);
    }
    return this.http.get<Evento[]>('/api/eventos', { params });
  }

  detalharEvento(id: string): Observable<Evento> {
    return this.http.get<Evento>(`/api/eventos/${id}`);
  }

  // ---------- Usuário logado ----------
  criarEvento(dados: EventoEntrada): Observable<Evento> {
    return this.http.post<Evento>('/api/eventos', dados);
  }

  editarEvento(id: string, dados: EventoEntrada): Observable<Evento> {
    return this.http.put<Evento>(`/api/eventos/${id}`, dados);
  }

  excluirEvento(id: string): Observable<void> {
    return this.http.delete<void>(`/api/eventos/${id}`);
  }

  meusEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>('/api/meus-eventos');
  }

  // ---------- Interações ----------
  curtir(id: string): Observable<{ curtiu: boolean; total_curtidas: number }> {
    return this.http.post<{ curtiu: boolean; total_curtidas: number }>(`/api/eventos/${id}/curtir`, {});
  }

  comentarios(id: string): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`/api/eventos/${id}/comentarios`);
  }

  comentar(id: string, texto: string): Observable<Comentario> {
    return this.http.post<Comentario>(`/api/eventos/${id}/comentarios`, { texto });
  }

  removerComentario(id: string): Observable<void> {
    return this.http.delete<void>(`/api/comentarios/${id}`);
  }

  // ---------- Notificações ----------
  notificacoes(): Observable<{ itens: Notificacao[]; nao_lidas: number }> {
    return this.http.get<{ itens: Notificacao[]; nao_lidas: number }>('/api/notificacoes');
  }

  marcarNotificacoesLidas(): Observable<void> {
    return this.http.post<void>('/api/notificacoes/lidas', {});
  }

  // ---------- Admin ----------
  eventosAdmin(status?: StatusEvento): Observable<EventoAdmin[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<EventoAdmin[]>('/api/admin/eventos', { params });
  }

  aprovarEvento(id: string): Observable<Evento> {
    return this.http.post<Evento>(`/api/admin/eventos/${id}/aprovar`, {});
  }

  rejeitarEvento(id: string, motivo: string): Observable<Evento> {
    return this.http.post<Evento>(`/api/admin/eventos/${id}/rejeitar`, { motivo });
  }
}
