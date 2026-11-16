import { Usuario } from '../../usuarios/models/usuario.model';

export function getNombreCompleto(usuario: Pick<Usuario, 'nombre' | 'apellidos'>): string {
  return `${usuario.nombre} ${usuario.apellidos}`.trim();
}
