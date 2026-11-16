export interface AuthUser {
  id?: number;
  name: string;
  email: string;
  picture?: string;
  role: AuthRole;
}

export type AuthRole = 'ADMINISTRADOR' | 'ALMACENISTA' | string;

export function normalizeRole(role: string | null | undefined): AuthRole | null {
  if (!role) return null;
  const normalized = role.trim().toUpperCase().replace(/^ROLE_/, '');
  if (normalized === 'ADMIN') return 'ADMINISTRADOR';
  return normalized || null;
}

/** Current-account response using the user fields already present in this app. */
export interface AuthUserResponse {
  id?: number;
  nombre?: string;
  apellidos?: string;
  name?: string;
  email: string;
  picture?: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: 'Bearer' | string;
}

export interface JwtClaims {
  sub?: string | number;
  email?: string;
  rol?: string;
  role?: string;
  iss?: string;
  exp?: number;
}
