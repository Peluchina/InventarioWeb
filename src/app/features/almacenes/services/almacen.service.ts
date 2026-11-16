import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api.config';
import { ActualizarAlmacen } from '../models/almacen-update-request.model';
import { ActualizarEstadoAlmacen } from '../models/almacen-update-status-request.model';
import { Almacen } from '../models/almacen.model';
import { CrearAlmacen } from '../models/almacen-create-request.model';

@Injectable({ providedIn: 'root' })
export class AlmacenService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_URL).replace(/\/$/, '')}/api/almacenes`;

  listar(): Observable<Almacen[]> {
    return this.http.get<Almacen[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Almacen> {
    return this.http.get<Almacen>(`${this.baseUrl}/${id}`);
  }

  crear(data: CrearAlmacen): Observable<unknown> {
    return this.http.post<unknown>(this.baseUrl, data);
  }

  actualizar(id: number, data: ActualizarAlmacen): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, data);
  }

  actualizarEstado(id: number, data: ActualizarEstadoAlmacen): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/estado`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
