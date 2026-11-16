import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize, map, startWith } from 'rxjs';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { userErrorMessage } from '../../../../core/interceptors/http-error.interceptor';
import { Producto } from '../../../productos/models/producto.model';
import { ProductosService } from '../../../productos/services/productos.service';
import { MovimientoRegistro } from '../../models/movimiento-inventario.model';
import { TipoMovimiento } from '../../models/tipo-movimiento.enum';
import { MovimientosInventarioService } from '../../services/movimientos-inventario.service';
import { movimientoErrorMessage } from '../../utils/movimiento-error-message';

@Component({
  selector: 'app-movimientos-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingComponent, PageHeaderComponent, MatAutocompleteModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSortModule, MatTableModule, MatTooltipModule],
  template: `
    <app-page-header title="Movimientos de inventario" subtitle="Consulta entradas, salidas y ajustes registrados." eyebrow="Inventario / Movimientos">
      <button mat-flat-button color="primary" routerLink="nuevo"><mat-icon>add</mat-icon>Registrar movimiento</button>
    </app-page-header>
    <section class="panel">
      <div class="panel-heading"><div><h2>{{ selectedProduct() ? 'Historial del producto' : 'Historial de movimientos' }}</h2><p>{{ selectedProduct() ? productLabel(selectedProduct()!) : 'Revisa el producto, el usuario y los cambios de stock de cada operación.' }}</p></div><div class="filters"><mat-form-field appearance="outline" class="product-filter"><mat-label>Filtrar por producto</mat-label><input matInput [formControl]="productSearch" [matAutocomplete]="productAutocomplete" placeholder="SKU o nombre" autocomplete="off"><mat-autocomplete #productAutocomplete="matAutocomplete" [displayWith]="displayProduct" (optionSelected)="selectProduct($event.option.value)"><mat-option *ngFor="let item of filteredProducts | async" [value]="item">{{ item.sku }} - {{ item.nombre }}</mat-option><mat-option *ngIf="(filteredProducts | async)?.length === 0" disabled>No hay productos coincidentes</mat-option></mat-autocomplete></mat-form-field><button mat-stroked-button type="button" (click)="clearProductFilter()" [disabled]="selectedProductId() === null">Todos</button></div></div>
      <div class="search-row"><mat-form-field appearance="outline" class="search"><mat-icon matPrefix>search</mat-icon><mat-label>Buscar movimiento</mat-label><input matInput (input)="filter($event)" placeholder="Producto, SKU, tipo, referencia o usuario"></mat-form-field></div>
      @if (productError()) { <div class="error-banner" role="alert"><mat-icon>error_outline</mat-icon><span>{{ productError() }}</span><button mat-button (click)="loadProducts()">Reintentar</button></div> }
      @if (errorMessage()) { <div class="error-banner" role="alert"><mat-icon>error_outline</mat-icon><span>{{ errorMessage() }}</span><button mat-button (click)="loadMovements()">Reintentar</button></div> }
      @if (loading()) { <app-loading message="Cargando movimientos…" /> }
      <div class="table-wrap" [class.dimmed]="loading()">
        <table mat-table [dataSource]="dataSource" matSort aria-label="Historial de movimientos">
          <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th><td mat-cell *matCellDef="let item"><span class="id-tag">#{{ item.id }}</span></td></ng-container>
          <ng-container matColumnDef="producto"><th mat-header-cell *matHeaderCellDef mat-sort-header>PRODUCTO</th><td mat-cell *matCellDef="let item"><span class="product-name">{{ item.sku ? item.sku + ' - ' : '' }}{{ item.producto }}</span></td></ng-container>
          <ng-container matColumnDef="tipoMovimiento"><th mat-header-cell *matHeaderCellDef mat-sort-header>TIPO</th><td mat-cell *matCellDef="let item"><span class="movement-chip" [class.entrada]="typeClass(item.tipoMovimiento) === 'entrada'" [class.salida]="typeClass(item.tipoMovimiento) === 'salida'" [class.ajuste]="typeClass(item.tipoMovimiento) === 'ajuste'">{{ item.tipoMovimiento | uppercase }}</span></td></ng-container>
          <ng-container matColumnDef="cantidad"><th mat-header-cell *matHeaderCellDef mat-sort-header>CANTIDAD</th><td mat-cell *matCellDef="let item">{{ item.cantidad }}</td></ng-container>
          <ng-container matColumnDef="stockAnterior"><th mat-header-cell *matHeaderCellDef>ANTERIOR</th><td mat-cell *matCellDef="let item">{{ item.stockAnterior }}</td></ng-container>
          <ng-container matColumnDef="stockNuevo"><th mat-header-cell *matHeaderCellDef>NUEVO</th><td mat-cell *matCellDef="let item"><strong>{{ item.stockNuevo }}</strong></td></ng-container>
          <ng-container matColumnDef="referencia"><th mat-header-cell *matHeaderCellDef>REFERENCIA</th><td mat-cell *matCellDef="let item" class="reference">{{ item.referencia || '—' }}</td></ng-container>
          <ng-container matColumnDef="usuario"><th mat-header-cell *matHeaderCellDef>USUARIO</th><td mat-cell *matCellDef="let item">{{ item.usuario || 'Usuario no disponible' }}</td></ng-container>
          <ng-container matColumnDef="fecha"><th mat-header-cell *matHeaderCellDef mat-sort-header>FECHA</th><td mat-cell *matCellDef="let item"><span>{{ item.createdAt ? (item.createdAt | date:'dd/MM/yyyy') : '—' }}</span><small class="time">{{ item.fecha || '' }}</small></td></ng-container>
          <ng-container matColumnDef="detalle"><th mat-header-cell *matHeaderCellDef><span class="sr-only">Detalle</span></th><td mat-cell *matCellDef="let item"><a mat-icon-button [routerLink]="['/', 'movimientos-inventario', item.id]" matTooltip="Ver detalle" [attr.aria-label]="'Ver movimiento ' + item.id"><mat-icon>arrow_forward</mat-icon></a></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr><tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          <tr class="mat-mdc-row" *matNoDataRow><td class="mat-mdc-cell no-data" [attr.colspan]="displayedColumns.length"><span class="empty-icon"><mat-icon>history</mat-icon></span><strong>{{ dataSource.filter ? 'No encontramos movimientos' : selectedProduct() ? 'Este producto aún no tiene movimientos.' : 'No existen movimientos registrados.' }}</strong><span>{{ dataSource.filter ? 'Prueba con otra búsqueda.' : selectedProduct() ? 'Los movimientos de este producto aparecerán aquí.' : 'Registra el primer movimiento para iniciar el historial.' }}</span></td></tr>
        </table>
      </div>
      <mat-paginator [pageSizeOptions]="[5, 10, 25]" [pageSize]="10" showFirstLastButtons aria-label="Paginación de movimientos" />
    </section>
  `,
  styles: [`
    :host{display:block}.panel{background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}.panel-heading{display:flex;align-items:flex-start;justify-content:space-between;padding:22px 24px 0;gap:18px}.panel-heading h2{margin:0 0 6px;color:#2d493e;font-size:15px}.panel-heading p{margin:0;color:#92a098;font-size:10px}.filters{display:flex;align-items:center;gap:8px}.filters button{height:46px;border-color:#dfe8e2;color:#62796c}.product-filter{width:260px}.search-row{padding:8px 24px 0}.search{width:min(360px,100%)}.search mat-icon{color:#91a099;margin-right:8px}.table-wrap{overflow:auto}table{width:100%;min-width:1050px}.mat-mdc-header-row{height:43px;background:#f8faf8}.mat-mdc-header-cell{font-size:9px;font-weight:700;color:#9aa7a1;letter-spacing:.08em;border-bottom:1px solid #edf1ee}.mat-mdc-cell{font-size:10px;color:#66786f;border-bottom-color:#f0f3f1;padding-top:9px;padding-bottom:9px}.id-tag{color:#83948b;font-size:9px;font-weight:600}.product-name{color:#2d493e;font-size:10px;font-weight:700}.movement-chip{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;font-size:8px;font-weight:700;letter-spacing:.06em}.movement-chip.entrada{background:#e8f4ed;color:#397554}.movement-chip.salida{background:#fff0e9;color:#b46a4c}.movement-chip.ajuste{background:#eef1f7;color:#66789e}.reference{max-width:170px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.time{display:block;color:#99a69f;font-size:9px;margin-top:3px}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.no-data{height:175px;text-align:center;color:#87968f}.no-data strong,.no-data span{display:block}.no-data strong{color:#456256;margin:5px}.no-data span{font-size:11px}.empty-icon{color:#90a69a}.error-banner{margin:12px 20px;padding:12px 14px;background:#fff5f2;color:#9d5340;border-radius:8px;display:flex;align-items:center;gap:10px;font-size:11px}.error-banner span{flex:1}.dimmed{opacity:.55}mat-paginator{border-top:1px solid #edf1ee}@media(max-width:760px){.panel-heading{flex-direction:column;padding:18px 16px 0}.filters{width:100%;align-items:flex-start}.product-filter{flex:1;min-width:0}.search-row{padding:6px 16px 0}.table-wrap{overflow-x:auto}.table-wrap table{min-width:1000px}.error-banner{margin:10px 12px}}
  `],
})
export class MovimientosListComponent implements AfterViewInit {
  private readonly service = inject(MovimientosInventarioService);
  private readonly productService = inject(ProductosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly displayedColumns = ['id', 'producto', 'tipoMovimiento', 'cantidad', 'stockAnterior', 'stockNuevo', 'referencia', 'usuario', 'fecha', 'detalle'];
  protected readonly dataSource = new MatTableDataSource<MovimientoRegistro>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly productError = signal('');
  protected readonly products = signal<Producto[]>([]);
  protected readonly selectedProductId = signal<number | null>(null);
  protected readonly selectedProduct = signal<Producto | null>(null);
  protected readonly productSearch = new FormControl<string | Producto>('', { nonNullable: true });
  protected readonly filteredProducts = this.productSearch.valueChanges.pipe(startWith(this.productSearch.value), map((value) => {
    const query = (typeof value === 'string' ? value : `${value.sku} ${value.nombre}`).trim().toLocaleLowerCase();
    return this.products().filter((product) => `${product.sku} ${product.nombre}`.toLocaleLowerCase().includes(query));
  }));
  @ViewChild(MatPaginator) private paginator!: MatPaginator;
  @ViewChild(MatSort) private sort!: MatSort;

  constructor() {
    this.dataSource.filterPredicate = (item, filter) => [item.producto, item.sku ?? '', item.tipoMovimiento, item.referencia ?? '', item.usuario, String(item.id)].some((value) => value.toLocaleLowerCase().includes(filter));
    this.productSearch.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      if (typeof value === 'string' && value.length === 0 && this.selectedProductId() !== null) this.clearProductFilter();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    const routeId = Number(this.route.snapshot.paramMap.get('productoId'));
    if (Number.isInteger(routeId) && routeId > 0) this.selectedProductId.set(routeId);
    this.loadProducts();
    this.loadMovements();
  }

  protected readonly displayProduct = (value: Producto | string | null): string => typeof value === 'string' ? value : value ? `${value.sku} - ${value.nombre}` : '';
  protected productLabel(product: Producto): string { return `${product.sku} - ${product.nombre}`; }
  protected typeClass(type: string): string { return type === TipoMovimiento.ENTRADA ? 'entrada' : type === TipoMovimiento.SALIDA ? 'salida' : type === TipoMovimiento.AJUSTE ? 'ajuste' : ''; }

  loadProducts(): void {
    this.productError.set('');
    this.productService.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => {
        this.products.set(items);
        const id = this.selectedProductId();
        if (id !== null) {
          const found = items.find((item) => item.id === id) ?? null;
          this.selectedProduct.set(found);
          if (found) this.productSearch.setValue(found, { emitEvent: false });
        }
      },
      error: (error: unknown) => this.productError.set(userErrorMessage(error)),
    });
  }

  loadMovements(): void {
    this.loading.set(true); this.errorMessage.set('');
    const productId = this.selectedProductId();
    const request = productId === null ? this.service.listar() : this.service.listarPorProducto(productId);
    request.pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => { this.dataSource.data = items; if (this.paginator) this.paginator.firstPage(); },
      error: (error: unknown) => this.errorMessage.set(movimientoErrorMessage(error)),
    });
  }

  selectProduct(product: Producto): void {
    this.selectedProduct.set(product);
    this.selectedProductId.set(product.id);
    void this.router.navigate(['/movimientos-inventario/producto', product.id]);
    this.loadMovements();
  }

  clearProductFilter(): void {
    if (this.selectedProductId() === null) return;
    this.selectedProductId.set(null); this.selectedProduct.set(null); this.productSearch.setValue('', { emitEvent: false });
    void this.router.navigate(['/movimientos-inventario']);
    this.loadMovements();
  }

  filter(event: Event): void { this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLocaleLowerCase(); this.dataSource.paginator?.firstPage(); }
}
