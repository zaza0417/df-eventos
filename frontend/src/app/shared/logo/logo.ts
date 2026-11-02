import { Component, input } from '@angular/core';

/**
 * Logo do DF EventoS.
 * Símbolo: quadrado verde com as quatro setas amarelas da bandeira do Distrito Federal
 * (os quatro pontos cardeais) apontando para fora de um coração — saúde e cuidado
 * espalhados por todo o DF. Texto: "DF Evento" + "S" de Social em amarelo-ouro.
 */
@Component({
  selector: 'app-logo',
  template: `
    <svg class="simbolo" viewBox="0 0 64 64" aria-hidden="true" [attr.width]="tamanho()" [attr.height]="tamanho()">
      <!-- contorno branco: o símbolo aparece também sobre fundos verdes -->
      <rect x="1.5" y="1.5" width="61" height="61" rx="14" fill="#006C35" stroke="#FFFFFF" stroke-width="3" />
      <g fill="#FFC72C">
        <polygon points="32,7 41,22 32,18.5 23,22" />
        <polygon points="32,7 41,22 32,18.5 23,22" transform="rotate(90 32 32)" />
        <polygon points="32,7 41,22 32,18.5 23,22" transform="rotate(180 32 32)" />
        <polygon points="32,7 41,22 32,18.5 23,22" transform="rotate(270 32 32)" />
      </g>
      <path
        fill="#FFFFFF"
        d="M32 39.5C26 35 24.4 31.3 24.4 28.8 24.4 26.5 26.2 24.8 28.4 24.8 30 24.8 31.3 25.7 32 27 32.7 25.7 34 24.8 35.6 24.8 37.8 24.8 39.6 26.5 39.6 28.8 39.6 31.3 38 35 32 39.5Z"
      />
    </svg>
    @if (comTexto()) {
      <span class="texto">DF Evento<span class="s">S</span></span>
    }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 0.55rem; }
    .simbolo { flex: none; display: block; }
    .texto { font-size: 1.45rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1; white-space: nowrap; }
    @media (max-width: 400px) { .texto { font-size: 1.2rem; } }
    .s { color: var(--amarelo); }
  `,
})
export class Logo {
  readonly tamanho = input(36);
  readonly comTexto = input(true);
}
