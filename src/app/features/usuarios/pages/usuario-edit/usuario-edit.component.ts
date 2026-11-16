import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { userErrorMessage } from '../../../../core/interceptors/http-error.interceptor';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { UsuarioFormComponent } from '../../components/usuario-form/usuario-form.component';
import { UsuarioCreateRequest } from '../../models/usuario-create-request.model';
import { Usuario } from '../../models/usuario.model';
import { UsuariosService } from '../../services/usuarios.service';

@Component({
  selector: 'app-usuario-edit',
  standalone: true,
  imports: [PageHeaderComponent, LoadingComponent, UsuarioFormComponent, MatButtonModule, MatIconModule],
  template: `
    <app-page-header title="Editar usuario" subtitle="Actualiza los datos de la cuenta." eyebrow="Administración / Usuarios" />
    <button mat-button class="back-link" (click)="back()"><mat-icon>arrow_back</mat-icon>Volver al directorio</button>
    @if (loading()) { <section class="form-panel"><app-loading message="Cargando información del usuario…" /></section> }
    @else if (errorMessage()) { <section class="load-error" role="alert"><mat-icon>error_outline</mat-icon><p>{{ errorMessage() }}</p><button mat-button (click)="load()">Reintentar</button></section> }
    @else if (usuario()) { <section class="form-panel"><app-usuario-form [usuario]="usuario()" [isEdit]="true" [saving]="saving()" submitLabel="Guardar cambios" (submitted)="save($event)" (cancel)="back()" /></section> }
  `,
  styles: [`.form-panel{max-width:860px;background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}.back-link{margin:-13px 0 15px -8px;color:#668076;font-size:11px}.back-link mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}.load-error{max-width:860px;padding:28px;background:#fff7f4;border:1px solid #f3e4de;border-radius:12px;color:#995741;display:flex;align-items:center;gap:12px}.load-error p{flex:1;font-size:12px}`],
})
export class UsuarioEditComponent implements OnInit {
  private readonly service = inject(UsuariosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly usuario = signal<Usuario | null>(null);
  private id = 0;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(this.id) || this.id <= 0) { this.errorMessage.set('El identificador del usuario no es válido.'); this.loading.set(false); return; }
    this.load();
  }

  load(): void {
    this.loading.set(true); this.errorMessage.set('');
    this.service.obtenerPorId(this.id).pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (item) => this.usuario.set(item),
      error: (error: unknown) => this.errorMessage.set(userErrorMessage(error)),
    });
  }

  save(request: UsuarioCreateRequest): void {
    this.saving.set(true);
    this.service.actualizar(this.id, request).pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void Swal.fire({ title: 'Usuario actualizado correctamente.', text: 'La información de la cuenta se guardó.', icon: 'success', confirmButtonColor: '#2f684f' }).then(() => this.back()); },
      error: (error: unknown) => { void Swal.fire({ title: 'No se pudieron guardar los cambios.', text: userErrorMessage(error), icon: 'error', confirmButtonColor: '#2f684f' }); },
    });
  }

  back(): void { void this.router.navigate(['/usuarios']); }
}
