--
-- PostgreSQL database dump
--

\restrict tLpoQCPlDgdH1xAa3tlIMXIXA8ghvyfYmotejil1qXVh7AmHn7bq27YeU37kqh9

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
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_role_enum AS ENUM (
    'candidate',
    'recruiter',
    'company_admin',
    'platform_admin'
);


--
-- Name: users_tier_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_tier_enum AS ENUM (
    'free',
    'pro'
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
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    full_name character varying(255) NOT NULL,
    avatar_url character varying(500),
    role public.users_role_enum DEFAULT 'candidate'::public.users_role_enum NOT NULL,
    tier public.users_tier_enum DEFAULT 'free'::public.users_tier_enum NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    email_verification_token character varying(500),
    email_verification_expires timestamp without time zone,
    password_reset_token character varying(500),
    password_reset_expires timestamp without time zone,
    mfa_enabled boolean DEFAULT false NOT NULL,
    mfa_secret character varying(500),
    mfa_backup_codes jsonb,
    oauth_provider character varying(100),
    oauth_id character varying(500),
    company_id uuid,
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    account_locked_until timestamp without time zone,
    last_login_at timestamp without time zone,
    last_login_ip character varying(45),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


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
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: IDX_97672ac88f789774dd47f7c8be; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON public.users USING btree (email);


--
-- PostgreSQL database dump complete
--

\unrestrict tLpoQCPlDgdH1xAa3tlIMXIXA8ghvyfYmotejil1qXVh7AmHn7bq27YeU37kqh9

