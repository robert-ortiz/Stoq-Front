# STOQ Frontend - Sistema de Gestion de Inventario

Aplicacion web para gestionar inventario en pequenas y medianas empresas con Angular 21, TypeScript y arquitectura por features.

## Resumen Consolidado del Proyecto

Este README unifica la informacion que estaba separada en otros documentos del repositorio.

- Arquitectura organizada en core, features, shared y layouts.
- Autenticacion con login y registro.
- Home y base funcional de catalogo/inventario.
- Formularios reactivos con validaciones de campos.
- Estandares de codigo y convenciones de estructura para escalar el proyecto.

## Estado Actual

- Proyecto frontend activo y compilable.
- Angular standalone + TypeScript.
- Routing configurado para home y modulo auth.
- Integracion base HTTP para autenticacion.
- Validaciones de formulario en login y signup.

## Funcionalidades Clave

### Login

- Validacion de correo obligatorio y formato valido.
- Validacion de contrasena obligatoria y longitud minima.
- Estado de carga durante autenticacion.
- Mensaje de error controlado para credenciales invalidas.
- Diseno interactivo con opcion mostrar/ocultar contrasena.

### Registro de Usuario

- Validacion de campos requeridos: nombre, correo, rol, contrasena y confirmacion.
- Validacion de correo con formato valido.
- Validacion de contrasena por longitud minima.
- Validacion de coincidencia de contrasena y confirmacion.
- Validacion de fortaleza de contrasena (al menos una mayuscula y un numero).

### Manejo de Roles

Se maneja de forma explicita en el registro y contratos de autenticacion:

- ADMINISTRADOR
- GERENTE
- OPERADOR

## Rutas Principales

- / -> Home
- /auth/login -> Inicio de sesion
- /auth/signup -> Registro de usuario

## Estructura del Proyecto (Resumen)

```text
src/
	app/
		core/
			services/
				auth.service.ts
				index.ts
			interceptors/
		features/
			auth/
				login/
				signup/
			home/
		shared/
			components/
			directives/
			pipes/
		layouts/
		app.routes.ts
		app.config.ts
```

## Estandares de Desarrollo (Resumen)

- Usar formularios reactivos para entradas de usuario.
- Preferir inyeccion moderna con inject() en servicios/componentes.
- Mantener componentes con responsabilidad unica.
- Mantener validaciones claras en template + TypeScript.
- Priorizar accesibilidad basica (labels, aria, mensajes de error).

## Scripts Disponibles

```bash
npm install
npm start
npm run build
npm run watch
npm test
npm run serve:ssr:stoq-front
```

## Ejecucion Local

1. Instalar dependencias: npm install
2. Levantar proyecto: npm start
3. Abrir: http://localhost:4200

## Proximos Pasos Recomendados

- Conectar auth y registro a backend definitivo (si cambia contrato).
- Agregar guardias por rol para modulos protegidos.
- Completar pruebas unitarias de login/signup.
- Incorporar gestion completa de usuarios e inventario.

## Equipo

- Robert Ortiz
- Harold Sejas
- Osthin Colque
- Luis Aguilar