import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api.config';
import { MovimientoCreateRequest } from '../models/movimiento-create-request.model';
import { MovimientoCreateResponse } from '../models/movimiento-response.model';
import { MovimientoInventario, MovimientoPorProducto } from '../models/movimiento-inventario.model';

@Injectable({ providedIn: 'root' })
export class MovimientosInventarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_URL).replace(/\/$/, '')}/api/movimientos`;

  registrar(request: MovimientoCreateRequest): Observable<MovimientoCreateResponse> { return this.http.post<MovimientoCreateResponse>(this.baseUrl, request); }
  listar(): Observable<MovimientoInventario[]> { return this.http.get<MovimientoInventario[]>(this.baseUrl); }
  obtenerPorId(id: number): Observable<MovimientoInventario> { return this.http.get<MovimientoInventario>(`${this.baseUrl}/${id}`); }
  listarPorProducto(productoId: number): Observable<MovimientoPorProducto[]> { return this.http.get<MovimientoPorProducto[]>(`${this.baseUrl}/producto/${productoId}`); }
}
