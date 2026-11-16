import { AfterViewInit, Component, DestroyRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { userErrorMessage } from '../../../../core/interceptors/http-error.interceptor';
import { AuthService } from '../../../../core/auth/auth.service';
import { Producto } from '../../models/producto.model';
import { ProductoStatus } from '../../models/producto-status.enum';
import { ProductosService } from '../../services/productos.service';

@Component({
  selector: 'app-productos-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent, PageHeaderComponent, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSortModule, MatTableModule, MatTooltipModule],
  template: `
    <app-page-header title="Productos" subtitle="Controla tu catálogo, precios y niveles de inventario." eyebrow="Inventario / Catálogo">
      <button mat-flat-button color="primary" routerLink="nuevo" [hidden]="!auth.hasRole('ADMINISTRADOR')"><mat-icon>add</mat-icon>Nuevo producto</button>
    </app-page-header>
    <section class="summary-row" aria-label="Resumen de productos">
      <article class="summary-card"><span class="summary-icon green"><mat-icon>inventory_2</mat-icon></span><div><small>Total de productos</small><strong>{{ dataSource.data.length }}</strong></div><span class="summary-foot">REGISTROS</span></article>
      <article class="summary-card"><span class="summary-icon sand"><mat-icon>warning_amber</mat-icon></span><div><small>Stock bajo</small><strong>{{ lowStockCount() }}</strong></div><span class="summary-foot">REVISAR</span></article>
      <article class="summary-card"><span class="summary-icon mint"><mat-icon>category</mat-icon></span><div><small>Categorías</small><strong>{{ categoryCount() }}</strong></div><span class="summary-foot">EN CATÁLOGO</span></article>
    </section>
    <section class="panel">
      <div class="panel-heading"><div><h2>Catálogo de productos</h2><p>Consulta y gestiona tus productos registrados.</p></div><mat-form-field appearance="outline" class="search"><mat-icon matPrefix>search</mat-icon><mat-label>Buscar producto</mat-label><input matInput (input)="filter($event)" placeholder="SKU, nombre o categoría"></mat-form-field></div>
      @if (errorMessage()) { <div class="error-banner" role="alert"><mat-icon>error_outline</mat-icon><span>{{ errorMessage() }}</span><button mat-button (click)="load()">Reintentar</button></div> }
      @if (loading()) { <app-loading message="Cargando productos…" /> }
      <div class="table-wrap" [class.dimmed]="loading()">
        <table mat-table [dataSource]="dataSource" matSort aria-label="Lista de productos">
          <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th><td mat-cell *matCellDef="let item"><span class="id-tag">#{{ item.id }}</span></td></ng-container>
          <ng-container matColumnDef="sku"><th mat-header-cell *matHeaderCellDef mat-sort-header>SKU</th><td mat-cell *matCellDef="let item"><span class="sku-tag">{{ item.sku }}</span></td></ng-container>
          <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef mat-sort-header>PRODUCTO</th><td mat-cell *matCellDef="let item"><span class="product-name">{{ item.nombre }}</span><span class="product-description">{{ item.descripcion || 'Sin descripción' }}</span></td></ng-container>
          <ng-container matColumnDef="categoria"><th mat-header-cell *matHeaderCellDef mat-sort-header>CATEGORÍA</th><td mat-cell *matCellDef="let item"><span class="category-tag">{{ item.categoria }}</span></td></ng-container>
          <ng-container matColumnDef="precioCompra"><th mat-header-cell *matHeaderCellDef mat-sort-header>COMPRA</th><td mat-cell *matCellDef="let item">{{ item.precioCompra | currency:'PEN':'symbol':'1.2-2' }}</td></ng-container>
          <ng-container matColumnDef="precioVenta"><th mat-header-cell *matHeaderCellDef mat-sort-header>VENTA</th><td mat-cell *matCellDef="let item">{{ item.precioVenta | currency:'PEN':'symbol':'1.2-2' }}</td></ng-container>
          <ng-container matColumnDef="stockMinimo"><th mat-header-cell *matHeaderCellDef mat-sort-header>MÍNIMO</th><td mat-cell *matCellDef="let item">{{ item.stockMinimo }}</td></ng-container>
          <ng-container matColumnDef="stockActual"><th mat-header-cell *matHeaderCellDef mat-sort-header>STOCK</th><td mat-cell *matCellDef="let item"><strong>{{ item.stockActual }}</strong><span class="stock-state" [class.low]="isLowStock(item)">{{ item.estadoStock }}</span></td></ng-container>
          <ng-container matColumnDef="estadoId"><th mat-header-cell *matHeaderCellDef>ESTADO</th><td mat-cell *matCellDef="let item"><span class="state-tag" [class.active]="item.estadoId === ProductoStatus.ACTIVO" [class.inactive]="item.estadoId === ProductoStatus.INACTIVO">{{ statusLabel(item) }}</span></td></ng-container>
          <ng-container matColumnDef="acciones"><th mat-header-cell *matHeaderCellDef><span class="sr-only">Acciones</span></th><td mat-cell *matCellDef="let item"><div class="row-actions"><button mat-icon-button [hidden]="!auth.hasRole('ADMINISTRADOR')" [routerLink]="['editar', item.id]" matTooltip="Editar" [attr.aria-label]="'Editar producto ' + item.nombre" [disabled]="busyId() !== null"><mat-icon>edit</mat-icon></button><button mat-icon-button [hidden]="!auth.hasRole('ADMINISTRADOR')" (click)="changeStatus(item)" [matTooltip]="item.estadoId === ProductoStatus.ACTIVO ? 'Desactivar' : 'Activar'" [attr.aria-label]="(item.estadoId === ProductoStatus.ACTIVO ? 'Desactivar ' : 'Activar ') + item.nombre" [disabled]="busyId() !== null"><mat-icon>{{ item.estadoId === ProductoStatus.ACTIVO ? 'pause_circle' : 'play_circle' }}</mat-icon></button><button mat-icon-button [hidden]="!auth.hasRole('ADMINISTRADOR')" class="delete-action" (click)="remove(item)" matTooltip="Eliminar" [attr.aria-label]="'Eliminar producto ' + item.nombre" [disabled]="busyId() !== null"><mat-icon>delete_outline</mat-icon></button></div></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr><tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          <tr class="mat-mdc-row" *matNoDataRow><td class="mat-mdc-cell no-data" [attr.colspan]="displayedColumns.length"><span class="empty-icon"><mat-icon>inventory_2</mat-icon></span><strong>{{ dataSource.filter ? 'No encontramos resultados' : 'No existen productos registrados.' }}</strong><span>{{ dataSource.filter ? 'Prueba con otra búsqueda.' : 'Crea un producto para comenzar a gestionar tu inventario.' }}</span></td></tr>
        </table>
      </div>
      <mat-paginator [pageSizeOptions]="[5, 10, 25]" [pageSize]="10" showFirstLastButtons aria-label="Paginación de productos" />
      <div class="mobile-list">
        @for (item of dataSource.filteredData; track item.id) {
          <article class="mobile-card"><div class="mobile-card-top"><div><strong>{{ item.nombre }}</strong><small>{{ item.sku }} · {{ item.categoria }}</small></div><span class="state-tag" [class.active]="item.estadoId === ProductoStatus.ACTIVO" [class.inactive]="item.estadoId === ProductoStatus.INACTIVO">{{ statusLabel(item) }}</span></div><p>{{ item.estadoStock }} · {{ item.stockActual }} unidades (mínimo {{ item.stockMinimo }})<br>Compra {{ item.precioCompra | currency:'PEN':'symbol':'1.2-2' }} · Venta {{ item.precioVenta | currency:'PEN':'symbol':'1.2-2' }}</p><div class="mobile-actions"><button mat-button [hidden]="!auth.hasRole('ADMINISTRADOR')" [routerLink]="['editar', item.id]"><mat-icon>edit</mat-icon>Editar</button><button mat-button [hidden]="!auth.hasRole('ADMINISTRADOR')" (click)="changeStatus(item)"><mat-icon>sync</mat-icon>{{ item.estadoId === ProductoStatus.ACTIVO ? 'Desactivar' : 'Activar' }}</button><button mat-button [hidden]="!auth.hasRole('ADMINISTRADOR')" (click)="remove(item)"><mat-icon>delete_outline</mat-icon>Eliminar</button></div></article>
        }
      </div>
    </section>
  `,
  styles: [`
    :host{display:block}.summary-row{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:22px}.summary-card{min-height:94px;background:#fff;border:1px solid #eaf0ec;border-radius:12px;display:flex;align-items:center;gap:13px;padding:18px 20px;box-sizing:border-box}.summary-icon{width:39px;height:39px;border-radius:11px;display:grid;place-items:center}.summary-icon mat-icon{font-size:19px}.green{background:#edf5f0;color:#3d745c}.mint{background:#e8f4ef;color:#4d8a6c}.sand{background:#f7f1e8;color:#ad8953}.summary-card div{display:flex;flex-direction:column;gap:6px;flex:1}.summary-card small{font-size:10px;color:#84958d}.summary-card strong{font-size:22px;line-height:1;color:#23483b}.summary-foot{font-size:8px;color:#a1ada7;letter-spacing:.08em;font-weight:700}.panel{background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}.panel-heading{display:flex;align-items:center;justify-content:space-between;padding:22px 24px 8px;gap:18px}.panel-heading h2{margin:0 0 6px;color:#2d493e;font-size:15px}.panel-heading p{margin:0;color:#92a098;font-size:10px}.search{width:270px}.search mat-icon{color:#91a099;margin-right:8px}.table-wrap{overflow:auto}table{width:100%;min-width:1140px}.mat-mdc-header-row{height:43px;background:#f8faf8}.mat-mdc-header-cell{font-size:9px;font-weight:700;color:#9aa7a1;letter-spacing:.08em;border-bottom:1px solid #edf1ee}.mat-mdc-cell{font-size:10px;color:#66786f;border-bottom-color:#f0f3f1;padding-top:8px;padding-bottom:8px}.id-tag{color:#83948b;font-size:9px;font-weight:600}.sku-tag,.category-tag,.state-tag{padding:5px 8px;background:#f2f5f2;border-radius:6px;color:#6b7f74;font-size:9px}.state-tag.active{background:#e6f3eb;color:#2f7958}.state-tag.inactive{background:#f7f1e8;color:#ad704f}.product-name,.product-description,.stock-state{display:block}.product-name{color:#2d493e;font-size:10px;font-weight:700}.product-description{font-size:9px;color:#98a59f;margin-top:3px;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stock-state{margin-top:3px;font-size:8px;color:#57916c}.stock-state.low{color:#b16d4d}.row-actions{display:flex;justify-content:flex-end}.row-actions button{width:31px;height:31px;color:#72857b}.row-actions .delete-action{color:#b07869}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.no-data{height:175px;text-align:center;color:#87968f}.no-data strong,.no-data span{display:block}.no-data strong{color:#456256;margin:5px}.no-data span{font-size:11px}.empty-icon{color:#90a69a}.error-banner{margin:12px 20px;padding:12px 14px;background:#fff5f2;color:#9d5340;border-radius:8px;display:flex;align-items:center;gap:10px;font-size:11px}.error-banner span{flex:1}.dimmed{opacity:.55}.mobile-list{display:none}.mobile-card{padding:16px;border-bottom:1px solid #edf1ee}.mobile-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}.mobile-card-top strong,.mobile-card-top small{display:block}.mobile-card-top strong{color:#2e4d40;font-size:12px}.mobile-card-top small{font-size:10px;color:#8b9a93;margin-top:5px}.mobile-card p{font-size:10px;line-height:1.8;color:#73847b}.mobile-actions{display:flex;justify-content:space-between}.mobile-actions button{font-size:10px;padding:0 6px}.mobile-actions mat-icon{font-size:16px;width:16px;height:16px;margin-right:3px}mat-paginator{border-top:1px solid #edf1ee}@media(max-width:980px){.summary-foot{display:none}}@media(max-width:700px){.summary-row{gap:8px}.summary-card{padding:12px 10px;gap:8px;min-height:82px}.summary-icon{width:32px;height:32px}.summary-card small{font-size:9px}.summary-card strong{font-size:18px}.panel-heading{padding:18px 15px 8px;align-items:flex-start;flex-direction:column}.search{width:100%}.table-wrap,mat-paginator{display:none}.mobile-list{display:block}.error-banner{margin:10px 12px}}
  `],
})
export class ProductosListComponent implements AfterViewInit {
  private readonly service = inject(ProductosService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ProductoStatus = ProductoStatus;
  protected readonly displayedColumns = ['id', 'sku', 'nombre', 'categoria', 'precioCompra', 'precioVenta', 'stockMinimo', 'stockActual', 'estadoId', 'acciones'];
  protected readonly auth = inject(AuthService);
  protected readonly dataSource = new MatTableDataSource<Producto>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly busyId = signal<number | null>(null);
  @ViewChild(MatPaginator) private paginator!: MatPaginator;
  @ViewChild(MatSort) private sort!: MatSort;

  constructor() {
    this.dataSource.filterPredicate = (item, filter) => [item.sku, item.nombre, item.descripcion ?? '', item.categoria, item.estadoStock, String(item.id)].some((value) => value.toLocaleLowerCase().includes(filter));
    this.load();
  }

  ngAfterViewInit(): void { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; }
  lowStockCount(): number { return this.dataSource.data.filter((item) => this.isLowStock(item)).length; }
  categoryCount(): number { return new Set(this.dataSource.data.map((item) => item.categoriaId)).size; }
  isLowStock(item: Producto): boolean { return item.estadoStock.toLocaleLowerCase().includes('bajo'); }
  statusLabel(item: Producto): string { return item.estadoId === ProductoStatus.ACTIVO ? 'ACTIVO' : item.estadoId === ProductoStatus.INACTIVO ? 'INACTIVO' : `Estado #${item.estadoId}`; }
  filter(event: Event): void { this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLocaleLowerCase(); this.dataSource.paginator?.firstPage(); }

  load(): void {
    this.loading.set(true); this.errorMessage.set('');
    this.service.listar().pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => { this.dataSource.data = this.auth.hasRole('ADMINISTRADOR') ? items : items.filter((item) => item.estadoId !== ProductoStatus.INACTIVO); if (this.paginator) this.dataSource.paginator = this.paginator; if (this.sort) this.dataSource.sort = this.sort; },
      error: (error: unknown) => this.errorMessage.set(userErrorMessage(error)),
    });
  }

  async changeStatus(item: Producto): Promise<void> {
    let target = item.estadoId === ProductoStatus.ACTIVO ? ProductoStatus.INACTIVO : item.estadoId === ProductoStatus.INACTIVO ? ProductoStatus.ACTIVO : undefined;
    if (target === undefined) {
      const selection = await Swal.fire({
        title: 'Cambiar estado del producto',
        text: 'El API no proporciona el catálogo. Ingresa el ID de estado destino definido en la base de datos.',
        input: 'number',
        inputLabel: 'ID del nuevo estado',
        inputAttributes: { min: '1', step: '1' },
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2f684f',
        cancelButtonColor: '#edf1ee',
        inputValidator: (value) => {
          const estadoId = Number(value);
          if (!Number.isInteger(estadoId) || estadoId < 1) return 'Ingresa un ID de estado válido.';
          if (estadoId === item.estadoId) return 'El ID debe ser distinto al estado actual.';
          return null;
        },
      });
      if (!selection.isConfirmed) return;
      target = Number(selection.value);
    }
    const activating = target === ProductoStatus.ACTIVO;
    const result = await Swal.fire({ title: activating ? '¿Deseas activar este producto?' : '¿Deseas desactivar este producto?', text: item.nombre, icon: 'question', showCancelButton: true, confirmButtonText: activating ? 'Sí, activar' : 'Sí, desactivar', cancelButtonText: 'Cancelar', confirmButtonColor: '#2f684f', cancelButtonColor: '#edf1ee', reverseButtons: true });
    if (!result.isConfirmed) return;
    this.busyId.set(item.id);
    this.service.actualizarEstado(item.id, { estadoId: target }).pipe(finalize(() => this.busyId.set(null)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void Swal.fire({ title: 'Estado actualizado', text: 'El producto se actualizó correctamente.', icon: 'success', confirmButtonColor: '#2f684f', timer: 1600, showConfirmButton: false }); this.load(); },
      error: (error: unknown) => { void Swal.fire({ title: 'No se pudo cambiar el estado', text: userErrorMessage(error), icon: 'error', confirmButtonColor: '#2f684f' }); },
    });
  }

  async remove(item: Producto): Promise<void> {
    const result = await Swal.fire({ title: '¿Estás seguro de eliminar este producto?', text: `${item.nombre}. Esta acción no se puede deshacer.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar', confirmButtonColor: '#b85b4c', cancelButtonColor: '#edf1ee', reverseButtons: true });
    if (!result.isConfirmed) return;
    this.busyId.set(item.id);
    this.service.eliminar(item.id).pipe(finalize(() => this.busyId.set(null)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void Swal.fire({ title: 'Producto eliminado correctamente.', icon: 'success', confirmButtonColor: '#2f684f', timer: 1500, showConfirmButton: false }); this.load(); },
      error: (error: unknown) => { void Swal.fire({ title: 'No se pudo eliminar el producto.', text: userErrorMessage(error), icon: 'error', confirmButtonColor: '#2f684f' }); },
    });
  }
}

