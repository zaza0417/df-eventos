import { DatePipe, Location } from '@angular/common';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';

import { ApiService, mensagemDaApi } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { categoria, iconeCategoria } from '../../core/constantes';
import { horaCurta } from '../../core/datas';
import { Comentario, Evento } from '../../core/models';
import { Azulejos } from '../../shared/azulejos/azulejos';
import { Icone } from '../../shared/icone/icone';
import { Placa } from '../../shared/placa/placa';

@Component({
  selector: 'app-evento-detalhe',
  imports: [DatePipe, RouterLink, Icone, Placa, Azulejos],
  template: `
    <button type="button" class="voltar" (click)="voltar()"><app-icone nome="voltar" />Voltar para a programação</button>

    @if (carregando()) {
      <p class="aviso">Carregando evento…</p>
    } @else if (erro()) {
      <div class="aviso">
        <p class="erro">{{ erro() }}</p>
        <a routerLink="/">Ver a programação</a>
      </div>
    } @else if (evento(); as e) {
      @if (e.status !== 'publicado') {
        <p class="mensagem" [class.erro]="e.status === 'rejeitado'" [class.sucesso]="e.status === 'pendente'">
          {{ e.status === 'pendente'
            ? 'Este evento está em análise. Só você e a equipe de validação conseguem vê-lo.'
            : 'Este evento não foi aprovado e não aparece na programação.' }}
        </p>
      }

      <!-- Ingresso: canhoto com a data + corpo com as informações -->
      <article class="ingresso">
        <div class="canhoto">
          <app-azulejos class="faixa-azulejos" [colunas]="6" [linhas]="1" [semente]="semente()" />
          <div class="quando">
            <span class="dia">{{ dataEvento() | date: 'dd' }}</span>
            <span class="mes">{{ dataEvento() | date: 'MMMM' }}</span>
            <span class="semana">{{ dataEvento() | date: 'EEEE' }}</span>
            <span class="hora">{{ horario() }}</span>
          </div>
        </div>

        <div class="corpo">
          <p class="categoria"><app-icone [nome]="icone()" [tamanho]="18" />{{ cat().nome }}</p>
          <h1>{{ e.titulo }}</h1>

          <div class="onde">
            <app-icone nome="local" [tamanho]="20" />
            <div>
              <strong>{{ e.local_nome }}</strong>
              <span>{{ e.endereco }}</span>
              <span class="placa-linha"><app-placa [texto]="e.regiao" /><a [href]="linkMapa()" target="_blank" rel="noopener">Ver no mapa</a></span>
            </div>
          </div>

          <p class="descricao">{{ e.descricao }}</p>

          <div class="acoes" role="group" aria-label="Curtir e compartilhar">
            @if (e.status === 'publicado') {
              <button type="button" class="botao curtir" [class.ativo]="e.curtiu" [attr.aria-pressed]="!!e.curtiu"
                [disabled]="curtindo()" (click)="curtir()">
                <app-icone nome="curtir" />{{ e.curtiu ? 'Curtido' : 'Curtir' }}
                <span class="contagem">{{ e.total_curtidas }}</span>
              </button>
            }
            <a class="botao" [href]="linkWhatsapp()" target="_blank" rel="noopener"><app-icone nome="compartilhar" />Enviar no WhatsApp</a>
            <button type="button" class="botao" (click)="copiarLink()">
              <app-icone [nome]="copiado() ? 'ok' : 'copiar'" />{{ copiado() ? 'Link copiado' : 'Copiar link' }}
            </button>
            @if (podeCompartilhar) {
              <button type="button" class="botao" (click)="compartilhar()"><app-icone nome="compartilhar" />Compartilhar</button>
            }
          </div>
        </div>
      </article>

      @if (e.status === 'publicado') {
        <!-- ================= Comentários (RF09, RF10) ================= -->
        <section class="comentarios" aria-labelledby="titulo-comentarios">
          <h2 id="titulo-comentarios">
            {{ comentarios().length === 0 ? 'Comentários' : comentarios().length === 1 ? '1 comentário' : comentarios().length + ' comentários' }}
          </h2>

          @if (auth.logado()) {
            <form class="novo" (submit)="comentar($event)">
              <label class="sr-only" for="texto-comentario">Escreva um comentário</label>
              <textarea id="texto-comentario" rows="2" maxlength="1000" placeholder="Tire uma dúvida ou conte como foi"
                [value]="texto()" (input)="texto.set(valor($event))"></textarea>
              <button type="submit" class="botao cheio" [disabled]="!texto().trim() || enviando()">
                {{ enviando() ? 'Enviando…' : 'Comentar' }}
              </button>
            </form>
          } @else {
            <p class="entrar-para">
              <a routerLink="/entrar" [queryParams]="{ voltar: urlAtual() }">Entre na sua conta</a> para curtir e comentar.
            </p>
          }
          @if (erroComentario()) {
            <p class="mensagem erro" role="alert">{{ erroComentario() }}</p>
          }

          <ul class="lista-comentarios">
            @for (c of comentarios(); track c.id) {
              <li>
                <span class="inicial" aria-hidden="true">{{ (c.autor?.nome ?? '?').charAt(0) }}</span>
                <div>
                  <p class="cabeca">
                    <strong>{{ c.autor?.nome ?? 'Usuário' }}</strong>
                    <span class="em">{{ c.criado_em | date: "d 'de' MMM, HH:mm" }}</span>
                  </p>
                  <p class="texto">{{ c.texto }}</p>
                  @if (podeRemover(c)) {
                    <button type="button" class="link-perigo" (click)="removerComentario(c)">
                      {{ auth.admin() && c.usuario_id !== auth.perfil()?.id ? 'Remover comentário' : 'Apagar' }}
                    </button>
                  }
                </div>
              </li>
            } @empty {
              <li class="vazio">Ainda ninguém comentou. Dúvidas sobre o evento podem ficar aqui.</li>
            }
          </ul>
        </section>
      }
    }
  `,
  styles: `
    .voltar {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font: inherit;
      font-weight: 600;
      background: none;
      border: 0;
      padding: 1.5rem 0 1rem;
      color: var(--verde);
      cursor: pointer;
    }

    /* ---------- Ingresso ---------- */
    .ingresso { display: grid; grid-template-columns: 15rem 1fr; border: 2px solid var(--verde); border-radius: var(--raio); overflow: hidden; }
    .canhoto { background: var(--verde); color: #fff; display: flex; flex-direction: column; border-right: 2px dashed rgb(255 255 255 / 0.5); }
    .faixa-azulejos { height: 40px; }
    .quando { display: flex; flex-direction: column; padding: 1.25rem 1.5rem 1.75rem; }
    .dia { font-family: var(--fonte-titulo); font-weight: 800; font-size: 6rem; line-height: 0.85; color: var(--ouro); }
    .mes { font-family: var(--fonte-titulo); font-weight: 700; font-size: 1.9rem; line-height: 1.1; }
    .mes::first-letter, .semana::first-letter { text-transform: uppercase; }
    .semana { color: #d6eadd; margin-bottom: 1rem; }
    .hora { font-family: var(--fonte-titulo); font-weight: 700; font-size: 1.35rem; padding-top: 0.75rem; border-top: 1px solid rgb(255 255 255 / 0.35); }

    .corpo { padding: 1.75rem 2rem 2rem; min-width: 0; }
    .categoria { display: flex; align-items: center; gap: 0.4rem; margin: 0 0 0.4rem; font-weight: 600; color: var(--verde); }
    h1 { margin: 0 0 1.25rem; font-size: clamp(2rem, 4.4vw, 2.9rem); max-width: 22ch; }
    .onde { display: flex; gap: 0.75rem; align-items: flex-start; color: var(--verde); margin-bottom: 1.25rem; }
    .onde > div { display: flex; flex-direction: column; gap: 0.2rem; color: var(--texto); }
    .onde span { color: var(--texto-suave); }
    .placa-linha { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.35rem; }
    .placa-linha a { font-weight: 600; }
    .descricao { margin: 0; white-space: pre-line; max-width: 64ch; font-size: 1.05rem; }

    .acoes { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid var(--linha); }
    .curtir.ativo { background: var(--verde); color: #fff; }
    .contagem { font-family: var(--fonte-titulo); font-size: 1.1rem; padding-left: 0.45rem; margin-left: 0.1rem; border-left: 1.5px solid currentColor; }

    @media (max-width: 700px) {
      .ingresso { grid-template-columns: 1fr; }
      .canhoto { border-right: 0; border-bottom: 2px dashed rgb(255 255 255 / 0.5); }
      .quando { flex-direction: row; flex-wrap: wrap; align-items: baseline; gap: 0 0.6rem; padding: 1rem 1.25rem 1.25rem; }
      .dia { font-size: 3.6rem; }
      .semana { margin: 0; width: 100%; }
      .hora { border: 0; padding: 0; width: 100%; }
      .corpo { padding: 1.25rem; }
    }

    /* ---------- Comentários ---------- */
    .comentarios { max-width: 760px; margin-top: 2.5rem; }
    .comentarios h2 { margin: 0 0 1rem; }
    .novo { display: flex; gap: 0.5rem; align-items: stretch; margin-bottom: 1.25rem; }
    .novo textarea { flex: 1; min-width: 0; font: inherit; resize: vertical; padding: 0.7rem 0.85rem; border: 1px solid #b9c1b8; border-radius: var(--raio); }
    .novo textarea:focus { outline: 2px solid var(--verde); border-color: var(--verde); }
    .entrar-para { padding: 0.9rem 1rem; background: var(--concreto); border-left: 4px solid var(--ouro); }
    .lista-comentarios { list-style: none; margin: 0; padding: 0; }
    .lista-comentarios li { display: flex; gap: 0.85rem; padding: 1rem 0; border-top: 1px solid var(--linha); }
    .inicial {
      flex: none; width: 2.4rem; height: 2.4rem; display: grid; place-items: center;
      background: var(--concreto); color: var(--verde); border-radius: var(--raio);
      font-family: var(--fonte-titulo); font-weight: 800; font-size: 1.3rem; text-transform: uppercase;
    }
    .cabeca { margin: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.6rem; }
    .em { font-size: 0.85rem; color: var(--texto-suave); }
    .texto { margin: 0.2rem 0 0.35rem; white-space: pre-line; }
    .link-perigo { font-size: 0.88rem; }
    .vazio { color: var(--texto-suave); }

    .aviso { padding: 2rem; text-align: center; color: var(--texto-suave); }
    .erro { color: var(--erro); }
  `,
})
export class EventoDetalhe implements OnInit {
  /** Vem da rota /eventos/:id (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly titulo = inject(Title);
  private readonly navegacao = inject(Location);
  private readonly router = inject(Router);

  protected readonly evento = signal<Evento | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);
  protected readonly copiado = signal(false);
  protected readonly curtindo = signal(false);
  protected readonly comentarios = signal<Comentario[]>([]);
  protected readonly texto = signal('');
  protected readonly enviando = signal(false);
  protected readonly erroComentario = signal<string | null>(null);
  protected readonly podeCompartilhar = typeof navigator !== 'undefined' && !!navigator.share;

  protected readonly cat = computed(() => categoria(this.evento()?.categoria ?? ''));
  protected readonly icone = computed(() => iconeCategoria(this.evento()?.categoria ?? ''));
  protected readonly dataEvento = computed(() => (this.evento()?.data ?? '') + 'T00:00');
  /** Cada evento ganha uma faixa de azulejos própria, sempre a mesma. */
  protected readonly semente = computed(() =>
    [...(this.evento()?.id ?? '')].reduce((soma, letra) => soma + letra.charCodeAt(0), 0),
  );

  protected readonly horario = computed(() => {
    const e = this.evento();
    if (!e) return '';
    const inicio = horaCurta(e.hora_inicio);
    return e.hora_fim ? `${inicio} às ${horaCurta(e.hora_fim)}` : `A partir das ${inicio}`;
  });

  protected readonly linkMapa = computed(() => {
    const e = this.evento();
    const endereco = e ? `${e.local_nome}, ${e.endereco}, ${e.regiao}, Brasília - DF` : '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
  });

  protected readonly linkWhatsapp = computed(() => {
    const e = this.evento();
    const texto = e ? `${e.titulo}. Veja no DF EventoS: ${location.href}` : location.href;
    return `https://wa.me/?text=${encodeURIComponent(texto)}`;
  });

  ngOnInit(): void {
    this.api.detalharEvento(this.id()).subscribe({
      next: (evento) => {
        this.evento.set(evento);
        this.titulo.setTitle(`${evento.titulo} | DF EventoS`);
        this.carregando.set(false);
        if (evento.status === 'publicado') {
          this.api.comentarios(evento.id).subscribe((lista) => this.comentarios.set(lista));
        }
      },
      error: (e) => {
        this.erro.set(
          e?.status === 404 || e?.status === 422
            ? 'Evento não encontrado. Ele pode ter sido removido ou ainda não foi publicado.'
            : (e?.error?.detail ?? 'Não foi possível carregar o evento. Tente novamente.'),
        );
        this.carregando.set(false);
      },
    });
  }

  protected urlAtual(): string {
    return this.router.url;
  }

  protected valor(evento: Event): string {
    return (evento.target as HTMLTextAreaElement).value;
  }

  /** RN08/RN22: visitante vai para o login; logado liga/desliga a curtida. */
  protected curtir(): void {
    const e = this.evento();
    if (!e) return;
    if (!this.auth.logado()) {
      this.router.navigate(['/entrar'], { queryParams: { voltar: this.router.url } });
      return;
    }
    this.curtindo.set(true);
    this.api.curtir(e.id).subscribe({
      next: ({ curtiu, total_curtidas }) => {
        this.evento.update((atual) => (atual ? { ...atual, curtiu, total_curtidas } : atual));
        this.curtindo.set(false);
      },
      error: () => this.curtindo.set(false),
    });
  }

  protected comentar(evento: Event): void {
    evento.preventDefault();
    const e = this.evento();
    const texto = this.texto().trim();
    if (!e || !texto) return;

    this.enviando.set(true);
    this.erroComentario.set(null);
    this.api.comentar(e.id, texto).subscribe({
      next: (novo) => {
        this.comentarios.update((lista) => [...lista, novo]);
        this.texto.set('');
        this.enviando.set(false);
      },
      error: (err) => {
        this.erroComentario.set(mensagemDaApi(err, 'Não foi possível enviar o comentário.'));
        this.enviando.set(false);
      },
    });
  }

  /** O autor apaga o próprio comentário; o admin remove qualquer um (RN09). */
  protected podeRemover(c: Comentario): boolean {
    return this.auth.admin() || c.usuario_id === this.auth.perfil()?.id;
  }

  protected removerComentario(c: Comentario): void {
    if (!confirm('Remover este comentário?')) return;
    this.api.removerComentario(c.id).subscribe({
      next: () => this.comentarios.update((lista) => lista.filter((x) => x.id !== c.id)),
      error: (err) => this.erroComentario.set(mensagemDaApi(err, 'Não foi possível remover o comentário.')),
    });
  }

  protected voltar(): void {
    // Volta mantendo os filtros da busca; se a pessoa abriu o link direto, vai para o início
    if (history.state?.navigationId > 1) this.navegacao.back();
    else this.router.navigate(['/']);
  }

  protected async copiarLink(): Promise<void> {
    await navigator.clipboard.writeText(location.href);
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 2500);
  }

  protected compartilhar(): void {
    const e = this.evento();
    navigator.share({ title: e?.titulo, text: e?.titulo, url: location.href }).catch(() => {
      // a pessoa fechou a janela de compartilhar: nada a fazer
    });
  }
}
