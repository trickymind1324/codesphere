# Database Schema Files

This directory contains consolidated SQL schema files for initializing databases in production. These files are generated from the current database state and include all tables, indexes, constraints, and types.

## Schema Files

- `schema/auth-service-schema.sql` - Auth service database schema (users, sessions, etc.)
- `schema/problem-service-schema.sql` - Problem service database schema (problems, test cases, submissions, problem files)
- `schema/assessment-service-schema.sql` - Assessment service database schema (assessments, invitations, results)

## Production Deployment

### Option 1: Use Schema Files (Recommended for Fresh Deployment)

For a fresh production deployment, use the consolidated schema files instead of running all historical migrations:

```bash
# Create databases
psql -U postgres -c "CREATE DATABASE codesphere_auth;"
psql -U postgres -c "CREATE DATABASE codesphere_problems;"
psql -U postgres -c "CREATE DATABASE codesphere_assessments;"

# Initialize schemas
psql -U postgres -d codesphere_auth < database/schema/auth-service-schema.sql
psql -U postgres -d codesphere_problems < database/schema/problem-service-schema.sql
psql -U postgres -d codesphere_assessments < database/schema/assessment-service-schema.sql

# Insert baseline migration records (prevents migrations from re-running)
psql -U postgres -d codesphere_auth -c "INSERT INTO migrations (timestamp, name) VALUES (1701000000000, 'CreateUsersTable1701000000000');"
psql -U postgres -d codesphere_problems -c "INSERT INTO migrations (timestamp, name) VALUES (1701100000000, 'CreateProblemTables1701100000000'), (1735000000000, 'CreateSubmissionsTable1735000000000'), (1738400000000, 'AddMultiFileSupport1738400000000');"
psql -U postgres -d codesphere_assessments -c "INSERT INTO migrations (timestamp, name) VALUES (1735300000000, 'CreateAssessmentTables1735300000000');"
```

### Option 2: Run Migrations (For Existing Deployments)

For existing deployments with data, run migrations to apply incremental changes:

```bash
cd backend/auth-service && npm run migration:run
cd backend/problem-service && npm run migration:run
cd backend/assessment-service && npm run migration:run
```

## Regenerating Schema Files

After adding new migrations, regenerate the schema files:

```bash
# Run all pending migrations first
cd backend/auth-service && npm run migration:run
cd backend/problem-service && npm run migration:run
cd backend/assessment-service && npm run migration:run

# Then regenerate schema dumps
docker exec codesphere-postgres-auth pg_dump -U postgres -d codesphere_auth --schema-only --no-owner --no-privileges > database/schema/auth-service-schema.sql
docker exec codesphere-postgres-problems pg_dump -U postgres -d codesphere_problems --schema-only --no-owner --no-privileges > database/schema/problem-service-schema.sql
docker exec codesphere-postgres-assessments pg_dump -U postgres -d codesphere_assessments --schema-only --no-owner --no-privileges > database/schema/assessment-service-schema.sql
```

## Schema Version

Last updated: 2026-02-02

Includes migrations up to:
- Auth Service: `1701000000000-CreateUsersTable`
- Problem Service: `1738400000000-AddMultiFileSupport` (includes multi-file debugging support)
- Assessment Service: `1735300000000-CreateAssessmentTables`
