import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api.config';
import { ProductoCreateRequest } from '../models/producto-create-request.model';
import { ProductoCreateResponse } from '../models/producto-response.model';
import { ProductoUpdateRequest } from '../models/producto-update-request.model';
import { ProductoUpdateStatusRequest } from '../models/producto-update-status-request.model';
import { Producto, ProductoDetalle } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_URL).replace(/\/$/, '')}/api/productos`;

  listar(): Observable<Producto[]> { return this.http.get<Producto[]>(this.baseUrl); }
  obtenerPorId(id: number): Observable<ProductoDetalle> { return this.http.get<ProductoDetalle>(`${this.baseUrl}/${id}`); }
  crear(request: ProductoCreateRequest): Observable<ProductoCreateResponse> { return this.http.post<ProductoCreateResponse>(this.baseUrl, request); }
  actualizar(id: number, request: ProductoUpdateRequest): Observable<void> { return this.http.put<void>(`${this.baseUrl}/${id}`, request); }
  actualizarEstado(id: number, request: ProductoUpdateStatusRequest): Observable<void> { return this.http.patch<void>(`${this.baseUrl}/${id}/estado`, request); }
  eliminar(id: number): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${id}`); }
}
