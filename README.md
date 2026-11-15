# Event registration

A single public page for one live event, and a staff workshop behind it.

Guests see a top bar with the event logo and a notification bell, a driver-cluster hero, a banner, a registration form, and footer social icons. On **Form** in the admin panel, the owner or manager creates the event guests see, chooses which fields to collect, and can set a registration close timer in Bangladesh time (Asia/Dhaka, UTC+6). When that moment passes, registration turns off automatically. **Site** holds the logo and Discord / Instagram / YouTube / Facebook links. **Notices** posts messages to the public bell. The owner can also replace the banner, read the guest list, clear it when the event is over, and invite moderators.

## Roles

- **Owner** — created on the first visit to `/admin`. Can do everything, including inviting staff and clearing every registration.
- **Manager** — can edit the hero, banner, and form, and can remove a single registration.
- **Assistant** — can view and export the guest list.

## Run locally

```bash
npm install
npm run dev
```

Open the public page at [http://localhost:4317](http://localhost:4317). Open [http://localhost:4317/admin](http://localhost:4317/admin) to create the owner account.

Local data is stored in memory and starts over when the dev server restarts. When the app is published, it uses its own Postgres database. Set `SESSION_SECRET` in production so session tokens are hashed with a private value. Without it, the app still runs with a local fallback.
