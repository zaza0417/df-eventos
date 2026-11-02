import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';

import { ApiService } from '../../core/api.service';
import { CATEGORIAS, iconeCategoria, REGIOES } from '../../core/constantes';
import { intervaloDoPeriodo, PERIODOS } from '../../core/datas';
import { Evento } from '../../core/models';
import { Azulejos } from '../../shared/azulejos/azulejos';
import { EventoCard } from '../../shared/evento-card/evento-card';
import { Icone } from '../../shared/icone/icone';

/** Filtros guardados na URL (ex.: /?categoria=vacinacao&regiao=Ceilândia), para poder compartilhar a busca. */
interface FiltrosUrl {
  q: string;
  categoria: string;
  regiao: string;
  quando: string;
}

function lerFiltros(params: ParamMap): FiltrosUrl {
  return {
    q: params.get('q') ?? '',
    categoria: params.get('categoria') ?? '',
    regiao: params.get('regiao') ?? '',
    quando: params.get('quando') ?? '',
  };
}

@Component({
  selector: 'app-inicio',
  imports: [DatePipe, EventoCard, RouterLink, Icone, Azulejos],
  template: `
    <section class="abertura">
      <div class="chamada">
        <h1>Cuidar da saúde no DF começa perto de casa</h1>
        <p>
          Vacinação, doação de sangue, rodas de conversa e atividades ao ar livre, da Ceilândia ao Plano Piloto,
          reunidas num só lugar.
        </p>

        <form class="busca" role="search" (submit)="buscar($event, termo.value)">
          <label class="sr-only" for="termo">Buscar evento</label>
          <app-icone nome="buscar" [tamanho]="20" />
          <input #termo id="termo" type="search" placeholder="Busque por nome, assunto ou local" [value]="filtros().q" />
          <button type="submit">Buscar</button>
        </form>
      </div>
      <app-azulejos class="mosaico" [colunas]="7" [linhas]="6" />
    </section>

    <section class="filtros" aria-label="Filtrar eventos">
      <div class="categorias" role="group" aria-label="Categoria">
        <button type="button" [class.ativo]="!filtros().categoria" [attr.aria-pressed]="!filtros().categoria"
          (click)="filtrar({ categoria: null })">
          Todas
        </button>
        @for (cat of categorias; track cat.slug) {
          <button type="button" [class.ativo]="filtros().categoria === cat.slug"
            [attr.aria-pressed]="filtros().categoria === cat.slug"
            (click)="filtrar({ categoria: filtros().categoria === cat.slug ? null : cat.slug })">
            <app-icone [nome]="icone(cat.slug)" [tamanho]="18" />{{ cat.nome }}
          </button>
        }
      </div>

      <div class="selects">
        <label>
          Quando
          <select (change)="filtrar({ quando: valor($event) })">
            @for (p of periodos; track p.valor) {
              <option [value]="p.valor" [selected]="p.valor === filtros().quando">{{ p.nome }}</option>
            }
          </select>
        </label>
        <label>
          Região administrativa
          <select (change)="filtrar({ regiao: valor($event) })">
            <option value="" [selected]="!filtros().regiao">Todo o DF</option>
            @for (r of regioes; track r) {
              <option [value]="r" [selected]="r === filtros().regiao">{{ r }}</option>
            }
          </select>
        </label>
        @if (temFiltro()) {
          <button type="button" class="limpar" (click)="limpar()">Limpar filtros</button>
        }
      </div>
    </section>

    @if (carregando()) {
      <p class="aviso">Carregando a programação…</p>
    } @else if (erro()) {
      <p class="aviso erro">{{ erro() }}</p>
    } @else if (eventos().length === 0) {
      <div class="aviso">
        <p><strong>Nenhum evento com esses filtros.</strong></p>
        @if (temFiltro()) {
          <p>Tente outra região ou <button type="button" class="link" (click)="limpar()">veja a programação completa</button>.</p>
        }
      </div>
    } @else {
      <p class="total" aria-live="polite">
        {{ eventos().length }} {{ eventos().length === 1 ? 'evento' : 'eventos' }} na programação
      </p>
      @for (mes of meses(); track mes.chave) {
        <section class="mes">
          <h2>{{ mes.chave + '-01T00:00' | date: "MMMM 'de' y" }}</h2>
          <ul>
            @for (evento of mes.eventos; track evento.id) {
              <li><app-evento-card [evento]="evento" /></li>
            }
          </ul>
        </section>
      }
    }

    <aside class="convite">
      <div>
        <h2>Sabe de uma ação que não está aqui?</h2>
        <p>Postos de saúde, ONGs, igrejas e grupos do bairro podem divulgar de graça. A equipe confere antes de publicar.</p>
      </div>
      <a class="botao cheio" routerLink="/divulgar"><app-icone nome="novo-evento" />Divulgar evento</a>
    </aside>
  `,
  styles: `
    /* ---------- Abertura: chamada + mosaico de azulejos ---------- */
    .abertura {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      margin: 1.75rem 0 2rem;
      background: var(--verde);
      color: #fff;
      border-radius: var(--raio);
      overflow: hidden;
    }
    .chamada { padding: 2.75rem 2.5rem 2.5rem; }
    h1 { margin: 0 0 1rem; color: #fff; font-size: clamp(2.4rem, 5.2vw, 3.6rem); line-height: 0.98; max-width: 14ch; }
    .chamada p { margin: 0; max-width: 44ch; color: #d6eadd; font-size: 1.05rem; }
    .mosaico { min-height: 300px; }

    .busca {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1.75rem;
      max-width: 520px;
      background: #fff;
      color: var(--texto-suave);
      border-radius: var(--raio);
      padding: 0.3rem 0.3rem 0.3rem 0.85rem;
    }
    .busca input { flex: 1; min-width: 0; font: inherit; border: 0; padding: 0.55rem 0.25rem; color: var(--texto); background: transparent; }
    .busca input:focus { outline: none; }
    .busca:focus-within { outline: 3px solid var(--ouro); outline-offset: 2px; }
    .busca button {
      font: inherit;
      font-weight: 700;
      padding: 0.6rem 1.1rem;
      border: 0;
      border-radius: 3px;
      background: var(--ouro);
      color: var(--verde-noite);
      cursor: pointer;
    }

    .chamada { min-width: 0; }
    @media (max-width: 760px) {
      .abertura { grid-template-columns: minmax(0, 1fr); }
      .mosaico { order: -1; min-height: 120px; height: 120px; }
      .chamada { padding: 1.75rem 1.25rem 1.5rem; }
    }

    /* ---------- Filtros ---------- */
    .filtros { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.75rem; }
    .categorias { display: flex; gap: 0.4rem; overflow-x: auto; padding-bottom: 0.25rem; scrollbar-width: none; }
    @media (min-width: 768px) { .categorias { flex-wrap: wrap; overflow: visible; } }
    .categorias button {
      flex: none;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font: inherit;
      font-size: 0.93rem;
      font-weight: 600;
      padding: 0.5rem 0.8rem;
      border: 1.5px solid var(--linha);
      border-radius: var(--raio);
      background: #fff;
      color: var(--texto);
      cursor: pointer;
    }
    .categorias button:hover { border-color: var(--verde); }
    .categorias button.ativo { background: var(--verde); border-color: var(--verde); color: #fff; }

    .selects { display: flex; flex-wrap: wrap; align-items: end; gap: 0.75rem 1rem; }
    .selects label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.88rem; font-weight: 700; color: var(--texto-suave); }
    .selects select {
      font: inherit;
      font-weight: 400;
      color: var(--texto);
      padding: 0.55rem 0.75rem;
      border: 1.5px solid var(--linha);
      border-radius: var(--raio);
      background: #fff;
      min-width: 200px;
    }
    .limpar, .link { font: inherit; font-weight: 600; background: none; border: 0; padding: 0.55rem 0; color: var(--verde); text-decoration: underline; cursor: pointer; }
    .link { padding: 0; }

    /* ---------- Programação por mês ---------- */
    .total { margin: 0 0 0.5rem; color: var(--texto-suave); }
    .mes { margin-bottom: 1.5rem; }
    .mes h2 { margin: 1rem 0 0.25rem; font-size: 1.9rem; }
    .mes h2::first-letter { text-transform: uppercase; }
    .mes ul { list-style: none; margin: 0; padding: 0; border-bottom: 1px solid var(--linha); }
    .aviso { padding: 2.5rem 1rem; text-align: center; color: var(--texto-suave); }
    .aviso p { margin: 0.25rem 0; }
    .erro { color: var(--erro); }

    /* ---------- Convite para divulgar ---------- */
    .convite {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem 2rem;
      margin-top: 3rem;
      padding: 1.75rem 1.5rem;
      background: var(--concreto);
      border-left: 6px solid var(--ouro);
    }
    .convite h2 { margin: 0 0 0.35rem; }
    .convite p { margin: 0; color: var(--texto-suave); max-width: 56ch; }
  `,
})
export class Inicio {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly categorias = CATEGORIAS;
  protected readonly regioes = REGIOES;
  protected readonly periodos = PERIODOS;
  protected readonly icone = iconeCategoria;

  protected readonly filtros = signal<FiltrosUrl>({ q: '', categoria: '', regiao: '', quando: '' });
  protected readonly eventos = signal<Evento[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly temFiltro = computed(() => Object.values(this.filtros()).some(Boolean));

  /** Eventos agrupados por mês ("2026-11"), na ordem em que vêm da API (por data). */
  protected readonly meses = computed(() => {
    const grupos: { chave: string; eventos: Evento[] }[] = [];
    for (const e of this.eventos()) {
      const chave = e.data.slice(0, 7);
      const atual = grupos.at(-1);
      if (atual?.chave === chave) atual.eventos.push(e);
      else grupos.push({ chave, eventos: [e] });
    }
    return grupos;
  });

  constructor() {
    // Cada mudança na URL refaz a busca na API
    this.route.queryParamMap
      .pipe(
        map(lerFiltros),
        tap((filtros) => {
          this.filtros.set(filtros);
          this.carregando.set(true);
          this.erro.set(null);
        }),
        switchMap(({ q, categoria, regiao, quando }) =>
          this.api.listarEventos({ q, categoria, regiao, ...intervaloDoPeriodo(quando) }).pipe(
            catchError((e) => {
              this.erro.set(e?.error?.detail ?? 'Não foi possível carregar os eventos. Tente novamente.');
              return of([] as Evento[]);
            }),
          ),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((eventos) => {
        this.eventos.set(eventos);
        this.carregando.set(false);
      });
  }

  /** Atualiza só os filtros informados na URL; null ou '' remove o filtro. */
  protected filtrar(mudancas: Partial<Record<keyof FiltrosUrl, string | null>>): void {
    const queryParams = Object.fromEntries(
      Object.entries(mudancas).map(([chave, valor]) => [chave, valor || null]),
    );
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }

  protected buscar(evento: Event, termo: string): void {
    evento.preventDefault();
    this.filtrar({ q: termo.trim() });
  }

  protected limpar(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected valor(evento: Event): string {
    return (evento.target as HTMLSelectElement).value;
  }
}
