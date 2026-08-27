import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon-dot',
  standalone: true,
  template: `<span class="icon-dot" [style.width.px]="size" [style.height.px]="size"></span>`,
  styles: [`
    .icon-dot {
      display: inline-block;
      border-radius: 50%;
      border: 1.5px solid var(--color-border);
      background: #fff;
      flex-shrink: 0;
    }
  `]
})
export class IconDotComponent {
  @Input() size = 28;
}
