import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { InternshipRequest, TaskItem } from '../../core/models/models';
import { label, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../../core/data/labels';
import { poll } from '../../core/util/polling';
import { trackById } from '../../core/util/track-by';

interface InternTaskGroup {
  studentId: number;
  studentName: string;
  tasks: TaskItem[];
  completedCount: number;
  progressPct: number;
  overdueCount: number;
}

@Component({
  selector: 'app-supervisor-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Tâches par stagiaire</h2>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <h3>Assigner une tâche</h3>
      <div class="grid grid-3">
        <div class="form-group">
          <label>Stagiaire</label>
          <select [(ngModel)]="form.studentId">
            <option [ngValue]="null">Sélectionner un stagiaire...</option>
            <option [ngValue]="'ALL'">Tous mes stagiaires</option>
            <option *ngFor="let i of interns; trackBy: trackById" [ngValue]="i.student?.id">{{ i.student?.firstName }} {{ i.student?.lastName }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Titre</label>
          <input [(ngModel)]="form.title" placeholder="ex. Réunion lundi 10h00">
        </div>
        <div class="form-group">
          <label>Échéance</label>
          <input type="date" [(ngModel)]="form.deadlineDate">
        </div>
      </div>
      <div class="grid grid-2">
        <div class="form-group">
          <label>Priorité</label>
          <select [(ngModel)]="form.priority">
            <option value="LOW">Faible</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Élevée</option>
          </select>
        </div>
        <div class="form-group">
          <label>Description</label>
          <input [(ngModel)]="form.description">
        </div>
      </div>
      <button class="btn btn-primary" (click)="assign()">Assigner la tâche</button>
      <span *ngIf="assignError" class="badge badge-danger" style="margin-left: 12px;">{{ assignError }}</span>
    </div>

    <div *ngIf="loading" class="card text-muted">Chargement des tâches...</div>

    <div *ngIf="!loading">
      <div *ngFor="let group of groups" class="card" style="margin-bottom: 16px;">
        <div class="page-header" style="margin-bottom: 8px;">
          <h3 style="margin: 0;">{{ group.studentName }}</h3>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span *ngIf="group.overdueCount > 0" class="badge badge-danger">{{ group.overdueCount }} en retard</span>
          </div>
        </div>

        <div *ngFor="let t of group.tasks; trackBy: trackById" class="task-row" [class.overdue-row]="isOverdue(t)">
          <div class="task-check" [class.done]="t.status === 'COMPLETED'">
            <span *ngIf="t.status === 'COMPLETED'">✓</span>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div class="task-title" [class.done]="t.status === 'COMPLETED'">{{ t.title }}</div>
            <div *ngIf="t.description" class="text-muted" style="font-size: 12px; margin-top: 2px;">{{ t.description }}</div>
            <div class="text-muted" style="font-size: 12px; margin-top: 4px;">
              <span *ngIf="t.deadline">Échéance : {{ t.deadline | date: 'mediumDate' }}</span>
              <span *ngIf="!t.deadline">Sans échéance</span>
            </div>
          </div>
          <div class="task-meta">
            <span class="badge" [ngClass]="priorityClass(t.priority)">{{ priorityLabel(t.priority) }}</span>
            <span class="badge badge-neutral">{{ statusLabel(t.status) }}</span>
          </div>
        </div>
      </div>

      <div *ngIf="groups.length === 0" class="card text-muted">Aucune tâche assignée pour le moment.</div>
    </div>
  `,
  styles: [`
    .progress-track {
      height: 10px; border: 1.5px solid var(--color-border); border-radius: var(--radius-pill);
      background: #fff; overflow: hidden;
    }
    .progress-fill { height: 100%; background: var(--color-accent); }
    .task-row {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 0; border-top: 1px solid var(--color-border-light);
    }
    .task-row:first-of-type { border-top: none; padding-top: 0; }
    .task-check {
      width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
      border: 1.5px solid var(--color-border); display: flex; align-items: center;
      justify-content: center; font-size: 12px; font-weight: 700;
    }
    .task-check.done { background: var(--color-accent); }
    .task-row.overdue-row .task-title { color: var(--color-danger); }
    .task-title { font-weight: 500; font-size: 14px; }
    .task-title.done { text-decoration: line-through; color: var(--color-text-muted); }
    .task-meta { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  `]
})
export class SupervisorTasksComponent implements OnInit {
  interns: InternshipRequest[] = [];
  tasks: TaskItem[] = [];
  groups: InternTaskGroup[] = [];
  loading = true;
  form: any = { studentId: null, title: '', description: '', priority: 'MEDIUM', deadlineDate: '' };
  assignError = '';
  readonly trackById = trackById;

  constructor(private api: ApiService) {}

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.api.myInterns().subscribe((data) => (this.interns = data));
    // Poll every 6s so task status changes made by the student appear without
    // a manual refresh. `loading` only ever flips to false once, on the
    // first response.
    poll(() => this.api.supervisorTasks(), this.destroyRef, 6000).subscribe((data) => {
      this.loading = false;
      this.applyTasks(data);
    });
  }

  load(): void {
    this.api.supervisorTasks().subscribe((data) => this.applyTasks(data));
  }

  // Grouped by intern with a completion percentage instead of a flat table —
  // recomputed once per data refresh, never inside the template.
  private applyTasks(data: TaskItem[]): void {
    this.tasks = data;

    const byStudent = new Map<number, TaskItem[]>();
    for (const t of data) {
      if (!t.student) continue;
      const list = byStudent.get(t.student.id) ?? [];
      list.push(t);
      byStudent.set(t.student.id, list);
    }

    const byDeadline = (a: TaskItem, b: TaskItem) =>
      new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime();

    this.groups = Array.from(byStudent.entries()).map(([studentId, tasks]) => {
      const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
      const overdueCount = tasks.filter((t) => this.isOverdue(t)).length;
      const first = tasks[0].student!;
      return {
        studentId,
        studentName: `${first.firstName} ${first.lastName}`,
        tasks: [...tasks].sort(byDeadline),
        completedCount,
        progressPct: tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100),
        overdueCount,
      };
    }).sort((a, b) => a.studentName.localeCompare(b.studentName));
  }

  isOverdue(t: TaskItem): boolean {
    if (!t.deadline || t.status === 'COMPLETED') return false;
    return new Date(t.deadline) < new Date();
  }

  assign(): void {
    if (!this.form.studentId || !this.form.title.trim()) return;
    this.assignError = '';
    const dto: any = { title: this.form.title, description: this.form.description, priority: this.form.priority };
    if (this.form.deadlineDate) dto.deadline = new Date(this.form.deadlineDate).toISOString();

    const call: Observable<TaskItem[]> = this.form.studentId === 'ALL'
      ? this.api.createTaskForAllInterns(dto)
      : this.api.createTaskForIntern({ ...dto, studentId: this.form.studentId }).pipe(
          map((task) => [task])
        );

    call.subscribe({
      next: () => {
        this.form = { studentId: null, title: '', description: '', priority: 'MEDIUM', deadlineDate: '' };
        this.load();
      },
      error: (err) => (this.assignError = err.error?.message || 'Impossible d\'assigner la tâche.')
    });
  }

  priorityLabel(p: string): string {
    return label(TASK_PRIORITY_LABELS, p);
  }

  statusLabel(s: string): string {
    return label(TASK_STATUS_LABELS, s);
  }

  priorityClass(p: string): string {
    if (p === 'HIGH') return 'badge-danger';
    if (p === 'LOW') return 'badge-neutral';
    return 'badge-warning';
  }
}
