import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="page-heading">
      <div><p class="eyebrow">{{ eyebrow() }}</p><h1>{{ title() }}</h1><p class="subtitle">{{ subtitle() }}</p></div>
      <div class="heading-actions"><ng-content /></div>
    </header>
  `,
  styles: [`:host{display:block}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin:8px 0 28px}.eyebrow{margin:0 0 8px;color:#55776d;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}h1{margin:0;color:#17352e;font-size:clamp(28px,4vw,36px);letter-spacing:-.04em}.subtitle{margin:8px 0 0;color:#778a84;font-size:14px}.heading-actions{display:flex;gap:10px}@media(max-width:600px){.page-heading{align-items:flex-start;flex-direction:column;gap:16px}.heading-actions{width:100%}.heading-actions>*{flex:1}}`],
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly eyebrow = input('Administración');
}
