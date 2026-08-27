export type Role = 'ADMIN' | 'STUDENT' | 'SUPERVISOR';

export type RequestStatus =
  | 'DRAFT' | 'SUBMITTED' | 'PENDING' | 'ACCEPTED' | 'REJECTED'
  | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type AttendanceStatus = 'PRESENT' | 'ABSENT';
export type ComplaintStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
export type EvaluationResult = 'UNSATISFACTORY' | 'SATISFACTORY' | 'VERY_SATISFACTORY';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH';

export interface AuthResponse {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
}

export interface UserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: Role;
  mustChangePassword: boolean;
}

export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: Role;
  fullName?: string;
}

export interface InternshipRequest {
  id: number;
  // Null for a guest application not yet accepted — see applicant* fields instead.
  student?: UserSummary;
  supervisor?: UserSummary;
  internshipType?: string;
  durationInWeeks: number;
  startDate?: string;
  endDate?: string;
  specialty?: string;
  entity?: string;
  status: RequestStatus;
  rejectionReason?: string;
  submittedAt?: string;
  createdAt: string;
  applicantFirstName?: string;
  applicantLastName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  applicantCin?: string;
  applicantUniversity?: string;
  applicantSchool?: string;
  applicantLevel?: string;
  applicantAcademicYear?: string;
  applicantDisplayName?: string;
}

export interface AcceptResult {
  request: InternshipRequest;
  temporaryPassword: string | null;
}

export interface AdminRequestDetail {
  request: InternshipRequest;
  // Persists across reloads/re-selections until the student actually
  // changes their password — unlike AcceptResult.temporaryPassword, which is
  // only ever populated right at the moment of acceptance.
  studentPendingTemporaryPassword: string | null;
}

export interface SupervisorAccountResult {
  supervisor: UserDto;
  temporaryPassword: string;
}

export interface PublicStatus {
  id: number;
  internshipType?: string;
  status: RequestStatus;
  rejectionReason?: string;
  submittedAt?: string;
}

export interface SupervisorProfile {
  id: number;
  user: UserSummary;
  entity?: string;
  maxInterns: number;
  currentInterns: number;
  availableCapacity?: number;
  // Persists until the supervisor changes their temporary password, then
  // becomes null — same pattern as AdminRequestDetail for students.
  pendingTemporaryPassword?: string | null;
}

// Used for supervisor selection dropdowns and admin lists — includes entity
// and current load so the admin can see it while choosing.
export interface SupervisorOption {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  entity?: string;
  currentInterns: number;
  maxInterns: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  priority: NotificationPriority;
  type: string;
  read: boolean;
  createdAt: string;
}

export interface Attendance {
  id: number;
  date: string;
  status: AttendanceStatus;
}

export interface TaskItem {
  id: number;
  title: string;
  description?: string;
  deadline?: string;
  status: TaskStatus;
  priority: TaskPriority;
  student?: UserSummary;
  supervisor?: UserSummary;
}

export interface Evaluation {
  id: number;
  overallResult: EvaluationResult;
  technicalPerformance?: number;
  professionalBehavior?: number;
  attendanceScore?: number;
  qualityOfWork?: number;
  autonomy?: number;
  communication?: number;
  finalComments?: string;
  // Once true, the evaluation is locked — the supervisor can no longer edit it.
  confirmed: boolean;
}

export interface Complaint {
  id: number;
  subject: string;
  description?: string;
  status: ComplaintStatus;
  createdAt: string;
  student?: UserSummary;
}

export interface Certificate {
  id: number;
  referenceNumber: string;
  issuedDate: string;
  filePath: string;
}

export interface DashboardStats {
  totalRequests: number;
  acceptedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  activeInterns: number;
  totalSupervisors: number;
  completedInternships: number;
  unresolvedComplaints: number;
}
