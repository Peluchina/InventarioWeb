import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { userErrorMessage } from '../../../../core/interceptors/http-error.interceptor';
import { Categoria } from '../../../categorias/models/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ProductoCreateRequest } from '../../models/producto-create-request.model';
import { ProductosService } from '../../services/productos.service';
import { ProductoFormComponent } from '../../components/producto-form/producto-form.component';

@Component({
  selector: 'app-producto-create',
  standalone: true,
  imports: [PageHeaderComponent, ProductoFormComponent, MatButtonModule, MatIconModule],
  template: `
    <app-page-header title="Nuevo producto" subtitle="Registra un artículo para controlar su precio y existencias." eyebrow="Inventario / Productos" />
    <button mat-button class="back-link" (click)="back()"><mat-icon>arrow_back</mat-icon>Volver al listado</button>
    <section class="form-panel"><app-producto-form [categories]="categories()" [categoriesLoading]="categoriesLoading()" [categoryError]="categoryError()" [saving]="saving()" submitLabel="Guardar producto" (submitted)="save($event)" (cancel)="back()" (retryCategories)="loadCategories()" /></section>
  `,
  styles: [`.form-panel{max-width:900px;background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}.back-link{margin:-13px 0 15px -8px;color:#668076;font-size:11px}.back-link mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}`],
})
export class ProductoCreateComponent implements OnInit {
  private readonly service = inject(ProductosService);
  private readonly categoriesService = inject(CategoriaService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly categories = signal<Categoria[]>([]);
  protected readonly categoriesLoading = signal(true);
  protected readonly categoryError = signal('');
  protected readonly saving = signal(false);

  ngOnInit(): void { this.loadCategories(); }

  loadCategories(): void {
    this.categoriesLoading.set(true); this.categoryError.set('');
    this.categoriesService.listar().pipe(catchError((error: unknown) => { this.categoryError.set(userErrorMessage(error)); return of([] as Categoria[]); }), finalize(() => this.categoriesLoading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe((items) => this.categories.set(items));
  }

  save(request: ProductoCreateRequest): void {
    this.saving.set(true);
    this.service.crear(request).pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void Swal.fire({ title: 'Producto creado', text: 'El producto se registró correctamente.', icon: 'success', confirmButtonColor: '#2f684f' }).then(() => this.back()); },
      error: (error: unknown) => { void Swal.fire({ title: 'No se pudo guardar', text: userErrorMessage(error), icon: 'error', confirmButtonColor: '#2f684f' }); },
    });
  }

  back(): void { void this.router.navigate(['/productos']); }
}
