export const REQUEST_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumise',
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Rejetée',
  ASSIGNED: 'Affectée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée'
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée'
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Élevée'
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Présent',
  ABSENT: 'Absent'
};

export const COMPLAINT_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Soumise',
  UNDER_REVIEW: 'En cours d\'examen',
  RESOLVED: 'Résolue',
  CLOSED: 'Clôturée'
};

export const EVALUATION_RESULT_LABELS: Record<string, string> = {
  UNSATISFACTORY: 'Insatisfaisant',
  SATISFACTORY: 'Satisfaisant',
  VERY_SATISFACTORY: 'Très satisfaisant'
};

export const NOTIFICATION_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Faible',
  NORMAL: 'Normale',
  HIGH: 'Élevée'
};

export function label(map: Record<string, string>, key: string | undefined | null): string {
  if (!key) return '—';
  return map[key] ?? key;
}
