import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth';

export const adminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const userId = await authService.getUserId();
  if (!userId) {
    router.navigate(['/login']);
    return false;
  }

  const { data } = await authService.client
    .from('usuarios')
    .select('es_admin')
    .eq('id', userId)
    .single();

  if (data?.es_admin) return true;

  router.navigate(['/home']);
  return false;
};