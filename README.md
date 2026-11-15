# Event registration

A single public page for one live event, and a staff workshop behind it.

Guests see a driver-cluster hero, a banner, and a registration form. The owner can change the words in the cluster, replace the banner, add or remove form fields, read the guest list, and clear it when the event is over. The owner can also give a manager or an assistant access to the workshop.

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
