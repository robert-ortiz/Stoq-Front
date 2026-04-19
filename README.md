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

## Implementacion de Idiomas (i18n) y Uso

El proyecto ya tiene base compatible con internacionalizacion en Angular (por ejemplo, `enableI18nLegacyMessageIdFormat: false` en `tsconfig.json`), pero en esta rama la traduccion dinamica aun no esta activada en el codigo fuente.

Esta es la implementacion recomendada para habilitar idiomas de forma escalable usando `ngx-translate`.

### 1) Instalar dependencias

```bash
npm install @ngx-translate/core @ngx-translate/http-loader
```

### 2) Configurar proveedores globales

En `src/app/app.config.ts` registrar el servicio de traduccion y el loader HTTP:

```ts
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

export const appConfig: ApplicationConfig = {
	providers: [
		provideBrowserGlobalErrorListeners(),
		provideRouter(routes),
		provideHttpClient(withFetch()),
		provideTranslateService({
			loader: provideTranslateHttpLoader({
				prefix: './i18n/',
				suffix: '.json'
			}),
			fallbackLang: 'es'
		})
	]
};
```

### 3) Crear archivos de traduccion

Crear carpeta y archivos JSON por idioma:

```text
public/
	i18n/
		es.json
		en.json
		pt.json
```

Ejemplo minimo (`es.json`):

```json
{
	"AUTH": {
		"LOGIN": {
			"TITLE": "Inicia sesion",
			"EMAIL": "Correo electronico",
			"PASSWORD": "Contrasena",
			"SUBMIT": "Entrar"
		}
	},
	"LANGUAGE": {
		"ES": "Espanol",
		"EN": "Ingles",
		"PT": "Portugues"
	}
}
```

### 4) Usar traducciones en templates

```html
<h1>{{ 'AUTH.LOGIN.TITLE' | translate }}</h1>
<label>{{ 'AUTH.LOGIN.EMAIL' | translate }}</label>
<button type="submit">{{ 'AUTH.LOGIN.SUBMIT' | translate }}</button>
```

### 5) Cambiar idioma en tiempo de ejecucion

En un componente (por ejemplo, layout principal):

```ts
import { TranslateService } from '@ngx-translate/core';

constructor(private readonly translate: TranslateService) {
	this.translate.addLangs(['es', 'en', 'pt']);
	this.translate.setFallbackLang('es');
	this.translate.use('es');
}

changeLanguage(lang: 'es' | 'en' | 'pt'): void {
	this.translate.use(lang);
	localStorage.setItem('stoq_lang', lang);
}
```

### 6) Restaurar idioma preferido del usuario

```ts
const savedLang = localStorage.getItem('stoq_lang');
const browserLang = this.translate.getBrowserLang();
const lang = savedLang ?? (['es', 'en', 'pt'].includes(browserLang ?? '') ? browserLang! : 'es');
this.translate.use(lang);
```

### Recomendaciones de uso

- Mantener todas las claves en formato jerarquico (`MODULO.SECCION.CLAVE`).
- Evitar textos literales en templates y mensajes de error del frontend.
- Reutilizar las mismas claves para botones comunes (guardar, cancelar, eliminar).
- Definir `es` como `fallbackLang` para asegurar respuesta cuando falte una traduccion.
- Validar visualmente login/signup al cambiar entre `es`, `en` y `pt`.

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

## Despliegue en Produccion

Como ultimo cambio importante del proyecto, el frontend fue desplegado en produccion usando Netlify y el flujo principal de publicacion se esta manejando desde la rama `release`.

- Estado de despliegue: activo en Netlify.
- Rama de referencia para version productiva: `release`.
- Objetivo cumplido: aplicacion publicada y funcionando en entorno productivo.

### Flujo de Publicacion Recomendado

1. Desarrollar y validar cambios en ramas de trabajo.
2. Integrar los cambios finales en la rama `release`.
3. Verificar build de produccion antes del push:

```bash
npm run build
```

4. Publicar/actualizar en Netlify mediante la rama `release`.
5. Validar en la URL productiva que login, signup, rutas y consumo de API funcionen correctamente.

### Checklist Rapido Post-Deploy

- Build de Angular completado sin errores.
- Variables/configuracion de entorno productivo revisadas.
- Navegacion principal operativa (`/`, `/auth/login`, `/auth/signup`).
- Formularios de autenticacion y registro funcionando.
- Integracion con backend respondiendo en entorno productivo.