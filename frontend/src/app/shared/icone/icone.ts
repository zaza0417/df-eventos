import { Component, computed, input } from '@angular/core';
import {
  Apple,
  ArrowLeft,
  Bell,
  Brain,
  Calendar,
  CalendarPlus,
  Check,
  ChevronDown,
  CircleAlert,
  Clock,
  Copy,
  Droplet,
  Flower2,
  Footprints,
  HandHeart,
  Heart,
  ListChecks,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Pencil,
  Search,
  Share2,
  Stethoscope,
  Syringe,
  Trash2,
  X,
} from 'lucide-angular';

/**
 * Ícones de linha (Lucide). Só os desenhos vêm da biblioteca; este componente desenha o SVG.
 * Uso: <app-icone nome="calendario" />  — o ícone herda a cor do texto (currentColor).
 */
const ICONES = {
  // interface
  calendario: Calendar,
  'novo-evento': CalendarPlus,
  local: MapPin,
  horario: Clock,
  curtir: Heart,
  comentario: MessageCircle,
  compartilhar: Share2,
  copiar: Copy,
  sino: Bell,
  menu: Menu,
  voltar: ArrowLeft,
  apagar: Trash2,
  editar: Pencil,
  ok: Check,
  fechar: X,
  buscar: Search,
  sair: LogOut,
  abrir: ChevronDown,
  alerta: CircleAlert,
  lista: ListChecks,
  // categorias (iguais às de core/constantes.ts)
  vacinacao: Syringe,
  saude_mental: Brain,
  atividade_fisica: Footprints,
  nutricao: Apple,
  doacao_sangue: Droplet,
  saude_mulher: Flower2,
  saude_idoso: HandHeart,
  prevencao: Stethoscope,
} as const;

export type NomeIcone = keyof typeof ICONES;
type No = [string, Record<string, string>];

@Component({
  selector: 'app-icone',
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      [attr.width]="tamanho()"
      [attr.height]="tamanho()"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="espessura()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @for (no of nos(); track $index) {
        @switch (no[0]) {
          @case ('path') { <path [attr.d]="no[1]['d']" /> }
          @case ('circle') { <circle [attr.cx]="no[1]['cx']" [attr.cy]="no[1]['cy']" [attr.r]="no[1]['r']" /> }
          @case ('ellipse') { <ellipse [attr.cx]="no[1]['cx']" [attr.cy]="no[1]['cy']" [attr.rx]="no[1]['rx']" [attr.ry]="no[1]['ry']" /> }
          @case ('rect') {
            <rect [attr.x]="no[1]['x']" [attr.y]="no[1]['y']" [attr.width]="no[1]['width']"
              [attr.height]="no[1]['height']" [attr.rx]="no[1]['rx']" [attr.ry]="no[1]['ry']" />
          }
          @case ('line') { <line [attr.x1]="no[1]['x1']" [attr.y1]="no[1]['y1']" [attr.x2]="no[1]['x2']" [attr.y2]="no[1]['y2']" /> }
          @case ('polyline') { <polyline [attr.points]="no[1]['points']" /> }
          @case ('polygon') { <polygon [attr.points]="no[1]['points']" /> }
        }
      }
    </svg>
  `,
  styles: `
    :host { display: inline-flex; flex: none; line-height: 0; }
  `,
})
export class Icone {
  readonly nome = input.required<NomeIcone>();
  readonly tamanho = input(18);
  readonly espessura = input(2);

  protected readonly nos = computed(() => ICONES[this.nome()] as unknown as No[]);
}
