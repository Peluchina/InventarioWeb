import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { userErrorMessage } from '../../../../core/interceptors/http-error.interceptor';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { AlmacenFormComponent } from '../../components/almacen-form/almacen-form.component';
import { CrearAlmacen } from '../../models/almacen-create-request.model';
import { Almacen } from '../../models/almacen.model';
import { AlmacenService } from '../../services/almacen.service';

@Component({
  selector: 'app-almacen-edit',
  standalone: true,
  imports: [PageHeaderComponent, LoadingComponent, AlmacenFormComponent, MatButtonModule, MatIconModule],
  template: `
    <app-page-header title="Editar almacén" subtitle="Actualiza el nombre o la ubicación del almacén." eyebrow="Inventario / Almacenes" />
    <button mat-button class="back-link" (click)="back()"><mat-icon>arrow_back</mat-icon>Volver al directorio</button>
    @if (loading()) { <app-loading message="Cargando almacén…" /> }
    @if (errorMessage()) { <div class="error-banner" role="alert"><mat-icon>error_outline</mat-icon><span>{{ errorMessage() }}</span><button mat-button (click)="load()">Reintentar</button></div> }
    @if (almacen(); as item) { <section class="form-panel"><app-almacen-form [almacen]="item" [saving]="saving()" submitLabel="Guardar cambios" (submitted)="save($event)" (cancel)="back()" /></section> }
  `,
  styles: [`.form-panel{max-width:800px;background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}.back-link{margin:-13px 0 15px -8px;color:#668076;font-size:11px}.back-link mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}.error-banner{max-width:800px;padding:12px 14px;background:#fff5f2;color:#9d5340;border-radius:8px;display:flex;align-items:center;gap:10px;font-size:11px;box-sizing:border-box}.error-banner span{flex:1}`],
})
export class AlmacenEditComponent {
  private readonly service = inject(AlmacenService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly almacen = signal<Almacen | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  private id: number | null = null;

  constructor() {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = rawId === null ? Number.NaN : Number(rawId);
    if (!Number.isInteger(id) || id < 1) {
      this.errorMessage.set('El identificador del almacén no es válido.');
      return;
    }
    this.id = id;
    this.load();
  }

  load(): void {
    if (this.id === null) return;
    this.loading.set(true); this.errorMessage.set('');
    this.service.obtenerPorId(this.id).pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (item) => this.almacen.set(item),
      error: (error: unknown) => { this.almacen.set(null); this.errorMessage.set(userErrorMessage(error)); },
    });
  }

  save(data: CrearAlmacen): void {
    if (this.id === null || this.saving()) return;
    this.saving.set(true);
    this.service.actualizar(this.id, data).pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void Swal.fire({ title: 'Almacén actualizado', text: 'Los cambios se guardaron correctamente.', icon: 'success', confirmButtonColor: '#2f684f' }).then(() => this.back()); },
      error: (error: unknown) => { void Swal.fire({ title: 'No se pudo actualizar', text: userErrorMessage(error), icon: 'error', confirmButtonColor: '#2f684f' }); },
    });
  }

  back(): void { void this.router.navigate(['/almacenes']); }
}
