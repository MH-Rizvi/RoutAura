CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  full_location VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  notes TEXT,
  chroma_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP,
  use_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stops (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  position INTEGER NOT NULL DEFAULT 0,
  label VARCHAR(255),
  resolved TEXT,
  lat FLOAT,
  lng FLOAT,
  note TEXT,
  chroma_id VARCHAR(255) UNIQUE
);

CREATE TABLE IF NOT EXISTS trip_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
  trip_name VARCHAR(200),
  raw_input TEXT,
  stops_json TEXT,
  launched_at TIMESTAMP DEFAULT NOW(),
  total_miles FLOAT
);

CREATE TABLE IF NOT EXISTS llm_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMP DEFAULT NOW(),
  model VARCHAR(100),
  prompt_version VARCHAR(50),
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  run_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
