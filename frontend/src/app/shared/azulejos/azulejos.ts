import { Component, computed, input } from '@angular/core';

/**
 * Mosaico de azulejos geométricos, uma homenagem aos painéis de Athos Bulcão
 * espalhados por Brasília (Itamaraty, Teatro Nacional, Igrejinha…).
 * Poucas formas simples, giradas em ângulos retos, com as cores da bandeira do DF.
 * A "semente" deixa o desenho sempre igual a cada visita (não muda ao recarregar).
 */
type Forma = 'quarto' | 'meia' | 'triangulo' | 'circulo' | 'liso';

interface Azulejo {
  x: number;
  y: number;
  giro: number;
  forma: Forma;
  fundo: string;
  frente: string;
}

const VERDE = '#006c35';
const VERDE_NOITE = '#0d3b22';
const OURO = '#ffc72c';
const BRANCO = '#ffffff';

// Combinações de cor (fundo, figura). O verde domina, o ouro aparece como acento.
const CORES: [string, string][] = [
  [VERDE, OURO],
  [VERDE, BRANCO],
  [VERDE, VERDE_NOITE],
  [BRANCO, VERDE],
  [OURO, VERDE],
  [VERDE, OURO],
  [VERDE_NOITE, VERDE],
];
const FORMAS: Forma[] = ['quarto', 'quarto', 'meia', 'meia', 'triangulo', 'circulo', 'liso'];

/** Gerador pseudoaleatório simples e determinístico. */
function sorteador(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

@Component({
  selector: 'app-azulejos',
  template: `
    <svg [attr.viewBox]="'0 0 ' + colunas() * 40 + ' ' + linhas() * 40" preserveAspectRatio="xMidYMid slice"
      aria-hidden="true">
      @for (a of azulejos(); track $index) {
        <g [attr.transform]="'translate(' + a.x + ' ' + a.y + ') rotate(' + a.giro + ' 20 20)'">
          <rect width="40" height="40" [attr.fill]="a.fundo" />
          @switch (a.forma) {
            @case ('quarto') { <path d="M0 0H40A40 40 0 0 1 0 40Z" [attr.fill]="a.frente" /> }
            @case ('meia') { <path d="M0 0A20 20 0 0 0 40 0Z" [attr.fill]="a.frente" /> }
            @case ('triangulo') { <path d="M0 0H40L0 40Z" [attr.fill]="a.frente" /> }
            @case ('circulo') { <circle cx="20" cy="20" r="9" [attr.fill]="a.frente" /> }
          }
        </g>
      }
    </svg>
  `,
  styles: `
    :host { display: block; overflow: hidden; }
    svg { display: block; width: 100%; height: 100%; shape-rendering: geometricPrecision; }
  `,
})
export class Azulejos {
  readonly colunas = input(8);
  readonly linhas = input(6);
  readonly semente = input(1960); // ano da inauguração de Brasília

  protected readonly azulejos = computed<Azulejo[]>(() => {
    const sortear = sorteador(this.semente());
    const lista: Azulejo[] = [];
    for (let l = 0; l < this.linhas(); l++) {
      for (let c = 0; c < this.colunas(); c++) {
        const [fundo, frente] = CORES[Math.floor(sortear() * CORES.length)];
        lista.push({
          x: c * 40,
          y: l * 40,
          giro: Math.floor(sortear() * 4) * 90,
          forma: FORMAS[Math.floor(sortear() * FORMAS.length)],
          fundo,
          frente,
        });
      }
    }
    return lista;
  });
}
