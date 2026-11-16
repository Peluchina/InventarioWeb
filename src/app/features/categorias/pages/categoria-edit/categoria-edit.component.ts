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
import { CategoriaFormComponent } from '../../components/categoria-form/categoria-form.component';
import { ActualizarCategoria } from '../../models/categoria-update-request.model';
import { Categoria } from '../../models/categoria.model';
import { CategoriaService } from '../../services/categoria.service';

@Component({
  selector: 'app-categoria-edit',
  standalone: true,
  imports: [PageHeaderComponent, LoadingComponent, CategoriaFormComponent, MatButtonModule, MatIconModule],
  template: `
    <app-page-header title="Editar categoría" subtitle="Actualiza el nombre o la descripción de la categoría." eyebrow="Inventario / Categorías" />
    <button mat-button class="back-link" type="button" (click)="back()"><mat-icon>arrow_back</mat-icon>Volver al directorio</button>

    @if (loading()) {
      <section class="form-panel"><app-loading message="Cargando categoría…" /></section>
    } @else if (errorMessage()) {
      <section class="load-error" role="alert">
        <mat-icon>error_outline</mat-icon>
        <p>{{ errorMessage() }}</p>
        <button mat-button type="button" (click)="load()">Reintentar</button>
      </section>
    } @else if (categoria(); as item) {
      <section class="form-panel">
        <app-categoria-form
          mode="editar"
          [categoria]="item"
          [saving]="saving()"
          submitLabel="Guardar cambios"
          (submitted)="save($event)"
          (cancel)="back()"
        />
      </section>
    }
  `,
  styles: [`
    .form-panel{max-width:800px}
    .back-link{margin:-13px 0 15px -8px;color:#668076;font-size:11px}
    .back-link mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}
    .load-error{max-width:800px;padding:28px;background:#fff7f4;border:1px solid #f3e4de;border-radius:12px;color:#995741;display:flex;align-items:center;gap:12px}
    .load-error p{flex:1;font-size:12px}
  `],
})
export class CategoriaEditComponent {
  private readonly service = inject(CategoriaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly categoria = signal<Categoria | null>(null);
  private id: number | null = null;

  constructor() {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = rawId === null ? Number.NaN : Number(rawId);
    if (!Number.isInteger(id) || id < 1) {
      this.errorMessage.set('El identificador de la categoría no es válido.');
      this.loading.set(false);
      return;
    }
    this.id = id;
    this.load();
  }

  load(): void {
    if (this.id === null) return;
    this.loading.set(true);
    this.errorMessage.set('');
    this.service.obtenerPorId(this.id)
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categoria) => this.categoria.set(categoria),
        error: (error: unknown) => {
          this.categoria.set(null);
          this.errorMessage.set(userErrorMessage(error));
        },
      });
  }

  save(data: ActualizarCategoria): void {
    if (this.id === null || this.saving()) return;
    this.saving.set(true);
    this.service.actualizar(this.id, data)
      .pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          void Swal.fire({
            title: 'Categoría actualizada',
            text: 'Los cambios se guardaron correctamente.',
            icon: 'success',
            confirmButtonColor: '#2f684f',
          }).then(() => this.back());
        },
        error: (error: unknown) => {
          void Swal.fire({
            title: 'No se pudo actualizar',
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
