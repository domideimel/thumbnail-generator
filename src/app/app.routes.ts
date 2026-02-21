import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('@/pages/generator/generator').then(m => m.Generator),},{
    path: '**',
    redirectTo: '',
  },

];
