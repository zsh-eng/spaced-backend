# spaced-backend

`pnpm drizzle-kit generate` to generate the schema.
Copy it to the test cases.

## Local Setup

``` shell
# 1. Delete existing local database
rm -rf .wrangler/state

# 2. Apply all migrations (creates new database)
wrangler d1 migrations apply spaced-backend --local

# 3. Seed with your data
wrangler d1 execute spaced-backend --local --file=./scripts/seed.sql
```

Username is `test@email.com` password is `password`.
