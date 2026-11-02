import { Component, inject, input, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';

/** Senha com pelo menos 8 caracteres, uma letra e um número. */
const SENHA_FORTE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function senhasIguais(grupo: AbstractControl): ValidationErrors | null {
  const { senha, confirmacao } = grupo.value;
  return senha && confirmacao && senha !== confirmacao ? { senhasDiferentes: true } : null;
}

@Component({
  selector: 'app-cadastro',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="cartao-form">
      <h1>Criar conta</h1>
      <p class="subtitulo">É grátis e leva menos de um minuto.</p>

      @if (erro()) {
        <p class="mensagem erro" role="alert">{{ erro() }}</p>
      }
      @if (aviso()) {
        <p class="mensagem sucesso" role="status">{{ aviso() }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
        <div class="campo" [class.invalido]="invalido('nome')">
          <label for="nome">Nome</label>
          <input id="nome" type="text" formControlName="nome" autocomplete="name" />
          @if (invalido('nome')) {
            <span class="erro-campo">Informe seu nome (mínimo de 2 letras).</span>
          }
        </div>

        <div class="campo" [class.invalido]="invalido('email')">
          <label for="email">E-mail</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
          @if (invalido('email')) {
            <span class="erro-campo">Informe um e-mail válido.</span>
          }
        </div>

        <div class="campo" [class.invalido]="invalido('senha')">
          <label for="senha">Senha</label>
          <input id="senha" type="password" formControlName="senha" autocomplete="new-password" />
          @if (invalido('senha')) {
            <span class="erro-campo">A senha precisa de 8 caracteres ou mais, com letras e números.</span>
          } @else {
            <span class="dica">Mínimo de 8 caracteres, com letras e números.</span>
          }
        </div>

        <div class="campo" [class.invalido]="confirmacaoInvalida()">
          <label for="confirmacao">Confirmar senha</label>
          <input id="confirmacao" type="password" formControlName="confirmacao" autocomplete="new-password" />
          @if (confirmacaoInvalida()) {
            <span class="erro-campo">As senhas não são iguais.</span>
          }
        </div>

        <button type="submit" class="botao-primario" [disabled]="enviando()">
          {{ enviando() ? 'Criando conta…' : 'Criar conta' }}
        </button>
      </form>

      <p class="rodape-form">
        Já tem conta?
        <a routerLink="/entrar" [queryParams]="voltar() ? { voltar: voltar() } : {}">Entrar</a>
      </p>
    </section>
  `,
})
export class Cadastro {
  readonly voltar = input<string>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.pattern(SENHA_FORTE)]],
      confirmacao: ['', Validators.required],
    },
    { validators: senhasIguais },
  );
  protected readonly erro = signal<string | null>(null);
  protected readonly aviso = signal<string | null>(null);
  protected readonly enviando = signal(false);

  protected invalido(campo: 'nome' | 'email' | 'senha'): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && controle.touched;
  }

  protected confirmacaoInvalida(): boolean {
    const controle = this.form.controls.confirmacao;
    return controle.touched && (controle.invalid || this.form.hasError('senhasDiferentes'));
  }

  protected async enviar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.enviando.set(true);
    this.erro.set(null);
    const { nome, email, senha } = this.form.getRawValue();
    const resultado = await this.auth.cadastrar(nome.trim(), email.trim(), senha);
    this.enviando.set(false);

    if (resultado === null) this.router.navigateByUrl(this.voltar() || '/');
    else if (resultado.startsWith('Conta criada')) this.aviso.set(resultado);
    else this.erro.set(resultado);
  }
}
