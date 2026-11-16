import { AfterViewInit, Component, DestroyRef, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/auth/auth.service';
import { AppHttpError, userErrorMessage } from '../../../../core/interceptors/http-error.interceptor';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EstadoAlmacen } from '../../models/almacen-status.enum';
import { Almacen } from '../../models/almacen.model';
import { AlmacenService } from '../../services/almacen.service';

@Component({
  selector: 'app-almacenes-list',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, LoadingComponent, StatusBadgeComponent, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSortModule, MatTableModule, MatTooltipModule],
  template: `
    <app-page-header title="Almacenes" subtitle="Administra las ubicaciones de almacenamiento de tu inventario." eyebrow="Inventario / Almacenes">
      <button mat-flat-button color="primary" routerLink="nuevo" [hidden]="!auth.hasRole('ADMINISTRADOR')"><mat-icon>add</mat-icon>Nuevo almacén</button>
    </app-page-header>
    <section class="summary-row" aria-label="Resumen de almacenes">
      <article class="summary-card"><span class="summary-icon green"><mat-icon>warehouse</mat-icon></span><div><small>Total de almacenes</small><strong>{{ dataSource.data.length }}</strong></div><span class="summary-foot">REGISTROS</span></article>
      <article class="summary-card"><span class="summary-icon mint"><mat-icon>check_circle</mat-icon></span><div><small>Almacenes activos</small><strong>{{ activeCount() }}</strong></div><span class="summary-foot positive">EN OPERACIÓN</span></article>
      @if (auth.hasRole('ADMINISTRADOR')) {
      <article class="summary-card"><span class="summary-icon sand"><mat-icon>pause_circle</mat-icon></span><div><small>Inactivos</small><strong>{{ inactiveCount() }}</strong></div><span class="summary-foot">PAUSADOS</span></article>
      }
    </section>
    <section class="panel">
      <div class="panel-heading"><div><h2>Directorio de almacenes</h2><p>Consulta y gestiona los almacenes registrados.</p></div><mat-form-field appearance="outline" class="search"><mat-icon matPrefix>search</mat-icon><mat-label>Buscar almacén</mat-label><input matInput (input)="filter($event)" placeholder="Nombre, ubicación o estado"></mat-form-field></div>
      @if (errorMessage()) { <div class="error-banner" role="alert"><mat-icon>error_outline</mat-icon><span>{{ errorMessage() }}</span><button mat-button (click)="load()">Reintentar</button></div> }
      @if (loading()) { <app-loading message="Cargando almacenes…" /> }
      <div class="table-wrap" [class.dimmed]="loading()">
        <table mat-table [dataSource]="dataSource" matSort aria-label="Lista de almacenes">
          <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th><td mat-cell *matCellDef="let item"><span class="id-tag">#{{ item.id }}</span></td></ng-container>
          <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef mat-sort-header>ALMACÉN</th><td mat-cell *matCellDef="let item"><span class="warehouse-name">{{ item.nombre }}</span></td></ng-container>
          <ng-container matColumnDef="ubicacion"><th mat-header-cell *matHeaderCellDef mat-sort-header>UBICACIÓN</th><td mat-cell *matCellDef="let item" class="location">{{ item.ubicacion }}</td></ng-container>
          <ng-container matColumnDef="estado"><th mat-header-cell *matHeaderCellDef>ESTADO</th><td mat-cell *matCellDef="let item"><app-status-badge [hidden]="item.estadoId !== EstadoAlmacen.ACTIVO && item.estadoId !== EstadoAlmacen.INACTIVO" [active]="item.estadoId === EstadoAlmacen.ACTIVO" /><span class="status-text" [hidden]="item.estadoId === EstadoAlmacen.ACTIVO || item.estadoId === EstadoAlmacen.INACTIVO">{{ statusLabel(item) }}</span></td></ng-container>
          <ng-container matColumnDef="acciones"><th mat-header-cell *matHeaderCellDef><span class="sr-only">Acciones</span></th><td mat-cell *matCellDef="let item"><div class="row-actions"><button mat-icon-button [hidden]="!auth.hasRole('ADMINISTRADOR')" [routerLink]="['editar', item.id]" matTooltip="Editar" [attr.aria-label]="'Editar almacén ' + item.nombre" [disabled]="busyId() !== null"><mat-icon>edit</mat-icon></button><button mat-icon-button [hidden]="!auth.hasRole('ADMINISTRADOR')" (click)="changeStatus(item)" [matTooltip]="item.estadoId === EstadoAlmacen.ACTIVO ? 'Desactivar' : 'Activar'" [attr.aria-label]="'Cambiar estado de ' + item.nombre" [disabled]="busyId() !== null"><mat-icon>{{ item.estadoId === EstadoAlmacen.ACTIVO ? 'pause_circle' : 'play_circle' }}</mat-icon></button><button mat-icon-button [hidden]="!auth.hasRole('ADMINISTRADOR')" class="delete-action" (click)="remove(item)" matTooltip="Eliminar" [attr.aria-label]="'Eliminar almacén ' + item.nombre" [disabled]="busyId() !== null"><mat-icon>delete_outline</mat-icon></button></div></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr><tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          <tr class="mat-mdc-row" *matNoDataRow><td class="mat-mdc-cell no-data" [attr.colspan]="displayedColumns.length"><span class="empty-icon"><mat-icon>warehouse</mat-icon></span><strong>{{ dataSource.filter ? 'No encontramos resultados' : 'Aún no hay almacenes' }}</strong><span>{{ dataSource.filter ? 'Prueba con otra búsqueda.' : 'Agrega tu primer almacén para comenzar.' }}</span></td></tr>
        </table>
      </div>
      <mat-paginator [pageSizeOptions]="[5, 10, 25]" [pageSize]="10" showFirstLastButtons aria-label="Paginación de almacenes" />
      <div class="mobile-list">
        @for (item of dataSource.filteredData; track item.id) {
          <article class="mobile-card"><div class="mobile-card-top"><div><strong>{{ item.nombre }}</strong><small>#{{ item.id }} · {{ item.ubicacion }}</small></div><app-status-badge [hidden]="item.estadoId !== EstadoAlmacen.ACTIVO && item.estadoId !== EstadoAlmacen.INACTIVO" [active]="item.estadoId === EstadoAlmacen.ACTIVO" /><span class="mobile-status" [hidden]="item.estadoId === EstadoAlmacen.ACTIVO || item.estadoId === EstadoAlmacen.INACTIVO">{{ statusLabel(item) }}</span></div><div class="mobile-actions"><button mat-button [hidden]="!auth.hasRole('ADMINISTRADOR')" [routerLink]="['editar', item.id]"><mat-icon>edit</mat-icon>Editar</button><button mat-button [hidden]="!auth.hasRole('ADMINISTRADOR')" (click)="changeStatus(item)"><mat-icon>sync</mat-icon>{{ item.estadoId === EstadoAlmacen.ACTIVO ? 'Desactivar' : 'Activar' }}</button><button mat-button [hidden]="!auth.hasRole('ADMINISTRADOR')" (click)="remove(item)"><mat-icon>delete_outline</mat-icon>Eliminar</button></div></article>
        }
      </div>
    </section>
  `,
  styles: [`
    :host{display:block}.summary-row{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:22px}.summary-card{min-height:94px;background:#fff;border:1px solid #eaf0ec;border-radius:12px;display:flex;align-items:center;gap:13px;padding:18px 20px;box-sizing:border-box}.summary-icon{width:39px;height:39px;border-radius:11px;display:grid;place-items:center}.summary-icon mat-icon{font-size:19px}.green{background:#edf5f0;color:#3d745c}.mint{background:#e8f4ef;color:#4d8a6c}.sand{background:#f7f1e8;color:#ad8953}.summary-card div{display:flex;flex-direction:column;gap:6px;flex:1}.summary-card small{font-size:10px;color:#84958d}.summary-card strong{font-size:22px;line-height:1;color:#23483b}.summary-foot{font-size:8px;color:#a1ada7;letter-spacing:.08em;font-weight:700}.positive{color:#5a9a75}.panel{background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}.panel-heading{display:flex;align-items:center;justify-content:space-between;padding:22px 24px 8px;gap:18px}.panel-heading h2{margin:0 0 6px;color:#2d493e;font-size:15px}.panel-heading p{margin:0;color:#92a098;font-size:10px}.search{width:270px}.search mat-icon{color:#91a099;margin-right:8px}.table-wrap{overflow:auto}table{width:100%;min-width:650px}.mat-mdc-header-row{height:43px;background:#f8faf8}.mat-mdc-header-cell{font-size:9px;font-weight:700;color:#9aa7a1;letter-spacing:.08em;border-bottom:1px solid #edf1ee}.mat-mdc-cell{font-size:10px;color:#66786f;border-bottom-color:#f0f3f1;padding-top:8px;padding-bottom:8px}.id-tag{color:#83948b;font-size:9px;font-weight:600}.warehouse-name{color:#2d493e;font-size:11px;font-weight:700}.location{max-width:340px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.status-text{font-size:9px;color:#71847a}.row-actions{display:flex;justify-content:flex-end}.row-actions button{width:31px;height:31px;color:#72857b}.row-actions .delete-action{color:#b07869}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.no-data{height:175px;text-align:center;color:#87968f}.no-data strong,.no-data span{display:block}.no-data strong{color:#456256;margin:5px}.no-data span{font-size:11px}.empty-icon{color:#90a69a}.error-banner{margin:12px 20px;padding:12px 14px;background:#fff5f2;color:#9d5340;border-radius:8px;display:flex;align-items:center;gap:10px;font-size:11px}.error-banner span{flex:1}.dimmed{opacity:.55}.mobile-list{display:none}.mobile-card{padding:16px;border-bottom:1px solid #edf1ee}.mobile-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}.mobile-card-top strong,.mobile-card-top small{display:block}.mobile-card-top strong{color:#2e4d40;font-size:12px}.mobile-card-top small{font-size:10px;color:#8b9a93;margin-top:5px}.mobile-status{color:#71847a;font-size:9px}.mobile-actions{display:flex;justify-content:space-between}.mobile-actions button{font-size:10px;padding:0 6px}.mobile-actions mat-icon{font-size:16px;width:16px;height:16px;margin-right:3px}mat-paginator{border-top:1px solid #edf1ee}@media(max-width:980px){.summary-foot{display:none}.location{max-width:220px}}@media(max-width:700px){.summary-row{gap:8px}.summary-card{padding:12px 10px;gap:8px;min-height:82px}.summary-icon{width:32px;height:32px}.summary-card small{font-size:9px}.summary-card strong{font-size:18px}.panel-heading{padding:18px 15px 8px;align-items:flex-start;flex-direction:column}.search{width:100%}.table-wrap,mat-paginator{display:none}.mobile-list{display:block}.error-banner{margin:10px 12px}}
  `],
})
export class AlmacenesListComponent implements AfterViewInit {
  private readonly service = inject(AlmacenService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly EstadoAlmacen = EstadoAlmacen;
  protected readonly displayedColumns = ['id', 'nombre', 'ubicacion', 'estado', 'acciones'];
  protected readonly auth = inject(AuthService);
  protected readonly dataSource = new MatTableDataSource<Almacen>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly busyId = signal<number | null>(null);
  @ViewChild(MatPaginator) private paginator!: MatPaginator;
  @ViewChild(MatSort) private sort!: MatSort;

  constructor() {
    this.dataSource.filterPredicate = (item, filter) => [item.nombre, item.ubicacion, this.statusLabel(item), String(item.id)].some((value) => value.toLocaleLowerCase().includes(filter));
    this.load();
  }

  ngAfterViewInit(): void { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; }
  activeCount(): number { return this.dataSource.data.filter((item) => item.estadoId === EstadoAlmacen.ACTIVO).length; }
  inactiveCount(): number { return this.dataSource.data.filter((item) => item.estadoId === EstadoAlmacen.INACTIVO).length; }
  statusLabel(item: Almacen): string { return item.estadoId === EstadoAlmacen.ACTIVO ? 'ACTIVO' : item.estadoId === EstadoAlmacen.INACTIVO ? 'INACTIVO' : `Estado #${item.estadoId}`; }
  filter(event: Event): void { this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLocaleLowerCase(); this.dataSource.paginator?.firstPage(); }

  load(): void {
    this.loading.set(true); this.errorMessage.set('');
    this.service.listar().pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => { this.dataSource.data = this.auth.hasRole('ADMINISTRADOR') ? items : items.filter((item) => item.estadoId !== EstadoAlmacen.INACTIVO); if (this.paginator) this.dataSource.paginator = this.paginator; if (this.sort) this.dataSource.sort = this.sort; },
      error: (error: unknown) => this.errorMessage.set(userErrorMessage(error)),
    });
  }

  async changeStatus(item: Almacen): Promise<void> {
    const nextStatus = item.estadoId === EstadoAlmacen.ACTIVO ? EstadoAlmacen.INACTIVO : EstadoAlmacen.ACTIVO;
    const activate = nextStatus === EstadoAlmacen.ACTIVO;
    const result = await Swal.fire({ title: `${activate ? 'Activar' : 'Desactivar'} almacén`, text: `¿Deseas ${activate ? 'activar' : 'desactivar'} el almacén "${item.nombre}"?`, icon: 'question', showCancelButton: true, confirmButtonText: activate ? 'Sí, activar' : 'Sí, desactivar', cancelButtonText: 'Cancelar', confirmButtonColor: '#2f684f', cancelButtonColor: '#edf1ee', reverseButtons: true });
    if (!result.isConfirmed) return;
    this.busyId.set(item.id);
    this.service.actualizarEstado(item.id, { estadoId: nextStatus }).pipe(finalize(() => this.busyId.set(null)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void Swal.fire({ title: 'Estado actualizado', text: `El almacén ahora está ${activate ? 'activo' : 'inactivo'}.`, icon: 'success', confirmButtonColor: '#2f684f', timer: 1700, showConfirmButton: false }); this.load(); },
      error: (error: unknown) => { void Swal.fire({ title: 'No se pudo cambiar el estado', text: userErrorMessage(error), icon: 'error', confirmButtonColor: '#2f684f' }); },
    });
  }

  async remove(item: Almacen): Promise<void> {
    const result = await Swal.fire({ title: '¿Eliminar almacén?', text: `¿Estás seguro de eliminar el almacén "${item.nombre}"? Esta acción no se puede deshacer.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar', confirmButtonColor: '#b85b4c', cancelButtonColor: '#edf1ee', reverseButtons: true });
    if (!result.isConfirmed) return;
    this.busyId.set(item.id);
    this.service.eliminar(item.id).pipe(finalize(() => this.busyId.set(null)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void Swal.fire({ title: 'Almacén eliminado', icon: 'success', confirmButtonColor: '#2f684f', timer: 1500, showConfirmButton: false }); this.load(); },
      error: (error: unknown) => {
        const message = error instanceof AppHttpError && error.status === 409
          ? 'No se puede eliminar este almacén porque está relacionado con otros registros.'
          : userErrorMessage(error);
        void Swal.fire({ title: 'No se pudo eliminar', text: message, icon: 'error', confirmButtonColor: '#2f684f' });
      },
    });
  }
}


