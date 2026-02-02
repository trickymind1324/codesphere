--
-- PostgreSQL database dump
--

\restrict kpJZxH2cMP5SqkflcM2O1k2Ehmto4RqGRu1g2P0TGEzMnaZJ3Sln5sST1HKLmYA

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


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assessment_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_invitations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "assessmentId" uuid NOT NULL,
    "candidateEmail" character varying(255) NOT NULL,
    "candidateName" character varying(255),
    "uniqueToken" character varying(64) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "startedAt" timestamp with time zone,
    "completedAt" timestamp with time zone,
    score integer,
    percentage integer,
    "problemsSolved" integer,
    "customMessage" text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_invitation_status" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'started'::character varying, 'completed'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: assessment_problems; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessment_problems (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "assessmentId" uuid NOT NULL,
    "problemId" uuid NOT NULL,
    "order" integer NOT NULL,
    points integer DEFAULT 10 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assessments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    "durationMinutes" integer DEFAULT 120 NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "createdBy" uuid,
    "updatedBy" uuid,
    "totalInvitations" integer DEFAULT 0 NOT NULL,
    "completedSubmissions" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "deletedAt" timestamp with time zone,
    CONSTRAINT "CHK_assessment_status" CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::text[])))
);


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
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: assessment_problems UQ_assessment_problem; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_problems
    ADD CONSTRAINT "UQ_assessment_problem" UNIQUE ("assessmentId", "problemId");


--
-- Name: assessment_invitations assessment_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_invitations
    ADD CONSTRAINT assessment_invitations_pkey PRIMARY KEY (id);


--
-- Name: assessment_invitations assessment_invitations_uniqueToken_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_invitations
    ADD CONSTRAINT "assessment_invitations_uniqueToken_key" UNIQUE ("uniqueToken");


--
-- Name: assessment_problems assessment_problems_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_problems
    ADD CONSTRAINT assessment_problems_pkey PRIMARY KEY (id);


--
-- Name: assessments assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);


--
-- Name: IDX_assessment_problems_assessmentId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_assessment_problems_assessmentId" ON public.assessment_problems USING btree ("assessmentId");


--
-- Name: IDX_assessment_problems_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_assessment_problems_order" ON public.assessment_problems USING btree ("assessmentId", "order");


--
-- Name: IDX_assessment_problems_problemId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_assessment_problems_problemId" ON public.assessment_problems USING btree ("problemId");


--
-- Name: IDX_assessments_createdAt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_assessments_createdAt" ON public.assessments USING btree ("createdAt");


--
-- Name: IDX_assessments_createdBy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_assessments_createdBy" ON public.assessments USING btree ("createdBy");


--
-- Name: IDX_assessments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_assessments_status" ON public.assessments USING btree (status);


--
-- Name: IDX_invitations_assessmentId; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_invitations_assessmentId" ON public.assessment_invitations USING btree ("assessmentId");


--
-- Name: IDX_invitations_candidateEmail; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_invitations_candidateEmail" ON public.assessment_invitations USING btree ("candidateEmail");


--
-- Name: IDX_invitations_expiresAt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_invitations_expiresAt" ON public.assessment_invitations USING btree ("expiresAt");


--
-- Name: IDX_invitations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_invitations_status" ON public.assessment_invitations USING btree (status);


--
-- Name: IDX_invitations_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_invitations_token" ON public.assessment_invitations USING btree ("uniqueToken");


--
-- Name: assessment_invitations FK_assessment_invitations_assessment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_invitations
    ADD CONSTRAINT "FK_assessment_invitations_assessment" FOREIGN KEY ("assessmentId") REFERENCES public.assessments(id) ON DELETE CASCADE;


--
-- Name: assessment_problems FK_assessment_problems_assessment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assessment_problems
    ADD CONSTRAINT "FK_assessment_problems_assessment" FOREIGN KEY ("assessmentId") REFERENCES public.assessments(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict kpJZxH2cMP5SqkflcM2O1k2Ehmto4RqGRu1g2P0TGEzMnaZJ3Sln5sST1HKLmYA

