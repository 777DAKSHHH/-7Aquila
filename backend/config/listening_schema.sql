-- =========================================================================
-- ROCKET ASSESSMENT SYSTEM - LISTENING MODULE SCHEMA
-- =========================================================================
-- SQL migration script to configure database tables, constraints, indexes, 
-- and helper triggers for the IELTS Computer-Based Test (CBT) Listening module.
-- Run this script inside the Supabase SQL Editor.

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. LISTENING TESTS
-- Groups sections and questions under a single 40-question listening exam.
CREATE TABLE IF NOT EXISTS public.listening_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_set_id UUID REFERENCES public.test_sets(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50) NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('easy', 'intermediate', 'hard', 'all')),
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. LISTENING SECTIONS
-- A Listening Test contains 4 parts/sections. Each has its own audio recording.
CREATE TABLE IF NOT EXISTS public.listening_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listening_test_id UUID NOT NULL REFERENCES public.listening_tests(id) ON DELETE CASCADE,
    section_number INTEGER NOT NULL CHECK (section_number BETWEEN 1 AND 4),
    title VARCHAR(255) NOT NULL,
    instruction_text TEXT,
    audio_url VARCHAR(500) NOT NULL, -- Static file path, e.g. /uploads/audio/c20_t1_p1.mp3
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_listening_test_section UNIQUE (listening_test_id, section_number)
);

-- 3. LISTENING QUESTIONS
-- Individual questions mapped to a section. Cumulative questions per test sum to 40.
CREATE TABLE IF NOT EXISTS public.listening_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES public.listening_sections(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL CHECK (question_number BETWEEN 1 AND 40),
    question_type VARCHAR(100) NOT NULL CHECK (question_type IN (
        'mcq_single',        -- Multiple choice, single correct option
        'mcq_multiple',      -- Multiple choice, select all that apply
        'tfng',              -- True / False / Not Given
        'ynng',              -- Yes / No / Not Given
        'sentence_completion',-- Fill in the blank (inline)
        'summary_completion',-- Fill in blanks in a summary snippet
        'short_answer',      -- Direct answer to short questions
        'diagram_labeling',  -- Drag-and-drop or textbox over a diagram image
        'table_completion',  -- Fill in fields in a grid/table
        'matching'           -- Matching choices to question prompts
    )),
    instruction_text TEXT NOT NULL,
    question_data JSONB NOT NULL,    -- Stores options, layout config, blanks
    correct_answers TEXT[] NOT NULL, -- Array of accepted text answers
    explanation TEXT,                -- Details on why this answer is correct
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. LISTENING SESSIONS
-- Tracks students taking a Listening Test.
CREATE TABLE IF NOT EXISTS public.listening_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL, -- References auth.users(id)
    listening_test_id UUID NOT NULL REFERENCES public.listening_tests(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'submitted', 'completed')),
    user_answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. { "1": "fish", "2": "roof" }
    flagged_questions INTEGER[] NOT NULL DEFAULT '{}'::integer[], -- e.g. [5, 12]
    raw_score INTEGER CHECK (raw_score BETWEEN 0 AND 40),
    band_score NUMERIC(3,1) CHECK (band_score BETWEEN 1.0 AND 9.0),
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- INDEXES & PERFORMANCE OPTIMIZATIONS
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_listening_sections_test_id ON public.listening_sections(listening_test_id);
CREATE INDEX IF NOT EXISTS idx_listening_questions_section_id ON public.listening_questions(section_id);
CREATE INDEX IF NOT EXISTS idx_listening_questions_number ON public.listening_questions(question_number);
CREATE INDEX IF NOT EXISTS idx_listening_sessions_student_id ON public.listening_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_listening_sessions_status ON public.listening_sessions(status);
CREATE INDEX IF NOT EXISTS idx_listening_sessions_test_id ON public.listening_sessions(listening_test_id);

-- =========================================================================
-- TRIGGER: AUTO-UPDATE `updated_at` TIMESTAMP
-- =========================================================================

-- Trigger function is public.update_modified_column(), already defined in reading_schema.sql

-- Apply triggers
CREATE TRIGGER update_listening_tests_modtime
    BEFORE UPDATE ON public.listening_tests
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_listening_sections_modtime
    BEFORE UPDATE ON public.listening_sections
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_listening_questions_modtime
    BEFORE UPDATE ON public.listening_questions
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_listening_sessions_modtime
    BEFORE UPDATE ON public.listening_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
