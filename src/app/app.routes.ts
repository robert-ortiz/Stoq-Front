import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { HomePageComponent } from './features/home/home-page/home-page.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent
  },
  {
    path: 'productos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/productos/lista-productos/lista-productos.component').then(
        (m) => m.ListaProductosComponent
      )
  },
  {
    path: 'productos/:id/editar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/productos/editar-producto/editar-producto.component').then(
        (m) => m.EditarProductoComponent
      )
  },
  {
    path: 'usuarios/editar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/users/user-edit/user-edit.component').then(
        (m) => m.UserEditComponent
      )
  },
  {
    path: 'usuarios/:id/editar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/users/user-edit/user-edit.component').then(
        (m) => m.UserEditComponent
      )
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'signup',
        loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
