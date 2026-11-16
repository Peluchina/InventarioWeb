import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { map, startWith } from 'rxjs';
import { Categoria } from '../../../categorias/models/categoria.model';
import { ProductoCreateRequest } from '../../models/producto-create-request.model';
import { ProductoUpdateRequest } from '../../models/producto-update-request.model';
import { ProductoDetalle } from '../../models/producto.model';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatAutocompleteModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="form-intro"><span class="form-icon"><mat-icon>inventory_2</mat-icon></span><div><h2>Información del producto</h2><p>Completa los datos del producto y su inventario inicial.</p></div></div>
      @if (categoryError()) { <div class="category-note error" role="alert"><mat-icon>error_outline</mat-icon><span>{{ categoryError() }}</span><button mat-button type="button" (click)="retryCategories.emit()">Reintentar</button></div> }
      @else if (!categoriesLoading() && categories().length === 0) { <div class="category-note" role="status"><mat-icon>info</mat-icon><span>No hay categorías asociadas a productos en el API para mostrar. Solicita habilitar el listado de categorías para elegir una nueva.</span></div> }
      <div class="fields">
        <mat-form-field appearance="outline"><mat-label>SKU</mat-label><input matInput formControlName="sku" autocomplete="off" placeholder="Ej. TOR-001"><mat-error>{{ errorFor('sku') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="nombre" autocomplete="off" placeholder="Nombre del producto"><mat-error>{{ errorFor('nombre') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>Descripción</mat-label><textarea matInput formControlName="descripcion" rows="3" placeholder="Detalles del producto (opcional)"></textarea></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Categoría</mat-label><input matInput [formControl]="categorySearch" [matAutocomplete]="categoryAutocomplete" placeholder="Escribe para buscar" autocomplete="off"><mat-autocomplete #categoryAutocomplete="matAutocomplete" [displayWith]="displayCategory" (optionSelected)="selectCategory($event.option.value)"><mat-option *ngFor="let category of filteredCategories | async" [value]="category">{{ category.nombre }}</mat-option><mat-option *ngIf="(filteredCategories | async)?.length === 0" disabled>No hay coincidencias</mat-option></mat-autocomplete><mat-hint>Escribe parte del nombre y selecciona una categoría.</mat-hint><mat-error>{{ errorFor('categoriaId') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Precio de compra</mat-label><span matTextPrefix>S/ &nbsp;</span><input matInput formControlName="precioCompra" type="number" min="0" step="0.01"><mat-error>{{ errorFor('precioCompra') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Precio de venta</mat-label><span matTextPrefix>S/ &nbsp;</span><input matInput formControlName="precioVenta" type="number" min="0" step="0.01"><mat-error>{{ errorFor('precioVenta') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Stock mínimo</mat-label><input matInput formControlName="stockMinimo" type="number" min="0" step="1"><mat-error>{{ errorFor('stockMinimo') }}</mat-error></mat-form-field>
        @if (!producto()) { <mat-form-field appearance="outline"><mat-label>Stock actual</mat-label><input matInput formControlName="stockActual" type="number" min="0" step="1"><mat-error>{{ errorFor('stockActual') }}</mat-error></mat-form-field> }
      </div>
      <div class="form-footer"><span class="required-note"><i></i> Campos obligatorios</span><div class="actions"><button mat-button type="button" class="cancel" (click)="cancel.emit()">Cancelar</button><button mat-flat-button color="primary" type="submit" [disabled]="saving()"><mat-icon>{{ saving() ? 'hourglass_top' : 'check' }}</mat-icon>{{ saving() ? 'Guardando…' : submitLabel() }}</button></div></div>
    </form>
  `,
  styles: [`
    :host{display:block}.form-intro{display:flex;align-items:center;gap:13px;padding:25px 28px 22px;border-bottom:1px solid #edf1ee}.form-icon{width:39px;height:39px;border-radius:11px;background:#edf5f0;color:#366d57;display:grid;place-items:center}.form-intro h2{font-size:14px;color:#2c493e;margin:0 0 5px}.form-intro p{font-size:11px;color:#899890;margin:0}.fields{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;padding:24px 28px 12px}.full{grid-column:1/-1}.form-footer{padding:18px 28px 24px;border-top:1px solid #edf1ee;display:flex;justify-content:space-between;align-items:center}.required-note{font-size:10px;color:#87968f;display:flex;align-items:center;gap:7px}.required-note i{width:6px;height:6px;border-radius:50%;background:#d78d6c}.actions{display:flex;align-items:center;gap:10px}.actions button{border-radius:8px;height:40px;padding:0 18px;font-size:11px}.actions mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}.cancel{color:#718179}.category-note{margin:16px 28px 0;padding:11px 13px;border-radius:8px;background:#f3f7f3;color:#62796c;display:flex;align-items:center;gap:9px;font-size:11px}.category-note span{flex:1}.category-note mat-icon{font-size:18px}.category-note.error{background:#fff5f2;color:#9d5340}@media(max-width:620px){.form-intro{padding:20px 18px}.fields{grid-template-columns:1fr;padding:20px 18px 8px;gap:4px}.full{grid-column:auto}.form-footer{padding:16px 18px;align-items:flex-start;flex-direction:column;gap:14px}.actions{width:100%}.actions button{flex:1}.category-note{margin:12px 18px 0}}
  `],
})
export class ProductoFormComponent {
  readonly producto = input<ProductoDetalle | null>(null);
  readonly categories = input<Categoria[]>([]);
  readonly categoriesLoading = input(false);
  readonly categoryError = input('');
  readonly saving = input(false);
  readonly submitLabel = input('Guardar producto');
  readonly submitted = output<ProductoCreateRequest>();
  readonly updated = output<ProductoUpdateRequest>();
  readonly cancel = output<void>();
  readonly retryCategories = output<void>();
  protected attempted = false;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    sku: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)]],
    nombre: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)]],
    descripcion: [''],
    categoriaId: [0, [Validators.required, Validators.min(1)]],
    precioCompra: [0, [Validators.required, Validators.min(0)]],
    precioVenta: [0, [Validators.required, Validators.min(0)]],
    stockMinimo: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    stockActual: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
  });
  protected readonly categorySearch = new FormControl<string | Categoria>('', { nonNullable: true });
  protected readonly filteredCategories = this.categorySearch.valueChanges.pipe(
    startWith(this.categorySearch.value),
    map((value) => {
      const query = (typeof value === 'string' ? value : value.nombre).trim().toLocaleLowerCase();
      return this.categories().filter((category) => category.nombre.toLocaleLowerCase().includes(query));
    }),
  );
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.categorySearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      if (typeof value === 'string') this.form.controls.categoriaId.setValue(0);
    });
    effect(() => {
      const item = this.producto();
      if (!item) return;
      this.form.patchValue({ sku: item.sku, nombre: item.nombre, descripcion: item.descripcion ?? '', categoriaId: item.categoriaId, precioCompra: item.precioCompra, precioVenta: item.precioVenta, stockMinimo: item.stockMinimo, stockActual: item.stockActual });
      const match = this.categories().find((category) => category.id === item.categoriaId);
      this.categorySearch.setValue(match ?? ({ id: item.categoriaId, nombre: item.categoria } as Categoria), { emitEvent: false });
    });
  }

  protected readonly displayCategory = (value: Categoria | string | null): string => typeof value === 'string' ? value : value?.nombre ?? '';

  selectCategory(category: Categoria): void {
    this.form.controls.categoriaId.setValue(category.id);
    this.form.controls.categoriaId.markAsTouched();
  }

  errorFor(field: keyof typeof this.form.controls): string {
    const control = this.form.controls[field];
    if (!(control.touched || this.attempted) || !control.errors) return '';
    if (control.hasError('required')) return field === 'categoriaId' ? 'Selecciona una categoría.' : `El campo ${this.fieldName(field)} es obligatorio.`;
    if (control.hasError('min')) return field === 'categoriaId' ? 'Selecciona una categoría de la lista.' : 'El valor no puede ser negativo.';
    if (control.hasError('pattern')) return field === 'sku' || field === 'nombre' ? 'Ingresa un valor que no esté vacío.' : 'El stock debe ser un número entero.';
    if (control.hasError('maxlength')) return 'El texto supera la longitud permitida.';
    return 'Revisa este dato.';
  }

  submit(): void {
    this.attempted = true;
    this.form.markAllAsTouched();
    this.categorySearch.markAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (this.producto()) {
      this.updated.emit({ sku: value.sku.trim(), nombre: value.nombre.trim(), descripcion: value.descripcion.trim(), categoriaId: value.categoriaId, precioCompra: value.precioCompra, precioVenta: value.precioVenta, stockMinimo: value.stockMinimo });
      return;
    }
    this.submitted.emit({ ...value, sku: value.sku.trim(), nombre: value.nombre.trim(), descripcion: value.descripcion.trim() });
  }

  private fieldName(field: string): string { return ({ sku: 'SKU', nombre: 'nombre', precioCompra: 'precio de compra', precioVenta: 'precio de venta', stockMinimo: 'stock mínimo', stockActual: 'stock actual' } as Record<string, string>)[field] ?? field; }
}
