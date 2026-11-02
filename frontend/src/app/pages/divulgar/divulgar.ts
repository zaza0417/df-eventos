import { Component, inject, input, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiService, mensagemDaApi } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { CATEGORIAS, REGIOES } from '../../core/constantes';
import { paraIso } from '../../core/datas';
import { EventoEntrada } from '../../core/models';

/** RN17: término depois do início. */
function horarioValido(grupo: AbstractControl): ValidationErrors | null {
  const { hora_inicio, hora_fim } = grupo.value;
  return hora_inicio && hora_fim && hora_fim <= hora_inicio ? { horarioInvalido: true } : null;
}

/** RN17: data de hoje em diante. */
function dataFutura(controle: AbstractControl): ValidationErrors | null {
  return controle.value && controle.value < paraIso(new Date()) ? { dataPassada: true } : null;
}

type Campo = 'titulo' | 'categoria' | 'descricao' | 'data' | 'hora_inicio' | 'local_nome' | 'endereco' | 'regiao';

@Component({
  selector: 'app-divulgar',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="cartao-form largo">
      <h1>{{ id() ? 'Editar evento' : 'Divulgar evento' }}</h1>
      <p class="subtitulo">
        @if (id() && auth.admin()) {
          Alterações feitas pela administração são publicadas direto.
        } @else {
          Preencha os dados abaixo. A equipe confere se o evento é de saúde ou bem-estar antes de publicar.
        }
      </p>

      @if (carregando()) {
        <p>Carregando evento…</p>
      } @else if (bloqueado()) {
        <p class="mensagem erro">{{ bloqueado() }}</p>
        <a routerLink="/meus-eventos">Voltar para meus eventos</a>
      } @else {
        @if (erro()) {
          <p class="mensagem erro" role="alert">{{ erro() }}</p>
        }

        <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
          <div class="campo" [class.invalido]="invalido('titulo')">
            <label for="titulo">Nome do evento *</label>
            <input id="titulo" formControlName="titulo" maxlength="120" placeholder="Ex.: Campanha de vacinação contra a gripe" />
            @if (invalido('titulo')) {
              <span class="erro-campo">Use entre 5 e 120 caracteres.</span>
            }
          </div>

          <div class="campo" [class.invalido]="invalido('categoria')">
            <label for="categoria">Categoria *</label>
            <select id="categoria" formControlName="categoria">
              <option value="" disabled>Escolha…</option>
              @for (cat of categorias; track cat.slug) {
                <option [value]="cat.slug">{{ cat.nome }}</option>
              }
            </select>
            @if (invalido('categoria')) {
              <span class="erro-campo">Escolha uma categoria.</span>
            }
          </div>

          <div class="campo" [class.invalido]="invalido('descricao')">
            <label for="descricao">Descrição *</label>
            <textarea id="descricao" formControlName="descricao" rows="5"
              placeholder="O que vai acontecer, para quem é, o que levar…"></textarea>
            @if (invalido('descricao')) {
              <span class="erro-campo">Escreva pelo menos 20 caracteres.</span>
            } @else {
              <span class="dica">{{ form.controls.descricao.value.length }} caracteres (mínimo 20)</span>
            }
          </div>

          <div class="linha">
            <div class="campo" [class.invalido]="invalido('data')">
              <label for="data">Data *</label>
              <input id="data" type="date" formControlName="data" [min]="hoje" />
              @if (invalido('data')) {
                <span class="erro-campo">
                  {{ form.controls.data.hasError('dataPassada') ? 'A data não pode estar no passado.' : 'Informe a data.' }}
                </span>
              }
            </div>
            <div class="campo" [class.invalido]="invalido('hora_inicio')">
              <label for="hora_inicio">Início *</label>
              <input id="hora_inicio" type="time" formControlName="hora_inicio" />
              @if (invalido('hora_inicio')) {
                <span class="erro-campo">Informe o horário.</span>
              }
            </div>
            <div class="campo" [class.invalido]="horarioInvalido()">
              <label for="hora_fim">Término</label>
              <input id="hora_fim" type="time" formControlName="hora_fim" />
              @if (horarioInvalido()) {
                <span class="erro-campo">Deve ser depois do início.</span>
              }
            </div>
          </div>

          <div class="campo" [class.invalido]="invalido('local_nome')">
            <label for="local_nome">Local *</label>
            <input id="local_nome" formControlName="local_nome" placeholder="Ex.: UBS 5 de Ceilândia" />
            @if (invalido('local_nome')) {
              <span class="erro-campo">Informe o nome do local.</span>
            }
          </div>

          <div class="linha">
            <div class="campo grande" [class.invalido]="invalido('endereco')">
              <label for="endereco">Endereço *</label>
              <input id="endereco" formControlName="endereco" placeholder="Ex.: QNN 13, Área Especial" />
              @if (invalido('endereco')) {
                <span class="erro-campo">Informe o endereço.</span>
              }
            </div>
            <div class="campo" [class.invalido]="invalido('regiao')">
              <label for="regiao">Região administrativa *</label>
              <select id="regiao" formControlName="regiao">
                <option value="" disabled>Escolha…</option>
                @for (r of regioes; track r) {
                  <option [value]="r">{{ r }}</option>
                }
              </select>
              @if (invalido('regiao')) {
                <span class="erro-campo">Escolha a região.</span>
              }
            </div>
          </div>

          <button type="submit" class="botao-primario" [disabled]="enviando()">
            @if (enviando()) {
              Enviando…
            } @else if (id() && auth.admin()) {
              Salvar alterações
            } @else {
              Enviar para análise
            }
          </button>
        </form>
      }
    </section>
  `,
  styles: `
    .largo { max-width: 720px; }
    .linha { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0 1rem; }
    .grande { grid-column: span 2; }
    @media (max-width: 520px) { .grande { grid-column: auto; } }
    textarea { resize: vertical; }
  `,
})
export class Divulgar implements OnInit {
  /** Presente ao editar (/divulgar/:id). */
  readonly id = input<string>();

  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly categorias = CATEGORIAS;
  protected readonly regioes = REGIOES;
  protected readonly hoje = paraIso(new Date());

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(120)]],
      categoria: ['', Validators.required],
      descricao: ['', [Validators.required, Validators.minLength(20)]],
      data: ['', [Validators.required, dataFutura]],
      hora_inicio: ['', Validators.required],
      hora_fim: [''],
      local_nome: ['', Validators.required],
      endereco: ['', Validators.required],
      regiao: ['', Validators.required],
    },
    { validators: horarioValido },
  );

  protected readonly carregando = signal(false);
  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly bloqueado = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    this.carregando.set(true);
    this.api.detalharEvento(id).subscribe({
      next: (e) => {
        if (e.status === 'publicado' && !this.auth.admin()) {
          this.bloqueado.set('Este evento já foi publicado. Para alterar, fale com a administração.');
        }
        this.form.setValue({
          titulo: e.titulo,
          categoria: e.categoria,
          descricao: e.descricao,
          data: e.data,
          hora_inicio: e.hora_inicio.slice(0, 5),
          hora_fim: e.hora_fim?.slice(0, 5) ?? '',
          local_nome: e.local_nome,
          endereco: e.endereco,
          regiao: e.regiao,
        });
        this.carregando.set(false);
      },
      error: (e) => {
        this.bloqueado.set(mensagemDaApi(e, 'Evento não encontrado.'));
        this.carregando.set(false);
      },
    });
  }

  protected invalido(campo: Campo): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && controle.touched;
  }

  protected horarioInvalido(): boolean {
    return this.form.hasError('horarioInvalido') && this.form.controls.hora_fim.touched;
  }

  protected enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.erro.set('Confira os campos destacados em vermelho.');
      return;
    }

    const valores = this.form.getRawValue();
    const dados: EventoEntrada = { ...valores, hora_fim: valores.hora_fim || null };
    const id = this.id();
    const pedido = id ? this.api.editarEvento(id, dados) : this.api.criarEvento(dados);

    this.enviando.set(true);
    this.erro.set(null);
    pedido.subscribe({
      next: () => {
        if (id && this.auth.admin()) this.router.navigate(['/admin']);
        else this.router.navigate(['/meus-eventos'], { queryParams: { enviado: 1 } });
      },
      error: (e) => {
        this.erro.set(mensagemDaApi(e, 'Não foi possível enviar o evento. Tente novamente.'));
        this.enviando.set(false);
      },
    });
  }
}
