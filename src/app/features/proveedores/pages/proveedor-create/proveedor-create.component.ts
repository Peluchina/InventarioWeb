import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { userErrorMessage } from '../../../../core/interceptors/http-error.interceptor';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ProveedorFormComponent } from '../../components/proveedor-form/proveedor-form.component';
import { ProveedorCreateRequest } from '../../models/proveedor-create-request.model';
import { ProveedoresService } from '../../services/proveedores.service';

@Component({ selector: 'app-proveedor-create', standalone: true, imports: [PageHeaderComponent, ProveedorFormComponent, MatButtonModule, MatIconModule], template: `
  <app-page-header title="Nuevo proveedor" subtitle="Registra un nuevo aliado para tu operación." eyebrow="Administración / Proveedores" />
  <button mat-button class="back-link" (click)="back()"><mat-icon>arrow_back</mat-icon>Volver al directorio</button>
  <section class="form-panel"><app-proveedor-form [saving]="saving()" submitLabel="Guardar proveedor" (submitted)="save($event)" (cancel)="back()" /></section>
  `, styles: [`.form-panel{max-width:800px;background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}.back-link{margin:-13px 0 15px -8px;color:#668076;font-size:11px}.back-link mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}`] })
export class ProveedorCreateComponent {
  private readonly service = inject(ProveedoresService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly saving = signal(false);

  save(request: ProveedorCreateRequest): void {
    this.saving.set(true);
    this.service.crear(request).pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void Swal.fire({ title: 'Proveedor creado', text: 'El proveedor se registró correctamente.', icon: 'success', confirmButtonColor: '#2f684f' }).then(() => this.back()); },
      error: (error: unknown) => { void Swal.fire({ title: 'No se pudo guardar', text: userErrorMessage(error), icon: 'error', confirmButtonColor: '#2f684f' }); },
    });
  }

  back(): void { void this.router.navigate(['/proveedores']); }
}
