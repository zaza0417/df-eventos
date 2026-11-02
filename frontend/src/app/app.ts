import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';
import { Congresso } from './shared/congresso/congresso';
import { Icone } from './shared/icone/icone';
import { Logo } from './shared/logo/logo';
import { Sino } from './shared/sino/sino';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo, Sino, Icone, Congresso],
  template: `
    <header class="topo">
      <div class="conteudo">
        <a class="marca" routerLink="/" aria-label="DF EventoS — página inicial"><app-logo /></a>

        <nav class="conta" aria-label="Conta">
          <a class="divulgar" routerLink="/divulgar" routerLinkActive="ativo">
            <app-icone nome="novo-evento" [tamanho]="18" />
            <span class="texto-longo">Divulgar evento</span><span class="texto-curto">Divulgar</span>
          </a>
          @if (auth.perfil(); as perfil) {
            <app-sino />
            <details class="menu" #menu>
              <summary class="botao-topo" [attr.aria-label]="'Menu de ' + perfil.nome">
                <span class="texto-longo">{{ primeiroNome(perfil.nome) }}</span>
                <app-icone class="texto-longo" nome="abrir" [tamanho]="16" />
                <app-icone class="texto-curto" nome="menu" [tamanho]="20" />
              </summary>
              <div class="menu-itens" (click)="menu.open = false">
                <a routerLink="/meus-eventos"><app-icone nome="lista" />Meus eventos</a>
                @if (auth.admin()) {
                  <a routerLink="/admin"><app-icone nome="ok" />Validar eventos</a>
                }
                <button type="button" (click)="sair()"><app-icone nome="sair" />Sair</button>
              </div>
            </details>
          } @else {
            <a class="botao-topo" routerLink="/entrar">Entrar</a>
          }
        </nav>
      </div>
    </header>

    <main class="conteudo">
      <router-outlet />
    </main>

    <footer class="rodape">
      <app-congresso class="skyline" />
      <div class="conteudo base">
        <div>
          <app-logo [tamanho]="30" />
          <p>Ações de saúde e bem-estar das regiões administrativas do Distrito Federal, num só lugar.</p>
        </div>
        <p class="credito">Protótipo acadêmico do curso de Sistemas de Informação da UDF, 2026.2</p>
      </div>
    </footer>
  `,
  styles: `
    .topo {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--verde);
      color: #fff;
      border-bottom: 4px solid var(--ouro);
    }
    .topo .conteudo { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; min-height: 66px; }
    .marca { color: #fff; text-decoration: none; }
    .conta { display: flex; align-items: center; gap: 0.5rem; }

    .divulgar, .botao-topo {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font: inherit;
      font-weight: 700;
      font-size: 0.95rem;
      height: 40px;
      padding: 0 0.85rem;
      border-radius: var(--raio);
      text-decoration: none;
      cursor: pointer;
      white-space: nowrap;
    }
    .divulgar { background: var(--ouro); color: var(--verde-noite); }
    .divulgar:hover { background: #ffd35c; }
    .botao-topo { border: 1.5px solid rgb(255 255 255 / 0.55); background: transparent; color: #fff; }
    .botao-topo:hover { border-color: #fff; }

    .texto-curto { display: none; }
    @media (max-width: 560px) {
      .texto-longo { display: none !important; }
      .texto-curto { display: inline-flex; }
    }

    /* Menu da conta */
    .menu { position: relative; }
    .menu summary { list-style: none; }
    .menu summary::-webkit-details-marker { display: none; }
    .menu-itens {
      position: absolute;
      right: 0;
      top: calc(100% + 10px);
      min-width: 210px;
      display: flex;
      flex-direction: column;
      background: #fff;
      border-top: 4px solid var(--ouro);
      box-shadow: 0 14px 30px rgb(13 59 34 / 0.22);
    }
    .menu-itens a, .menu-itens button {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font: inherit;
      text-align: left;
      padding: 0.8rem 1rem;
      color: var(--texto);
      text-decoration: none;
      background: none;
      border: 0;
      cursor: pointer;
    }
    .menu-itens a:hover, .menu-itens button:hover { background: var(--concreto); }
    .menu-itens button { border-top: 1px solid var(--linha); color: var(--erro); font-weight: 700; }

    main { padding-bottom: 4rem; min-height: 60vh; }

    .rodape { background: var(--verde-noite); color: #cfe0d4; font-size: 0.95rem; }
    .skyline { color: #1f5a37; max-width: 560px; margin: 0 auto; padding: 2rem 16px 0; }
    .base { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 1rem 2rem; padding-top: 1.75rem; padding-bottom: 2rem; }
    .base app-logo { color: #fff; }
    .base p { margin: 0.75rem 0 0; max-width: 46ch; }
    .rodape .credito { color: #8fb09b; font-size: 0.85rem; }
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected primeiroNome(nome: string): string {
    return nome.split(' ')[0];
  }

  protected async sair(): Promise<void> {
    await this.auth.sair();
    this.router.navigate(['/']);
  }
}
