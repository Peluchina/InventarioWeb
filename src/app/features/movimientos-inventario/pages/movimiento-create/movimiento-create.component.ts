import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { userErrorMessage } from '../../../../core/interceptors/http-error.interceptor';
import { AuthService } from '../../../../core/auth/auth.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { Producto } from '../../../productos/models/producto.model';
import { ProductosService } from '../../../productos/services/productos.service';
import { MovimientoCreateRequest } from '../../models/movimiento-create-request.model';
import { MovimientoCreateResponse } from '../../models/movimiento-response.model';
import { TipoMovimiento } from '../../models/tipo-movimiento.enum';
import { MovimientoFormComponent } from '../../components/movimiento-form/movimiento-form.component';
import { movimientoErrorMessage } from '../../utils/movimiento-error-message';
import { MovimientosInventarioService } from '../../services/movimientos-inventario.service';

@Component({
  selector: 'app-movimiento-create',
  standalone: true,
  imports: [PageHeaderComponent, LoadingComponent, MovimientoFormComponent, MatButtonModule, MatIconModule],
  template: `
    <app-page-header title="Registrar movimiento" subtitle="Registra entradas, salidas o ajustes de inventario." eyebrow="Inventario / Movimientos" />
    <button mat-button class="back-link" (click)="back()"><mat-icon>arrow_back</mat-icon>Volver al historial</button>
    @if (loading()) { <section class="form-panel"><app-loading message="Cargando productos…" /></section> }
    @else if (errorMessage()) { <section class="load-error" role="alert"><mat-icon>error_outline</mat-icon><p>{{ errorMessage() }}</p><button mat-button (click)="loadLookups()">Reintentar</button></section> }
    @else { <section class="form-panel"><app-movimiento-form [products]="products()" [usuarioId]="currentUserId()" [saving]="saving()" (submitted)="save($event)" (cancel)="back()" /></section> }
  `,
  styles: [`.form-panel{max-width:900px;background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}.back-link{margin:-13px 0 15px -8px;color:#668076;font-size:11px}.back-link mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}.load-error{max-width:900px;padding:28px;background:#fff7f4;border:1px solid #f3e4de;border-radius:12px;color:#995741;display:flex;align-items:center;gap:12px}.load-error p{flex:1;font-size:12px}`],
})
export class MovimientoCreateComponent implements OnInit {
  private readonly movementService = inject(MovimientosInventarioService);
  private readonly productService = inject(ProductosService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly products = signal<Producto[]>([]);
  protected readonly currentUserId = signal<number | null>(null);

  ngOnInit(): void { this.loadLookups(); }

  loadLookups(): void {
    this.loading.set(true); this.errorMessage.set('');
    forkJoin({ products: this.productService.listar(), user: this.auth.getCurrentUser() })
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ products, user }) => {
          this.products.set(products);
          const id = user?.id;
          if (!Number.isSafeInteger(id) || (id ?? 0) <= 0) {
            this.errorMessage.set('No se pudo identificar tu usuario para registrar el movimiento. Cierra sesión e inicia nuevamente.');
            return;
          }
          this.currentUserId.set(id!);
        },
        error: (error: unknown) => this.errorMessage.set(userErrorMessage(error)),
      });
  }

  async save(request: MovimientoCreateRequest): Promise<void> {
    const quantityLabel = request.tipoMovimiento === TipoMovimiento.AJUSTE ? `Stock final: ${request.cantidad}` : `Cantidad: ${request.cantidad}`;
    const result = await Swal.fire({ title: '¿Deseas registrar este movimiento?', text: `${request.tipoMovimiento.toLocaleUpperCase()} · ${this.productLabel(request.productoId)} · ${quantityLabel}`, icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, registrar', cancelButtonText: 'Cancelar', confirmButtonColor: '#2f684f', cancelButtonColor: '#edf1ee', reverseButtons: true });
    if (!result.isConfirmed) return;
    this.saving.set(true);
    this.movementService.registrar(request).pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => { void Swal.fire({ title: 'Movimiento registrado correctamente.', text: this.successText(response), icon: 'success', confirmButtonColor: '#2f684f' }).then(() => this.back()); },
      error: (error: unknown) => { void Swal.fire({ title: 'No se pudo registrar el movimiento.', text: movimientoErrorMessage(error, 'registrar'), icon: 'error', confirmButtonColor: '#2f684f' }); },
    });
  }

  back(): void { void this.router.navigate(['/movimientos-inventario']); }
  private productLabel(id: number): string { const product = this.products().find((item) => item.id === id); return product ? `${product.sku} - ${product.nombre}` : `Producto #${id}`; }
  private successText(response: MovimientoCreateResponse): string { return `${response.mensaje} Stock: ${response.stockAnterior} → ${response.stockNuevo}.`; }
}
