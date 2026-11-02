import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { categoria, iconeCategoria } from '../../core/constantes';
import { horaCurta } from '../../core/datas';
import { Evento } from '../../core/models';
import { Icone } from '../icone/icone';
import { Placa } from '../placa/placa';

/** Uma linha da programação: data grande à esquerda, como num cartaz de agenda. */
@Component({
  selector: 'app-evento-card',
  imports: [DatePipe, RouterLink, Icone, Placa],
  template: `
    <a class="linha" [routerLink]="['/eventos', evento().id]">
      <div class="data" [attr.aria-label]="data() | date: 'EEEE, d MMMM'">
        <span class="dia">{{ data() | date: 'dd' }}</span>
        <span class="semana">{{ data() | date: 'EEE' }}</span>
      </div>

      <div class="texto">
        <p class="categoria"><app-icone [nome]="icone()" [tamanho]="16" />{{ nomeCategoria() }}</p>
        <h3>{{ evento().titulo }}</h3>
        <p class="onde">
          <app-placa [texto]="evento().regiao" />
          <span>{{ evento().local_nome }}</span>
        </p>
      </div>

      <div class="lado">
        <span class="hora"><app-icone nome="horario" [tamanho]="16" />{{ hora() }}</span>
        <span class="numeros">
          <span [attr.aria-label]="evento().total_curtidas + ' curtidas'"><app-icone nome="curtir" [tamanho]="15" />{{ evento().total_curtidas }}</span>
          <span [attr.aria-label]="evento().total_comentarios + ' comentários'"><app-icone nome="comentario" [tamanho]="15" />{{ evento().total_comentarios }}</span>
        </span>
      </div>
    </a>
  `,
  styles: `
    .linha {
      display: grid;
      grid-template-columns: 4.5rem 1fr auto;
      gap: 1.25rem;
      align-items: start;
      padding: 1.25rem 0.5rem 1.25rem 0;
      color: inherit;
      text-decoration: none;
      border-top: 1px solid var(--linha);
    }
    .linha:hover h3 { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 0.15em; }
    .linha:hover .data { background: var(--verde); color: #fff; }
    .linha:hover .semana { color: var(--ouro); }

    .data {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.45rem 0 0.5rem;
      border: 2px solid var(--verde);
      border-radius: var(--raio);
      color: var(--verde);
      transition: background 0.12s;
    }
    .dia { font-family: var(--fonte-titulo); font-weight: 800; font-size: 2.3rem; line-height: 0.9; }
    .semana { font-size: 0.82rem; font-weight: 600; color: var(--texto-suave); }

    .texto { min-width: 0; }
    .categoria { display: flex; align-items: center; gap: 0.35rem; margin: 0 0 0.2rem; font-size: 0.88rem; font-weight: 600; color: var(--verde); }
    h3 { margin: 0 0 0.55rem; font-size: 1.45rem; }
    .onde { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.65rem; margin: 0; color: var(--texto-suave); }

    .lado { display: flex; flex-direction: column; align-items: flex-end; gap: 0.6rem; padding-top: 0.2rem; }
    .hora { display: inline-flex; align-items: center; gap: 0.35rem; font-family: var(--fonte-titulo); font-weight: 700; font-size: 1.25rem; color: var(--verde-noite); }
    .numeros { display: flex; gap: 0.85rem; color: var(--texto-suave); font-size: 0.9rem; }
    .numeros span { display: inline-flex; align-items: center; gap: 0.3rem; }

    @media (max-width: 600px) {
      .linha { grid-template-columns: 3.6rem 1fr; gap: 0.9rem; }
      .dia { font-size: 1.9rem; }
      .lado { grid-column: 2; flex-direction: row; align-items: center; justify-content: space-between; padding-top: 0; }
      h3 { font-size: 1.3rem; }
    }
  `,
})
export class EventoCard {
  readonly evento = input.required<Evento>();
  protected readonly data = computed(() => this.evento().data + 'T00:00');
  protected readonly nomeCategoria = computed(() => categoria(this.evento().categoria).nome);
  protected readonly icone = computed(() => iconeCategoria(this.evento().categoria));
  protected readonly hora = computed(() => horaCurta(this.evento().hora_inicio));
}
