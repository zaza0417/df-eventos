import { Component, computed, input } from '@angular/core';

import { STATUS_EVENTO, StatusEvento } from '../../core/models';

/** Etiqueta colorida do status do evento (RF20). */
@Component({
  selector: 'app-status-badge',
  template: `<span [style.color]="info().cor" [style.background]="info().fundo">{{ info().nome }}</span>`,
  styles: `
    span {
      display: inline-block;
      font-size: 0.8rem;
      font-weight: 800;
      padding: 0.2rem 0.65rem;
      border-radius: 3px;
      white-space: nowrap;
    }
  `,
})
export class StatusBadge {
  readonly status = input.required<StatusEvento>();
  protected readonly info = computed(() => STATUS_EVENTO[this.status()]);
}
