import { Component, input } from '@angular/core';
@Component({ selector: 'app-status-badge', standalone: true, template: `<span class="badge" [class.active]="active()"><span class="dot"></span>{{ active() ? activeLabel() : inactiveLabel() }}</span>`, styles: [`.badge{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border-radius:999px;background:#f2f2ee;color:#718078;font-size:11px;font-weight:700;letter-spacing:.04em}.badge.active{background:#e6f3eb;color:#2f7958}.dot{width:6px;height:6px;border-radius:50%;background:currentColor}`] })
export class StatusBadgeComponent {
  readonly active = input.required<boolean>();
  readonly activeLabel = input('ACTIVO');
  readonly inactiveLabel = input('INACTIVO');
}
