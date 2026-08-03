# MenuHub

Multi-business digital menu platform with customer menus, QR downloads, business dashboards, and a protected super-admin console.

## Local setup

Copy `.env.example` to `.env` and fill in every value. Generate the admin password hash without storing its plaintext:

```bash
node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" 'use-a-strong-password'
npm run dev
```

## Deployment

Set every value from `.env.example` in the deployment provider. `NEXTAUTH_SECRET` and `SUPER_ADMIN_SESSION_SECRET` must be different, random production secrets. The application has no default super-admin account and refuses super-admin authentication until valid credentials are configured.

The connected database predates Prisma Migrate. Before the first deployment, baseline the included initial migration against that existing database once, then use Prisma Migrate for each deployment. Do not use `prisma db push` in production.

```bash
npx prisma migrate resolve --applied 20260727000000_initial
npx prisma migrate deploy
npm run build
```
