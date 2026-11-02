import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthError, createClient, Session } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { Perfil } from './models';

/** Traduz as mensagens do Supabase Auth para o usuário. */
function mensagemDeErro(erro: AuthError): string {
  if (erro.code === 'invalid_credentials') return 'E-mail ou senha inválidos.';
  if (erro.code === 'user_already_exists' || erro.code === 'email_exists') {
    return 'Este e-mail já está cadastrado. Tente entrar.';
  }
  if (erro.code === 'weak_password') return 'Senha fraca: use pelo menos 8 caracteres.';
  if (erro.code === 'over_email_send_rate_limit' || erro.status === 429) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  }
  if (erro.code === 'email_not_confirmed') return 'Confirme seu e-mail antes de entrar.';
  return 'Não foi possível concluir. Tente novamente.';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);

  private readonly sessao = signal<Session | null>(null);
  /** Perfil vindo da nossa API (nome e papel). null = visitante. */
  readonly perfil = signal<Perfil | null>(null);
  readonly logado = computed(() => this.perfil() !== null);
  readonly admin = computed(() => this.perfil()?.papel === 'admin');

  /** Resolve quando a sessão salva no navegador já foi lida (usado pelos guards). */
  readonly pronto: Promise<void>;

  constructor() {
    this.pronto = this.supabase.auth.getSession().then(({ data }) => this.aplicarSessao(data.session));
    this.supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === 'SIGNED_OUT') this.limpar();
      else if (evento === 'TOKEN_REFRESHED') this.sessao.set(sessao);
    });
  }

  /** Token enviado para a API no header Authorization. */
  token(): string | null {
    return this.sessao()?.access_token ?? null;
  }

  async entrar(email: string, senha: string): Promise<string | null> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password: senha });
    if (error) return mensagemDeErro(error);
    await this.aplicarSessao(data.session);
    return null;
  }

  async cadastrar(nome: string, email: string, senha: string): Promise<string | null> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } }, // o gatilho do banco usa esse nome para criar o perfil
    });
    if (error) return mensagemDeErro(error);
    if (!data.session) {
      // Acontece se "Confirm email" estiver ligado no Supabase
      return 'Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre.';
    }
    await this.aplicarSessao(data.session);
    return null;
  }

  async sair(): Promise<void> {
    await this.supabase.auth.signOut();
    this.limpar();
  }

  private async aplicarSessao(sessao: Session | null): Promise<void> {
    this.sessao.set(sessao);
    if (!sessao) {
      this.perfil.set(null);
      return;
    }
    try {
      this.perfil.set(await firstValueFrom(this.http.get<Perfil>('/api/eu')));
    } catch {
      // Token antigo ou perfil inexistente: trata como visitante
      await this.supabase.auth.signOut();
      this.limpar();
    }
  }

  private limpar(): void {
    this.sessao.set(null);
    this.perfil.set(null);
  }
}
