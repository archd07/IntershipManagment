# Internship Management System — Frontend

Angular 21 (standalone components) single-page app with three role-based
dashboards: Administrator, Student, and Supervisor.

## Running

```bash
npm install
npm start
```

The app runs on **http://localhost:4200** and expects the backend at
`http://localhost:8080/api` (see `src/environments/environment.ts`).

## Structure

```
src/app/
  core/
    models/models.ts        # shared TypeScript interfaces
    services/
      auth.service.ts       # login/register/session (signals-based)
      api.service.ts        # all HTTP calls to the backend
    interceptors/auth.interceptor.ts  # attaches JWT, handles 401
    guards/
      auth.guard.ts         # requires login
      role.guard.ts         # requires a specific role
  shared/
    shell/shell.component.ts        # sidebar + topbar layout, role-aware nav
    notifications/notifications.component.ts  # shared notifications list
  features/
    auth/        landing, login, register
    admin/       dashboard, requests (accept/reject/assign), supervisors, complaints
    student/     dashboard, application (draft/submit), calendar (attendance), tasks, results, complaints
    supervisor/  dashboard, interns (attendance + evaluation), tasks
```

Routing is defined in `app.routes.ts`, lazily loading each feature component and
gating `/admin`, `/supervisor`, `/student` behind `authGuard` + `roleGuard`.

## Login

Use the seeded backend admin account to explore the admin views:

```
admin@internship.com / Admin123!
```

Register a new account from `/register` to try the student flow, and create
supervisor accounts from the admin "Supervisors" page.

## Notes

- Styling is a plain CSS enterprise-dashboard theme (`src/styles.css`) — no UI
  library dependency, easy to swap for Angular Material / Tailwind if you prefer.
- Certificate "download" is a placeholder button; wire it to the backend's
  `filePath` once real PDF generation is added server-side.
