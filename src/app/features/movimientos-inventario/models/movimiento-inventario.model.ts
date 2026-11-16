export interface MovimientoRegistro {
  id: number;
  productoId: number;
  producto: string;
  sku?: string;
  tipoMovimiento: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  referencia: string | null;
  usuario: string;
  usuarioId?: number;
  fecha: string | null;
  createdAt: string | null;
  updateAt?: string | null;
}

export interface MovimientoInventario extends MovimientoRegistro {
  sku: string;
  usuarioId: number;
  updateAt: string | null;
}

export type MovimientoPorProducto = MovimientoRegistro;
