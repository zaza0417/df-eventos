import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService, mensagemDaApi } from '../../core/api.service';
import { categoria, iconeCategoria } from '../../core/constantes';
import { horaCurta } from '../../core/datas';
import { Evento, StatusEvento } from '../../core/models';
import { Icone } from '../../shared/icone/icone';
import { StatusBadge } from '../../shared/status-badge/status-badge';

@Component({
  selector: 'app-meus-eventos',
  imports: [DatePipe, RouterLink, StatusBadge, Icone],
  template: `
    <div class="cabecalho">
      <h1>Meus eventos</h1>
      <a class="botao cheio" routerLink="/divulgar"><app-icone nome="novo-evento" />Divulgar evento</a>
    </div>

    @if (enviado()) {
      <p class="mensagem sucesso" role="status">
        Recebemos seu evento. Ele entra na programação assim que a equipe confirmar que é uma ação de saúde ou bem-estar.
      </p>
    }
    @if (erro()) {
      <p class="mensagem erro" role="alert">{{ erro() }}</p>
    }

    @if (carregando()) {
      <p class="aviso">Carregando…</p>
    } @else if (eventos().length === 0) {
      <div class="aviso">
        <p><strong>Você ainda não divulgou nenhum evento.</strong></p>
        <p>Conhece uma ação de saúde ou bem-estar no DF? <a routerLink="/divulgar">Divulgue aqui</a>.</p>
      </div>
    } @else {
      <dl class="resumo">
        <div><dt>Em análise</dt><dd>{{ contagem().pendente }}</dd></div>
        <div><dt>Publicados</dt><dd>{{ contagem().publicado }}</dd></div>
        <div><dt>Não aprovados</dt><dd>{{ contagem().rejeitado }}</dd></div>
      </dl>
      <ul class="lista">
        @for (e of eventos(); track e.id) {
          <li class="item">
            <div class="data">
              <span class="dia">{{ e.data + 'T00:00' | date: 'dd' }}</span>
              <span class="mes">{{ e.data + 'T00:00' | date: 'MMM' }}</span>
            </div>
            <div class="texto">
              <div class="topo-item">
                <app-status-badge [status]="e.status" />
                <span class="categoria"><app-icone [nome]="icone(e.categoria)" [tamanho]="16" />{{ nomeCategoria(e) }}</span>
              </div>
              <h2>{{ e.titulo }}</h2>
              <p class="info">
                <app-icone nome="horario" [tamanho]="16" />{{ hora(e) }}
                <app-icone nome="local" [tamanho]="16" />{{ e.local_nome }}, {{ e.regiao }}
              </p>
              @if (e.status === 'rejeitado' && e.motivo_rejeicao) {
                <p class="motivo"><strong>Por que não foi aprovado:</strong> {{ e.motivo_rejeicao }}</p>
              }
              <div class="acoes">
                @if (e.status === 'publicado') {
                  <a [routerLink]="['/eventos', e.id]">Ver na programação</a>
                } @else {
                  <a [routerLink]="['/divulgar', e.id]">{{ e.status === 'rejeitado' ? 'Corrigir e reenviar' : 'Editar' }}</a>
                  <button type="button" class="link-perigo" (click)="excluir(e)">Excluir</button>
                }
              </div>
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .cabecalho { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin: 2rem 0 1.25rem; }
    h1 { margin: 0; }
    .resumo { display: flex; gap: 0; margin: 0 0 1.5rem; border: 2px solid var(--verde); border-radius: var(--raio); width: fit-content; }
    .resumo div { padding: 0.6rem 1.25rem; }
    .resumo div + div { border-left: 1px solid var(--linha); }
    .resumo dt { font-size: 0.85rem; color: var(--texto-suave); font-weight: 600; }
    .resumo dd { margin: 0; font-family: var(--fonte-titulo); font-weight: 800; font-size: 2rem; line-height: 1; color: var(--verde); }
    .lista { list-style: none; margin: 0; padding: 0; border-bottom: 1px solid var(--linha); }
    .item { display: grid; grid-template-columns: 4rem 1fr; gap: 1.1rem; padding: 1.25rem 0; border-top: 1px solid var(--linha); }
    .data { display: flex; flex-direction: column; align-items: center; padding: 0.4rem 0; background: var(--concreto); border-radius: var(--raio); color: var(--verde-noite); }
    .dia { font-family: var(--fonte-titulo); font-weight: 800; font-size: 1.9rem; line-height: 0.95; }
    .mes { font-size: 0.85rem; font-weight: 600; }
    .topo-item { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; }
    .categoria { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.88rem; color: var(--verde); font-weight: 600; }
    h2 { font-size: 1.4rem; margin: 0.45rem 0 0.3rem; }
    .info { display: flex; flex-wrap: wrap; align-items: center; gap: 0.3rem; margin: 0; color: var(--texto-suave); }
    .info app-icone + app-icone, .info app-icone:not(:first-child) { margin-left: 0.6rem; }
    .motivo { margin: 0.75rem 0 0; padding: 0.65rem 0.85rem; border-left: 4px solid var(--erro); background: #fbeeee; color: #6e1212; max-width: 64ch; }
    .acoes { display: flex; gap: 1.25rem; margin-top: 0.75rem; font-weight: 600; }
    .aviso { padding: 2.5rem 1rem; text-align: center; color: var(--texto-suave); }
    .aviso p { margin: 0.25rem 0; }
  `,
})
export class MeusEventos implements OnInit {
  /** ?enviado=1 depois de divulgar um evento. */
  readonly enviadoParam = input<string>(undefined, { alias: 'enviado' });

  private readonly api = inject(ApiService);

  protected readonly eventos = signal<Evento[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly enviado = computed(() => this.enviadoParam() === '1');
  protected readonly contagem = computed(() => {
    const total: Record<StatusEvento, number> = { pendente: 0, publicado: 0, rejeitado: 0 };
    for (const e of this.eventos()) total[e.status]++;
    return total;
  });

  ngOnInit(): void {
    this.api.meusEventos().subscribe({
      next: (eventos) => {
        this.eventos.set(eventos);
        this.carregando.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemDaApi(e, 'Não foi possível carregar seus eventos.'));
        this.carregando.set(false);
      },
    });
  }

  protected readonly icone = iconeCategoria;

  protected nomeCategoria(e: Evento): string {
    return categoria(e.categoria).nome;
  }

  protected hora(e: Evento): string {
    return horaCurta(e.hora_inicio);
  }

  protected excluir(e: Evento): void {
    if (!confirm(`Excluir o evento "${e.titulo}"? Essa ação não pode ser desfeita.`)) return;
    this.api.excluirEvento(e.id).subscribe({
      next: () => this.eventos.update((lista) => lista.filter((x) => x.id !== e.id)),
      error: (err) => this.erro.set(mensagemDaApi(err, 'Não foi possível excluir o evento.')),
    });
  }
}
