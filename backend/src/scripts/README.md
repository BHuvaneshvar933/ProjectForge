## Demo Data Seeding

This project includes a seed script that creates demo users, skills, projects, memberships, tasks, messages, applications, and notifications.

### Run Seed

From `backend/`:

```bash
npm run seed
```

### Reset Demo Data

This removes only projects tagged with `demo:projectforge` and related project data.

```bash
npm run seed:reset
```

### Demo Accounts

- `owner@demo.com` / `password123`
- `member@demo.com` / `password123`
- `applicant@demo.com` / `password123`
- `explorer@demo.com` / `password123`
