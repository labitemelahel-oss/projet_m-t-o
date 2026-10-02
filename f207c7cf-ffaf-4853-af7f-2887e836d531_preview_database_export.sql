-- genspark preview database export — schema + data
-- Importable via Hosted Deploy 'Import Database' (INSERT OR REPLACE; existing rows with the same id are overwritten).
CREATE TABLE IF NOT EXISTS "alert_rules" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "city_id" TEXT,
  "metric" TEXT,
  "operator" TEXT,
  "threshold" REAL,
  "window_hours" REAL,
  "message" TEXT,
  "active" BOOLEAN,
  "notify_browser" BOOLEAN,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT OR REPLACE INTO "alert_rules" ("id", "name", "city_id", "metric", "operator", "threshold", "window_hours", "message", "active", "notify_browser", "created_at", "updated_at") VALUES ('rule-1', 'Risque de pluie sur parcelle', 'city-cotonou', 'rain_prob', '>=', 70, 24, 'Forte probabilité de pluie : reportez l''arrosage et protégez la récolte en cours de séchage.', 1, 1, '2026-10-01T20:04:21.806Z', '2026-10-01T20:04:21.806Z');
INSERT OR REPLACE INTO "alert_rules" ("id", "name", "city_id", "metric", "operator", "threshold", "window_hours", "message", "active", "notify_browser", "created_at", "updated_at") VALUES ('rule-2', 'Coup de chaleur', 'city-parakou', 'temp_max', '>', 38, 48, 'Chaleur extrême : arrosez tôt le matin, ombrez les jeunes plants, abreuvez le bétail plus souvent.', 1, 0, '2026-10-01T20:04:21.806Z', '2026-10-01T20:04:21.806Z');
INSERT OR REPLACE INTO "alert_rules" ("id", "name", "city_id", "metric", "operator", "threshold", "window_hours", "message", "active", "notify_browser", "created_at", "updated_at") VALUES ('rule-3', 'Vent fort / risque de verse', 'city-kandi', 'wind_kmh', '>', 45, 36, 'Vents forts : tuteurez les cultures hautes, rentrez le matériel léger, évitez les traitements.', 1, 1, '2026-10-01T20:04:21.806Z', '2026-10-01T20:04:21.806Z');
INSERT OR REPLACE INTO "alert_rules" ("id", "name", "city_id", "metric", "operator", "threshold", "window_hours", "message", "active", "notify_browser", "created_at", "updated_at") VALUES ('rule-4', 'Nuit froide', 'city-natitingou', 'temp_min', '<', 15, 24, 'Températures basses nocturnes : brumisez avant l''aube et couvrez les pépinières.', 1, 0, '2026-10-01T20:04:21.806Z', '2026-10-01T20:04:21.806Z');
INSERT OR REPLACE INTO "alert_rules" ("id", "name", "city_id", "metric", "operator", "threshold", "window_hours", "message", "active", "notify_browser", "created_at", "updated_at") VALUES ('rule-5', 'Déficit hydrique', 'city-bohicon', 'rain_mm', '<', 5, 72, 'Aucune pluie utile en vue : planifiez un arrosage d''appoint (20-25 mm) sur les cultures en floraison.', 1, 1, '2026-10-01T20:04:21.806Z', '2026-10-01T20:04:21.806Z');

CREATE TABLE IF NOT EXISTS "cities" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "country" TEXT,
  "admin1" TEXT,
  "latitude" REAL,
  "longitude" REAL,
  "timezone" TEXT,
  "is_primary" BOOLEAN,
  "sort_order" REAL,
  "label" TEXT,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT OR REPLACE INTO "cities" ("id", "name", "country", "admin1", "latitude", "longitude", "timezone", "is_primary", "sort_order", "label", "created_at", "updated_at") VALUES ('city-cotonou', 'Cotonou', 'Bénin', 'Littoral', 6.3654, 2.4183, 'Africa/Porto-Novo', 1, 1, 'Siège principal', '2026-10-01T20:04:21.918Z', '2026-10-01T20:04:21.918Z');
INSERT OR REPLACE INTO "cities" ("id", "name", "country", "admin1", "latitude", "longitude", "timezone", "is_primary", "sort_order", "label", "created_at", "updated_at") VALUES ('city-porto-novo', 'Porto-Novo', 'Bénin', 'Ouémé', 6.4969, 2.6289, 'Africa/Porto-Novo', 0, 2, 'Capitale', '2026-10-01T20:04:21.918Z', '2026-10-01T20:04:21.918Z');
INSERT OR REPLACE INTO "cities" ("id", "name", "country", "admin1", "latitude", "longitude", "timezone", "is_primary", "sort_order", "label", "created_at", "updated_at") VALUES ('city-abomey-calavi', 'Abomey-Calavi', 'Bénin', 'Atlantique', 6.4489, 2.3556, 'Africa/Porto-Novo', 0, 3, 'Maraîchage', '2026-10-01T20:04:21.918Z', '2026-10-01T20:04:21.918Z');
INSERT OR REPLACE INTO "cities" ("id", "name", "country", "admin1", "latitude", "longitude", "timezone", "is_primary", "sort_order", "label", "created_at", "updated_at") VALUES ('city-parakou', 'Parakou', 'Bénin', 'Borgou', 9.3372, 2.6303, 'Africa/Porto-Novo', 0, 4, 'Zone cotonnière', '2026-10-01T20:04:21.918Z', '2026-10-01T20:04:21.918Z');
INSERT OR REPLACE INTO "cities" ("id", "name", "country", "admin1", "latitude", "longitude", "timezone", "is_primary", "sort_order", "label", "created_at", "updated_at") VALUES ('city-bohicon', 'Bohicon', 'Bénin', 'Zou', 7.1782, 2.0667, 'Africa/Porto-Novo', 0, 5, 'Céréales', '2026-10-01T20:04:21.918Z', '2026-10-01T20:04:21.918Z');
INSERT OR REPLACE INTO "cities" ("id", "name", "country", "admin1", "latitude", "longitude", "timezone", "is_primary", "sort_order", "label", "created_at", "updated_at") VALUES ('city-natitingou', 'Natitingou', 'Bénin', 'Atacora', 10.3042, 1.3794, 'Africa/Porto-Novo', 0, 6, 'Zone coton / igname', '2026-10-01T20:04:21.918Z', '2026-10-01T20:04:21.918Z');
INSERT OR REPLACE INTO "cities" ("id", "name", "country", "admin1", "latitude", "longitude", "timezone", "is_primary", "sort_order", "label", "created_at", "updated_at") VALUES ('city-kandi', 'Kandi', 'Bénin', 'Alibori', 11.1342, 2.9386, 'Africa/Porto-Novo', 0, 7, 'Élevage / coton', '2026-10-01T20:04:21.918Z', '2026-10-01T20:04:21.918Z');
INSERT OR REPLACE INTO "cities" ("id", "name", "country", "admin1", "latitude", "longitude", "timezone", "is_primary", "sort_order", "label", "created_at", "updated_at") VALUES ('city-lokossa', 'Lokossa', 'Bénin', 'Mono', 6.6389, 1.7167, 'Africa/Porto-Novo', 0, 8, 'Ananas / palmiers', '2026-10-01T20:04:21.918Z', '2026-10-01T20:04:21.918Z');

CREATE TABLE IF NOT EXISTS "custom_crops" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "category" TEXT,
  "cycle_days" REAL,
  "temp_min" REAL,
  "temp_max" REAL,
  "temp_opt_min" REAL,
  "temp_opt_max" REAL,
  "rain_min" REAL,
  "rain_max" REAL,
  "water_need" TEXT,
  "ph_min" REAL,
  "ph_max" REAL,
  "soils" TEXT,
  "zones" TEXT,
  "spacing" TEXT,
  "seed_rate" TEXT,
  "yield_range" TEXT,
  "growing_stages" TEXT,
  "calendar" TEXT,
  "pests" TEXT,
  "notes" TEXT,
  "source" TEXT,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "journal" (
  "id" TEXT PRIMARY KEY,
  "plot_id" TEXT,
  "date" DATETIME,
  "kind" TEXT,
  "title" TEXT,
  "detail" TEXT,
  "cost" REAL,
  "rain_mm" REAL,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "news" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT,
  "category" TEXT,
  "scope" TEXT,
  "published_at" DATETIME,
  "summary" TEXT,
  "body" TEXT,
  "source_name" TEXT,
  "source_url" TEXT,
  "image_url" TEXT,
  "pinned" BOOLEAN,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "plots" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "city_id" TEXT,
  "crop_id" TEXT,
  "crop_name" TEXT,
  "surface" REAL,
  "soil" TEXT,
  "irrigation" TEXT,
  "planting_date" DATETIME,
  "stage" TEXT,
  "lat" REAL,
  "lon" REAL,
  "notes" TEXT,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "prefs" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT,
  "value" TEXT,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT OR REPLACE INTO "prefs" ("id", "key", "value", "created_at", "updated_at") VALUES ('pref-1', 'active_city', 'city-cotonou', '2026-10-01T20:04:21.807Z', '2026-10-01T20:04:21.807Z');
INSERT OR REPLACE INTO "prefs" ("key", "value", "id", "created_at", "updated_at") VALUES ('theme_mode', 'day', 'pref-2', '2026-10-01T20:04:21.807Z', '2026-10-01T21:16:02.051Z');
INSERT OR REPLACE INTO "prefs" ("id", "key", "value", "created_at", "updated_at") VALUES ('pref-3', 'units', 'metric', '2026-10-01T20:04:21.807Z', '2026-10-01T20:04:21.807Z');
INSERT OR REPLACE INTO "prefs" ("id", "key", "value", "created_at", "updated_at") VALUES ('pref-4', 'notify_permission', 'unknown', '2026-10-01T20:04:21.807Z', '2026-10-01T20:04:21.807Z');
INSERT OR REPLACE INTO "prefs" ("key", "value", "id", "created_at", "updated_at") VALUES ('voice_reply', 'false', 'pref-5', '2026-10-01T20:04:21.807Z', '2026-10-01T21:14:29.701Z');
INSERT OR REPLACE INTO "prefs" ("key", "value", "id", "created_at", "updated_at") VALUES ('zone', 'soudano-guineenne', '937108de-762e-4eb5-830c-13c898f09115', '2026-10-01T20:39:13.777Z', '2026-10-01T20:39:13.777Z');
INSERT OR REPLACE INTO "prefs" ("key", "value", "id", "created_at", "updated_at") VALUES ('main_crop', '', '75664f7c-f071-498d-80d3-e2f467502fed', '2026-10-01T20:39:20.510Z', '2026-10-01T20:39:20.510Z');

CREATE TABLE IF NOT EXISTS "videos" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT,
  "title" TEXT,
  "situation" TEXT,
  "audience" TEXT,
  "duration_sec" REAL,
  "poster_url" TEXT,
  "video_url" TEXT,
  "summary" TEXT,
  "steps" TEXT,
  "tags" TEXT,
  "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

