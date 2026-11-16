import { TipoMovimiento } from './tipo-movimiento.enum';

export interface MovimientoCreateRequest {
  productoId: number;
  tipoMovimiento: TipoMovimiento;
  cantidad: number;
  referencia: string | null;
  usuarioId: number;
}
