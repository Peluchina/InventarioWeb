import { Component, DestroyRef, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/auth/auth.service';
import { AppHttpError, userErrorMessage } from '../../../../core/interceptors/http-error.interceptor';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Categoria } from '../../models/categoria.model';
import { CategoriaService } from '../../services/categoria.service';

@Component({
  selector: 'app-categorias-list',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, LoadingComponent, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSortModule, MatTableModule, MatTooltipModule],
  template: `
    <app-page-header
      title="Categorías"
      subtitle="Organiza los productos en categorías para mantener tu catálogo ordenado."
      eyebrow="Inventario / Catálogo"
    >
      <button mat-flat-button color="primary" routerLink="nuevo" [hidden]="!auth.hasRole('ADMINISTRADOR')" [disabled]="busyId() !== null">
        <mat-icon>add</mat-icon>Nueva categoría
      </button>
    </app-page-header>

    <section class="panel" aria-labelledby="categories-title">
      <div class="panel-heading">
        <div>
          <h2 id="categories-title">Directorio de categorías</h2>
          <p>Consulta y gestiona las categorías registradas.</p>
        </div>
        <mat-form-field appearance="outline" class="search">
          <mat-icon matPrefix>search</mat-icon>
          <mat-label>Buscar categoría</mat-label>
          <input matInput (input)="filtrar($event)" placeholder="Nombre o descripción">
        </mat-form-field>
      </div>

      @if (errorMessage()) {
        <div class="error-banner" role="alert">
          <mat-icon>error_outline</mat-icon>
          <span>{{ errorMessage() }}</span>
          <button type="button" (click)="load()">Reintentar</button>
        </div>
      }

      @if (loading()) {
        <app-loading message="Cargando categorías…" />
      } @else {
        <div class="table-wrap">
          <table mat-table [dataSource]="dataSource" matSort aria-label="Lista de categorías">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
              <td mat-cell *matCellDef="let categoria"><span class="id-tag">#{{ categoria.id }}</span></td>
            </ng-container>

            <ng-container matColumnDef="nombre">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>NOMBRE</th>
              <td mat-cell *matCellDef="let categoria"><span class="category-name">{{ categoria.nombre }}</span></td>
            </ng-container>

            <ng-container matColumnDef="descripcion">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>DESCRIPCIÓN</th>
              <td mat-cell *matCellDef="let categoria" class="description">{{ categoria.descripcion || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="acciones">
              <th mat-header-cell *matHeaderCellDef><span class="sr-only">Acciones</span></th>
              <td mat-cell *matCellDef="let categoria">
                <div class="row-actions">
                  <button
                    mat-icon-button
                    [hidden]="!auth.hasRole('ADMINISTRADOR')"
                    [routerLink]="['editar', categoria.id]"
                    matTooltip="Editar"
                    [attr.aria-label]="'Editar categoría ' + categoria.nombre"
                    [disabled]="busyId() !== null"
                  ><mat-icon>edit</mat-icon></button>
                  <button
                    mat-icon-button
                    class="delete-action"
                    [hidden]="!auth.hasRole('ADMINISTRADOR')"
                    (click)="eliminar(categoria)"
                    matTooltip="Eliminar"
                    [attr.aria-label]="'Eliminar categoría ' + categoria.nombre"
                    [disabled]="busyId() !== null"
                  ><mat-icon>delete_outline</mat-icon></button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            <tr class="mat-mdc-row" *matNoDataRow>
              <td class="mat-mdc-cell no-data" [attr.colspan]="displayedColumns.length">
                <mat-icon>category</mat-icon>
                <strong>{{ dataSource.filter ? 'No encontramos resultados' : 'Aún no hay categorías' }}</strong>
                <span>{{ dataSource.filter ? 'Prueba con otra búsqueda.' : 'Las categorías registradas aparecerán aquí.' }}</span>
              </td>
            </tr>
          </table>
        </div>
        <mat-paginator [pageSizeOptions]="[5, 10, 25]" [pageSize]="10" showFirstLastButtons aria-label="Paginación de categorías" />
      }
    </section>
  `,
  styles: [`
    :host{display:block}
    .panel{background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}
    .panel-heading{display:flex;align-items:center;justify-content:space-between;padding:22px 24px 16px;gap:18px}
    .panel-heading h2{margin:0 0 6px;color:#2d493e;font-size:15px}
    .panel-heading p{margin:0;color:#92a098;font-size:10px}
    .search{width:270px}
    .search mat-icon{color:#91a099;margin-right:8px}
    .table-wrap{overflow:auto}
    mat-paginator{border-top:1px solid #edf1ee}
    table{width:100%;min-width:580px}
    .mat-mdc-header-row{height:43px;background:#f8faf8}
    .mat-mdc-header-cell{font-size:9px;font-weight:700;color:#9aa7a1;letter-spacing:.08em;border-bottom:1px solid #edf1ee}
    .mat-mdc-cell{font-size:11px;color:#66786f;border-bottom-color:#f0f3f1;padding-top:12px;padding-bottom:12px}
    .id-tag{color:#83948b;font-size:10px;font-weight:600}
    .category-name{color:#2d493e;font-size:11px;font-weight:700}
    .description{max-width:520px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .row-actions{display:flex;justify-content:flex-end}
    .row-actions button{width:32px;height:32px;color:#72857b}
    .row-actions .delete-action{color:#b07869}
    .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
    .no-data{height:175px;text-align:center;color:#87968f}
    .no-data mat-icon,.no-data strong,.no-data span{display:block;margin-left:auto;margin-right:auto}
    .no-data mat-icon{color:#90a69a}
    .no-data strong{color:#456256;margin-top:8px;margin-bottom:5px}
    .no-data span{font-size:11px}
    .error-banner{margin:12px 20px;padding:12px 14px;background:#fff5f2;color:#9d5340;border-radius:8px;display:flex;align-items:center;gap:10px;font-size:11px}
    .error-banner span{flex:1}
    .error-banner button{border:0;background:transparent;color:inherit;text-decoration:underline;cursor:pointer;font:inherit}
    @media(max-width:700px){.panel-heading{align-items:flex-start;flex-direction:column}.search{width:100%}}
  `],
})
export class CategoriasListComponent {
  private readonly service = inject(CategoriaService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);
  protected readonly displayedColumns = ['id', 'nombre', 'descripcion', 'acciones'];
  protected readonly dataSource = new MatTableDataSource<Categoria>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly busyId = signal<number | null>(null);

  @ViewChild(MatSort) set sort(sort: MatSort | undefined) {
    if (sort) this.dataSource.sort = sort;
  }

  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator | undefined) {
    if (paginator) this.dataSource.paginator = paginator;
  }

  constructor() {
    this.dataSource.filterPredicate = (categoria, filter) =>
      `${categoria.nombre} ${categoria.descripcion ?? ''}`.toLocaleLowerCase().includes(filter);
    this.load();
  }

  filtrar(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLocaleLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.service.listar()
      .pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.dataSource.data = items;
        },
        error: (error: unknown) => this.errorMessage.set(userErrorMessage(error)),
      });
  }

  async eliminar(categoria: Categoria): Promise<void> {
    if (this.busyId() !== null) return;
    this.busyId.set(categoria.id);

    const confirmation = await Swal.fire({
      title: '¿Eliminar categoría?',
      text: `¿Estás seguro de eliminar la categoría "${categoria.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b85b4c',
      cancelButtonColor: '#edf1ee',
      reverseButtons: true,
    });

    if (!confirmation.isConfirmed) {
      this.busyId.set(null);
      return;
    }

    this.service.eliminar(categoria.id)
      .pipe(finalize(() => this.busyId.set(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          void Swal.fire({
            title: 'Categoría eliminada',
            text: 'La categoría se eliminó correctamente.',
            icon: 'success',
            confirmButtonColor: '#2f684f',
            timer: 1500,
            showConfirmButton: false,
          });
          this.load();
        },
        error: (error: unknown) => {
          const message = error instanceof AppHttpError && error.status === 409
            ? 'No se puede eliminar esta categoría porque está siendo utilizada por uno o más productos.'
            : userErrorMessage(error);
          void Swal.fire({
            title: 'No se pudo eliminar',
            text: message,
            icon: 'error',
            confirmButtonColor: '#2f684f',
          });
        },
      });
  }
}


