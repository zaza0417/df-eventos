import { Component } from '@angular/core';

/**
 * Silhueta do Congresso Nacional (Oscar Niemeyer): a cúpula do Senado, a "bacia"
 * da Câmara e as duas torres ligadas por uma passarela, sobre a plataforma.
 * Usa a cor do texto (currentColor) e o ouro como destaque.
 */
@Component({
  selector: 'app-congresso',
  template: `
    <svg viewBox="0 0 480 96" aria-hidden="true">
      <g fill="currentColor">
        <!-- torres e passarela -->
        <rect x="226" y="6" width="11" height="70" />
        <rect x="243" y="6" width="11" height="70" />
        <rect x="226" y="34" width="28" height="5" />
        <!-- bacia da Câmara (aberta para cima) -->
        <path d="M110 52H190C186 66 166 74 150 74 134 74 114 66 110 52Z" />
        <rect x="146" y="72" width="8" height="6" />
        <!-- cúpula do Senado (fechada) -->
        <path d="M296 76C298 60 312 52 326 52 340 52 354 60 356 76Z" />
        <!-- plataforma -->
        <rect x="70" y="76" width="340" height="6" />
      </g>
      <!-- horizonte do cerrado -->
      <rect x="0" y="86" width="480" height="2" fill="#ffc72c" />
    </svg>
  `,
  styles: `
    :host { display: block; }
    svg { display: block; width: 100%; height: auto; }
  `,
})
export class Congresso {}
