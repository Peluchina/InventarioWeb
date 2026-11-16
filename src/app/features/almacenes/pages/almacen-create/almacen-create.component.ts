import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { userErrorMessage } from '../../../../core/interceptors/http-error.interceptor';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { AlmacenFormComponent } from '../../components/almacen-form/almacen-form.component';
import { CrearAlmacen } from '../../models/almacen-create-request.model';
import { AlmacenService } from '../../services/almacen.service';

@Component({
  selector: 'app-almacen-create',
  standalone: true,
  imports: [PageHeaderComponent, AlmacenFormComponent, MatButtonModule, MatIconModule],
  template: `
    <app-page-header title="Nuevo almacén" subtitle="Registra una ubicación para organizar tu inventario." eyebrow="Inventario / Almacenes" />
    <button mat-button class="back-link" (click)="back()"><mat-icon>arrow_back</mat-icon>Volver al directorio</button>
    <section class="form-panel"><app-almacen-form [saving]="saving()" submitLabel="Crear almacén" (submitted)="save($event)" (cancel)="back()" /></section>
  `,
  styles: [`.form-panel{max-width:800px;background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}.back-link{margin:-13px 0 15px -8px;color:#668076;font-size:11px}.back-link mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}`],
})
export class AlmacenCreateComponent {
  private readonly service = inject(AlmacenService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly saving = signal(false);

  save(data: CrearAlmacen): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.service.crear(data).pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void Swal.fire({ title: 'Almacén creado', text: 'El almacén se registró correctamente.', icon: 'success', confirmButtonColor: '#2f684f' }).then(() => this.back()); },
      error: (error: unknown) => { void Swal.fire({ title: 'No se pudo guardar', text: userErrorMessage(error), icon: 'error', confirmButtonColor: '#2f684f' }); },
    });
  }

  back(): void { void this.router.navigate(['/almacenes']); }
}
