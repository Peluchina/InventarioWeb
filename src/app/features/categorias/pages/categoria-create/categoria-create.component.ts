import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { userErrorMessage } from '../../../../core/interceptors/http-error.interceptor';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CategoriaFormComponent } from '../../components/categoria-form/categoria-form.component';
import { CrearCategoria } from '../../models/categoria-create-request.model';
import { CategoriaService } from '../../services/categoria.service';

@Component({
  selector: 'app-categoria-create',
  standalone: true,
  imports: [PageHeaderComponent, CategoriaFormComponent, MatButtonModule, MatIconModule],
  template: `
    <app-page-header title="Nueva categoría" subtitle="Registra una categoría para organizar tu catálogo." eyebrow="Inventario / Categorías" />
    <button mat-button class="back-link" type="button" (click)="back()"><mat-icon>arrow_back</mat-icon>Volver al directorio</button>
    <section class="form-panel">
      <app-categoria-form
        mode="crear"
        [saving]="saving()"
        submitLabel="Crear categoría"
        (submitted)="save($event)"
        (cancel)="back()"
      />
    </section>
  `,
  styles: [`
    .form-panel{max-width:800px}
    .back-link{margin:-13px 0 15px -8px;color:#668076;font-size:11px}
    .back-link mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}
  `],
})
export class CategoriaCreateComponent {
  private readonly service = inject(CategoriaService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly saving = signal(false);

  save(data: CrearCategoria): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.service.crear(data)
      .pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          void Swal.fire({
            title: 'Categoría creada',
            text: 'La categoría se registró correctamente.',
            icon: 'success',
            confirmButtonColor: '#2f684f',
          }).then(() => this.back());
        },
        error: (error: unknown) => {
          void Swal.fire({
            title: 'No se pudo guardar',
            text: userErrorMessage(error),
            icon: 'error',
            confirmButtonColor: '#2f684f',
          });
        },
      });
  }

  back(): void {
    void this.router.navigate(['/categorias']);
  }
}
