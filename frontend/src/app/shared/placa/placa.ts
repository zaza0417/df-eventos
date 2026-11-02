import { Component, input } from '@angular/core';

/** Região administrativa no formato das placas verdes de rua do DF. */
@Component({
  selector: 'app-placa',
  template: `<span class="placa">{{ texto() }}</span>`,
  styles: `
    .placa {
      display: inline-block;
      font-family: var(--fonte-titulo);
      font-weight: 700;
      font-size: 0.92rem;
      line-height: 1;
      letter-spacing: 0.01em;
      color: #fff;
      background: var(--verde);
      padding: 0.3rem 0.55rem 0.28rem;
      border-radius: 3px;
      box-shadow: inset 0 0 0 1.5px var(--verde), inset 0 0 0 3px #fff; /* filete branco das placas */
      white-space: nowrap;
    }
  `,
})
export class Placa {
  readonly texto = input.required<string>();
}
