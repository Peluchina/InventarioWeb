import { AppHttpError, userErrorMessage } from '../../../core/interceptors/http-error.interceptor';

export function movimientoErrorMessage(error: unknown, action: 'registrar' | 'consultar' = 'consultar'): string {
  const message = userErrorMessage(error);
  const normalized = message.toLocaleLowerCase();
  if (normalized.includes('stock insuficiente') || normalized.includes('stock disponible')) {
    return 'No se puede realizar la salida porque el stock disponible es insuficiente.';
  }
  if (normalized.includes('producto no encontrado')) return 'El producto seleccionado ya no está disponible.';
  if (normalized.includes('usuario no encontrado')) return 'El usuario seleccionado ya no está disponible.';
  if (normalized.includes('tipo de movimiento') && normalized.includes('inválido')) return 'Selecciona un tipo de movimiento válido.';
  if (normalized.includes('cantidad')) return 'Revisa la cantidad ingresada para este movimiento.';
  if (error instanceof AppHttpError && error.status >= 500) return action === 'registrar' ? 'No se pudo registrar el movimiento. Inténtalo nuevamente.' : 'No se pudo consultar el movimiento. Inténtalo nuevamente.';
  if (/sql(exception|state)|nullpointer|exception|stack trace|internal server error/i.test(message)) return action === 'registrar' ? 'No se pudo registrar el movimiento. Inténtalo nuevamente.' : 'No se pudo consultar el movimiento. Inténtalo nuevamente.';
  return message;
}
