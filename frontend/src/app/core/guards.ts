import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

// Atenção: todo inject() precisa vir ANTES do primeiro await (regra do Angular).

/** Só deixa entrar quem está logado; os outros vão para /entrar e voltam depois (RN02). */
export const authGuard: CanActivateFn = async (_rota, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.pronto;
  if (auth.logado()) return true;
  return router.createUrlTree(['/entrar'], { queryParams: { voltar: estado.url } });
};

/** Só administradores (RN21). */
export const adminGuard: CanActivateFn = async (_rota, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.pronto;
  if (auth.admin()) return true;
  return auth.logado()
    ? router.createUrlTree(['/'])
    : router.createUrlTree(['/entrar'], { queryParams: { voltar: estado.url } });
};

/** Telas de Entrar/Cadastro: quem já está logado vai para o início. */
export const visitanteGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.pronto;
  return auth.logado() ? router.createUrlTree(['/']) : true;
};
