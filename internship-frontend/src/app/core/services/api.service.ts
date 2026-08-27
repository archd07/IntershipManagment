import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import * as M from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ---- Common ----
  me() { return this.http.get<M.UserDto>(`${this.base}/me`); }
  changePassword(currentPassword: string, newPassword: string) {
    return this.http.put<M.UserDto>(`${this.base}/me/password`, { currentPassword, newPassword });
  }
  myNotifications() { return this.http.get<M.Notification[]>(`${this.base}/notifications`); }
  unreadNotificationCount() { return this.http.get<{ count: number }>(`${this.base}/notifications/unread-count`); }
  markNotificationRead(id: number) { return this.http.patch(`${this.base}/notifications/${id}/read`, {}); }
  deleteNotification(id: number) { return this.http.delete(`${this.base}/notifications/${id}`); }
  getResult(requestId: number) { return this.http.get<M.Evaluation>(`${this.base}/requests/${requestId}/result`); }
  getCertificate(requestId: number) { return this.http.get<M.Certificate>(`${this.base}/requests/${requestId}/certificate`); }
  downloadCertificate(requestId: number) {
    return this.http.get(`${this.base}/requests/${requestId}/certificate/download`, { responseType: 'blob' });
  }

  // ---- Student ----
  myRequests() { return this.http.get<M.InternshipRequest[]>(`${this.base}/student/requests`); }
  saveDraft(dto: any) { return this.http.post<M.InternshipRequest>(`${this.base}/student/requests`, dto); }
  updateDraft(id: number, dto: any) { return this.http.put<M.InternshipRequest>(`${this.base}/student/requests/${id}`, dto); }
  submitRequest(id: number) { return this.http.post<M.InternshipRequest>(`${this.base}/student/requests/${id}/submit`, {}); }
  myAttendance() { return this.http.get<M.Attendance[]>(`${this.base}/student/attendance`); }
  recordAttendance(internshipRequestId: number, dto: any) {
    return this.http.post<M.Attendance>(`${this.base}/student/attendance?internshipRequestId=${internshipRequestId}`, dto);
  }
  myTasks() { return this.http.get<M.TaskItem[]>(`${this.base}/student/tasks`); }
  createStudentTask(dto: any) { return this.http.post<M.TaskItem>(`${this.base}/student/tasks`, dto); }
  updateStudentTaskStatus(id: number, status: M.TaskStatus) {
    return this.http.patch<M.TaskItem>(`${this.base}/student/tasks/${id}/status?status=${status}`, {});
  }
  submitComplaint(dto: any) { return this.http.post<M.Complaint>(`${this.base}/student/complaints`, dto); }
  myComplaints() { return this.http.get<M.Complaint[]>(`${this.base}/student/complaints`); }

  // ---- Supervisor ----
  myInterns() { return this.http.get<M.InternshipRequest[]>(`${this.base}/supervisor/interns`); }
  myProfile() { return this.http.get<M.SupervisorProfile>(`${this.base}/supervisor/profile`); }
  completeInternship(requestId: number) { return this.http.post<M.InternshipRequest>(`${this.base}/supervisor/interns/${requestId}/complete`, {}); }
  internAttendance(studentId: number) { return this.http.get<M.Attendance[]>(`${this.base}/supervisor/interns/${studentId}/attendance`); }
  supervisorTasks() { return this.http.get<M.TaskItem[]>(`${this.base}/supervisor/tasks`); }
  createTaskForIntern(dto: any) { return this.http.post<M.TaskItem>(`${this.base}/supervisor/tasks`, dto); }
  createTaskForAllInterns(dto: any) { return this.http.post<M.TaskItem[]>(`${this.base}/supervisor/tasks/bulk`, dto); }
  submitEvaluation(requestId: number, dto: any) { return this.http.post<M.Evaluation>(`${this.base}/supervisor/interns/${requestId}/evaluation`, dto); }
  confirmEvaluation(requestId: number) { return this.http.post<M.Evaluation>(`${this.base}/supervisor/interns/${requestId}/evaluation/confirm`, {}); }
  getEvaluation(requestId: number) { return this.http.get<M.Evaluation>(`${this.base}/supervisor/interns/${requestId}/evaluation`); }

  // ---- Admin ----
  dashboardStats() { return this.http.get<M.DashboardStats>(`${this.base}/admin/dashboard/stats`); }
  allRequests(status?: M.RequestStatus) {
    const qs = status ? `?status=${status}` : '';
    return this.http.get<M.InternshipRequest[]>(`${this.base}/admin/requests${qs}`);
  }
  getRequest(id: number) { return this.http.get<M.AdminRequestDetail>(`${this.base}/admin/requests/${id}`); }
  acceptRequest(id: number) { return this.http.post<M.AcceptResult>(`${this.base}/admin/requests/${id}/accept`, {}); }
  rejectRequest(id: number, reason: string) { return this.http.post<M.InternshipRequest>(`${this.base}/admin/requests/${id}/reject`, { reason }); }
  assignSupervisor(id: number, supervisorId: number) {
    return this.http.post<M.InternshipRequest>(`${this.base}/admin/requests/${id}/assign-supervisor`, { supervisorId });
  }
  changeSupervisor(id: number, supervisorId: number) {
    return this.http.put<M.InternshipRequest>(`${this.base}/admin/requests/${id}/change-supervisor`, { supervisorId });
  }
  removeIntern(id: number) { return this.http.delete(`${this.base}/admin/requests/${id}/supervisor`); }
  cancelAcceptance(id: number) { return this.http.post<M.InternshipRequest>(`${this.base}/admin/requests/${id}/cancel-acceptance`, {}); }

  allSupervisors() { return this.http.get<M.SupervisorOption[]>(`${this.base}/admin/supervisors`); }
  createSupervisor(dto: any) { return this.http.post<M.SupervisorAccountResult>(`${this.base}/admin/supervisors`, dto); }
  supervisorProfile(id: number) { return this.http.get<M.SupervisorProfile>(`${this.base}/admin/supervisors/${id}`); }
  updateSupervisorCapacity(id: number, maxInterns: number) {
    return this.http.patch<M.SupervisorProfile>(`${this.base}/admin/supervisors/${id}/capacity?maxInterns=${maxInterns}`, {});
  }
  supervisorInterns(id: number) { return this.http.get<M.InternshipRequest[]>(`${this.base}/admin/supervisors/${id}/interns`); }

  allComplaints() { return this.http.get<M.Complaint[]>(`${this.base}/admin/complaints`); }
  updateComplaintStatus(id: number, status: M.ComplaintStatus) {
    return this.http.patch<M.Complaint>(`${this.base}/admin/complaints/${id}/status?status=${status}`, {});
  }
  generateCertificate(id: number) { return this.http.post<M.Certificate>(`${this.base}/admin/requests/${id}/certificate`, {}); }

  // ---- Public (no account required) ----
  publicApply(dto: any) { return this.http.post<M.InternshipRequest>(`${this.base}/public/apply`, dto); }
  publicTrackStatus(email: string) {
    return this.http.get<M.PublicStatus[]>(`${this.base}/public/status?email=${encodeURIComponent(email)}`);
  }
}
