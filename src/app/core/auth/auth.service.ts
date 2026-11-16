import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap, timeout } from 'rxjs';
import { API_URL } from '../config/api.config';
import { AuthTokenResponse, AuthUser, AuthUserResponse, JwtClaims, normalizeRole } from './auth-user.model';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = inject(API_URL).replace(/\/$/, '');
  private readonly userState = signal<AuthUser | null>(null);
  private readonly accessTokenState = signal<string | null>(null);
  private sessionRequest: Observable<AuthUser | null> | null = null;
  private sessionChecked = false;
  private unauthorizedHandled = false;

  readonly currentUser = this.userState.asReadonly();
  readonly accessToken = this.accessTokenState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null && this.hasValidToken());
  readonly role = computed(() => this.userState()?.role ?? null);

  getCurrentUser(): Observable<AuthUser | null> {
    if (this.sessionChecked) return of(this.isAuthenticated() ? this.userState() : null);
    if (!this.sessionRequest) {
      this.sessionRequest = this.http.get<AuthTokenResponse>(environment.authTokenUrl).pipe(
        map((response) => response.accessToken),
        tap((token) => this.accessTokenState.set(token)),
        switchMap((token) => this.http.get<AuthUserResponse>(this.url(environment.authUserPath)).pipe(map((response) => this.toAuthUser(response, token)))),
        tap((user) => {
          this.userState.set(user);
          this.sessionChecked = true;
        }),
        catchError(() => {
          this.userState.set(null);
          this.clearSession();
          this.sessionChecked = true;
          return of(null);
        }),
        tap(() => { this.sessionRequest = null; }),
      );
    }
    return this.userState() ? of(this.userState()) : this.sessionRequest;
  }

  loginWithGoogle(returnUrl?: string): void {
    if (returnUrl) sessionStorage.setItem('auth:returnUrl', returnUrl);
    window.location.assign(environment.oauth2AuthorizationUrl);
  }

  logout(): void {
    this.clearSession();
    sessionStorage.removeItem('auth:returnUrl');
    void this.router.navigateByUrl('/login');
    this.http.post<void>(environment.authLogoutUrl, {}).pipe(
      catchError(() => of(undefined)),
    ).subscribe();
  }

  retryGoogleLogin(): void {
    this.clearSession();
    this.sessionChecked = true;
    this.sessionRequest = null;
    sessionStorage.removeItem('auth:returnUrl');
    this.http.post<void>(environment.authLogoutUrl, {}).pipe(
      timeout(1500),
      catchError(() => of(undefined)),
    ).subscribe(() => window.location.assign(environment.oauth2AuthorizationUrl));
  }

  handleUnauthorized(): void {
    if (this.unauthorizedHandled) return;
    this.unauthorizedHandled = true;
    const returnUrl = this.router.url;
    this.clearSession();
    this.sessionChecked = true;
    void Swal.fire({ title: 'Tu sesión ha expirado.', text: 'Inicia sesión nuevamente.', icon: 'warning', confirmButtonText: 'Ir al inicio de sesión', confirmButtonColor: '#2f684f' }).then(() => {
      void this.router.navigate(['/login'], { queryParams: { returnUrl } });
      this.unauthorizedHandled = false;
    });
  }

  hasRole(...roles: string[]): boolean {
    const currentRole = normalizeRole(this.role());
    return !!currentRole && roles.some((role) => normalizeRole(role) === currentRole);
  }
  hasAnyRole(roles: readonly string[]): boolean { return this.hasRole(...roles); }
  getToken(): string | null { return this.accessToken(); }
  getUser(): AuthUser | null { return this.userState(); }
  getRole(): string | null { return this.role(); }

  private hasValidToken(): boolean {
    const token = this.accessTokenState();
    if (!token) return false;
    const claims = this.decodeClaims(token);
    return !!claims && typeof claims.exp === 'number' && claims.exp * 1000 > Date.now()
      && !!normalizeRole(claims.rol ?? claims.role);
  }

  private clearSession(): void {
    this.userState.set(null);
    this.accessTokenState.set(null);
  }

  consumeReturnUrl(): string | null {
    const returnUrl = sessionStorage.getItem('auth:returnUrl');
    sessionStorage.removeItem('auth:returnUrl');
    return returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : null;
  }

  private url(path: string): string { return `${this.apiUrl}${path}`; }

  private toAuthUser(response: AuthUserResponse, token: string): AuthUser | null {
    const name = response.name ?? [response.nombre, response.apellidos].filter(Boolean).join(' ');
    const claims = this.decodeClaims(token);
    const role = normalizeRole(claims?.rol ?? claims?.role);
    if (!name || !response.email || !claims || !role || typeof claims.exp !== 'number' || claims.exp * 1000 <= Date.now()) return null;
    const parsedId = Number(claims.sub);
    return {
      ...(Number.isSafeInteger(parsedId) ? { id: parsedId } : response.id !== undefined ? { id: response.id } : {}),
      name,
      email: claims.email ?? response.email,
      ...(response.picture ? { picture: response.picture } : {}),
      role,
    };
  }

  private decodeClaims(token: string): JwtClaims | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))) as JwtClaims;
    } catch { return null; }
  }
}
