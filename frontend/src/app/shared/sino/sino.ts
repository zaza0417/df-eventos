import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { Notificacao } from '../../core/models';

/** Sino de notificações do topo (RF11). Atualiza a cada minuto; ao abrir, marca tudo como lido. */
@Component({
  selector: 'app-sino',
  imports: [DatePipe, RouterLink],
  template: `
    <details class="sino" #painel (toggle)="aoAbrirFechar(painel.open)">
      <summary [attr.aria-label]="naoLidas() ? naoLidas() + ' notificações não lidas' : 'Notificações'">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" />
        </svg>
        @if (naoLidas() > 0) {
          <span class="contador">{{ naoLidas() > 9 ? '9+' : naoLidas() }}</span>
        }
      </summary>

      <div class="painel" (click)="painel.open = false">
        <p class="titulo">Notificações</p>
        <ul>
          @for (n of itens(); track n.id) {
            <li [class.nova]="!n.lida">
              @if (n.link) {
                <a [routerLink]="n.link">{{ n.titulo }}</a>
              } @else {
                <span>{{ n.titulo }}</span>
              }
              <small>{{ n.criado_em | date: "dd/MM 'às' HH:mm" }}</small>
            </li>
          } @empty {
            <li class="vazio">Nenhuma notificação por enquanto.</li>
          }
        </ul>
      </div>
    </details>
  `,
  styles: `
    .sino { position: relative; }
    summary {
      list-style: none;
      position: relative;
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: var(--raio);
      border: 1px solid rgb(255 255 255 / 0.6);
      color: #fff;
      cursor: pointer;
    }
    summary::-webkit-details-marker { display: none; }
    .contador {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      border-radius: 999px;
      background: var(--amarelo);
      color: var(--primaria-escura);
      font-size: 0.75rem;
      font-weight: 800;
      display: grid;
      place-items: center;
    }
    .painel {
      position: absolute;
      right: -60px;
      top: calc(100% + 8px);
      width: min(340px, calc(100vw - 32px));
      max-height: 420px;
      overflow-y: auto;
      background: var(--superficie);
      color: var(--texto);
      border: 1px solid var(--borda);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgb(0 0 0 / 0.15);
    }
    @media (min-width: 521px) { .painel { right: 0; } }
    .titulo { margin: 0; padding: 0.75rem 1rem; font-weight: 800; border-bottom: 1px solid var(--borda); }
    ul { list-style: none; margin: 0; padding: 0; }
    li { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.7rem 1rem; border-bottom: 1px solid var(--borda); font-size: 0.92rem; }
    li:last-child { border-bottom: 0; }
    li.nova { background: #fff8e1; box-shadow: inset 4px 0 0 var(--amarelo); }
    li a { color: var(--texto); text-decoration: none; }
    li a:hover { text-decoration: underline; }
    small { color: var(--texto-suave); font-size: 0.8rem; }
    .vazio { color: var(--texto-suave); text-align: center; }
  `,
})
export class Sino implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly itens = signal<Notificacao[]>([]);
  protected readonly naoLidas = signal(0);

  ngOnInit(): void {
    this.carregar();
    const timer = setInterval(() => this.carregar(), 60_000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  private carregar(): void {
    this.api.notificacoes().subscribe({
      next: ({ itens, nao_lidas }) => {
        this.itens.set(itens);
        this.naoLidas.set(nao_lidas);
      },
      error: () => {
        // sem conexão ou sessão expirada: tenta de novo no próximo minuto
      },
    });
  }

  /** Ao abrir o painel, as notificações viram lidas (o destaque some ao fechar). */
  protected aoAbrirFechar(aberto: boolean): void {
    if (aberto && this.naoLidas() > 0) {
      this.naoLidas.set(0);
      this.api.marcarNotificacoesLidas().subscribe();
    } else if (!aberto) {
      this.itens.update((lista) => lista.map((n) => ({ ...n, lida: true })));
    }
  }
}
