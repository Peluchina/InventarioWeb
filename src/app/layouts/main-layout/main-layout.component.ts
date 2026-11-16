import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatSidenavModule, MatToolbarModule],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav #drawer class="sidebar" [mode]="isMobile() ? 'over' : 'side'" [opened]="drawerOpened()" (openedChange)="drawerOpened.set($event)">
        <a class="brand" routerLink="/inicio" aria-label="Inicio de Stockwise"><span class="brand-mark"><mat-icon>inventory_2</mat-icon></span><span><strong>Stockwise</strong><small>GESTIÓN DE INVENTARIO</small></span></a>
        <div class="nav-label">MENÚ PRINCIPAL</div>
        <a class="nav-item" routerLink="/inicio" routerLinkActive="selected" [routerLinkActiveOptions]="{ exact: true }"><mat-icon>home</mat-icon><span>Inicio</span></a>
        <div class="nav-label group-label">INVENTARIO</div>
        <a class="nav-item" routerLink="/productos" routerLinkActive="selected"><mat-icon>inventory</mat-icon><span>Productos</span></a>
        <a class="nav-item" routerLink="/categorias" routerLinkActive="selected"><mat-icon>category</mat-icon><span>Categorías</span></a>
        <a class="nav-item" routerLink="/almacenes" routerLinkActive="selected"><mat-icon>warehouse</mat-icon><span>Almacenes</span></a>
        <a class="nav-item" routerLink="/movimientos-inventario" routerLinkActive="selected"><mat-icon>swap_horiz</mat-icon><span>Movimientos</span></a>
        <div class="nav-label group-label">ADMINISTRACIÓN</div>
        <a class="nav-item" routerLink="/proveedores" routerLinkActive="selected"><mat-icon>local_shipping</mat-icon><span>Proveedores</span></a>
        <a class="nav-item" routerLink="/usuarios" routerLinkActive="selected"><mat-icon>group</mat-icon><span>Usuarios</span></a>
        <div class="sidebar-bottom"><div class="profile"><span class="avatar" [style.background-image]="auth.currentUser()?.picture ? 'url(' + auth.currentUser()?.picture + ')' : null">{{ auth.currentUser()?.name?.charAt(0)?.toUpperCase() }}</span><span class="profile-text"><strong>{{ auth.currentUser()?.name }}</strong><small>{{ auth.currentUser()?.email }}</small></span></div><button mat-button class="logout-button" (click)="auth.logout()"><mat-icon>logout</mat-icon>Cerrar sesión</button></div>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar class="topbar"><button mat-icon-button class="menu-toggle" aria-label="Abrir menú" (click)="drawer.toggle()"><mat-icon>menu</mat-icon></button><div class="breadcrumbs">Stockwise <mat-icon>chevron_right</mat-icon> <strong>{{ currentSection() }}</strong></div><span class="spacer"></span><span class="toolbar-user">{{ auth.currentUser()?.name }}</span><span class="top-avatar" [style.background-image]="auth.currentUser()?.picture ? 'url(' + auth.currentUser()?.picture + ')' : null">{{ auth.currentUser()?.name?.charAt(0)?.toUpperCase() }}</span></mat-toolbar>
        <main class="main-content"><router-outlet /></main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host{display:block;min-height:100vh}.shell{height:100vh;background:#f7f9f7}.sidebar{width:252px;background:#fff;border-right:1px solid #e9efeb;padding:24px 16px;box-sizing:border-box;display:flex;flex-direction:column}.brand{display:flex;align-items:center;gap:12px;padding:3px 10px 32px;text-decoration:none;color:#17352e}.brand-mark{width:38px;height:38px;border-radius:13px;background:#214e40;color:white;display:grid;place-items:center}.brand strong{display:block;font-size:17px;letter-spacing:-.04em}.brand small{display:block;margin-top:3px;font-size:8px;font-weight:700;letter-spacing:.11em;color:#98a8a1}.nav-label{padding:11px 12px;color:#a3b0aa;font-size:9px;font-weight:700;letter-spacing:.12em}.group-label{margin-top:14px}.nav-item{height:42px;display:flex;align-items:center;gap:12px;padding:0 12px;margin:2px 0;border-radius:9px;text-decoration:none;color:#718079;font-size:12px;font-weight:600}.nav-item mat-icon{width:19px;height:19px;font-size:19px}.nav-item.selected{color:#285c4c;background:#eaf3ee}.nav-item.muted{color:#a4afa9;cursor:default}.soon{font-size:9px;margin-left:auto;background:#f1f4f1;padding:4px 6px;border-radius:5px}.sidebar-bottom{margin-top:auto}.profile{display:flex;align-items:center;gap:10px;border-top:1px solid #edf1ee;padding:17px 5px 0}.avatar,.top-avatar{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background-color:#dcebe3;background-position:center;background-size:cover;color:#315f4d;font-size:12px;font-weight:700;flex:none}.profile-text{display:flex;min-width:0;flex:1;flex-direction:column;gap:3px}.profile-text strong,.profile-text small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.profile-text strong{font-size:11px;color:#344e45}.profile-text small{font-size:9px;color:#97a59f}.logout-button{width:100%;justify-content:flex-start;margin-top:13px;color:#78877f;font-size:11px}.logout-button mat-icon{font-size:17px}.topbar{height:64px;background:#fff;border-bottom:1px solid #e9efeb;padding:0 30px;gap:15px;color:#8a9992}.breadcrumbs{display:flex;align-items:center;gap:8px;font-size:11px}.breadcrumbs mat-icon{font-size:16px;width:16px;height:16px}.breadcrumbs strong{color:#3b554b;font-weight:600}.spacer{flex:1}.toolbar-user{font-size:11px;color:#596d63}.top-avatar{width:29px;height:29px;font-size:11px}.main-content{max-width:1440px;margin:0 auto;padding:34px 40px 54px}.menu-toggle{display:none}@media(max-width:900px){.sidebar{width:220px}.main-content{padding:28px 24px}}@media(max-width:680px){.sidebar{width:260px}.menu-toggle{display:inline-flex}.topbar{padding:0 13px;gap:8px}.toolbar-user{display:none}.main-content{padding:22px 16px 36px}}
  `],
})
export class MainLayoutComponent {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly isMobile = signal(window.innerWidth <= 680);
  protected readonly drawerOpened = signal(window.innerWidth > 680);

  protected currentSection(): string { return this.router.url.startsWith('/inicio') || this.router.url === '/' ? 'Inicio' : this.router.url.startsWith('/usuarios') ? 'Usuarios' : this.router.url.startsWith('/productos') ? 'Productos' : this.router.url.startsWith('/movimientos-inventario') ? 'Movimientos' : this.router.url.startsWith('/categorias') ? 'Categorías' : this.router.url.startsWith('/almacenes') ? 'Almacenes' : 'Proveedores'; }

  @HostListener('window:resize')
  protected onResize(): void {
    const mobile = window.innerWidth <= 680;
    this.isMobile.set(mobile);
    if (!mobile) this.drawerOpened.set(true);
  }
}

