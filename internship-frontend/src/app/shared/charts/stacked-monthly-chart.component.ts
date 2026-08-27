import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MonthlyStatusCount {
  label: string;
  value: number;
  color: string;
}

export interface MonthlyChartDatum {
  label: string;
  total: number;
  statuses: MonthlyStatusCount[];
}

@Component({
  selector: 'app-stacked-monthly-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-shell">
      <div class="y-axis-title">Nombre de demandes</div>
      <div class="chart-area">
        <div class="y-axis-scale">
          <span>{{ maxTotal }}</span>
          <span>{{ halfTotal }}</span>
          <span>0</span>
        </div>
        <div class="plot">
          <div class="grid-line grid-line-top"></div>
          <div class="grid-line grid-line-middle"></div>
          <div class="grid-line grid-line-bottom"></div>
          <div class="bars">
            <div class="month-column" *ngFor="let month of data">
              <div class="bar" [style.height.%]="barHeight(month.total)" [attr.title]="month.label + ': ' + month.total + ' demande(s)'">
                <div
                  class="segment"
                  *ngFor="let status of month.statuses"
                  [style.height.%]="segmentHeight(status.value, month.total)"
                  [style.background]="status.color"
                  [attr.title]="status.label + ': ' + status.value"
                ></div>
              </div>
              <span class="month-label">{{ month.label }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="legend">
        <span *ngFor="let status of legend" class="legend-item">
          <span class="legend-dot" [style.background]="status.color"></span>{{ status.label }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .chart-shell { min-height: 280px; }
    .y-axis-title { color: var(--color-text-muted); font-size: 11px; margin-bottom: 8px; }
    .chart-area { display: flex; height: 210px; }
    .y-axis-scale { width: 34px; color: var(--color-text-muted); display: flex; flex-direction: column; justify-content: space-between; font-size: 11px; padding-bottom: 25px; }
    .plot { flex: 1; min-width: 0; position: relative; border-bottom: 1px solid var(--color-border); }
    .grid-line { position: absolute; left: 0; right: 0; border-top: 1px dashed var(--color-border-light); }
    .grid-line-top { top: 0; }
    .grid-line-middle { top: 50%; }
    .grid-line-bottom { bottom: 25px; }
    .bars { position: absolute; inset: 0 0 25px; display: flex; align-items: end; justify-content: space-around; gap: 5px; padding: 0 4px; }
    .month-column { height: 100%; flex: 1; min-width: 24px; display: flex; flex-direction: column; justify-content: end; align-items: center; position: relative; z-index: 1; }
    .bar { width: min(34px, 80%); min-height: 0; display: flex; flex-direction: column-reverse; border: 1px solid var(--color-border); border-bottom: 0; transition: height .25s ease; }
    .segment { min-height: 0; border-top: 1px solid rgba(255, 255, 255, .75); }
    .month-label { color: var(--color-text-muted); font-size: 10px; margin-top: 8px; white-space: nowrap; }
    .legend { display: flex; gap: 12px 18px; flex-wrap: wrap; margin: 14px 0 0 34px; }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; }
    .legend-dot { width: 10px; height: 10px; border: 1px solid var(--color-border); display: inline-block; }
  `]
})
export class StackedMonthlyChartComponent {
  @Input() data: MonthlyChartDatum[] = [];
  @Input() legend: MonthlyStatusCount[] = [];

  get maxTotal(): number {
    return Math.max(1, ...this.data.map((month) => month.total));
  }

  get halfTotal(): number {
    return Math.ceil(this.maxTotal / 2);
  }

  barHeight(total: number): number {
    return total === 0 ? 0 : (total / this.maxTotal) * 100;
  }

  segmentHeight(value: number, total: number): number {
    return total === 0 ? 0 : (value / total) * 100;
  }
}
