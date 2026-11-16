export interface UsuarioCreateRequest {
  nombre: string;
  apellidos: string;
  dni: number;
  direccion: string;
  rolId: number;
  email: string;
  contrasenia: string;
}
