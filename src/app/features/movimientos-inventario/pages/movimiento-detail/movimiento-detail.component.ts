import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { MovimientoInventario } from '../../models/movimiento-inventario.model';
import { TipoMovimiento } from '../../models/tipo-movimiento.enum';
import { MovimientosInventarioService } from '../../services/movimientos-inventario.service';
import { movimientoErrorMessage } from '../../utils/movimiento-error-message';

@Component({
  selector: 'app-movimiento-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent, PageHeaderComponent, MatButtonModule, MatIconModule],
  template: `
    <app-page-header title="Detalle del movimiento" subtitle="Consulta los datos registrados y el cambio de existencias." eyebrow="Inventario / Movimientos" />
    <button mat-button class="back-link" (click)="back()"><mat-icon>arrow_back</mat-icon>Volver al historial</button>
    @if (loading()) { <section class="detail-panel"><app-loading message="Cargando movimiento…" /></section> }
    @else if (errorMessage()) { <section class="load-error" role="alert"><mat-icon>error_outline</mat-icon><p>{{ errorMessage() }}</p><button mat-button (click)="load()">Reintentar</button></section> }
    @else if (movement()) {
      <section class="detail-panel">
        <header class="detail-heading"><div><span class="movement-id">MOVIMIENTO #{{ movement()!.id }}</span><h2>{{ movement()!.producto }}</h2><p>{{ movement()!.sku }}</p></div><span class="movement-chip" [class.entrada]="typeClass(movement()!.tipoMovimiento) === 'entrada'" [class.salida]="typeClass(movement()!.tipoMovimiento) === 'salida'" [class.ajuste]="typeClass(movement()!.tipoMovimiento) === 'ajuste'">{{ movement()!.tipoMovimiento | uppercase }}</span></header>
        <div class="stock-flow"><div><small>STOCK ANTERIOR</small><strong>{{ movement()!.stockAnterior }}</strong></div><mat-icon>east</mat-icon><div><small>STOCK NUEVO</small><strong>{{ movement()!.stockNuevo }}</strong></div><span class="quantity">{{ movement()!.tipoMovimiento === TipoMovimiento.AJUSTE ? 'Nuevo stock' : 'Cantidad' }}: {{ movement()!.cantidad }}</span></div>
        <div class="detail-grid"><article><small>Usuario</small><strong>{{ movement()!.usuario || 'Usuario no disponible' }}</strong></article><article><small>Referencia</small><strong>{{ movement()!.referencia || 'Sin referencia' }}</strong></article><article><small>Fecha del movimiento</small><strong>{{ movement()!.createdAt ? (movement()!.createdAt | date:'dd/MM/yyyy') : '—' }} {{ movement()!.fecha || '' }}</strong></article><article><small>Fecha de creación</small><strong>{{ movement()!.createdAt ? (movement()!.createdAt | date:'dd/MM/yyyy HH:mm:ss') : '—' }}</strong></article><article><small>Fecha de actualización</small><strong>{{ movement()!.updateAt ? (movement()!.updateAt | date:'dd/MM/yyyy HH:mm:ss') : '—' }}</strong></article></div>
        <footer class="detail-footer"><a mat-stroked-button [routerLink]="['/movimientos-inventario/producto', movement()!.productoId]"><mat-icon>history</mat-icon>Historial de este producto</a></footer>
      </section>
    }
  `,
  styles: [`
    :host{display:block}.detail-panel{max-width:900px;background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}.back-link{margin:-13px 0 15px -8px;color:#668076;font-size:11px}.back-link mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}.detail-heading{padding:24px 28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #edf1ee}.movement-id{font-size:9px;font-weight:700;letter-spacing:.09em;color:#8a9a91}.detail-heading h2{margin:8px 0 4px;font-size:20px;color:#2e4b3f}.detail-heading p{margin:0;color:#899890;font-size:11px}.movement-chip{display:inline-flex;align-items:center;padding:7px 11px;border-radius:999px;font-size:9px;font-weight:700;letter-spacing:.06em}.movement-chip.entrada{background:#e8f4ed;color:#397554}.movement-chip.salida{background:#fff0e9;color:#b46a4c}.movement-chip.ajuste{background:#eef1f7;color:#66789e}.stock-flow{display:flex;align-items:center;gap:20px;padding:25px 28px;background:#fafbf9}.stock-flow div{display:flex;flex-direction:column;gap:7px}.stock-flow small,.detail-grid small{color:#91a098;font-size:9px;font-weight:700;letter-spacing:.06em}.stock-flow strong{font-size:25px;color:#2e4d40}.stock-flow>mat-icon{color:#91a098}.quantity{margin-left:auto;color:#638073;font-size:12px;font-weight:600}.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;padding:4px 28px}.detail-grid article{display:flex;flex-direction:column;gap:8px;padding:17px 0;border-bottom:1px solid #eff2ef}.detail-grid strong{color:#3d584b;font-size:12px;font-weight:600}.detail-footer{padding:18px 28px 24px;display:flex;justify-content:flex-end}.detail-footer a{border-color:#dfe8e2;color:#527365;font-size:11px}.detail-footer mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}.load-error{max-width:900px;padding:28px;background:#fff7f4;border:1px solid #f3e4de;border-radius:12px;color:#995741;display:flex;align-items:center;gap:12px}.load-error p{flex:1;font-size:12px}@media(max-width:620px){.detail-heading{padding:20px 18px;align-items:flex-start}.detail-heading h2{font-size:16px}.stock-flow{padding:20px 18px;gap:12px;flex-wrap:wrap}.stock-flow strong{font-size:21px}.quantity{width:100%;margin:0}.detail-grid{grid-template-columns:1fr;padding:4px 18px}.detail-footer{padding:16px 18px;justify-content:stretch}.detail-footer a{width:100%}}
  `],
})
export class MovimientoDetailComponent implements OnInit {
  private readonly service = inject(MovimientosInventarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly TipoMovimiento = TipoMovimiento;
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly movement = signal<MovimientoInventario | null>(null);
  private id = 0;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(this.id) || this.id <= 0) { this.errorMessage.set('El identificador del movimiento no es válido.'); this.loading.set(false); return; }
    this.load();
  }

  load(): void {
    this.loading.set(true); this.errorMessage.set('');
    this.service.obtenerPorId(this.id).pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (item) => this.movement.set(item),
      error: (error: unknown) => this.errorMessage.set(movimientoErrorMessage(error)),
    });
  }

  back(): void { void this.router.navigate(['/movimientos-inventario']); }
  protected typeClass(type: string): string { return type === TipoMovimiento.ENTRADA ? 'entrada' : type === TipoMovimiento.SALIDA ? 'salida' : type === TipoMovimiento.AJUSTE ? 'ajuste' : ''; }
}
