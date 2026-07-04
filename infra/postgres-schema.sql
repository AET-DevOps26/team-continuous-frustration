-- PostgreSQL schema visualization for the team-continuous-frustration services.
-- This file is for documentation and ERD tooling only.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Auth service database: authdb
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  google_id VARCHAR(255) UNIQUE
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Flashcard service database: flashcarddb
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source_ref UUID NOT NULL,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Upload service database: uploaddocumentdb
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255),
  content TEXT,
  date_uploaded VARCHAR(255)
);

-- Study data stored in flashcarddb for deck membership and review scheduling.
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
);

CREATE TABLE deck_flashcards (
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL,
  study_status VARCHAR(20) NOT NULL,
  due_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (deck_id, flashcard_id)
);

CREATE INDEX idx_deck_flashcards_deck_id ON deck_flashcards(deck_id);
CREATE INDEX idx_deck_flashcards_flashcard_id ON deck_flashcards(flashcard_id);
CREATE INDEX idx_deck_flashcards_due_at ON deck_flashcards(due_at);