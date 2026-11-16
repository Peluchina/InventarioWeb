import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export class AppHttpError extends Error {
  constructor(readonly status: number, message: string, readonly originalError: unknown) {
    super(message);
    this.name = 'AppHttpError';
  }
}

function backendMessage(error: HttpErrorResponse): string | null {
  let body: unknown = error.error;
  if (typeof body === 'string') {
    const textBody = body;
    try { body = JSON.parse(textBody) as unknown; }
    catch { return safeMessage(textBody); }
  }
  if (typeof body !== 'object' || body === null) return null;
  const record = body as Record<string, unknown>;
  const code = record['error'] ?? record['code'];
  if (code === 'user_not_registered') return 'El usuario no existe en el sistema. Intenta nuevamente con una cuenta registrada.';
  if (code === 'user_inactive') return 'Esta cuenta no está activa en el sistema. Contacta con el administrador.';
  for (const key of ['message', 'mensaje', 'detail']) {
    const value = record[key];
    if (typeof value === 'string') {
      const message = safeMessage(value);
      if (message) return message;
    }
  }
  return null;
}

function safeMessage(value: string): string | null {
  const message = value.trim();
  if (!message || /^[{[]/.test(message) || /OAuth2AuthenticationException|org\.springframework|stack trace|user_not_registered|user_inactive/i.test(message)) return null;
  return message;
}

function defaultMessage(status: number): string {
  switch (status) {
    case 0: return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.';
    case 400: return 'La solicitud contiene datos no válidos.';
    case 401: return 'Tu sesión no está autorizada. Inicia sesión nuevamente.';
    case 403: return 'No tienes permisos para realizar esta acción.';
    case 404: return 'No se encontró el recurso solicitado.';
    case 409: return 'La operación entra en conflicto con los datos existentes.';
    default: return status >= 500 ? 'Ocurrió un problema en el servidor. Inténtalo nuevamente.' : 'No se pudo completar la operación.';
  }
}

export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const accessToken = auth.accessToken();
  const isApiRequest = request.url.includes('/api/');
  const securedRequest = isApiRequest && accessToken
    ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : request;

  return next(securedRequest).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401
          && !request.url.endsWith('/auth/token')
          && !request.url.endsWith('/logout')) {
          auth.handleUnauthorized();
        }
        return throwError(() => new AppHttpError(error.status, backendMessage(error) ?? defaultMessage(error.status), error));
      }
      return throwError(() => error);
    }),
  );
};

export function userErrorMessage(error: unknown): string {
  if (error instanceof AppHttpError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'No se pudo completar la operación. Inténtalo nuevamente.';
}
