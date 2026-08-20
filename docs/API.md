# API Reference

All endpoints return JSON except the poster download and attendance event stream. Authentication uses the HTTP-only `session` cookie set by the login and registration endpoints.

## Authentication

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create an attendee account and session |
| `POST` | `/api/auth/login` | Public | Verify credentials and create a session |
| `POST` | `/api/auth/logout` | Authenticated | Clear the session cookie |
| `GET` | `/api/auth/me` | Authenticated | Return the current user profile |

## Events and Configuration

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/events` | Organizer | Create an event |
| `POST` | `/api/events/:id/ticket-types` | Event organizer | Add a ticket type |
| `DELETE` | `/api/events/:id/ticket-types/:ticketTypeId` | Event organizer | Delete a ticket type |
| `GET` | `/api/events/:id/form-fields` | Public | List registration fields |
| `POST` | `/api/events/:id/form-fields` | Event organizer | Add a registration field |
| `POST` | `/api/events/:id/staff` | Event organizer | Assign an existing staff account |

## Orders, Posters, and Attendance

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/events/:id/orders` | Attendee | Create a simulated paid order and tickets |
| `POST` | `/api/events/:id/poster` | Event organizer | Upload a validated image to R2 |
| `GET` | `/api/events/:id/poster` | Public | Stream the event poster from R2 |
| `POST` | `/api/events/:id/checkin` | Assigned staff | Check in a ticket by code |
| `GET` | `/api/events/:id/attendance/stream` | Event organizer | Stream attendance snapshots as SSE |

## Important Request Shapes

Create an event:

```json
{
  "title": "Developer Conference",
  "description": "One-day technical conference",
  "location": "Toronto",
  "startAt": "2026-09-15T13:00:00.000Z",
  "endAt": "2026-09-15T21:00:00.000Z"
}
```

Create an order:

```json
{
  "items": [{ "ticketTypeId": "ticket-type-id", "quantity": 1 }],
  "registrationAnswers": { "form-field-id": "Answer" }
}
```

Check in a ticket:

```json
{ "checkInCode": "ticket-check-in-code" }
```

The implementation validates request bodies with Zod. The orders endpoint does not integrate a payment gateway; it records accepted reservations with `PAID` status for demonstration purposes.
