import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private sequence = 0;
  readonly toasts = signal<ToastItem[]>([]);

  show(message: string, type: ToastType = 'info', durationMs = 3000): void {
    const toast: ToastItem = {
      id: ++this.sequence,
      message,
      type
    };

    this.toasts.update((current) => [...current, toast]);

    window.setTimeout(() => {
      this.remove(toast.id);
    }, durationMs);
  }

  success(message: string, durationMs = 3000): void {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs = 3500): void {
    this.show(message, 'error', durationMs);
  }

  info(message: string, durationMs = 3000): void {
    this.show(message, 'info', durationMs);
  }

  remove(id: number): void {
    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
  }
}
