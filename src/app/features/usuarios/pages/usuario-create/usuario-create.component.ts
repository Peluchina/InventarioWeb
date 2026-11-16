import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { userErrorMessage } from '../../../../core/interceptors/http-error.interceptor';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { UsuarioFormComponent } from '../../components/usuario-form/usuario-form.component';
import { UsuarioCreateRequest } from '../../models/usuario-create-request.model';
import { UsuariosService } from '../../services/usuarios.service';

@Component({
  selector: 'app-usuario-create',
  standalone: true,
  imports: [PageHeaderComponent, UsuarioFormComponent, MatButtonModule, MatIconModule],
  template: `
    <app-page-header title="Nuevo usuario" subtitle="Crea una cuenta para acceder al sistema." eyebrow="Administración / Usuarios" />
    <button mat-button class="back-link" (click)="back()"><mat-icon>arrow_back</mat-icon>Volver al directorio</button>
    <section class="form-panel"><app-usuario-form [saving]="saving()" submitLabel="Crear usuario" (submitted)="save($event)" (cancel)="back()" /></section>
  `,
  styles: [`.form-panel{max-width:860px;background:#fff;border:1px solid #e9efeb;border-radius:13px;overflow:hidden}.back-link{margin:-13px 0 15px -8px;color:#668076;font-size:11px}.back-link mat-icon{font-size:17px;width:17px;height:17px;margin-right:5px}`],
})
export class UsuarioCreateComponent {
  private readonly service = inject(UsuariosService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly saving = signal(false);

  save(request: UsuarioCreateRequest): void {
    this.saving.set(true);
    this.service.crear(request).pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { void Swal.fire({ title: 'Usuario creado correctamente.', text: 'La cuenta quedó registrada.', icon: 'success', confirmButtonColor: '#2f684f' }).then(() => this.back()); },
      error: (error: unknown) => { void Swal.fire({ title: 'No se pudo guardar el usuario.', text: userErrorMessage(error), icon: 'error', confirmButtonColor: '#2f684f' }); },
    });
  }

  back(): void { void this.router.navigate(['/usuarios']); }
}
