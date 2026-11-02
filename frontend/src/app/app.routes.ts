import { Routes } from '@angular/router';

import { adminGuard, authGuard, visitanteGuard } from './core/guards';
import { Admin } from './pages/admin/admin';
import { Cadastro } from './pages/cadastro/cadastro';
import { Divulgar } from './pages/divulgar/divulgar';
import { Entrar } from './pages/entrar/entrar';
import { EventoDetalhe } from './pages/evento-detalhe/evento-detalhe';
import { Inicio } from './pages/inicio/inicio';
import { MeusEventos } from './pages/meus-eventos/meus-eventos';

export const routes: Routes = [
  // Público
  { path: '', component: Inicio, title: 'DF EventoS — Saúde e bem-estar no DF' },
  { path: 'eventos/:id', component: EventoDetalhe, title: 'Evento — DF EventoS' },
  { path: 'entrar', component: Entrar, canActivate: [visitanteGuard], title: 'Entrar — DF EventoS' },
  { path: 'cadastro', component: Cadastro, canActivate: [visitanteGuard], title: 'Criar conta — DF EventoS' },

  // Usuário logado
  { path: 'divulgar', component: Divulgar, canActivate: [authGuard], title: 'Divulgar evento — DF EventoS' },
  { path: 'divulgar/:id', component: Divulgar, canActivate: [authGuard], title: 'Editar evento — DF EventoS' },
  { path: 'meus-eventos', component: MeusEventos, canActivate: [authGuard], title: 'Meus eventos — DF EventoS' },

  // Administração
  { path: 'admin', component: Admin, canActivate: [adminGuard], title: 'Administração — DF EventoS' },

  { path: '**', redirectTo: '' },
];
