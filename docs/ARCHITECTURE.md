# Architecture and Security Notes

## Application Boundaries

The project is a single Next.js application. Server Components render data-backed pages, client components handle forms and camera scanning, and Route Handlers provide the HTTP API. Prisma connects those server-side paths to PostgreSQL. The browser never receives database or R2 credentials.

## Authorization Model

Users have one of three roles:

- `ORGANIZER` manages only events it owns, including ticket types, fields, staff, posters, and attendance.
- `STAFF` sees assigned events and can check in tickets only for those events.
- `ATTENDEE` browses events, creates orders, and views only tickets connected to its user ID.

Middleware redirects users away from role-specific page trees. API handlers repeat authorization checks because middleware is not a substitute for server-side resource authorization.

Sessions are HS256 JWTs stored in an HTTP-only, same-site cookie. `JWT_SECRET` is mandatory and must contain at least 32 characters. Passwords are hashed with bcrypt and are never selected into client responses.

## Data Model

`User`, `Event`, and `TicketType` form the catalog and ownership layer. `Order` and `OrderItem` record a reservation, while each `Ticket` carries a unique check-in code. `EventStaff` grants event-scoped staff access. `CheckIn` has a unique `ticketId`, providing database-level duplicate protection in addition to application checks. Custom `FormField` values are attached to an order through `RegistrationAnswer`.

## Object Storage

Poster files are uploaded through an organizer-authorized API route. Supported types are PNG, JPEG, and WebP, with a 5 MB limit enforced by the UI/API implementation. The database stores an R2 object key and the application streams the object through its own poster endpoint.

## Live Attendance Limitation

The SSE broadcaster stores subscribers in the Node.js process. Database state remains authoritative, and each new connection receives a fresh database snapshot. However, a check-in handled by one process cannot push to a client connected to another process. Horizontal deployment therefore needs shared pub/sub (for example Redis) before live updates can be considered multi-instance safe.

## Payment and Inventory Scope

Orders are marked paid without contacting a payment provider. The current implementation is suitable for demonstrating ticket lifecycle and check-in flows, not processing real funds. Production commerce would require payment-provider webhooks, idempotency keys, transactional inventory reservation, and expiration/reconciliation rules.
