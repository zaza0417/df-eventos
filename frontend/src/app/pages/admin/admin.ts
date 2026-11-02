import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, mensagemDaApi } from '../../core/api.service';
import { categoria, iconeCategoria } from '../../core/constantes';
import { horaCurta } from '../../core/datas';
import { EventoAdmin, StatusEvento } from '../../core/models';
import { Icone } from '../../shared/icone/icone';
import { Placa } from '../../shared/placa/placa';
import { StatusBadge } from '../../shared/status-badge/status-badge';

type Aba = 'pendentes' | 'todos';

@Component({
  selector: 'app-admin',
  imports: [DatePipe, FormsModule, RouterLink, StatusBadge, Icone, Placa],
  template: `
    <h1>Validar eventos</h1>

    <div class="abas" role="tablist">
      <button type="button" role="tab" [class.ativa]="aba() === 'pendentes'" [attr.aria-selected]="aba() === 'pendentes'"
        (click)="trocarAba('pendentes')">
        Esperando análise <span class="contador">{{ pendentes().length }}</span>
      </button>
      <button type="button" role="tab" [class.ativa]="aba() === 'todos'" [attr.aria-selected]="aba() === 'todos'"
        (click)="trocarAba('todos')">
        Todos os eventos
      </button>
    </div>

    @if (mensagem(); as m) {
      <p class="mensagem" [class.sucesso]="m.tipo === 'sucesso'" [class.erro]="m.tipo === 'erro'" role="status">{{ m.texto }}</p>
    }

    @if (carregando()) {
      <p class="aviso">Carregando…</p>
    } @else if (aba() === 'pendentes') {
      <!-- ================= Fila de validação (RF05) ================= -->
      @if (pendentes().length === 0) {
        <p class="aviso"><strong>Nenhum evento esperando análise.</strong> Novos envios aparecem aqui.</p>
      } @else {
        <div class="fila">
          <ol class="lista-pendentes" aria-label="Fila, do envio mais antigo para o mais novo">
            @for (e of pendentes(); track e.id) {
              <li>
                <button type="button" [class.selecionado]="selecionado()?.id === e.id" (click)="selecionar(e)">
                  <strong>{{ e.titulo }}</strong>
                  <span><app-icone [nome]="icone(e.categoria)" [tamanho]="15" />{{ nomeCategoria(e) }}, enviado em {{ e.criado_em | date: 'dd/MM' }}</span>
                </button>
              </li>
            }
          </ol>

          @if (selecionado(); as e) {
            <article class="analise">
              <p class="categoria"><app-icone [nome]="icone(e.categoria)" />{{ nomeCategoria(e) }}</p>
              <h2>{{ e.titulo }}</h2>
              <p class="enviado">Enviado por <strong>{{ e.autor?.nome ?? 'Equipe DF EventoS' }}</strong>
                em {{ e.criado_em | date: "dd/MM/yyyy 'às' HH:mm" }}</p>
              <dl>
                <div><dt><app-icone nome="calendario" [tamanho]="16" />Quando</dt>
                  <dd>{{ e.data + 'T00:00' | date: "EEEE, d 'de' MMMM" }}, {{ horario(e) }}</dd></div>
                <div><dt><app-icone nome="local" [tamanho]="16" />Onde</dt>
                  <dd>{{ e.local_nome }}, {{ e.endereco }} <app-placa [texto]="e.regiao" /></dd></div>
                <div class="inteira"><dt>Descrição</dt><dd class="descricao">{{ e.descricao }}</dd></div>
              </dl>

              <p class="pergunta">É uma ação de saúde ou bem-estar, aberta ao público, que combina com a plataforma?</p>

              @if (rejeitando()) {
                <div class="campo">
                  <label for="motivo">Por que não aprovar? Quem enviou vai ler esta mensagem.</label>
                  <textarea id="motivo" rows="3" [(ngModel)]="motivo"
                    placeholder="Ex.: é uma promoção comercial, não uma ação social de saúde."></textarea>
                </div>
                <div class="acoes">
                  <button type="button" class="botao perigo cheio" [disabled]="ocupado()" (click)="rejeitar(e)">Não aprovar</button>
                  <button type="button" class="botao" (click)="rejeitando.set(false)">Cancelar</button>
                </div>
              } @else {
                <div class="acoes">
                  <button type="button" class="botao cheio" [disabled]="ocupado()" (click)="aprovar(e)"><app-icone nome="ok" />Aprovar e publicar</button>
                  <button type="button" class="botao perigo" [disabled]="ocupado()" (click)="rejeitando.set(true)"><app-icone nome="fechar" />Não aprovar</button>
                  <a class="botao" [routerLink]="['/divulgar', e.id]"><app-icone nome="editar" />Editar antes</a>
                </div>
              }
            </article>
          }
        </div>
      }
    } @else {
      <!-- ================= Todos os eventos (RF15, RF19) ================= -->
      <label class="filtro">
        Situação
        <select [ngModel]="filtroStatus()" (ngModelChange)="filtroStatus.set($event)">
          <option value="">Todas</option>
          <option value="pendente">Em análise</option>
          <option value="publicado">Publicados</option>
          <option value="rejeitado">Não aprovados</option>
        </select>
      </label>

      <div class="tabela-rolagem">
        <table>
          <thead>
            <tr><th>Evento</th><th>Data</th><th>Situação</th><th>Divulgado por</th><th><span class="sr-only">Ações</span></th></tr>
          </thead>
          <tbody>
            @for (e of todosFiltrados(); track e.id) {
              <tr>
                <td><strong>{{ e.titulo }}</strong><br /><span class="suave">{{ nomeCategoria(e) }}, {{ e.regiao }}</span></td>
                <td>{{ e.data + 'T00:00' | date: 'dd/MM/yyyy' }}</td>
                <td><app-status-badge [status]="e.status" /></td>
                <td>{{ e.autor?.nome ?? 'Equipe DF EventoS' }}</td>
                <td class="acoes-tabela">
                  @if (e.status === 'publicado') {
                    <a [routerLink]="['/eventos', e.id]">Ver</a>
                  }
                  <a [routerLink]="['/divulgar', e.id]">Editar</a>
                  <button type="button" class="link-perigo" (click)="excluir(e)">Excluir</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="aviso">Nenhum evento nessa situação.</td></tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    h1 { margin: 2rem 0 1rem; }
    .abas { display: flex; gap: 0.25rem; border-bottom: 2px solid var(--linha); margin-bottom: 1.5rem; }
    .abas button {
      display: inline-flex; align-items: center; gap: 0.5rem;
      font: inherit; font-weight: 700; background: none; border: 0; cursor: pointer;
      padding: 0.75rem 1rem; color: var(--texto-suave); border-bottom: 4px solid transparent; margin-bottom: -2px;
    }
    .abas button.ativa { color: var(--verde-noite); border-bottom-color: var(--ouro); }
    .contador { font-family: var(--fonte-titulo); font-weight: 800; font-size: 1.05rem; min-width: 1.7em; padding: 0.05rem 0.4rem; border-radius: 3px; background: var(--verde); color: #fff; }

    .fila { display: grid; grid-template-columns: minmax(220px, 320px) 1fr; gap: 1.5rem; align-items: start; }
    @media (max-width: 760px) { .fila { grid-template-columns: 1fr; } }
    .lista-pendentes { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--linha); }
    .lista-pendentes button {
      width: 100%; text-align: left; font: inherit; cursor: pointer;
      display: flex; flex-direction: column; gap: 0.2rem;
      padding: 0.85rem 0.9rem; border: 0; border-bottom: 1px solid var(--linha); background: #fff; color: var(--texto);
    }
    .lista-pendentes button:hover { background: var(--concreto); }
    .lista-pendentes button span { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.85rem; color: var(--texto-suave); }
    .lista-pendentes button.selecionado { background: var(--concreto); box-shadow: inset 5px 0 0 var(--verde); }

    .analise { border: 2px solid var(--verde); border-radius: var(--raio); padding: 1.5rem; }
    .categoria { display: flex; align-items: center; gap: 0.4rem; margin: 0 0 0.3rem; font-weight: 600; color: var(--verde); }
    h2 { margin: 0 0 0.35rem; font-size: 2rem; }
    .enviado { margin: 0 0 1.25rem; color: var(--texto-suave); }
    dl { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.5rem; margin: 0; }
    .inteira { grid-column: 1 / -1; }
    @media (max-width: 560px) { dl { grid-template-columns: 1fr; } }
    dt { display: flex; align-items: center; gap: 0.35rem; font-weight: 700; font-size: 0.88rem; color: var(--texto-suave); }
    dd { margin: 0.2rem 0 0; }
    dd::first-letter { text-transform: uppercase; }
    dd app-placa { margin-left: 0.35rem; }
    .descricao { white-space: pre-line; max-width: 66ch; }
    .pergunta { margin: 1.5rem 0 1rem; padding: 0.8rem 1rem; background: var(--concreto); border-left: 4px solid var(--ouro); font-weight: 600; }
    .acoes { display: flex; flex-wrap: wrap; gap: 0.5rem; }

    .filtro { display: inline-flex; flex-direction: column; gap: 0.25rem; font-size: 0.88rem; font-weight: 700; color: var(--texto-suave); margin-bottom: 1rem; }
    .filtro select { font: inherit; font-weight: 400; padding: 0.55rem 0.75rem; border: 1.5px solid var(--linha); border-radius: var(--raio); background: #fff; color: var(--texto); min-width: 200px; }
    .tabela-rolagem { overflow-x: auto; border-top: 2px solid var(--verde); }
    table { width: 100%; border-collapse: collapse; min-width: 680px; }
    th, td { text-align: left; padding: 0.85rem 0.75rem; border-bottom: 1px solid var(--linha); vertical-align: top; }
    th { font-size: 0.88rem; color: var(--texto-suave); }
    .suave { font-size: 0.88rem; color: var(--texto-suave); }
    .acoes-tabela { white-space: nowrap; display: flex; gap: 1rem; font-weight: 600; }
    .aviso { padding: 2.5rem 1rem; text-align: center; color: var(--texto-suave); }
  `,
})
export class Admin implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly aba = signal<Aba>('pendentes');
  protected readonly todos = signal<EventoAdmin[]>([]);
  protected readonly carregando = signal(true);
  protected readonly ocupado = signal(false);
  protected readonly mensagem = signal<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  protected readonly selecionado = signal<EventoAdmin | null>(null);
  protected readonly rejeitando = signal(false);
  protected readonly filtroStatus = signal<StatusEvento | ''>('');
  protected motivo = '';

  /** Fila: mais antigos primeiro. */
  protected readonly pendentes = computed(() =>
    this.todos()
      .filter((e) => e.status === 'pendente')
      .sort((a, b) => a.criado_em.localeCompare(b.criado_em)),
  );
  protected readonly todosFiltrados = computed(() => {
    const status = this.filtroStatus();
    return status ? this.todos().filter((e) => e.status === status) : this.todos();
  });

  ngOnInit(): void {
    this.carregar();
  }

  private carregar(): void {
    this.api.eventosAdmin().subscribe({
      next: (eventos) => {
        this.todos.set(eventos);
        this.carregando.set(false);
        if (!this.selecionado()) this.selecionado.set(this.pendentes()[0] ?? null);
      },
      error: (e) => {
        this.mensagem.set({ tipo: 'erro', texto: mensagemDaApi(e, 'Não foi possível carregar os eventos.') });
        this.carregando.set(false);
      },
    });
  }

  protected trocarAba(aba: Aba): void {
    this.aba.set(aba);
    this.mensagem.set(null);
  }

  protected selecionar(e: EventoAdmin): void {
    this.selecionado.set(e);
    this.rejeitando.set(false);
    this.motivo = '';
  }

  protected aprovar(e: EventoAdmin): void {
    this.decidir(this.api.aprovarEvento(e.id), e, `"${e.titulo}" foi aprovado e já está na programação.`);
  }

  protected rejeitar(e: EventoAdmin): void {
    if (this.motivo.trim().length < 5) {
      this.mensagem.set({ tipo: 'erro', texto: 'Explique o motivo da rejeição (mínimo de 5 caracteres).' });
      return;
    }
    this.decidir(this.api.rejeitarEvento(e.id, this.motivo), e, `"${e.titulo}" não foi aprovado. Quem enviou vai ver o motivo.`);
  }

  /** Aplica a decisão, atualiza a lista e já abre o próximo pendente. */
  private decidir(pedido: ReturnType<ApiService['aprovarEvento']>, e: EventoAdmin, sucesso: string): void {
    this.ocupado.set(true);
    pedido.subscribe({
      next: (atualizado) => {
        this.todos.update((lista) => lista.map((x) => (x.id === e.id ? { ...x, ...atualizado } : x)));
        this.selecionado.set(this.pendentes()[0] ?? null);
        this.rejeitando.set(false);
        this.motivo = '';
        this.mensagem.set({ tipo: 'sucesso', texto: sucesso });
        this.ocupado.set(false);
      },
      error: (err) => {
        this.mensagem.set({ tipo: 'erro', texto: mensagemDaApi(err) });
        this.ocupado.set(false);
      },
    });
  }

  protected excluir(e: EventoAdmin): void {
    if (!confirm(`Excluir o evento "${e.titulo}"? Essa ação não pode ser desfeita.`)) return;
    this.api.excluirEvento(e.id).subscribe({
      next: () => {
        this.todos.update((lista) => lista.filter((x) => x.id !== e.id));
        this.mensagem.set({ tipo: 'sucesso', texto: `"${e.titulo}" foi excluído.` });
      },
      error: (err) => this.mensagem.set({ tipo: 'erro', texto: mensagemDaApi(err) }),
    });
  }

  protected readonly icone = iconeCategoria;

  protected nomeCategoria(e: EventoAdmin): string {
    return categoria(e.categoria).nome;
  }

  protected horario(e: EventoAdmin): string {
    const inicio = horaCurta(e.hora_inicio);
    return e.hora_fim ? `${inicio} às ${horaCurta(e.hora_fim)}` : `a partir das ${inicio}`;
  }
}
