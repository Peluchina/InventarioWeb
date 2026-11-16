import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UsuarioCreateRequest } from '../../models/usuario-create-request.model';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="form-intro">
        <span class="form-icon"><mat-icon>person_add</mat-icon></span>
        <div><h2>Información del usuario</h2><p>Completa los datos de la cuenta y su asignación de rol.</p></div>
      </div>
      <div class="fields">
        <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="nombre" autocomplete="given-name" placeholder="Nombre"><mat-error>{{ errorFor('nombre') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Apellidos</mat-label><input matInput formControlName="apellidos" autocomplete="family-name" placeholder="Apellidos"><mat-error>{{ errorFor('apellidos') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>DNI</mat-label><input matInput type="text" inputmode="numeric" maxlength="8" pattern="[0-9]{8}" formControlName="dni" autocomplete="off" placeholder="8 dígitos" (beforeinput)="validateDniInput($event)" aria-describedby="dni-help"><mat-hint id="dni-help">DNI peruano: exactamente 8 números.</mat-hint><mat-error>{{ errorFor('dni') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Correo electrónico</mat-label><input matInput type="email" formControlName="email" autocomplete="email" placeholder="usuario@empresa.com"><mat-error>{{ errorFor('email') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Dirección</mat-label><input matInput formControlName="direccion" autocomplete="street-address" placeholder="Dirección"><mat-error>{{ errorFor('direccion') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>ID del rol</mat-label><input matInput type="text" inputmode="numeric" formControlName="rolId" autocomplete="off" placeholder="Ej. 1"><mat-hint>El backend aún no expone un catálogo de roles.</mat-hint><mat-error>{{ errorFor('rolId') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>{{ isEdit() ? 'Nueva contraseña' : 'Contraseña' }}</mat-label><input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="contrasenia" autocomplete="new-password" [placeholder]="isEdit() ? 'Ingresa la contraseña que reemplazará la actual' : 'Crea una contraseña'"><button mat-icon-button matSuffix type="button" (click)="togglePassword()" [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"><mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon></button><mat-error>{{ errorFor('contrasenia') }}</mat-error></mat-form-field>
      </div>
      @if (isEdit()) { <p class="password-note"><mat-icon>info</mat-icon>Por seguridad, el backend no devuelve la contraseña y la reemplaza en cada actualización. Ingresa una nueva para guardar cambios.</p> }
      <div class="form-footer"><span class="required-note"><i></i> Todos los campos son obligatorios</span><div class="actions"><button mat-button type="button" class="cancel" (click)="cancel.emit()">Cancelar</button><button mat-flat-button color="primary" type="submit" [disabled]="saving()"><mat-icon>{{ saving() ? 'hourglass_top' : 'check' }}</mat-icon>{{ saving() ? 'Guardando…' : submitLabel() }}</button></div></div>
    </form>
  `,
  styles: [`
    :host{display:block}.form-intro{display:flex;align-items:center;gap:13px;padding:25px 28px 22px;border-bottom:1px solid #edf1ee}.form-icon{width:39px;height:39px;border-radius:11px;background:#edf5f0;color:#366d57;display:grid;place-items:center}.form-icon mat-icon{font-size:20px}.form-intro h2{font-size:14px;color:#2c493e;margin:0 0 5px}.form-intro p{font-size:11px;color:#899890;margin:0}.fields{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;padding:24px 28px 12px}.full{grid-column:1/-1}.password-note{display:flex;align-items:flex-start;gap:8px;margin:0 28px 17px;color:#7b8d84;font-size:10px;line-height:1.5}.password-note mat-icon{flex:0 0 17px;width:17px;height:17px;font-size:17px;color:#778f80}.form-footer{padding:18px 28px 24px;border-top:1px solid #edf1ee;display:flex;justify-content:space-between;align-items:center}.required-note{font-size:10px;color:#87968f;display:flex;align-items:center;gap:7px}.required-note i{width:6px;height:6px;border-radius:50%;background:#d78d6c}.actions{display:flex;align-items:center;gap:10px}.actions button{border-radius:8px;height:40px;padding:0 18px;font-size:11px}.actions mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}.cancel{color:#718179}@media(max-width:620px){.form-intro{padding:20px 18px}.fields{grid-template-columns:1fr;padding:20px 18px 8px;gap:4px}.full{grid-column:auto}.password-note{margin:0 18px 15px}.form-footer{padding:16px 18px;align-items:flex-start;flex-direction:column;gap:14px}.actions{width:100%}.actions button{flex:1}}
  `],
})
export class UsuarioFormComponent {
  readonly usuario = input<Usuario | null>(null);
  readonly isEdit = input(false);
  readonly saving = input(false);
  readonly submitLabel = input('Guardar usuario');
  readonly submitted = output<UsuarioCreateRequest>();
  readonly cancel = output<void>();
  protected readonly showPassword = signal(false);
  protected attempted = false;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(500)]],
    apellidos: ['', [Validators.required, Validators.maxLength(500)]],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/), Validators.minLength(8), Validators.maxLength(8)]],
    direccion: ['', [Validators.required, Validators.maxLength(500)]],
    rolId: ['', [Validators.required, Validators.pattern(/^[1-9]\d*$/)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(500)]],
    contrasenia: ['', [Validators.required, Validators.maxLength(500)]],
  });

  constructor() {
    effect(() => {
      const value = this.usuario();
      if (value) this.form.patchValue({
        nombre: value.nombre,
        apellidos: value.apellidos,
        dni: String(value.dni).padStart(8, '0'),
        direccion: value.direccion,
        rolId: String(value.rolId),
        email: value.email,
        contrasenia: '',
      });
    });
  }

  errorFor(field: keyof typeof this.form.controls): string {
    const control = this.form.controls[field];
    if (!(control.touched || this.attempted) || !control.errors) return '';
    if (control.hasError('required')) return field === 'dni' ? 'El DNI es obligatorio.' : `El campo ${this.fieldLabel(field)} es obligatorio.`;
    if (field === 'dni') return /^\d+$/.test(control.value) ? 'El DNI debe tener 8 dígitos.' : 'El DNI solo debe contener números.';
    if (field === 'rolId' && control.hasError('pattern')) return 'El ID del rol debe ser un entero positivo.';
    if (field === 'email' && control.hasError('email')) return 'Ingresa un correo electrónico válido.';
    if (control.hasError('maxlength')) return 'El valor supera el máximo permitido.';
    return 'Revisa este dato.';
  }

  validateDniInput(event: InputEvent): void {
    if (event.inputType.startsWith('insert') && event.data !== null && /\D/.test(event.data)) event.preventDefault();
  }

  submit(): void {
    this.attempted = true;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.submitted.emit({
      nombre: value.nombre,
      apellidos: value.apellidos,
      dni: Number(value.dni),
      direccion: value.direccion,
      rolId: Number(value.rolId),
      email: value.email,
      contrasenia: value.contrasenia,
    });
  }

  togglePassword(): void { this.showPassword.update((visible) => !visible); }

  private fieldLabel(field: string): string {
    return ({ nombre: 'nombre', apellidos: 'apellidos', dni: 'DNI', direccion: 'dirección', rolId: 'ID del rol', email: 'correo electrónico', contrasenia: 'contraseña' } as Record<string, string>)[field] ?? field;
  }
}
