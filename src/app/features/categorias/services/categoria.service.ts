import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api.config';
import { ActualizarCategoria } from '../models/categoria-update-request.model';
import { Categoria } from '../models/categoria.model';
import { CrearCategoria } from '../models/categoria-create-request.model';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_URL).replace(/\/$/, '')}/api/categorias`;

  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.baseUrl);
  }

  obtenerPorId(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.baseUrl}/${id}`);
  }

  crear(data: CrearCategoria): Observable<void> {
    return this.http.post<void>(this.baseUrl, data);
  }

  actualizar(id: number, data: ActualizarCategoria): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, data);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
