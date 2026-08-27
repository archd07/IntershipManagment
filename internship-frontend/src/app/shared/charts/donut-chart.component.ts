import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DonutChartDatum {
  label: string;
  value: number;
  colorVar: string; // CSS variable name, e.g. '--color-success'
}

interface Segment extends DonutChartDatum {
  dashArray: string;
  dashOffset: number;
  pct: number;
}

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="donut-wrap">
      <svg viewBox="0 0 120 120" width="140" height="140">
        <circle cx="60" cy="60" r="48" fill="none" [attr.stroke]="'var(--color-border-light)'" stroke-width="16"></circle>
        <circle
          *ngFor="let s of segments"
          cx="60" cy="60" r="48" fill="none"
          [attr.stroke]="'var(' + s.colorVar + ')'"
          stroke-width="16"
          [attr.stroke-dasharray]="s.dashArray"
          [attr.stroke-dashoffset]="s.dashOffset"
          transform="rotate(-90 60 60)"
        ></circle>
        <text x="60" y="56" text-anchor="middle" font-size="20" font-weight="700" fill="var(--color-text)">{{ total }}</text>
        <text x="60" y="72" text-anchor="middle" font-size="9" fill="var(--color-text-muted)">total</text>
      </svg>
      <div class="donut-legend">
        <div class="legend-row" *ngFor="let s of segments">
          <span class="legend-dot" [style.background]="'var(' + s.colorVar + ')'"></span>
          {{ s.label }} &middot; {{ s.value }}
        </div>
        <div *ngIf="segments.length === 0" class="text-muted">No data yet.</div>
      </div>
    </div>
  `,
  styles: [`
    .donut-wrap { display: flex; align-items: center; gap: 20px; }
    .donut-legend { display: flex; flex-direction: column; gap: 8px; }
    .legend-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .legend-dot {
      width: 10px; height: 10px; border-radius: 50%;
      border: 1.5px solid var(--color-border); display: inline-block;
    }
  `]
})
export class DonutChartComponent implements OnChanges {
  @Input() data: DonutChartDatum[] = [];

  segments: Segment[] = [];
  total = 0;

  private readonly circumference = 2 * Math.PI * 48;

  ngOnChanges(): void {
    this.total = this.data.reduce((sum, d) => sum + d.value, 0) || 0;
    let cumulative = 0;
    this.segments = this.data
      .filter((d) => d.value > 0)
      .map((d) => {
        const pct = this.total === 0 ? 0 : d.value / this.total;
        const length = pct * this.circumference;
        const dashArray = `${length} ${this.circumference - length}`;
        const dashOffset = -cumulative * this.circumference;
        cumulative += pct;
        return { ...d, dashArray, dashOffset, pct };
      });
  }
}
