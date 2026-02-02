#!/bin/bash

# Production Database Initialization Script
# This script initializes fresh databases with the consolidated schema files

set -e

# Configuration (override with environment variables)
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}

# Database names
AUTH_DB=${AUTH_DB:-codesphere_auth}
PROBLEMS_DB=${PROBLEMS_DB:-codesphere_problems}
ASSESSMENTS_DB=${ASSESSMENTS_DB:-codesphere_assessments}

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Set password for non-interactive mode
export PGPASSWORD=$POSTGRES_PASSWORD

echo "=== CodeSphere Production Database Initialization ==="
echo ""
echo "Host: $POSTGRES_HOST:$POSTGRES_PORT"
echo "User: $POSTGRES_USER"
echo ""

# Function to run psql command
run_psql() {
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$@"
}

# Create databases
echo "Creating databases..."
run_psql -c "CREATE DATABASE $AUTH_DB;" 2>/dev/null || echo "Database $AUTH_DB already exists"
run_psql -c "CREATE DATABASE $PROBLEMS_DB;" 2>/dev/null || echo "Database $PROBLEMS_DB already exists"
run_psql -c "CREATE DATABASE $ASSESSMENTS_DB;" 2>/dev/null || echo "Database $ASSESSMENTS_DB already exists"
echo ""

# Initialize auth service schema
echo "Initializing $AUTH_DB schema..."
run_psql -d "$AUTH_DB" < "$SCRIPT_DIR/schema/auth-service-schema.sql"
echo "Done."

# Initialize problem service schema
echo "Initializing $PROBLEMS_DB schema..."
run_psql -d "$PROBLEMS_DB" < "$SCRIPT_DIR/schema/problem-service-schema.sql"
echo "Done."

# Initialize assessment service schema
echo "Initializing $ASSESSMENTS_DB schema..."
run_psql -d "$ASSESSMENTS_DB" < "$SCRIPT_DIR/schema/assessment-service-schema.sql"
echo "Done."

# Insert baseline migration records
echo ""
echo "Recording baseline migrations..."

run_psql -d "$AUTH_DB" -c "
INSERT INTO migrations (timestamp, name) VALUES
    (1701000000000, 'CreateUsersTable1701000000000')
ON CONFLICT DO NOTHING;
"

run_psql -d "$PROBLEMS_DB" -c "
INSERT INTO migrations (timestamp, name) VALUES
    (1701100000000, 'CreateProblemTables1701100000000'),
    (1735000000000, 'CreateSubmissionsTable1735000000000'),
    (1738400000000, 'AddMultiFileSupport1738400000000')
ON CONFLICT DO NOTHING;
"

run_psql -d "$ASSESSMENTS_DB" -c "
INSERT INTO migrations (timestamp, name) VALUES
    (1735300000000, 'CreateAssessmentTables1735300000000')
ON CONFLICT DO NOTHING;
"

echo ""
echo "=== Database initialization complete ==="
echo ""
echo "Databases created and initialized:"
echo "  - $AUTH_DB"
echo "  - $PROBLEMS_DB"
echo "  - $ASSESSMENTS_DB"
