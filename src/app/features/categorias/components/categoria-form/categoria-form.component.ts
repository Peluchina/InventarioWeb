import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Categoria } from '../../models/categoria.model';
import { CrearCategoria } from '../../models/categoria-create-request.model';

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="form-intro">
        <span class="form-icon"><mat-icon>category</mat-icon></span>
        <div>
          <h2>{{ mode() === 'crear' ? 'Crear categoría' : 'Editar categoría' }}</h2>
          <p>Define el nombre y la descripción de la categoría.</p>
        </div>
      </div>

      <div class="fields">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nombre de la categoría</mat-label>
          <input matInput formControlName="nombre" autocomplete="off" maxlength="500" placeholder="Ej. Herramientas">
          <mat-hint align="end">{{ form.controls.nombre.value.length }}/500</mat-hint>
          @if (errorFor('nombre')) {
            <mat-error>{{ errorFor('nombre') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="descripcion" rows="4" maxlength="500" placeholder="Describe esta categoría (opcional)"></textarea>
          <mat-hint align="end">{{ form.controls.descripcion.value.length }}/500</mat-hint>
          @if (errorFor('descripcion')) {
            <mat-error>{{ errorFor('descripcion') }}</mat-error>
          }
        </mat-form-field>
      </div>

      <div class="form-footer">
        <span class="required-note"><i></i> El nombre es obligatorio</span>
        <div class="actions">
          <button mat-button type="button" class="cancel" (click)="cancel.emit()" [disabled]="saving()">Cancelar</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
            <mat-icon>{{ saving() ? 'hourglass_top' : 'check' }}</mat-icon>
            {{ saving() ? 'Guardando…' : submitLabel() }}
          </button>
        </div>
      </div>
    </form>
  `,
  styles: [`
    :host{display:block;background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}
    .form-intro{display:flex;align-items:center;gap:13px;padding:25px 28px 22px;border-bottom:1px solid #edf1ee}
    .form-icon{width:39px;height:39px;border-radius:11px;background:#edf5f0;color:#366d57;display:grid;place-items:center;flex:none}
    .form-icon mat-icon{font-size:20px}
    .form-intro h2{font-size:14px;color:#2c493e;margin:0 0 5px}
    .form-intro p{font-size:11px;color:#899890;margin:0}
    .fields{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;padding:24px 28px 12px}
    .full{grid-column:1/-1}
    .form-footer{padding:18px 28px 24px;border-top:1px solid #edf1ee;display:flex;justify-content:space-between;align-items:center;gap:14px}
    .required-note{font-size:10px;color:#87968f;display:flex;align-items:center;gap:7px}
    .required-note i{width:6px;height:6px;border-radius:50%;background:#d78d6c}
    .actions{display:flex;align-items:center;gap:10px}
    .actions button{border-radius:8px;height:40px;padding:0 18px;font-size:11px}
    .actions mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}
    .cancel{color:#718179}
    @media(max-width:620px){.form-intro{padding:20px 18px}.fields{grid-template-columns:1fr;padding:20px 18px 8px;gap:4px}.full{grid-column:auto}.form-footer{padding:16px 18px;align-items:flex-start;flex-direction:column}.actions{width:100%}.actions button{flex:1}}
  `],
})
export class CategoriaFormComponent {
  readonly mode = input<'crear' | 'editar'>('crear');
  readonly categoria = input<Categoria | null>(null);
  readonly saving = input(false);
  readonly submitLabel = input('Guardar categoría');
  readonly submitted = output<CrearCategoria>();
  readonly cancel = output<void>();
  protected attempted = false;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(500), Validators.pattern(/\S/)]],
    descripcion: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    effect(() => {
      const categoria = this.categoria();
      if (categoria) {
        this.form.patchValue({ nombre: categoria.nombre, descripcion: categoria.descripcion ?? '' });
      }
    });
  }

  errorFor(field: 'nombre' | 'descripcion'): string {
    const control = this.form.controls[field];
    if (!(control.touched || this.attempted) || !control.errors) return '';
    if (control.hasError('required') || control.hasError('pattern')) {
      return 'Ingresa un nombre que no esté vacío ni contenga solo espacios.';
    }
    if (control.hasError('maxlength')) return 'Este campo no puede superar los 500 caracteres.';
    return 'Revisa este dato.';
  }

  submit(): void {
    this.attempted = true;
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    const value = this.form.getRawValue();
    this.submitted.emit({ nombre: value.nombre.trim(), descripcion: value.descripcion.trim() });
  }
}
