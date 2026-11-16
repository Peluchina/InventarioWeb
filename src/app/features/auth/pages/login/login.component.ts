import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/auth/auth.service';

interface AuthFailureMessage { title: string; message: string; }

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <main class="login-page">
      <section class="login-card" aria-labelledby="login-title">
        <div class="brand-mark"><mat-icon>inventory_2</mat-icon></div>
        <p class="eyebrow">STOCKWISE · GESTIÓN DE INVENTARIO</p>
        <h1 id="login-title">Bienvenido</h1>
        <p class="description">Accede a tu espacio de trabajo para gestionar tu inventario.</p>
        @if (authFailure()) {
          <section class="auth-failure" role="alert">
            <h2>{{ authFailure()?.title }}</h2>
            <p>{{ authFailure()?.message }}</p>
            <button mat-flat-button class="google-button" (click)="retryGoogleLogin()">Intentar nuevamente</button>
          </section>
        } @else {
          <button mat-flat-button class="google-button" (click)="continueWithGoogle()">
            <span class="google-g" aria-hidden="true">G</span> Continuar con Google
          </button>
        }
        <p class="secure-note"><mat-icon>lock</mat-icon> Inicio de sesión seguro con Google</p>
      </section>
      <p class="footer">Stockwise · Sistema de gestión de inventario</p>
    </main>
  `,
  styles: [`
    :host{display:block;min-height:100vh}.login-page{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(ellipse at 50% 0%,#e9f2ed 0,transparent 55%),#f7f9f7;position:relative}.login-card{width:min(100%,420px);padding:48px 42px 40px;border:1px solid #e7ede9;border-radius:22px;background:#fff;box-shadow:0 24px 70px #284d3b12;text-align:center}.brand-mark{width:54px;height:54px;margin:0 auto 22px;border-radius:17px;background:#214e40;color:white;display:grid;place-items:center}.brand-mark mat-icon{font-size:27px;width:27px;height:27px}.eyebrow{margin:0 0 24px;color:#87978f;font-size:9px;font-weight:700;letter-spacing:.14em}.login-card h1{margin:0;color:#203d32;font-size:28px;letter-spacing:-.04em}.description{margin:12px auto 28px;max-width:280px;color:#78877f;font-size:13px;line-height:1.7}.google-button{width:100%;height:48px;border:1px solid #dce4df;border-radius:9px;background:#fff;color:#344c42;font-size:13px;font-weight:600;box-shadow:none}.google-g{font-family:Arial,sans-serif;color:#4285f4;font-size:17px;font-weight:700;margin-right:8px}.auth-failure{margin:0 auto 8px;padding:16px;background:#fff7f3;border:1px solid #f1ded5;border-radius:10px}.auth-failure h2{margin:0;color:#814b3d;font-size:17px}.auth-failure p{color:#7e6a62;font-size:12px;line-height:1.6;margin:9px 0 16px}.secure-note{display:flex;align-items:center;justify-content:center;gap:6px;margin:22px 0 0;color:#96a39d;font-size:10px}.secure-note mat-icon{font-size:15px;width:15px;height:15px}.footer{position:absolute;bottom:18px;color:#99a69f;font-size:10px}@media(max-width:480px){.login-card{padding:38px 25px 32px}}
  `],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly authFailure = signal<AuthFailureMessage | null>(null);

  constructor() {
    const failureCode = this.route.snapshot.queryParamMap.get('error') ?? this.route.snapshot.queryParamMap.get('errorCode');
    this.authFailure.set(this.getAuthFailure(failureCode));
    if (failureCode) {
      void this.router.navigate([], { relativeTo: this.route, queryParams: { error: null, errorCode: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }
    if (!failureCode) {
      void this.auth.getCurrentUser().subscribe((user) => {
        if (user) void this.router.navigateByUrl(this.auth.consumeReturnUrl() ?? '/inicio');
      });
    }
  }

  retryGoogleLogin(): void { this.auth.retryGoogleLogin(); }

  continueWithGoogle(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.auth.loginWithGoogle(returnUrl ?? undefined);
  }

  private getAuthFailure(code: string | null): AuthFailureMessage | null {
    if (!code) return null;
    switch (code.trim().toLowerCase()) {
      case 'user_not_registered':
      case 'user-not-registered':
        return { title: 'Usuario no registrado', message: 'El usuario con esta cuenta de Google no existe en el sistema. Por favor, intenta nuevamente con una cuenta registrada.' };
      case 'user_inactive':
      case 'user-inactive':
      case 'inactive_user':
        return { title: 'Usuario inactivo', message: 'Esta cuenta no está activa en el sistema. Contacta con el administrador o intenta con otra cuenta registrada.' };
      default:
        return { title: 'No se pudo iniciar sesión', message: 'No pudimos completar la autenticación. Intenta nuevamente con una cuenta registrada.' };
    }
  }
}
