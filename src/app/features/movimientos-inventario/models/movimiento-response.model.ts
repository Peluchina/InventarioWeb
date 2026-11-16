export interface MovimientoCreateResponse {
  movimientoId: number;
  productoId: number;
  tipoMovimiento: string;
  stockAnterior: number;
  stockNuevo: number;
  mensaje: string;
}
