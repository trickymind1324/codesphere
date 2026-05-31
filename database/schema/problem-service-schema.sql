--
-- PostgreSQL database dump
--

\restrict t25JhLWuURR9dZanyfsFJxZDXeuyE25jIcJzi88eNGyhDftH3R8VZGWsAm5FpVT

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: problem_difficulty_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.problem_difficulty_enum AS ENUM (
    'easy',
    'medium',
    'hard'
);


--
-- Name: problem_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.problem_status_enum AS ENUM (
    'draft',
    'published',
    'archived'
);


--
-- Name: problem_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.problem_type_enum AS ENUM (
    'algorithmic',
    'debugging'
);


--
-- Name: programming_language_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.programming_language_enum AS ENUM (
    'python',
    'javascript',
    'typescript',
    'java',
    'cpp',
    'c',
    'go',
    'rust',
    'csharp',
    'ruby',
    'php',
    'swift',
    'kotlin',
    'sql'
);


--
-- Name: submission_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.submission_status_enum AS ENUM (
    'accepted',
    'wrong_answer',
    'time_limit_exceeded',
    'memory_limit_exceeded',
    'runtime_error',
    'compilation_error',
    'internal_error'
);


--
-- Name: validation_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.validation_type_enum AS ENUM (
    'exact',
    'contains',
    'regex',
    'exit_code'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: problem_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.problem_files (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "problemId" uuid NOT NULL,
    language public.programming_language_enum NOT NULL,
    "filePath" character varying NOT NULL,
    content text NOT NULL,
    "isEntryPoint" boolean DEFAULT false NOT NULL,
    "isReadOnly" boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: problem_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.problem_tags (
    problem_id uuid NOT NULL,
    tag_id uuid NOT NULL
);


--
-- Name: problems; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.problems (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    slug character varying NOT NULL,
    title character varying NOT NULL,
    description text NOT NULL,
    difficulty public.problem_difficulty_enum DEFAULT 'easy'::public.problem_difficulty_enum NOT NULL,
    status public.problem_status_enum DEFAULT 'draft'::public.problem_status_enum NOT NULL,
    "isPremium" boolean DEFAULT false NOT NULL,
    hints text[] DEFAULT ARRAY[]::text[] NOT NULL,
    examples jsonb,
    constraints text[] DEFAULT ARRAY[]::text[] NOT NULL,
    companies text[] DEFAULT ARRAY[]::text[] NOT NULL,
    "totalSubmissions" integer DEFAULT 0 NOT NULL,
    "totalAccepted" integer DEFAULT 0 NOT NULL,
    "acceptanceRate" numeric(5,2) DEFAULT 0 NOT NULL,
    "timeComplexity" character varying,
    "spaceComplexity" character varying,
    "timeLimitMs" integer DEFAULT 2000 NOT NULL,
    "memoryLimitMb" integer DEFAULT 128 NOT NULL,
    "createdBy" uuid,
    "updatedBy" uuid,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp without time zone,
    "problemType" public.problem_type_enum DEFAULT 'algorithmic'::public.problem_type_enum NOT NULL,
    "executionConfig" jsonb
);


--
-- Name: starter_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.starter_codes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "problemId" uuid NOT NULL,
    language public.programming_language_enum NOT NULL,
    code text NOT NULL,
    "functionName" character varying,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" uuid NOT NULL,
    "problemId" uuid NOT NULL,
    code text NOT NULL,
    language public.programming_language_enum NOT NULL,
    status public.submission_status_enum NOT NULL,
    "totalTestCases" integer DEFAULT 0 NOT NULL,
    "passedTestCases" integer DEFAULT 0 NOT NULL,
    "failedTestCases" integer DEFAULT 0 NOT NULL,
    "executionTimeMs" integer,
    "memoryUsageKb" integer,
    "testResults" jsonb,
    error text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    files jsonb
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    slug character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    category character varying,
    "problemCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: test_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_cases (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "problemId" uuid NOT NULL,
    input text NOT NULL,
    "expectedOutput" text NOT NULL,
    explanation text,
    "isExample" boolean DEFAULT false NOT NULL,
    "isHidden" boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    weight numeric(5,2) DEFAULT 1 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "validationType" public.validation_type_enum DEFAULT 'exact'::public.validation_type_enum NOT NULL
);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: submissions PK_10b3be95b8b2fb1e482e07d706b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "PK_10b3be95b8b2fb1e482e07d706b" PRIMARY KEY (id);


--
-- Name: test_cases PK_39eb2dc90c54d7a036b015f05c4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT "PK_39eb2dc90c54d7a036b015f05c4" PRIMARY KEY (id);


--
-- Name: problem_files PK_880874a7aa5c8bdc3678e7201fb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problem_files
    ADD CONSTRAINT "PK_880874a7aa5c8bdc3678e7201fb" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: problems PK_b3994afba6ab64a42cda1ccaeff; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problems
    ADD CONSTRAINT "PK_b3994afba6ab64a42cda1ccaeff" PRIMARY KEY (id);


--
-- Name: starter_codes PK_bc2cf521d26d5ddb2388f803118; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.starter_codes
    ADD CONSTRAINT "PK_bc2cf521d26d5ddb2388f803118" PRIMARY KEY (id);


--
-- Name: tags PK_e7dc17249a1148a1970748eda99; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY (id);


--
-- Name: tags UQ_b3aa10c29ea4e61a830362bd25a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT "UQ_b3aa10c29ea4e61a830362bd25a" UNIQUE (slug);


--
-- Name: problems UQ_ed0948d10a4b9dff13c9461090b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problems
    ADD CONSTRAINT "UQ_ed0948d10a4b9dff13c9461090b" UNIQUE (slug);


--
-- Name: IDX_problem_files_problemId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_problem_files_problemId" ON public.problem_files USING btree ("problemId");


--
-- Name: IDX_problem_files_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_problem_files_unique" ON public.problem_files USING btree ("problemId", language, "filePath");


--
-- Name: IDX_problem_tags_problem_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_problem_tags_problem_id" ON public.problem_tags USING btree (problem_id);


--
-- Name: IDX_problem_tags_tag_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_problem_tags_tag_id" ON public.problem_tags USING btree (tag_id);


--
-- Name: IDX_problems_problemType; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_problems_problemType" ON public.problems USING btree ("problemType");


--
-- Name: IDX_problems_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_problems_slug" ON public.problems USING btree (slug);


--
-- Name: IDX_problems_status_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_problems_status_difficulty" ON public.problems USING btree (status, difficulty);


--
-- Name: IDX_problems_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_problems_title" ON public.problems USING btree (title);


--
-- Name: IDX_starter_codes_problemId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_starter_codes_problemId" ON public.starter_codes USING btree ("problemId");


--
-- Name: IDX_starter_codes_problemId_language; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_starter_codes_problemId_language" ON public.starter_codes USING btree ("problemId", language);


--
-- Name: IDX_submissions_problemId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_submissions_problemId" ON public.submissions USING btree ("problemId");


--
-- Name: IDX_submissions_problemId_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_submissions_problemId_status" ON public.submissions USING btree ("problemId", status);


--
-- Name: IDX_submissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_submissions_status" ON public.submissions USING btree (status);


--
-- Name: IDX_submissions_userId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_submissions_userId" ON public.submissions USING btree ("userId");


--
-- Name: IDX_submissions_userId_createdAt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_submissions_userId_createdAt" ON public.submissions USING btree ("userId", "createdAt");


--
-- Name: IDX_tags_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_tags_slug" ON public.tags USING btree (slug);


--
-- Name: IDX_test_cases_problemId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_test_cases_problemId" ON public.test_cases USING btree ("problemId");


--
-- Name: IDX_test_cases_problemId_isHidden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_test_cases_problemId_isHidden" ON public.test_cases USING btree ("problemId", "isHidden");


--
-- Name: test_cases FK_0126d367e92400b37cd7da0cda6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_cases
    ADD CONSTRAINT "FK_0126d367e92400b37cd7da0cda6" FOREIGN KEY ("problemId") REFERENCES public.problems(id) ON DELETE CASCADE;


--
-- Name: starter_codes FK_2078b7fc625f8ade0369797adb7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.starter_codes
    ADD CONSTRAINT "FK_2078b7fc625f8ade0369797adb7" FOREIGN KEY ("problemId") REFERENCES public.problems(id) ON DELETE CASCADE;


--
-- Name: problem_files FK_3dfcc3d56b421e9880745a03b44; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problem_files
    ADD CONSTRAINT "FK_3dfcc3d56b421e9880745a03b44" FOREIGN KEY ("problemId") REFERENCES public.problems(id) ON DELETE CASCADE;


--
-- Name: problem_tags FK_853473f54d7b1e91b236346fa13; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problem_tags
    ADD CONSTRAINT "FK_853473f54d7b1e91b236346fa13" FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: submissions FK_a659ade908bd365bf760853fd4f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT "FK_a659ade908bd365bf760853fd4f" FOREIGN KEY ("problemId") REFERENCES public.problems(id) ON DELETE CASCADE;


--
-- Name: problem_tags FK_e369a453fb95b878301184caddc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.problem_tags
    ADD CONSTRAINT "FK_e369a453fb95b878301184caddc" FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict t25JhLWuURR9dZanyfsFJxZDXeuyE25jIcJzi88eNGyhDftH3R8VZGWsAm5FpVT

