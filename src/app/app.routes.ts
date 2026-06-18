import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { HomePageComponent } from './features/home/home-page/home-page.component';
import { PublicHomeComponent } from './features/home/public-home/public-home.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: PublicHomeComponent
  },
  {
    path: 'home',
    canActivate: [authGuard],
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
      import('./features/productos/lista-productos-gerente/lista-productos-gerente.component').then(
        (m) => m.ListaProductosGerenteComponent
      )
  },
  {
    path: 'reportes',
    canActivate: [roleGuard],
    data: { roles: ['GERENTE'] },
    loadComponent: () =>
      import('./features/reportes/lista-reportes/lista-reportes.component').then(
        (m) => m.ListaReportesComponent
      )
  },
  {
    path: 'reportes/dashboard',
    canActivate: [roleGuard],
    data: { roles: ['GERENTE'] },
    loadComponent: () =>
      import('./features/reportes/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      )
  },
  {
    path: 'reportes/dashboard-predictivo',
    canActivate: [roleGuard],
    data: { roles: ['GERENTE'] },
    loadComponent: () =>
      import('./features/reportes/dashboard-predictivo/dashboard-predictivo.component').then(
        (m) => m.DashboardPredictivoComponent
      )
  },
  {
    path: 'notificaciones',
    canActivate: [roleGuard],
    data: { roles: ['GERENTE'] },
    loadComponent: () =>
      import('./features/notificaciones/lista-notificaciones/lista-notificaciones.component').then(
        (m) => m.ListaNotificacionesComponent
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
  path: 'gerente/solicitudes',
  canActivate: [roleGuard],
  data: { roles: ['GERENTE'] },
  loadComponent: () =>
    import('./features/solicitudes/lista-solicitudes-gerente/lista-solicitudes-gerente.component')
      .then(m => m.ListaSolicitudesGerenteComponent)
},

{
  path: 'operador/solicitudes',
  canActivate: [roleGuard],
  data: { roles: ['OPERADOR'] },
  loadComponent: () =>
    import('./features/solicitudes/lista-solicitudes-operador/lista-solicitudes-operador.component')
      .then(m => m.ListaSolicitudesOperadorComponent)
},

{
  path: 'gerente/recomendaciones',
  canActivate: [roleGuard],
  data: { roles: ['GERENTE'] },
  loadComponent: () =>
    import('./features/recomendaciones/lista-recomendaciones/lista-recomendaciones.component')
      .then(m => m.ListaRecomendacionesComponent)
},


  {
    path: '**',
    redirectTo: ''
  },

];
