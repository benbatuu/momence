-- Studio OS - PostgreSQL başlangıç SQL'i
-- Bu dosya PostgreSQL konteyneri ilk kez oluşturulduğunda çalışır.

-- Uygulama rolü (RLS bypasssız - normal sorgular)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'studio_os_app') THEN
    CREATE ROLE studio_os_app WITH LOGIN PASSWORD 'studio_os_app_secret';
  END IF;
END
$$;

-- Migration rolü (şema değişiklikleri için)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'studio_os_migrator') THEN
    CREATE ROLE studio_os_migrator WITH LOGIN PASSWORD 'studio_os_migrator_secret' CREATEROLE;
  END IF;
END
$$;

-- Yetkilendirmeler
GRANT CONNECT ON DATABASE studio_os_dev TO studio_os_app;
GRANT CONNECT ON DATABASE studio_os_dev TO studio_os_migrator;
GRANT ALL PRIVILEGES ON DATABASE studio_os_dev TO studio_os_migrator;

-- UUID eklentisi
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgcrypto eklentisi (hash/şifreleme için)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
