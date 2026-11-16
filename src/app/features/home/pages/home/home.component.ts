import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <section class="welcome">
      <p class="eyebrow">INICIO</p>
      <h1>Bienvenido, {{ auth.currentUser()?.name }}</h1>
      <p>Administra tus productos y mantén tus operaciones de inventario al día.</p>
    </section>
    <section class="section-heading"><div><h2>Accesos rápidos</h2><p>Continúa con una de las áreas del sistema.</p></div></section>
    <div class="cards">
      <a class="card" routerLink="/productos"><span class="icon"><mat-icon>inventory_2</mat-icon></span><strong>Productos</strong><small>Consulta y administra el catálogo.</small><mat-icon class="arrow">arrow_forward</mat-icon></a>
      <a class="card" routerLink="/movimientos-inventario"><span class="icon"><mat-icon>swap_horiz</mat-icon></span><strong>Movimientos</strong><small>Revisa entradas y salidas registradas.</small><mat-icon class="arrow">arrow_forward</mat-icon></a>
      <a class="card" routerLink="/proveedores"><span class="icon"><mat-icon>local_shipping</mat-icon></span><strong>Proveedores</strong><small>Gestiona los proveedores del negocio.</small><mat-icon class="arrow">arrow_forward</mat-icon></a>
      <a class="card" routerLink="/usuarios"><span class="icon"><mat-icon>group</mat-icon></span><strong>Usuarios</strong><small>Administra el acceso de usuarios.</small><mat-icon class="arrow">arrow_forward</mat-icon></a>
    </div>
  `,
  styles: [`
    :host{display:block}.welcome{padding:8px 0 35px}.eyebrow{margin:0 0 10px;color:#87978f;font-size:9px;font-weight:700;letter-spacing:.13em}.welcome h1{margin:0;color:#203d32;font-size:28px;letter-spacing:-.04em}.welcome p:last-child{margin:10px 0 0;color:#7b8982;font-size:13px}.section-heading{margin-bottom:15px}.section-heading h2{margin:0;color:#344e43;font-size:15px}.section-heading p{margin:5px 0 0;color:#92a098;font-size:11px}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.card{position:relative;min-height:148px;padding:18px;border:1px solid #e8eeea;border-radius:13px;background:white;text-decoration:none;display:flex;flex-direction:column;align-items:flex-start;transition:transform .15s,border-color .15s}.card:hover{transform:translateY(-2px);border-color:#b9d0c4}.icon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#eaf3ee;color:#315f4d}.icon mat-icon{font-size:19px}.card strong{margin-top:12px;color:#344e43;font-size:12px}.card small{margin-top:5px;color:#88968f;font-size:10px}.arrow{position:absolute;right:16px;top:19px;color:#a4b1aa;font-size:17px}@media(max-width:620px){.cards{grid-template-columns:1fr}.welcome h1{font-size:23px}}
  `],
})
export class HomeComponent { protected readonly auth = inject(AuthService); }
