import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { map, startWith } from 'rxjs';
import { Producto } from '../../../productos/models/producto.model';
import { MovimientoCreateRequest } from '../../models/movimiento-create-request.model';
import { TipoMovimiento } from '../../models/tipo-movimiento.enum';

@Component({
  selector: 'app-movimiento-form',
  standalone: true,
  imports: [AsyncPipe, CommonModule, ReactiveFormsModule, MatAutocompleteModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="form-intro"><span class="form-icon"><mat-icon>swap_horiz</mat-icon></span><div><h2>Datos del movimiento</h2><p>El sistema registrará el movimiento y calculará los stocks.</p></div></div>
      <div class="fields">
        <mat-form-field appearance="outline" class="full"><mat-label>Producto</mat-label><input matInput [formControl]="productSearch" [matAutocomplete]="productAutocomplete" placeholder="Busca por SKU o nombre" autocomplete="off"><mat-autocomplete #productAutocomplete="matAutocomplete" [displayWith]="displayProduct" (optionSelected)="selectProduct($event.option.value)"><mat-option *ngFor="let product of filteredProducts | async" [value]="product">{{ product.sku }} - {{ product.nombre }}</mat-option><mat-option *ngIf="(filteredProducts | async)?.length === 0" disabled>No hay productos coincidentes</mat-option></mat-autocomplete><mat-error>{{ errorFor('productoId') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Tipo de movimiento</mat-label><mat-select formControlName="tipoMovimiento"><mat-option [value]="TipoMovimiento.ENTRADA">Entrada</mat-option><mat-option [value]="TipoMovimiento.SALIDA">Salida</mat-option><mat-option [value]="TipoMovimiento.AJUSTE">Ajuste</mat-option></mat-select><mat-error>{{ errorFor('tipoMovimiento') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>{{ form.controls.tipoMovimiento.value === TipoMovimiento.AJUSTE ? 'Nuevo stock' : 'Cantidad' }}</mat-label><input matInput formControlName="cantidad" type="number" [min]="minimumQuantity()" step="1"><mat-hint *ngIf="form.controls.tipoMovimiento.value === TipoMovimiento.AJUSTE">En un ajuste, este valor es el stock final.</mat-hint><mat-error>{{ errorFor('cantidad') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>Referencia (opcional)</mat-label><textarea matInput formControlName="referencia" rows="3" maxlength="500" placeholder="Ej. Compra OC-00125"></textarea><mat-hint align="end">{{ form.controls.referencia.value.length }}/500</mat-hint><mat-error>{{ errorFor('referencia') }}</mat-error></mat-form-field>
      </div>
      <div class="form-footer"><span class="required-note"><i></i> Producto, tipo y cantidad son obligatorios. El usuario corresponde a tu sesión.</span><div class="actions"><button mat-button type="button" class="cancel" (click)="cancel.emit()">Cancelar</button><button mat-flat-button color="primary" type="submit" [disabled]="saving()"><mat-icon>{{ saving() ? 'hourglass_top' : 'check' }}</mat-icon>{{ saving() ? 'Registrando…' : 'Registrar movimiento' }}</button></div></div>
    </form>
  `,
  styles: [`
    :host{display:block}.form-intro{display:flex;align-items:center;gap:13px;padding:25px 28px 22px;border-bottom:1px solid #edf1ee}.form-icon{width:39px;height:39px;border-radius:11px;background:#edf5f0;color:#366d57;display:grid;place-items:center}.form-intro h2{font-size:14px;color:#2c493e;margin:0 0 5px}.form-intro p{font-size:11px;color:#899890;margin:0}.fields{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;padding:24px 28px 12px}.full{grid-column:1/-1}.form-footer{padding:18px 28px 24px;border-top:1px solid #edf1ee;display:flex;justify-content:space-between;align-items:center;gap:14px}.required-note{font-size:10px;color:#87968f;display:flex;align-items:center;gap:7px}.required-note i{width:6px;height:6px;border-radius:50%;background:#d78d6c}.actions{display:flex;align-items:center;gap:10px}.actions button{border-radius:8px;height:40px;padding:0 18px;font-size:11px}.actions mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}.cancel{color:#718179}@media(max-width:620px){.form-intro{padding:20px 18px}.fields{grid-template-columns:1fr;padding:20px 18px 8px;gap:4px}.full{grid-column:auto}.form-footer{padding:16px 18px;align-items:flex-start;flex-direction:column}.actions{width:100%}.actions button{flex:1}}
  `],
})
export class MovimientoFormComponent {
  readonly products = input<Producto[]>([]);
  readonly usuarioId = input<number | null>(null);
  readonly saving = input(false);
  readonly submitted = output<MovimientoCreateRequest>();
  readonly cancel = output<void>();
  protected attempted = false;
  protected readonly TipoMovimiento = TipoMovimiento;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    productoId: [0, [Validators.required, Validators.min(1)]],
    tipoMovimiento: [TipoMovimiento.ENTRADA, [Validators.required]],
    cantidad: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    referencia: ['', [Validators.maxLength(500)]],
    usuarioId: [0, [Validators.required, Validators.min(1)]],
  });
  protected readonly productSearch = new FormControl<string | Producto>('', { nonNullable: true });
  protected readonly filteredProducts = this.productSearch.valueChanges.pipe(startWith(this.productSearch.value), map((value) => {
    const query = (typeof value === 'string' ? value : `${value.sku} ${value.nombre}`).trim().toLocaleLowerCase();
    return this.products().filter((product) => `${product.sku} ${product.nombre}`.toLocaleLowerCase().includes(query));
  }));
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.productSearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => { if (typeof value === 'string') this.form.controls.productoId.setValue(0); });
    this.form.controls.tipoMovimiento.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((type) => this.applyQuantityRules(type));
    effect(() => {
      const id = this.usuarioId();
      this.form.controls.usuarioId.setValue(id ?? 0);
      this.form.controls.usuarioId.disable({ emitEvent: false });
    });
  }

  protected readonly displayProduct = (value: Producto | string | null): string => typeof value === 'string' ? value : value ? `${value.sku} - ${value.nombre}` : '';
  protected minimumQuantity(): number { return this.form.controls.tipoMovimiento.value === TipoMovimiento.AJUSTE ? 0 : 1; }

  selectProduct(product: Producto): void { this.form.controls.productoId.setValue(product.id); this.form.controls.productoId.markAsTouched(); }

  errorFor(field: keyof typeof this.form.controls): string {
    const control = this.form.controls[field];
    if (!(control.touched || this.attempted) || !control.errors) return '';
    if (control.hasError('required') || (control.hasError('min') && (field === 'productoId' || field === 'usuarioId'))) return field === 'productoId' ? 'Selecciona un producto de la lista.' : field === 'usuarioId' ? 'Selecciona un usuario de la lista.' : 'Este campo es obligatorio.';
    if (control.hasError('min')) return this.minimumQuantity() === 0 ? 'El stock final no puede ser negativo.' : 'La cantidad debe ser mayor que cero.';
    if (control.hasError('pattern')) return 'Ingresa un número entero.';
    if (control.hasError('maxlength')) return 'La referencia no puede superar 500 caracteres.';
    return 'Revisa este dato.';
  }

  submit(): void {
    this.attempted = true;
    this.form.markAllAsTouched();
    this.productSearch.markAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.submitted.emit({ ...value, referencia: value.referencia.trim() || null });
  }

  private applyQuantityRules(type: TipoMovimiento): void {
    const min = type === TipoMovimiento.AJUSTE ? 0 : 1;
    this.form.controls.cantidad.setValidators([Validators.required, Validators.min(min), Validators.pattern(/^\d+$/)]);
    this.form.controls.cantidad.updateValueAndValidity({ emitEvent: false });
  }
}
