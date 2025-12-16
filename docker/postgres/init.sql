-- VoxLink Database Initialization Script
-- This script sets up the initial database structure for development

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create development user with appropriate permissions
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'voxlink_dev') THEN
        CREATE ROLE voxlink_dev WITH LOGIN PASSWORD 'voxlink_dev_password';
    END IF;
END
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE voxlink_dev TO voxlink_dev;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO voxlink_dev;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO voxlink_dev;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO voxlink_dev;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO voxlink_dev;

-- Create initial schema (will be managed by Prisma migrations)
-- This is just to ensure the database is ready for Prisma

COMMENT ON DATABASE voxlink_dev IS 'VoxLink development database';

-- Log successful initialization
INSERT INTO pg_stat_statements_info VALUES ('Database initialized successfully') ON CONFLICT DO NOTHING;