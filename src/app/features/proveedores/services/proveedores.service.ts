import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api.config';
import { ProveedorCreateRequest } from '../models/proveedor-create-request.model';
import { ProveedorCreateResponse } from '../models/proveedor-response.model';
import { ProveedorUpdateRequest } from '../models/proveedor-update-request.model';
import { ProveedorUpdateStatusRequest } from '../models/proveedor-update-status-request.model';
import { Proveedor } from '../models/proveedor.model';

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_URL).replace(/\/$/, '')}/api/proveedores`;

  listar(): Observable<Proveedor[]> { return this.http.get<Proveedor[]>(this.baseUrl); }
  obtenerPorId(id: number): Observable<Proveedor> { return this.http.get<Proveedor>(`${this.baseUrl}/${id}`); }
  crear(request: ProveedorCreateRequest): Observable<ProveedorCreateResponse> {
    return this.http.post<ProveedorCreateResponse>(this.baseUrl, request);
  }
  actualizar(id: number, request: ProveedorUpdateRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, request);
  }
  actualizarEstado(id: number, request: ProveedorUpdateStatusRequest): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/estado`, request);
  }
  eliminar(id: number): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${id}`); }
}
