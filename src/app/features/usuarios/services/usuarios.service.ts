import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api.config';
import { UsuarioCreateRequest } from '../models/usuario-create-request.model';
import { UsuarioCreateResponse } from '../models/usuario-response.model';
import { UsuarioUpdateRequest } from '../models/usuario-update-request.model';
import { UsuarioUpdateStatusRequest } from '../models/usuario-update-status-request.model';
import { Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_URL).replace(/\/$/, '')}/api/usuarios`;

  listar(): Observable<Usuario[]> { return this.http.get<Usuario[]>(this.baseUrl); }
  obtenerPorId(id: number): Observable<Usuario> { return this.http.get<Usuario>(`${this.baseUrl}/${id}`); }
  crear(request: UsuarioCreateRequest): Observable<UsuarioCreateResponse> {
    return this.http.post<UsuarioCreateResponse>(this.baseUrl, request);
  }
  actualizar(id: number, request: UsuarioUpdateRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, request);
  }
  actualizarEstado(id: number, request: UsuarioUpdateStatusRequest): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/estado`, request);
  }
  eliminar(id: number): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${id}`); }
}
