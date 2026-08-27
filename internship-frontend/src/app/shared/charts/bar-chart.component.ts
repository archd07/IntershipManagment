import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BarChartDatum {
  label: string;
  value: number;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bar-chart">
      <div class="bar-row" *ngFor="let d of data">
        <div class="bar-label">{{ d.label }}</div>
        <div class="bar-track">
          <div class="bar-fill" [style.width.%]="pct(d.value)"></div>
        </div>
        <div class="bar-value">{{ d.value }}</div>
      </div>
      <div *ngIf="data.length === 0" class="text-muted">No data yet.</div>
    </div>
  `,
  styles: [`
    .bar-chart { display: flex; flex-direction: column; gap: 14px; }
    .bar-row { display: grid; grid-template-columns: 130px 1fr 36px; align-items: center; gap: 12px; }
    .bar-label { font-size: 12px; color: var(--color-text-muted); }
    .bar-track {
      height: 14px;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-pill);
      background: #fff;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: var(--color-accent);
      border-right: 1.5px solid var(--color-border);
      transition: width 0.3s ease;
    }
    .bar-value { font-size: 12px; font-weight: 600; text-align: right; }
  `]
})
export class BarChartComponent {
  @Input() data: BarChartDatum[] = [];

  pct(value: number): number {
    const max = Math.max(1, ...this.data.map((d) => d.value));
    return (value / max) * 100;
  }
}
