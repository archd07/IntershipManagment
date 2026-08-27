# Internship Management System — Backend

Spring Boot 3 / Java 21 REST API implementing the full internship lifecycle:
application → validation → supervisor assignment → monitoring → evaluation → certificate.

## Stack
- Java 21, Spring Boot 3.4 (Web, Data JPA, Security, Validation, Mail)
- JWT authentication (jjwt)
- H2 in-memory database by default (zero setup) — swap to MySQL by editing `application.properties`
- Lombok

## Running

```bash
mvn spring-boot:run
```

The API starts on **http://localhost:8080**.

On first boot a default admin account is seeded:

```
email:    admin@internship.com
password: Admin123!
```

H2 console (dev only): http://localhost:8080/h2-console
(JDBC URL: `jdbc:h2:mem:internshipdb`, user `sa`, empty password)

## Switching to MySQL

In `src/main/resources/application.properties`, comment out the `spring.datasource.*`
H2 lines and uncomment the MySQL example below them, then rerun. The
`mysql-connector-j` dependency is already included in `pom.xml`.

## Key endpoints

| Area | Base path | Notes |
|---|---|---|
| Auth | `/api/auth/register`, `/api/auth/login` | Public registration always creates a STUDENT account |
| Student | `/api/student/**` | Requests, attendance, tasks, complaints |
| Supervisor | `/api/supervisor/**` | Interns, tasks, evaluations |
| Admin | `/api/admin/**` | Requests, supervisors, complaints, certificates, dashboard stats |
| Shared | `/api/me`, `/api/notifications`, `/api/requests/{id}/result`, `/api/requests/{id}/certificate` | Any authenticated user |

Full request/response shapes are in `dto/` and `entity/`. All endpoints require a
`Authorization: Bearer <token>` header except `/api/auth/**`.

## Business rules enforced

- Only DRAFT requests can be edited; submission freezes it for administrator review.
- Only an ADMIN can accept/reject/assign supervisors.
- A supervisor cannot be assigned past `maxInterns` capacity (`SupervisorProfile`).
- The organizational entity on a request is never chosen by the student — it's set
  automatically from the assigned supervisor's entity when the admin assigns/changes one.
- Duration (in weeks) is never entered directly — it's computed server-side from
  `startDate`/`endDate` whenever a draft is saved.
- Certificates can only be generated once a request's status is `COMPLETED`.
- State changes (accept, reject, assignment, evaluation, certificate) automatically create notifications.

## Email

`EmailService` sends real emails, but **only** to the student, and **only** when
the status of their internship request changes: accepted, rejected, supervisor
assigned/changed/removed, acceptance cancelled, or the internship marked
completed. Every other event in the app (admin/supervisor notifications,
complaints, tasks, evaluations, certificates, new-supervisor-account temp
passwords, etc.) stays as an in-app `Notification` only — no email.

It's wired directly into `InternshipRequestService`, called right alongside
the existing `notificationService.notify(...)` calls at each status
transition. Sending is `@Async` (see `@EnableAsync` on the main application
class): if SMTP is unreachable or the credentials in `application.properties`
are still the placeholder values, the failure is logged and swallowed — it
never blocks or fails the underlying accept/reject/assign/complete action.

To actually deliver mail, set real values under `spring.mail.*` in
`application.properties`. For Gmail SMTP you need an
[App Password](https://myaccount.google.com/apppasswords) (a normal account
password will be rejected); for anything beyond a demo, point it at a
transactional provider (SendGrid, Mailgun, AWS SES) instead.

## Notes for production

- Change `app.jwt.secret` in `application.properties` to a long random value, and load it from an environment variable.
- Configure real SMTP credentials under `spring.mail` — see the **Email** section above.
- `CertificateService` currently stores a placeholder file path — wire it up to an
  actual PDF generator (e.g. the `pdf` skill / iText / OpenPDF) for a real printable attestation.
- Add ownership checks in `CommonController` before exposing `/api/requests/{id}/result`
  and `/certificate` broadly — this scaffold trusts the frontend to only request a student's own data.
