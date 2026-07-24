-- =========================================================================
-- ROCKET ASSESSMENT SYSTEM - READING MODULE SCHEMA
-- =========================================================================
-- SQL migration script to configure database tables, constraints, indexes, 
-- and helper triggers for the IELTS Computer-Based Test (CBT) Reading module.
-- Run this script inside the Supabase SQL Editor.

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. READING TESTS
-- Groups passages and questions under a single 40-question test session.
CREATE TABLE IF NOT EXISTS public.reading_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_set_id UUID REFERENCES public.test_sets(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    test_type VARCHAR(50) NOT NULL CHECK (test_type IN ('academic', 'general')),
    difficulty VARCHAR(50) NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('easy', 'intermediate', 'hard', 'all')),
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. READING PASSAGES
-- A Reading Test typically contains 3 passages (Passage 1, 2, and 3).
CREATE TABLE IF NOT EXISTS public.reading_passages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reading_test_id UUID NOT NULL REFERENCES public.reading_tests(id) ON DELETE CASCADE,
    passage_number INTEGER NOT NULL CHECK (passage_number IN (1, 2, 3)),
    title VARCHAR(255) NOT NULL,
    sub_title VARCHAR(500),
    content_html TEXT NOT NULL, -- Full body of passage with clean HTML structure
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_test_passage UNIQUE (reading_test_id, passage_number)
);

-- 3. READING QUESTIONS
-- Individual questions mapped to a passage. Cumulative questions per test sum to 40.
CREATE TABLE IF NOT EXISTS public.reading_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passage_id UUID NOT NULL REFERENCES public.reading_passages(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL CHECK (question_number BETWEEN 1 AND 40),
    question_type VARCHAR(100) NOT NULL CHECK (question_type IN (
        'mcq_single',        -- Multiple choice, single correct option
        'mcq_multiple',      -- Multiple choice, select all that apply
        'tfng',              -- True / False / Not Given
        'ynng',              -- Yes / No / Not Given
        'matching_headings', -- Match headings to paragraph letters (Section A, B...)
        'matching_info',     -- Match statements to paragraphs
        'matching_features', -- Match features/opinions to list of researchers/countries
        'sentence_completion',-- Fill in the blank (inline)
        'summary_completion',-- Fill in blanks in a summary snippet
        'short_answer',      -- Direct answer to short questions
        'diagram_labeling',  -- Drag-and-drop or textbox over a diagram image
        'table_completion'   -- Fill in fields in a grid/table
    )),
    instruction_text TEXT NOT NULL, -- e.g. "Choose the correct heading for each section..."
    question_data JSONB NOT NULL,    -- Stores options, layout config, diagram coords, text snippets with blanks
    correct_answers TEXT[] NOT NULL, -- Array of accepted text answers (e.g. ['TRUE'], ['air pollution', 'pollution'])
    explanation TEXT,                -- Details on why this answer is correct
    citation_excerpt TEXT,           -- Exact quote from passage containing the answer
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. READING SESSIONS
-- Tracks students taking a Reading Test.
CREATE TABLE IF NOT EXISTS public.reading_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL, -- References auth.users(id)
    reading_test_id UUID NOT NULL REFERENCES public.reading_tests(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'submitted', 'completed')),
    user_answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. { "1": "TRUE", "2": "air pollution", "3": ["A", "D"] }
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

-- Quick passage lookups for a given test
CREATE INDEX IF NOT EXISTS idx_reading_passages_test_id ON public.reading_passages(reading_test_id);

-- Speed up fetching questions for a passage
CREATE INDEX IF NOT EXISTS idx_reading_questions_passage_id ON public.reading_questions(passage_id);
CREATE INDEX IF NOT EXISTS idx_reading_questions_number ON public.reading_questions(question_number);

-- Speed up fetching student history and checking in-progress drafts
CREATE INDEX IF NOT EXISTS idx_reading_sessions_student_id ON public.reading_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_status ON public.reading_sessions(status);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_test_id ON public.reading_sessions(reading_test_id);

-- =========================================================================
-- TRIGGER: AUTO-UPDATE `updated_at` TIMESTAMP
-- =========================================================================

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_reading_tests_modtime
    BEFORE UPDATE ON public.reading_tests
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_reading_passages_modtime
    BEFORE UPDATE ON public.reading_passages
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_reading_questions_modtime
    BEFORE UPDATE ON public.reading_questions
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_reading_sessions_modtime
    BEFORE UPDATE ON public.reading_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
