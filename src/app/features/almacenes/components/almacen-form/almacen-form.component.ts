import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CrearAlmacen } from '../../models/almacen-create-request.model';
import { Almacen } from '../../models/almacen.model';

@Component({
  selector: 'app-almacen-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="form-intro">
        <span class="form-icon"><mat-icon>warehouse</mat-icon></span>
        <div><h2>Información del almacén</h2><p>Ingresa el nombre y la ubicación del almacén.</p></div>
      </div>
      <div class="fields">
        <mat-form-field appearance="outline">
          <mat-label>Nombre del almacén</mat-label>
          <input matInput formControlName="nombre" autocomplete="organization" maxlength="500" placeholder="Ej. Almacén Principal">
          <mat-hint align="end">{{ form.controls.nombre.value.length }}/500</mat-hint>
          <mat-error>{{ errorFor('nombre') }}</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Ubicación</mat-label>
          <input matInput formControlName="ubicacion" autocomplete="street-address" maxlength="500" placeholder="Ej. Lima - Independencia">
          <mat-hint align="end">{{ form.controls.ubicacion.value.length }}/500</mat-hint>
          <mat-error>{{ errorFor('ubicacion') }}</mat-error>
        </mat-form-field>
      </div>
      <div class="form-footer">
        <span class="required-note"><i></i> Ambos campos son obligatorios</span>
        <div class="actions">
          <button mat-button type="button" class="cancel" (click)="cancel.emit()" [disabled]="saving()">Cancelar</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
            <mat-icon>{{ saving() ? 'hourglass_top' : 'check' }}</mat-icon>{{ saving() ? 'Guardando…' : submitLabel() }}
          </button>
        </div>
      </div>
    </form>
  `,
  styles: [`
    :host{display:block}.form-intro{display:flex;align-items:center;gap:13px;padding:25px 28px 22px;border-bottom:1px solid #edf1ee}.form-icon{width:39px;height:39px;border-radius:11px;background:#edf5f0;color:#366d57;display:grid;place-items:center}.form-icon mat-icon{font-size:20px}.form-intro h2{font-size:14px;color:#2c493e;margin:0 0 5px}.form-intro p{font-size:11px;color:#899890;margin:0}.fields{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;padding:24px 28px 12px}.form-footer{padding:18px 28px 24px;border-top:1px solid #edf1ee;display:flex;justify-content:space-between;align-items:center}.required-note{font-size:10px;color:#87968f;display:flex;align-items:center;gap:7px}.required-note i{width:6px;height:6px;border-radius:50%;background:#d78d6c}.actions{display:flex;align-items:center;gap:10px}.actions button{border-radius:8px;height:40px;padding:0 18px;font-size:11px}.actions mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}.cancel{color:#718179}@media(max-width:620px){.form-intro{padding:20px 18px}.fields{grid-template-columns:1fr;padding:20px 18px 8px;gap:4px}.form-footer{padding:16px 18px;align-items:flex-start;flex-direction:column;gap:14px}.actions{width:100%}.actions button{flex:1}}
  `],
})
export class AlmacenFormComponent {
  readonly almacen = input<Almacen | null>(null);
  readonly saving = input(false);
  readonly submitLabel = input('Guardar almacén');
  readonly submitted = output<CrearAlmacen>();
  readonly cancel = output<void>();
  protected attempted = false;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(500), Validators.pattern(/\S/)]],
    ubicacion: ['', [Validators.required, Validators.maxLength(500), Validators.pattern(/\S/)]],
  });

  constructor() {
    effect(() => {
      const value = this.almacen();
      if (value) this.form.patchValue({ nombre: value.nombre, ubicacion: value.ubicacion });
    });
  }

  errorFor(field: 'nombre' | 'ubicacion'): string {
    const control = this.form.controls[field];
    if (!(control.touched || this.attempted) || !control.errors) return '';
    if (control.hasError('required') || control.hasError('pattern')) return `El campo ${field} es obligatorio y no puede contener solo espacios.`;
    if (control.hasError('maxlength')) return `El campo ${field} no puede superar los 500 caracteres.`;
    return 'Revisa este dato.';
  }

  submit(): void {
    this.attempted = true;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.submitted.emit({ nombre: value.nombre.trim(), ubicacion: value.ubicacion.trim() });
  }
}
