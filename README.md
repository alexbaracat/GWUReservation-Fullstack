# GWU Room Reservation System (Duquès & Funger Hall)

A real-time, web-based study-room reservation system for the George Washington University School of Business (GWSB) Duquès & Funger Hall complex. It was planned and built by a five-member team for **ISTM 6204: IT Project Management** (final report dated April 16, 2025).

> **Status:** front-end prototype. Login, calendar, booking rules and admin export work in the browser with data kept in `localStorage`. The backend, database, SSO and email notifications described below are the planned production architecture and are not implemented in this repository yet.

## Why this project exists

Booking a study room in Duquès & Funger Hall currently means submitting a request through a web portal and waiting **24–48 hours** for confirmation. Students need rooms for group projects and exam preparation on short notice, some report double-booked rooms, and facilities staff spend time manually reviewing and assigning requests.

The goal is to replace that with instant booking, a live availability calendar, and automatic confirmations.

## Features

Planned for the full system (from the project vision board):

- Real-time calendar availability for every room
- Instant booking and cancellation, with automated confirmation emails (SMTP)
- Secure login restricted to GWU email accounts
- Room details (seating capacity, whiteboards, accessibility features)
- Mobile-responsive design
- Admin controls for monitoring usage, cancelling bookings, setting limits and reporting
- Class-schedule sync so classrooms cannot be booked during lectures

Working in this prototype:

| Area | Behavior |
| --- | --- |
| Login | GWU email required; role is derived from the domain (`@admin.gwu.edu` = admin, `@email.gwu.edu` = faculty, `@gwmail.gwu.edu` / `@gwu.edu` = student) |
| Calendar | Day view of every room in 30-minute slots from 9:00 AM to 10:30 PM, navigable up to 14 days ahead |
| Booking | Click an available slot to book it; click your own booking to cancel it. Past slots cannot be booked |
| Rules | Students are limited to 2 hours (4 slots) per day; faculty see the Faculty Lounge and Conference Room A; admins see every room |
| Admin | Cancel any reservation and download all reservations as CSV |
| Persistence | Bookings survive reloads and day navigation (stored in `localStorage`) |
| Mobile | Responsive layout with a horizontally scrollable calendar and a sticky room column |

Demo reservations by other users are generated deterministically per day so the calendar is never empty.

## Running it

No build step is needed. Open `loginpage.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/loginpage.html
```

Try these emails: `you@gwmail.gwu.edu` (student), `you@email.gwu.edu` (faculty), `you@admin.gwu.edu` (admin).

## Repository layout

```
loginpage.html / .css / .js   Login form and role detection
calendar.html / .css / .js    Reservation calendar, booking rules, admin tools
README.md                     This file
```

## Bug fixes in the current version

- **Booking did nothing.** Clicking an available slot only showed an alert. It now reserves the slot and updates the calendar.
- **Availability was random.** The calendar regenerated random data on every page load and every day change. Reservations are now persisted and demo data is deterministic per day.
- **Admin cancel was wrong.** Cancelling one reservation re-randomised the whole calendar. It now cancels only the selected slot.
- **Daily limit counted the wrong things.** It counted every student reservation in the building. It now counts only the signed-in user's bookings for the day.
- **"Download Reservations" never worked.** The admin button was permanently hidden and its function was undefined. It is now shown to admins and exports a CSV, protected against spreadsheet formula injection.
- **Two-week rule and past slots were not enforced.** Navigation and booking now respect both.
- **Login script was empty.** `loginpage.js` was an empty file with the logic inlined in the HTML. The logic now lives in the script file, with email trimming and validation, and an inline error instead of an alert.
- **No logout, and weak access check.** Added a logout button, and the calendar now requires both an email and a role.
- **Unsafe inline handlers.** Cells were built with string-interpolated `onclick` attributes. They now use DOM APIs and event listeners, with keyboard support (Enter/Space).
- **Mobile layout.** Added the missing viewport meta tag to the login page and a scrollable calendar with minimum column widths.
- **Student email domain.** `@gwmail.gwu.edu` is now recognised as a student address.

## Known limitations

- Authentication is client-side only, so role and email in `localStorage` can be edited by the user. Real access control must be enforced by a backend or GWU single sign-on.
- Reservations are stored per browser, not shared between users.
- Email confirmations, attendee invites, reminders, class-schedule sync, no-show release and room-feature filters are not implemented yet.

## Planned architecture and cost (from the final report)

- **Hosting:** Amazon EC2 (web app), Amazon RDS for SQL Server (reservations and room data), Amazon Route 53 (DNS)
- **Annual hosting and infrastructure:** about $1,578–$1,625 depending on DNS query volume
- **Development cost:** $28,050 (bottom-up estimate of $25,500 plus 10% contingency)
- **Estimated annual savings:** $40,000 (reduced admin labor, better room utilization, lower IT support cost)
- **Return:** about 470% ROI over four years and an NPV of $98,744.62 at a 10% discount rate

## Project plan

Built with Agile across four one-week sprints (March 10 – April 7, 2025), 20 user stories in total:

| Sprint | Focus |
| --- | --- |
| 1 (Mar 10–17) | Core booking, faculty room access, accessibility info, live availability |
| 2 (Mar 17–24) | GWU email login, attendee emails, calendar view, booking restrictions, class-schedule sync |
| 3 (Mar 24–31) | Notifications and reminders, room size and type, staff-only rooms, admin contact info, usage monitoring |
| 4 (Mar 31–Apr 7) | Facilities dashboard, admin cancellation, usage data and reports, mobile access |

Deliverables also included a work breakdown structure, schedule, RACI chart, communication plan, risk register and lessons learned.

## Lessons learned

1. Use a formal meeting template with an agenda and action items.
2. Assign a clear owner to every user story and keep the RACI chart current.
3. Estimate with experienced developers and add buffer for integration work.
4. Start collecting room data (accessibility, capacity) early, in parallel with wireframes and the ERD.
5. Run lightweight user testing every sprint instead of leaving it to the final UAT.

## Team

Kaitlyn Wassel, Lily Han Htun, Alexandre De Carvalho Baracat, Elliott Jaz Irwin and Ruben Salazar. Faculty advisor: Dr. Khaled Falah. ISTM 6204: IT Project Management, George Washington University.
