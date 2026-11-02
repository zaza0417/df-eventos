import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-entrar',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="cartao-form">
      <h1>Entrar</h1>
      <p class="subtitulo">Entre para curtir, comentar e divulgar eventos.</p>

      @if (erro()) {
        <p class="mensagem erro" role="alert">{{ erro() }}</p>
      }

      <form [formGroup]="form" (ngSubmit)="enviar()" novalidate>
        <div class="campo" [class.invalido]="invalido('email')">
          <label for="email">E-mail</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
          @if (invalido('email')) {
            <span class="erro-campo">Informe um e-mail válido.</span>
          }
        </div>

        <div class="campo" [class.invalido]="invalido('senha')">
          <label for="senha">Senha</label>
          <input id="senha" type="password" formControlName="senha" autocomplete="current-password" />
          @if (invalido('senha')) {
            <span class="erro-campo">Informe sua senha.</span>
          }
        </div>

        <button type="submit" class="botao-primario" [disabled]="enviando()">
          {{ enviando() ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <p class="rodape-form">
        Ainda não tem conta?
        <a routerLink="/cadastro" [queryParams]="voltar() ? { voltar: voltar() } : {}">Criar conta</a>
      </p>
    </section>
  `,
})
export class Entrar {
  /** Página para onde voltar depois de entrar (?voltar=/divulgar). */
  readonly voltar = input<string>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });
  protected readonly erro = signal<string | null>(null);
  protected readonly enviando = signal(false);

  protected invalido(campo: 'email' | 'senha'): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && controle.touched;
  }

  protected async enviar(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.enviando.set(true);
    this.erro.set(null);
    const { email, senha } = this.form.getRawValue();
    const erro = await this.auth.entrar(email.trim(), senha);
    this.enviando.set(false);

    if (erro) this.erro.set(erro);
    else this.router.navigateByUrl(this.voltar() || '/');
  }
}
