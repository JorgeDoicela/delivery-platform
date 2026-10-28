-- Habilitación obligatoria de la extensión PostGIS para cálculo espacial
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificación de versión PostGIS instalada
DO $$
BEGIN
    RAISE NOTICE 'PostGIS Extension initialized successfully: %', postgis_full_version();
END $$;
