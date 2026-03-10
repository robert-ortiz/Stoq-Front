# Stoq - Sistema de Gestión de Inventario

## Descripción

Aplicación Angular moderna para la gestión de inventario con una arquitectura limpia y escalable.

## Estructura del Proyecto

```
src/
├── app/
│   ├── core/                    # Servicios, interceptors y lógica compartida
│   │   ├── services/            # Servicios singleton (AuthService, etc.)
│   │   └── interceptors/        # HTTP interceptors
│   ├── features/                # Módulos de características
│   │   └── auth/
│   │       └── login/           # Componente de Login
│   ├── shared/                  # Componentes, directives y pipes compartidos
│   │   ├── components/          # Componentes reutilizables
│   │   ├── directives/          # Directivas personalizadas
│   │   └── pipes/               # Pipes personalizados
│   ├── layouts/                 # Layouts principales
│   ├── app.ts                   # Componente raíz
│   ├── app.routes.ts            # Definición de rutas
│   ├── app.config.ts            # Configuración de la aplicación
│   ├── app.html                 # Template del componente raíz
│   └── app.css                  # Estilos del componente raíz
├── assets/
│   ├── images/                  # Imágenes del proyecto
│   └── icons/                   # Iconos SVG
├── styles/
│   └── global.css               # Estilos globales
├── index.html                   # HTML principal
├── main.ts                      # Punto de entrada
└── environments/                # Variables de entorno
```

## Características Principales

- ✅ **Componentes Standalone**: Sin NgModules, usando la sintaxis moderna de Angular
- ✅ **Signals**: Sistema reactivo con signals de Angular v21
- ✅ **Reactive Forms**: Formularios reactivos con validación integrada
- ✅ **Routing**: Sistema de rutas moderno con lazy loading
- ✅ **TypeScript Strict**: Tipos estrictos en todo el proyecto
- ✅ **Accesibilidad**: Cumple con WCAG AA y AXE
- ✅ **Responsive Design**: Diseño adaptable a todos los dispositivos

## Estructura de Rutas

```
/ (root)
└── /auth
    ├── /login          # Página de inicio de sesión
    └── /register       # Página de registro (próximamente)
```

## Convenciones

### Componentes
- Ubicación: `src/app/features/[feature]/[component]/`
- Archivos: `[component].component.ts`, `[component].component.html`, `[component].component.css`
- Standalone: Todos los componentes son standalone
- Change Detection: `ChangeDetectionStrategy.OnPush` en todos los componentes

### Servicios
- Ubicación: `src/app/core/services/`
- Inyección: Usar `inject()` en lugar de constructor
- Providencia: `providedIn: 'root'` para servicios singleton

### Estilos
- Globales: `src/styles/global.css`
- Componente: Archivos `.css` colocados junto al componente

### Tipos
- No usar `any`
- Usar type inference cuando sea obvio
- Crear interfaces/types en archivos separados cuando sea necesario

## Levantar el Proyecto

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Compilar para producción
npm run build

# Ejecutar tests
npm test
```

## Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Stoq
```

## Estándares de Código

- **Linter**: ESLint (recomendación)
- **Formatter**: Prettier
- **Language**: TypeScript 5.9+
- **Node**: v20.17.19+
- **NPM**: v10.9.2+

## Browser Support

- Chrome (últimas 2 versiones)
- Firefox (últimas 2 versiones)
- Safari (últimas 2 versiones)
- Edge (últimas 2 versiones)

## Licencia

Propietaria - Stoq
