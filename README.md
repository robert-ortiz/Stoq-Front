# STOQ Frontend

Frontend web para la gestion de inventario de STOQ, desarrollado con Angular 21, TypeScript y arquitectura por features.

## Resumen Ejecutivo

El proyecto paso de una base inicial a una aplicacion funcional con autenticacion, home, catalogo de productos y edicion de usuario.  
Este README consolida lo que antes estaba distribuido en varios archivos de documentacion.

## Estado Actual del Proyecto

- Aplicacion Angular 21 con componentes standalone.
- Ruteo activo para home, autenticacion, catalogo y edicion de usuarios.
- Formularios reactivos con validaciones en login, signup y edicion de usuario.
- Servicios HTTP para autenticacion y gestion de usuario.
- Vistas responsivas base para los modulos ya implementados.
- Preparado para conectar backend REST en entorno local.

## Funcionalidades Implementadas

### 1. Autenticacion

- Login con formulario reactivo y validaciones.
- Registro (signup) con validacion de confirmacion de contrasena.
- Persistencia de token en localStorage.
- Cierre de sesion desde el catalogo.

### 2. Home

- Pagina principal con acceso rapido a login y registro.

### 3. Catalogo de Productos

- Vista principal de productos.
- Filtros por busqueda, categoria y estado de stock.
- Estructura para agregar productos y gestionar categorias.

### 4. Edicion de Usuario (reciente)

- Edicion de datos relevantes: nombre, apellidos, correo, telefono y rol.
- Dos modos de uso:
	- Cuenta propia: /usuarios/editar
	- Usuario por id (administracion): /usuarios/:id/editar
- Accion de eliminacion:
	- Eliminar cuenta (propia)
	- Eliminar usuario (administracion)
- Acceso rapido a perfil desde el catalogo mediante boton "Mi Perfil".

## Rutas Configuradas

- / -> Home
- /productos -> Catalogo de productos
- /usuarios/editar -> Edicion de cuenta propia
- /usuarios/:id/editar -> Edicion de usuario por id
- /auth/login -> Inicio de sesion
- /auth/signup -> Registro de usuario

## Arquitectura y Estructura

```text
src/
	app/
		core/
			services/
				auth.service.ts
				user.service.ts
		features/
			auth/
				login/
				signup/
			home/
				home-page/
			product-catalog/
			users/
				user-edit/
		shared/
			components/
			directives/
			pipes/
		app.routes.ts
		app.config.ts
	assets/
	styles/
```

## Estandares Tecnicos Consolidados

Este proyecto sigue, de forma general, estas practicas:

- TypeScript estricto y sin uso de any salvo necesidad real.
- Componentes standalone.
- Change detection OnPush en componentes de features.
- Formularios reactivos para entradas de usuario.
- Uso de control flow moderno de Angular (@if, @for) donde aplica.
- Servicios con responsabilidad unica y providedIn: root.
- Base de accesibilidad con labels, roles y mensajes de error visibles.

## Servicios de API Actuales

### AuthService

- Login
- Signup
- Manejo de token local

### UserService

- Obtener usuario actual
- Obtener usuario por id
- Actualizar usuario actual
- Actualizar usuario por id
- Eliminar cuenta actual
- Eliminar usuario por id

## Scripts Disponibles

```bash
npm install
npm start
npm run build
npm test
npm run watch
npm run serve:ssr:stoq-front
```

## Ejecucion Local

1. Instalar dependencias.
2. Ejecutar npm start.
3. Abrir http://localhost:4200.

## Trabajo Pendiente Recomendado

- Conectar y validar todos los endpoints reales del backend.
- Proteger rutas con guards de autenticacion y roles.
- Estandarizar manejo de errores HTTP con interceptor.
- Completar pruebas unitarias de componentes y servicios.
- Agregar gestion de usuarios/listado administrativo completo.

## Equipo

- Robert Ortiz
- Harold Sejas
- Osthin Colque
- Luis Aguilar