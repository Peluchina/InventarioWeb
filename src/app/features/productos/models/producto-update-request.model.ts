export interface ProductoUpdateRequest {
  sku: string;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  precioCompra: number;
  precioVenta: number;
  stockMinimo: number;
}
