# Database Schema Files

This directory contains consolidated SQL schema files for initializing databases in production. These files are generated from the current database state and include all tables, indexes, constraints, and types.

Identity data (users, sessions, credentials) is **not** stored here — it lives
in Keycloak, which manages its own PostgreSQL database. The `auth-service` is a
stateless proxy in front of Keycloak and has no database of its own.

## Schema Files

- `schema/problem-service-schema.sql` - Problem service database schema (problems, test cases, submissions, problem files, user profiles, playback)
- `schema/assessment-service-schema.sql` - Assessment service database schema (assessments, invitations, results, candidate events)
- `schema/problem-library-data.sql` - The seeded problem library (60 problems: 50 algorithmic + 10 multi-file debugging, with test cases, starter code, and project files). Content only — no user data.

**`docker-compose.prod.yml` mounts these into the Postgres containers'
`/docker-entrypoint-initdb.d/`, so on the FIRST boot of an empty volume the
schema and problem library are applied automatically — a fresh clone needs no
manual database steps.**

## Production Deployment

### Option 1: Use Schema Files (Recommended for Fresh Deployment)

For a fresh production deployment, use the consolidated schema files instead of running all historical migrations:

```bash
# Create databases
psql -U postgres -c "CREATE DATABASE codesphere_problems;"
psql -U postgres -c "CREATE DATABASE codesphere_assessments;"

# Initialize schemas
psql -U postgres -d codesphere_problems < database/schema/problem-service-schema.sql
psql -U postgres -d codesphere_assessments < database/schema/assessment-service-schema.sql

# Insert baseline migration records (prevents migrations from re-running)
psql -U postgres -d codesphere_problems -c "INSERT INTO migrations (timestamp, name) VALUES (1701100000000, 'CreateProblemTables1701100000000'), (1735000000000, 'CreateSubmissionsTable1735000000000'), (1738400000000, 'AddMultiFileSupport1738400000000'), (1748700000000, 'CreatePlaybackEvents1748700000000'), (1755700000000, 'CreateUserProfiles1755700000000'), (1755800000000, 'AddProfileMedia1755800000000'), (1755900000000, 'RenameHeadlineToDesignation1755900000000');"
psql -U postgres -d codesphere_assessments -c "INSERT INTO migrations (timestamp, name) VALUES (1735300000000, 'CreateAssessmentTables1735300000000'), (1748800000000, 'CreateCandidateEvents1748800000000'), (1755600000000, 'CreateAssessmentResults1755600000000');"
```

### Option 2: Run Migrations (For Existing Deployments)

For existing deployments with data, run migrations to apply incremental changes:

```bash
cd backend/problem-service && npm run migration:run
cd backend/assessment-service && npm run migration:run
```

## Regenerating Schema Files

After adding new migrations, regenerate the schema files:

```bash
# Run all pending migrations first
cd backend/problem-service && npm run migration:run
cd backend/assessment-service && npm run migration:run

# Then regenerate schema dumps
docker exec codesphere-postgres-problems pg_dump -U postgres -d codesphere_problems --schema-only --no-owner --no-privileges > database/schema/problem-service-schema.sql
docker exec codesphere-postgres-assessments pg_dump -U postgres -d codesphere_assessments --schema-only --no-owner --no-privileges > database/schema/assessment-service-schema.sql

# Regenerate the problem-library data seed after adding/editing problems
# (content tables only, in FK-dependency order — never user data)
for t in tags problems problem_tags test_cases starter_codes problem_files; do
  docker exec codesphere-postgres-problems pg_dump -U postgres -d codesphere_problems --data-only --no-owner --no-privileges -t "public.$t"
done > database/schema/problem-library-data.sql
```

## Schema Version

Last updated: 2026-08-19 (includes user profiles/badges, playback, assessment results)

Includes migrations up to:
- Problem Service: `1755900000000-RenameHeadlineToDesignation`
- Assessment Service: `1755600000000-CreateAssessmentResults`
