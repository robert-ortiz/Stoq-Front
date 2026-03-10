# Estándares de Código - Stoq

## TypeScript

### Tipos Estrictos
```typescript
// ❌ Evitar
const data: any = {};

// ✅ Hacer
interface User {
  id: string;
  name: string;
}
const user: User = { id: '1', name: 'John' };
```

### Uso de `inject()`
```typescript
// ❌ Evitar
constructor(private http: HttpClient) {}

// ✅ Hacer
private http = inject(HttpClient);
```

## Angular Components

### Componentes Standalone
```typescript
// ✅ Siempre usar standalone: true
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './example.component.html',
  styleUrl: './example.component.css'
})
export class ExampleComponent {}
```

### Change Detection Strategy
```typescript
// ✅ Siempre usar OnPush
@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### State Management con Signals
```typescript
// ❌ Evitar propiedades mutables
export class MyComponent {
  count = 0;
  increment() {
    this.count++; // ❌ Mutación directa
  }
}

// ✅ Usar signals
export class MyComponent {
  count = signal(0);
  increment() {
    this.count.update(c => c + 1);
  }
}
```

### Computed vs Signal
```typescript
// ✅ Usar computed para valores derivados
export class MyComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
}
```

## Formularios

### Reactive Forms
```typescript
// ✅ Usar grupo de formularios
form = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(3)]],
  email: ['', [Validators.required, Validators.email]]
});

// Acceder a campos
get name() {
  return this.form.get('name');
}

// En el template
<input [formControl]="form.get('name')" />
@if (name?.invalid && name?.touched) {
  <span class="error">Campo inválido</span>
}
```

## Templates

### Control Flow Moderno
```html
<!-- ❌ Evitar - Sintaxis antigua -->
<div *ngIf="isVisible">Content</div>
<div *ngFor="let item of items">{{ item }}</div>

<!-- ✅ Usar - Control flow nativo -->
@if (isVisible) {
  <div>Content</div>
}

@for (item of items; track item.id) {
  <div>{{ item }}</div>
}
```

### Bindings CSS/Style
```html
<!-- ❌ Evitar ngClass y ngStyle -->
<div [ngClass]="{ active: isActive }" [ngStyle]="{ color: textColor }">
  Content
</div>

<!-- ✅ Usar bindings directos -->
<div [class.active]="isActive" [style.color]="textColor">
  Content
</div>
```

### Atributos Host
```typescript
// ❌ Evitar @HostBinding y @HostListener
@HostBinding('class.active') isActive = true;
@HostListener('click') onClick() { }

// ✅ Usar objeto host
@Component({
  host: {
    '[class.active]': 'isActive()',
    '(click)': 'onClick()'
  }
})
```

## Servicios

### Inyección de Dependencias
```typescript
// ✅ Usar inject() en lugar de constructor
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
}
```

### ProvidedIn Root
```typescript
// ✅ Siempre usar providedIn: 'root' para servicios globales
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  // ...
}
```

## Accesibilidad (a11y)

### Semántica HTML
```html
<!-- ✅ Usar etiquetas semánticas -->
<button type="button">Click me</button>
<label for="username">Username</label>
<input id="username" type="text" />
```

### ARIA Attributes
```html
<!-- ✅ Agregar ARIA cuando sea necesario -->
<div role="alert" aria-live="polite">
  Error: Username is required
</div>
<button [disabled]="isLoading" aria-label="Submit form">
  Submit
</button>
```

### Contrast y Focus
```css
/* ✅ Colores con contraste suficiente */
.text {
  color: #333333; /* Contraste > 4.5:1 contra fondo blanco */
}

/* ✅ Focus visible */
button:focus-visible {
  outline: 2px solid #9b8ab8;
  outline-offset: 2px;
}
```

## Estilos

### CSS Modular
```css
/* ✅ Scope de estilos al componente */
.component-name {
  display: flex;
  gap: 16px;
}

.component-name__item {
  flex: 1;
}

.component-name__item--active {
  background: #000;
}
```

### Variables CSS
```css
/* ✅ Definir y usar variables CSS */
:root {
  --color-primary: #9b8ab8;
  --color-error: #d32f2f;
  --spacing-unit: 8px;
}

.button {
  color: var(--color-primary);
  padding: calc(var(--spacing-unit) * 2);
}
```

## Estructura de Carpetas

```
feature/
├── [component].component.ts      # Lógica del componente
├── [component].component.html    # Template
├── [component].component.css     # Estilos
└── [component].component.spec.ts # Tests
```

## Naming Conventions

| Element | Convención | Ejemplo |
|---------|-----------|---------|
| Components | PascalCase | `LoginComponent` |
| Services | PascalCase + Service | `AuthService` |
| Archivos TS | kebab-case | `login.component.ts` |
| Variables | camelCase | `isLoading` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Interfaces | PascalCase + Interface | `UserInterface` |
| Types | PascalCase | `UserType` |

## Performance

### Lazy Loading
```typescript
// ✅ Usar lazy loading en rutas
const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  }
];
```

### Presencia Ósea (skeletal)
```typescript
// ✅ Mostrar skeleton durante carga
export class ListComponent {
  isLoading = signal(false);
}
```

## Testing

### Estructura de Tests
```typescript
describe('LoginComponent', () => {
  it('should display error when username is invalid', () => {
    // Arrange
    const component = createComponent();
    
    // Act
    component.username?.markAsTouched();
    
    // Assert
    expect(component.username?.errors?.['required']).toBeTruthy();
  });
});
```

## Git y Commits

### Mensajes de Commit
```
feat: Add login component with reactive forms
fix: Resolve CORS issue in auth interceptor
docs: Update README with new structure
style: Format code with Prettier
test: Add unit tests for LoginComponent
refactor: Extract validation logic to service
```

## Recursos

- [Angular Documentation](https://angular.dev)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/)
- [Web Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [AXE DevTools](https://www.deque.com/axe/devtools/)
