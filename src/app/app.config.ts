import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';

const withBackendCredentials: HttpInterceptorFn = (request, next) => {
  const isOAuthSessionRequest = request.url.includes('/auth/token') || request.url.endsWith('/logout');
  return next(request.clone({ withCredentials: isOAuthSessionRequest }));
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([withBackendCredentials, httpErrorInterceptor])),
  ]
};
