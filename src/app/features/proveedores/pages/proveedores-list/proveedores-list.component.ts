import { AfterViewInit, Component, DestroyRef, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { userErrorMessage } from '../../../../core/interceptors/http-error.interceptor';
import { AuthService } from '../../../../core/auth/auth.service';
import { EstadoProveedor } from '../../models/estado-proveedor.enum';
import { Proveedor } from '../../models/proveedor.model';
import { ProveedoresService } from '../../services/proveedores.service';

@Component({
  selector: 'app-proveedores-list',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, LoadingComponent, StatusBadgeComponent, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatPaginatorModule, MatSortModule, MatTableModule, MatTooltipModule],
  template: `
    <app-page-header title="Proveedores" subtitle="Administra las relaciones y datos de contacto de tus proveedores." eyebrow="Administración / Directorio">
      <button mat-flat-button color="primary" routerLink="nuevo" [hidden]="!auth.hasRole('ADMINISTRADOR')"><mat-icon>add</mat-icon>Nuevo proveedor</button>
    </app-page-header>
    <section class="summary-row" aria-label="Resumen de proveedores">
      <article class="summary-card"><span class="summary-icon green"><mat-icon>local_shipping</mat-icon></span><div><small>Total de proveedores</small><strong>{{ dataSource.data.length }}</strong></div><span class="summary-foot">REGISTROS</span></article>
      <article class="summary-card"><span class="summary-icon mint"><mat-icon>verified_user</mat-icon></span><div><small>Proveedores activos</small><strong>{{ activeCount() }}</strong></div><span class="summary-foot positive">EN OPERACIÓN</span></article>
      @if (auth.hasRole('ADMINISTRADOR')) {
      <article class="summary-card"><span class="summary-icon sand"><mat-icon>schedule</mat-icon></span><div><small>Inactivos</small><strong>{{ inactiveCount() }}</strong></div><span class="summary-foot">PAUSADOS</span></article>
      }
    </section>
    <section class="panel">
      <div class="panel-heading"><div><h2>Directorio de proveedores</h2><p>Consulta y gestiona los proveedores registrados.</p></div><mat-form-field appearance="outline" class="search"><mat-icon matPrefix>search</mat-icon><mat-label>Buscar proveedor</mat-label><input matInput (input)="filter($event)" placeholder="Nombre, correo o contacto"></mat-form-field></div>
      @if (errorMessage()) { <div class="error-banner" role="alert"><mat-icon>error_outline</mat-icon><span>{{ errorMessage() }}</span><button mat-button (click)="load()">Reintentar</button></div> }
      @if (loading()) { <app-loading message="Cargando proveedores…" /> }
      <div class="table-wrap" [class.dimmed]="loading()">
        <table mat-table [dataSource]="dataSource" matSort aria-label="Lista de proveedores">
          <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th><td mat-cell *matCellDef="let item"><span class="id-tag">#{{ item.id }}</span></td></ng-container>
          <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef mat-sort-header>PROVEEDOR</th><td mat-cell *matCellDef="let item"><span class="supplier-name">{{ item.nombre }}</span><span class="supplier-contact">{{ item.contacto || 'Sin contacto asignado' }}</span></td></ng-container>
          <ng-container matColumnDef="telefono"><th mat-header-cell *matHeaderCellDef>TELÉFONO</th><td mat-cell *matCellDef="let item">{{ item.telefono || '—' }}</td></ng-container>
          <ng-container matColumnDef="email"><th mat-header-cell *matHeaderCellDef>CORREO</th><td mat-cell *matCellDef="let item">{{ item.email || '—' }}</td></ng-container>
          <ng-container matColumnDef="direccion"><th mat-header-cell *matHeaderCellDef>DIRECCIÓN</th><td mat-cell *matCellDef="let item" class="address">{{ item.direccion || '—' }}</td></ng-container>
          <ng-container matColumnDef="estado"><th mat-header-cell *matHeaderCellDef>ESTADO</th><td mat-cell *matCellDef="let item"><app-status-badge [active]="item.estadoId === EstadoProveedor.ACTIVO" /></td></ng-container>
          <ng-container matColumnDef="acciones"><th mat-header-cell *matHeaderCellDef><span class="sr-only">Acciones</span></th><td mat-cell *matCellDef="let item"><div class="row-actions"><button mat-icon-button [hidden]="!auth.hasRole('ADMINISTRADOR')" [routerLink]="['editar', item.id]" matTooltip="Editar" [attr.aria-label]="'Editar proveedor ' + item.nombre" [disabled]="busyId() !== null"><mat-icon>edit</mat-icon></button><button mat-icon-button [hidden]="!auth.hasRole('ADMINISTRADOR')" (click)="changeStatus(item)" [matTooltip]="item.estadoId === EstadoProveedor.ACTIVO ? 'Desactivar' : 'Activar'" [attr.aria-label]="'Cambiar estado de ' + item.nombre" [disabled]="busyId() !== null"><mat-icon>{{ item.estadoId === EstadoProveedor.ACTIVO ? 'pause_circle' : 'play_circle' }}</mat-icon></button><button mat-icon-button [hidden]="!auth.hasRole('ADMINISTRADOR')" class="delete-action" (click)="remove(item)" matTooltip="Eliminar" [attr.aria-label]="'Eliminar proveedor ' + item.nombre" [disabled]="busyId() !== null"><mat-icon>delete_outline</mat-icon></button></div></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr><tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          <tr class="mat-mdc-row" *matNoDataRow><td class="mat-mdc-cell no-data" [attr.colspan]="displayedColumns.length"><span class="empty-icon"><mat-icon>search_off</mat-icon></span><strong>{{ dataSource.filter ? 'No encontramos resultados' : 'Aún no hay proveedores' }}</strong><span>{{ dataSource.filter ? 'Prueba con otra búsqueda.' : 'Agrega tu primer proveedor para comenzar.' }}</span></td></tr>
        </table>
      </div>
      <mat-paginator [pageSizeOptions]="[5, 10, 25]" [pageSize]="10" showFirstLastButtons aria-label="Paginación de proveedores" />
      <div class="mobile-list">
        @for (item of dataSource.filteredData; track item.id) {
          <article class="mobile-card"><div class="mobile-card-top"><div><strong>{{ item.nombre }}</strong><small>#{{ item.id }} · {{ item.contacto || 'Sin contacto' }}</small></div><app-status-badge [active]="item.estadoId === EstadoProveedor.ACTIVO" /></div><p>{{ item.telefono || '—' }}<br>{{ item.email || '—' }}</p><div class="mobile-actions"><button mat-button [hidden]="!auth.hasRole('ADMINISTRADOR')" [routerLink]="['editar', item.id]"><mat-icon>edit</mat-icon>Editar</button><button mat-button [hidden]="!auth.hasRole('ADMINISTRADOR')" (click)="changeStatus(item)"><mat-icon>sync</mat-icon>Estado</button><button mat-button [hidden]="!auth.hasRole('ADMINISTRADOR')" (click)="remove(item)"><mat-icon>delete_outline</mat-icon>Eliminar</button></div></article>
        }
      </div>
    </section>
  `,
  styles: [`
    :host{display:block}.summary-row{display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:22px}.summary-card{min-height:94px;background:#fff;border:1px solid #eaf0ec;border-radius:12px;display:flex;align-items:center;gap:13px;padding:18px 20px;box-sizing:border-box}.summary-icon{width:39px;height:39px;border-radius:11px;display:grid;place-items:center}.summary-icon mat-icon{font-size:19px}.green{background:#edf5f0;color:#3d745c}.mint{background:#e8f4ef;color:#4d8a6c}.sand{background:#f7f1e8;color:#ad8953}.summary-card div{display:flex;flex-direction:column;gap:6px;flex:1}.summary-card small{font-size:10px;color:#84958d}.summary-card strong{font-size:22px;line-height:1;color:#23483b}.summary-foot{font-size:8px;color:#a1ada7;letter-spacing:.08em;font-weight:700}.positive{color:#5a9a75}.panel{background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}.panel-heading{display:flex;align-items:center;justify-content:space-between;padding:22px 24px 8px;gap:18px}.panel-heading h2{margin:0 0 6px;color:#2d493e;font-size:15px}.panel-heading p{margin:0;color:#92a098;font-size:10px}.search{width:260px}.search mat-icon{color:#91a099;margin-right:8px}.table-wrap{overflow:auto}table{width:100%;min-width:850px}.mat-mdc-header-row{height:43px;background:#f8faf8}.mat-mdc-header-cell{font-size:9px;font-weight:700;color:#9aa7a1;letter-spacing:.08em;border-bottom:1px solid #edf1ee}.mat-mdc-cell{font-size:10px;color:#66786f;border-bottom-color:#f0f3f1;padding-top:7px;padding-bottom:7px}.id-tag{color:#83948b;font-size:9px;font-weight:600}.supplier-name,.supplier-contact{display:block}.supplier-name{color:#2d493e;font-size:10px;font-weight:700}.supplier-contact{font-size:9px;color:#98a59f;margin-top:3px}.address{max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.row-actions{display:flex;justify-content:flex-end}.row-actions button{width:31px;height:31px;color:#72857b}.row-actions .delete-action{color:#b07869}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.no-data{height:175px;text-align:center;color:#87968f}.no-data strong,.no-data span{display:block}.no-data strong{color:#456256;margin:5px}.no-data span{font-size:11px}.empty-icon{color:#90a69a}.error-banner{margin:12px 20px;padding:12px 14px;background:#fff5f2;color:#9d5340;border-radius:8px;display:flex;align-items:center;gap:10px;font-size:11px}.error-banner span{flex:1}.dimmed{opacity:.55}.mobile-list{display:none}.mobile-card{padding:16px;border-bottom:1px solid #edf1ee}.mobile-card-top{display:flex;justify-content:space-between;align-items:flex-start}.mobile-card-top strong,.mobile-card-top small{display:block}.mobile-card-top strong{color:#2e4d40;font-size:12px}.mobile-card-top small{font-size:10px;color:#8b9a93;margin-top:5px}.mobile-card p{font-size:10px;line-height:1.8;color:#73847b}.mobile-actions{display:flex;justify-content:space-between}.mobile-actions button{font-size:10px;padding:0 6px}.mobile-actions mat-icon{font-size:16px;width:16px;height:16px;margin-right:3px}mat-paginator{border-top:1px solid #edf1ee}.mobile-list{display:none}@media(max-width:980px){.summary-foot{display:none}.address{max-width:90px}}@media(max-width:700px){.summary-row{gap:8px}.summary-card{padding:12px 10px;gap:8px;min-height:82px}.summary-icon{width:32px;height:32px}.summary-card small{font-size:9px}.summary-card strong{font-size:18px}.panel-heading{padding:18px 15px 8px;align-items:flex-start;flex-direction:column}.search{width:100%}.table-wrap,mat-paginator{display:none}.mobile-list{display:block}.error-banner{margin:10px 12px}}
  `],
})
export class ProveedoresListComponent implements AfterViewInit {
  private readonly service = inject(ProveedoresService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly EstadoProveedor = EstadoProveedor;
  protected readonly displayedColumns = ['id', 'nombre', 'telefono', 'email', 'direccion', 'estado', 'acciones'];
  protected readonly auth = inject(AuthService);
  protected readonly dataSource = new MatTableDataSource<Proveedor>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly busyId = signal<number | null>(null);
  @ViewChild(MatPaginator) private paginator!: MatPaginator;
  @ViewChild(MatSort) private sort!: MatSort;

  constructor() {
    this.dataSource.filterPredicate = (item, filter) => [item.nombre, item.contacto, item.telefono, item.email, item.direccion, String(item.id)].some((value) => value.toLocaleLowerCase().includes(filter));
    this.load();
  }

  ngAfterViewInit(): void { this.dataSource.paginator = this.paginator; this.dataSource.sort = this.sort; }
  activeCount(): number { return this.dataSource.data.filter((item) => item.estadoId === EstadoProveedor.ACTIVO).length; }
  inactiveCount(): number { return this.dataSource.data.length - this.activeCount(); }
  filter(event: Event): void { this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLocaleLowerCase(); this.dataSource.paginator?.firstPage(); }

  load(): void {
    this.loading.set(true); this.errorMessage.set('');
    this.service.listar().pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => { this.dataSource.data = this.auth.hasRole('ADMINISTRADOR') ? items : items.filter((item) => item.estadoId !== EstadoProveedor.INACTIVO); if (this.paginator) this.dataSource.paginator = this.paginator; if (this.sort) this.dataSource.sort = this.sort; },
      error: (error: unknown) => this.errorMessage.set(userErrorMessage(error)),
    });
  }

  async changeStatus(item: Proveedor): Promise<void> {
    const nextStatus = item.estadoId === EstadoProveedor.ACTIVO ? EstadoProveedor.INACTIVO : EstadoProveedor.ACTIVO;
    const activate = nextStatus === EstadoProveedor.ACTIVO;
    const result = await Swal.fire({ title: `${activate ? 'Activar' : 'Desactivar'} proveedor`, text: `¿Deseas ${activate ? 'activar' : 'desactivar'} a ${item.nombre}?`, icon: 'question', showCancelButton: true, confirmButtonText: activate ? 'Sí, activar' : 'Sí, desactivar', cancelButtonText: 'Cancelar', confirmButtonColor: '#2f684f', cancelButtonColor: '#edf1ee', reverseButtons: true });
    if (!result.isConfirmed) return;
    this.busyId.set(item.id);
    this.service.actualizarEstado(item.id, { estadoId: nextStatus }).pipe(finalize(() => this.busyId.set(null)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void Swal.fire({ title: 'Estado actualizado', text: `El proveedor ahora está ${activate ? 'activo' : 'inactivo'}.`, icon: 'success', confirmButtonColor: '#2f684f', timer: 1700, showConfirmButton: false }); this.load(); },
      error: (error: unknown) => { void Swal.fire({ title: 'No se pudo cambiar el estado', text: userErrorMessage(error), icon: 'error', confirmButtonColor: '#2f684f' }); },
    });
  }

  async remove(item: Proveedor): Promise<void> {
    const result = await Swal.fire({ title: '¿Eliminar proveedor?', text: `Se eliminará a ${item.nombre}. Esta acción no se puede deshacer.`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar', confirmButtonColor: '#b85b4c', cancelButtonColor: '#edf1ee', reverseButtons: true });
    if (!result.isConfirmed) return;
    this.busyId.set(item.id);
    this.service.eliminar(item.id).pipe(finalize(() => this.busyId.set(null)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void Swal.fire({ title: 'Proveedor eliminado', icon: 'success', confirmButtonColor: '#2f684f', timer: 1500, showConfirmButton: false }); this.load(); },
      error: (error: unknown) => { void Swal.fire({ title: 'No se pudo eliminar', text: userErrorMessage(error), icon: 'error', confirmButtonColor: '#2f684f' }); },
    });
  }
}


