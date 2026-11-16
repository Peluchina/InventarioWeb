import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ProveedorCreateRequest } from '../../models/proveedor-create-request.model';
import { Proveedor } from '../../models/proveedor.model';

@Component({
  selector: 'app-proveedor-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="form-intro"><span class="form-icon"><mat-icon>business</mat-icon></span><div><h2>Información del proveedor</h2><p>Completa los datos de contacto para mantener tu directorio actualizado.</p></div></div>
      <div class="fields">
        <mat-form-field appearance="outline"><mat-label>Nombre del proveedor</mat-label><input matInput formControlName="nombre" autocomplete="organization" placeholder="Ej. Distribuidora Central"><mat-error>{{ errorFor('nombre') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Persona de contacto</mat-label><input matInput formControlName="contacto" autocomplete="name" placeholder="Ej. Ana Pérez"><mat-error>{{ errorFor('contacto') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Teléfono</mat-label><input matInput formControlName="telefono" type="tel" autocomplete="tel" placeholder="+51 999 000 000"><mat-error>{{ errorFor('telefono') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Correo electrónico</mat-label><input matInput formControlName="email" type="email" autocomplete="email" placeholder="contacto@empresa.com"><mat-error>{{ errorFor('email') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>Dirección</mat-label><textarea matInput formControlName="direccion" rows="3" autocomplete="street-address" placeholder="Dirección comercial"></textarea><mat-error>{{ errorFor('direccion') }}</mat-error></mat-form-field>
      </div>
      <div class="form-footer"><span class="required-note"><i></i> Campos obligatorios</span><div class="actions"><button mat-button type="button" class="cancel" (click)="cancel.emit()">Cancelar</button><button mat-flat-button color="primary" type="submit" [disabled]="saving()"><mat-icon>{{ saving() ? 'hourglass_top' : 'check' }}</mat-icon>{{ saving() ? 'Guardando…' : submitLabel() }}</button></div></div>
    </form>
  `,
  styles: [`
    :host{display:block}.form-intro{display:flex;align-items:center;gap:13px;padding:25px 28px 22px;border-bottom:1px solid #edf1ee}.form-icon{width:39px;height:39px;border-radius:11px;background:#edf5f0;color:#366d57;display:grid;place-items:center}.form-icon mat-icon{font-size:20px}.form-intro h2{font-size:14px;color:#2c493e;margin:0 0 5px}.form-intro p{font-size:11px;color:#899890;margin:0}.fields{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;padding:24px 28px 12px}.full{grid-column:1/-1}.form-footer{padding:18px 28px 24px;border-top:1px solid #edf1ee;display:flex;justify-content:space-between;align-items:center}.required-note{font-size:10px;color:#87968f;display:flex;align-items:center;gap:7px}.required-note i{width:6px;height:6px;border-radius:50%;background:#d78d6c}.actions{display:flex;align-items:center;gap:10px}.actions button{border-radius:8px;height:40px;padding:0 18px;font-size:11px}.actions mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}.cancel{color:#718179}@media(max-width:620px){.form-intro{padding:20px 18px}.fields{grid-template-columns:1fr;padding:20px 18px 8px;gap:4px}.full{grid-column:auto}.form-footer{padding:16px 18px;align-items:flex-start;flex-direction:column;gap:14px}.actions{width:100%}.actions button{flex:1}}
  `],
})
export class ProveedorFormComponent {
  readonly proveedor = input<Proveedor | null>(null);
  readonly saving = input(false);
  readonly submitLabel = input('Guardar proveedor');
  readonly submitted = output<ProveedorCreateRequest>();
  readonly cancel = output<void>();
  protected attempted = false;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    contacto: ['', [Validators.maxLength(120)]],
    telefono: ['', [Validators.required, Validators.maxLength(30)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    direccion: ['', [Validators.maxLength(250)]],
  });

  constructor() {
    effect(() => {
      const value = this.proveedor();
      if (value) this.form.patchValue({ nombre: value.nombre, contacto: value.contacto, telefono: value.telefono, email: value.email, direccion: value.direccion });
    });
  }

  errorFor(field: 'nombre' | 'contacto' | 'telefono' | 'email' | 'direccion'): string {
    const control = this.form.controls[field];
    if (!(control.touched || this.attempted) || !control.errors) return '';
    if (control.hasError('required')) return field === 'email' ? 'El correo electrónico es obligatorio.' : `El campo ${this.fieldLabel(field)} es obligatorio.`;
    if (control.hasError('email')) return 'Ingresa un correo electrónico válido.';
    return 'Revisa este dato.';
  }

  submit(): void {
    this.attempted = true;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.submitted.emit(this.form.getRawValue());
  }

  private fieldLabel(field: string): string { return ({ nombre: 'nombre', contacto: 'contacto', telefono: 'teléfono', email: 'correo electrónico', direccion: 'dirección' } as Record<string, string>)[field] ?? field; }
}
