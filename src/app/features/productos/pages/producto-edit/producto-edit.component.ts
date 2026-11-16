import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { userErrorMessage } from '../../../../core/interceptors/http-error.interceptor';
import { Categoria } from '../../../categorias/models/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria.service';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ProductoUpdateRequest } from '../../models/producto-update-request.model';
import { ProductoDetalle } from '../../models/producto.model';
import { ProductosService } from '../../services/productos.service';
import { ProductoFormComponent } from '../../components/producto-form/producto-form.component';

@Component({
  selector: 'app-producto-edit',
  standalone: true,
  imports: [PageHeaderComponent, LoadingComponent, ProductoFormComponent, MatButtonModule, MatIconModule],
  template: `
    <app-page-header title="Editar producto" subtitle="Actualiza los datos del producto." eyebrow="Inventario / Productos" />
    <button mat-button class="back-link" (click)="back()"><mat-icon>arrow_back</mat-icon>Volver al listado</button>
    @if (loading()) { <section class="form-panel"><app-loading message="Cargando información del producto…" /></section> }
    @else if (errorMessage()) { <section class="load-error" role="alert"><mat-icon>error_outline</mat-icon><p>{{ errorMessage() }}</p><button mat-button (click)="load()">Reintentar</button></section> }
    @else if (product()) { <section class="form-panel"><app-producto-form [producto]="product()" [categories]="categories()" [categoriesLoading]="categoriesLoading()" [categoryError]="categoryError()" [saving]="saving()" submitLabel="Guardar cambios" (updated)="save($event)" (cancel)="back()" (retryCategories)="loadCategories()" /></section> }
  `,
  styles: [`.form-panel{max-width:900px;background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}.back-link{margin:-13px 0 15px -8px;color:#668076;font-size:11px}.back-link mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}.load-error{max-width:900px;padding:28px;background:#fff7f4;border:1px solid #f3e4de;border-radius:12px;color:#995741;display:flex;align-items:center;gap:12px}.load-error p{flex:1;font-size:12px}`],
})
export class ProductoEditComponent implements OnInit {
  private readonly service = inject(ProductosService);
  private readonly categoriesService = inject(CategoriaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly loading = signal(true);
  protected readonly categoriesLoading = signal(true);
  protected readonly categoryError = signal('');
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly categories = signal<Categoria[]>([]);
  protected readonly product = signal<ProductoDetalle | null>(null);
  private id = 0;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(this.id) || this.id <= 0) { this.errorMessage.set('El identificador del producto no es válido.'); this.loading.set(false); return; }
    this.load();
  }

  load(): void {
    this.loading.set(true); this.categoriesLoading.set(true); this.errorMessage.set(''); this.categoryError.set('');
    forkJoin({ product: this.service.obtenerPorId(this.id), categories: this.categoriesService.listar().pipe(catchError((error: unknown) => { this.categoryError.set(userErrorMessage(error)); return of([] as Categoria[]); })) })
      .pipe(finalize(() => { this.loading.set(false); this.categoriesLoading.set(false); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ product, categories }) => {
          this.product.set(product);
          const currentCategory: Categoria = { id: product.categoriaId, nombre: product.categoria, descripcion: '' };
          this.categories.set(categories.some((category) => category.id === currentCategory.id) ? categories : [...categories, currentCategory]);
        },
        error: (error: unknown) => this.errorMessage.set(userErrorMessage(error)),
      });
  }

  loadCategories(): void {
    this.categoriesLoading.set(true); this.categoryError.set('');
    this.categoriesService.listar().pipe(finalize(() => this.categoriesLoading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => { const current = this.product(); this.categories.set(current && !items.some((category) => category.id === current.categoriaId) ? [...items, { id: current.categoriaId, nombre: current.categoria, descripcion: '' }] : items); },
      error: (error: unknown) => this.categoryError.set(userErrorMessage(error)),
    });
  }

  save(request: ProductoUpdateRequest): void {
    this.saving.set(true);
    this.service.actualizar(this.id, request).pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void Swal.fire({ title: 'Cambios guardados', text: 'El producto se actualizó correctamente.', icon: 'success', confirmButtonColor: '#2f684f' }).then(() => this.back()); },
      error: (error: unknown) => { void Swal.fire({ title: 'No se pudieron guardar los cambios', text: userErrorMessage(error), icon: 'error', confirmButtonColor: '#2f684f' }); },
    });
  }

  back(): void { void this.router.navigate(['/productos']); }
}
