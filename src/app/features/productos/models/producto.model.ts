export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  descripcion: string | null;
  categoriaId: number;
  categoria: string;
  precioCompra: number;
  precioVenta: number;
  stockMinimo: number;
  stockActual: number;
  estadoId: number;
  estadoStock: string;
}

export type ProductoDetalle = Omit<Producto, 'estadoId' | 'estadoStock'>;
