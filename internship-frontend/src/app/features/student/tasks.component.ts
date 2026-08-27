import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { TaskItem, TaskStatus } from '../../core/models/models';
import { label, TASK_PRIORITY_LABELS } from '../../core/data/labels';
import { poll } from '../../core/util/polling';
import { trackById } from '../../core/util/track-by';

interface TaskGroup {
  key: string;
  label: string;
  tasks: TaskItem[];
  urgent: boolean;
}

@Component({
  selector: 'app-student-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Mes tâches</h2>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <h3>Ajouter une tâche personnelle</h3>
      <div class="grid grid-3">
        <div class="form-group">
          <label>Titre</label>
          <input [(ngModel)]="newTitle" placeholder="ex. Préparer le rapport hebdomadaire">
        </div>
        <div class="form-group">
          <label>Échéance</label>
          <input type="date" [(ngModel)]="newDeadline">
        </div>
        <div class="form-group">
          <label>Priorité</label>
          <select [(ngModel)]="newPriority">
            <option value="LOW">Faible</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Élevée</option>
          </select>
        </div>
      </div>
      <button class="btn btn-primary" (click)="add()">Ajouter la tâche</button>
    </div>

    <div *ngIf="loading" class="card text-muted">Chargement des tâches...</div>

    <div *ngIf="!loading">
      <div *ngFor="let group of groups" class="card" style="margin-bottom: 16px;" [class.overdue-card]="group.urgent">
        <div class="page-header" style="margin-bottom: 12px;">
          <h3 style="margin: 0;">{{ group.label }}</h3>
          <span class="badge" [ngClass]="group.urgent ? 'badge-danger' : 'badge-neutral'">{{ group.tasks.length }}</span>
        </div>

        <div *ngFor="let t of group.tasks; trackBy: trackById" class="task-row">
          <div class="task-check" [class.done]="t.status === 'COMPLETED'">
            <span *ngIf="t.status === 'COMPLETED'">✓</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div class="task-title" [class.done]="t.status === 'COMPLETED'">{{ t.title }}</div>
            <div *ngIf="t.description" class="text-muted" style="font-size: 12px; margin-top: 2px;">{{ t.description }}</div>
            <div class="text-muted" style="font-size: 12px; margin-top: 4px;">
              <span *ngIf="t.deadline">Échéance : {{ t.deadline | date: 'mediumDate' }}</span>
              <span *ngIf="!t.deadline">Sans échéance</span>
              <span *ngIf="t.supervisor"> &middot; assignée par {{ t.supervisor.firstName }} {{ t.supervisor.lastName }}</span>
            </div>
          </div>
          <div class="task-meta">
            <span class="badge" [ngClass]="priorityClass(t.priority)">{{ priorityLabel(t.priority) }}</span>
            <select class="status-select" [ngModel]="t.status" (ngModelChange)="changeStatus(t, $event)">
              <option value="TODO">À faire</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="COMPLETED">Terminée</option>
            </select>
          </div>
        </div>
      </div>

      <div *ngIf="groups.length === 0" class="card text-muted">
        Aucune tâche pour le moment.
      </div>
    </div>
  `,
  styles: [`
    .overdue-card { border-color: var(--color-danger); }
    .task-row {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 0; border-top: 1px solid var(--color-border-light);
    }
    .task-row:first-of-type { border-top: none; padding-top: 0; }
    .task-check {
      width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
      border: 1.5px solid var(--color-border); display: flex; align-items: center;
      justify-content: center; font-size: 12px; font-weight: 700;
    }
    .task-check.done { background: var(--color-accent); }
    .task-title { font-weight: 500; font-size: 14px; }
    .task-title.done { text-decoration: line-through; color: var(--color-text-muted); }
    .task-meta { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .status-select { min-width: 140px; }
  `]
})
export class StudentTasksComponent implements OnInit {
  tasks: TaskItem[] = [];
  groups: TaskGroup[] = [];
  newTitle = '';
  newDeadline = '';
  newPriority: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  loading = true;
  readonly trackById = trackById;

  constructor(private api: ApiService) {}

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Poll every 6s so changes appear without a manual refresh.
    poll(() => this.api.myTasks(), this.destroyRef, 6000).subscribe((data) => {
      this.loading = false;
      this.applyTasks(data);
    });
  }

  load(): void {
    this.api.myTasks().subscribe((data) => this.applyTasks(data));
  }

  // Groups by urgency/due date instead of a static kanban column, so the
  // most time-sensitive tasks surface first — recomputed once per data
  // refresh, never inside the template (which would re-filter on every
  // change-detection cycle).
  private applyTasks(data: TaskItem[]): void {
    this.tasks = data;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const active = data.filter((t) => t.status !== 'COMPLETED');
    const completed = data.filter((t) => t.status === 'COMPLETED');

    const overdue = active.filter((t) => t.deadline && new Date(t.deadline) < todayStart);
    const today = active.filter((t) => t.deadline && new Date(t.deadline) >= todayStart && new Date(t.deadline) < todayEnd);
    const upcoming = active.filter((t) => t.deadline && new Date(t.deadline) >= todayEnd);
    const noDeadline = active.filter((t) => !t.deadline);

    const byDeadline = (a: TaskItem, b: TaskItem) =>
      new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime();

    const groups: TaskGroup[] = [
      { key: 'overdue', label: 'En retard', tasks: overdue.sort(byDeadline), urgent: true },
      { key: 'today', label: "Aujourd'hui", tasks: today.sort(byDeadline), urgent: false },
      { key: 'upcoming', label: 'À venir', tasks: upcoming.sort(byDeadline), urgent: false },
      { key: 'none', label: 'Sans échéance', tasks: noDeadline, urgent: false },
      { key: 'done', label: 'Terminées', tasks: completed, urgent: false },
    ];

    this.groups = groups.filter((g) => g.tasks.length > 0);
  }

  add(): void {
    if (!this.newTitle.trim()) return;
    const dto: any = { title: this.newTitle, priority: this.newPriority };
    if (this.newDeadline) dto.deadline = new Date(this.newDeadline).toISOString();
    this.api.createStudentTask(dto).subscribe(() => {
      this.newTitle = '';
      this.newDeadline = '';
      this.load();
    });
  }

  changeStatus(task: TaskItem, status: TaskStatus): void {
    this.api.updateStudentTaskStatus(task.id, status).subscribe(() => this.load());
  }

  priorityLabel(p: string): string {
    return label(TASK_PRIORITY_LABELS, p);
  }

  priorityClass(p: string): string {
    if (p === 'HIGH') return 'badge-danger';
    if (p === 'LOW') return 'badge-neutral';
    return 'badge-warning';
  }
}
