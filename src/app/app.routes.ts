import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { HomePageComponent } from './features/home/home-page/home-page.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

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
    path: 'movimientos',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./features/movimientos/lista-movimientos/lista-movimientos.component').then(
        (m) => m.ListaMovimientosComponent
      )
  },
  {
    path: 'salidas/registro',
    canActivate: [roleGuard],
    data: { roles: ['OPERADOR', 'ADMIN'] },
    loadComponent: () =>
      import('./features/salidas/registro-salida/registro-salida.component').then(
        (m) => m.RegistroSalidaComponent
      )
  },
  {
    path: 'entradas/registro',
    canActivate: [roleGuard],
    data: { roles: ['OPERADOR', 'ADMIN'] },
    loadComponent: () =>
      import('./features/entradas/registro-entrada/registro-entrada.component').then(
        (m) => m.RegistroEntradaComponent
      )
  },
  {
    path: 'perfil',
    canActivate: [roleGuard],
    loadComponent: () =>
      import('./features/users/user-edit/user-edit.component').then(
        (m) => m.UserEditComponent
      )
  },
  {
    path: 'usuarios/editar',
    redirectTo: 'perfil',
    pathMatch: 'full'
  },
  {
    path: 'usuarios/:id/editar',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./features/users/user-edit/user-edit.component').then(
        (m) => m.UserEditComponent
      )
  },
  {
    path: 'admin',

    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./features/admin/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      )
  },
  {
  path: 'operador',
  canActivate: [roleGuard],
  data: { roles: ['OPERADOR'] },
  loadComponent: () =>
    import('./features/productos/lista-productos-operador/lista-productos-operador.component').then(
      (m) => m.ListaProductosOperadorComponent
    )
},
  {
    path: 'gerente',
    canActivate: [roleGuard],
    data: { roles: ['GERENTE'] },
    loadComponent: () =>
     import('./features/productos/lista-productos-gerente/lista-productos-gerente.component')
        .then(m => m.ListaProductosGerenteComponent)
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
