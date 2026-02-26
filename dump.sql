--
-- PostgreSQL database dump
--

\restrict L7ePFfz1wbnx65ulWLstJb3d0aOdvLhI9kXfNFegtZevYh1Z2kShaQhebpLAs0t

-- Dumped from database version 16.12 (6d3029c)
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: _system; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

CREATE SCHEMA _system;


ALTER SCHEMA _system OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: replit_database_migrations_v1; Type: TABLE; Schema: _system; Owner: neondb_owner
--

CREATE TABLE _system.replit_database_migrations_v1 (
    id bigint NOT NULL,
    build_id text NOT NULL,
    deployment_id text NOT NULL,
    statement_count bigint NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE _system.replit_database_migrations_v1 OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE; Schema: _system; Owner: neondb_owner
--

CREATE SEQUENCE _system.replit_database_migrations_v1_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE OWNED BY; Schema: _system; Owner: neondb_owner
--

ALTER SEQUENCE _system.replit_database_migrations_v1_id_seq OWNED BY _system.replit_database_migrations_v1.id;


--
-- Name: addon_purchases; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.addon_purchases (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    organization_id character varying(255),
    addon_type character varying(50) NOT NULL,
    package_sku character varying(100) NOT NULL,
    billing_type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    purchase_amount character varying(20) NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    gateway_transaction_id character varying(255),
    start_date timestamp without time zone DEFAULT now() NOT NULL,
    end_date timestamp without time zone,
    auto_renew boolean DEFAULT false,
    total_units integer NOT NULL,
    used_units integer DEFAULT 0 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    parent_purchase_id character varying(255),
    renewal_scheduled_at timestamp without time zone,
    refunded_at timestamp without time zone,
    refund_amount character varying(20),
    refund_reason text,
    gateway_refund_id character varying(255),
    refunded_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.addon_purchases OWNER TO neondb_owner;

--
-- Name: addons; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.addons (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(50) NOT NULL,
    display_name character varying(100) NOT NULL,
    type character varying(20) NOT NULL,
    billing_interval character varying(20),
    pricing_tiers jsonb,
    flat_price character varying(20),
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    features jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    published_on_website boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.addons OWNER TO neondb_owner;

--
-- Name: ai_token_usage; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.ai_token_usage (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    organization_id character varying(255),
    provider character varying(20) NOT NULL,
    prompt_tokens integer DEFAULT 0 NOT NULL,
    completion_tokens integer DEFAULT 0 NOT NULL,
    total_tokens integer DEFAULT 0 NOT NULL,
    request_id character varying(255),
    feature character varying(50),
    metadata jsonb DEFAULT '{}'::jsonb,
    occurred_at timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_token_usage OWNER TO neondb_owner;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.announcements (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    target_audience character varying(50) DEFAULT 'all'::character varying NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    published_at timestamp without time zone,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.announcements OWNER TO neondb_owner;

--
-- Name: api_key_usage_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.api_key_usage_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    api_key_id character varying NOT NULL,
    endpoint character varying(255) NOT NULL,
    method character varying(10) NOT NULL,
    status_code integer,
    response_time integer,
    ip_address character varying(45),
    user_agent text,
    request_body jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.api_key_usage_logs OWNER TO neondb_owner;

--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.api_keys (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    key_prefix character varying(10) NOT NULL,
    key_hash character varying(255) NOT NULL,
    created_by character varying NOT NULL,
    organization_id character varying,
    scopes text[] DEFAULT '{}'::text[],
    rate_limit integer DEFAULT 1000,
    rate_limit_window character varying(20) DEFAULT 'hour'::character varying,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    last_used_at timestamp without time zone,
    usage_count integer DEFAULT 0,
    expires_at timestamp without time zone,
    ip_whitelist text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    revoked_at timestamp without time zone,
    revoked_by character varying
);


ALTER TABLE public.api_keys OWNER TO neondb_owner;

--
-- Name: audio_sources; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.audio_sources (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    conversation_id character varying NOT NULL,
    source_type character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    source_id text,
    teams_meeting_id character varying,
    status text DEFAULT 'active'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    connected_at timestamp without time zone DEFAULT now(),
    disconnected_at timestamp without time zone,
    CONSTRAINT audio_sources_source_type_check CHECK (((source_type)::text = ANY (ARRAY[('device-microphone'::character varying)::text, ('teams-meeting'::character varying)::text, ('teams-recording'::character varying)::text]))),
    CONSTRAINT audio_sources_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'disconnected'::text])))
);


ALTER TABLE public.audio_sources OWNER TO neondb_owner;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.audit_logs (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    actor_id character varying(255),
    action character varying(100) NOT NULL,
    target_type character varying(50),
    target_id character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address character varying(50),
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO neondb_owner;

--
-- Name: auth_users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.auth_users (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    mobile character varying(20),
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    organization character varying(255),
    username character varying(100) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    trial_start_date timestamp without time zone,
    trial_end_date timestamp without time zone,
    train_me_subscription_date timestamp without time zone,
    email_verified boolean DEFAULT false,
    stripe_customer_id character varying(255),
    ai_engine character varying(50),
    encrypted_api_key text,
    ai_engine_setup_completed boolean DEFAULT false,
    terms_accepted boolean DEFAULT false,
    terms_accepted_at timestamp without time zone,
    session_version integer DEFAULT 0 NOT NULL,
    call_recording_enabled boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.auth_users OWNER TO neondb_owner;

--
-- Name: billing_adjustments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.billing_adjustments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    organization_id character varying NOT NULL,
    license_package_id character varying,
    adjustment_type character varying(50) NOT NULL,
    delta_seats integer NOT NULL,
    razorpay_order_id character varying(255),
    razorpay_payment_id character varying(255),
    amount character varying(20) NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    processed_at timestamp without time zone,
    added_by character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.billing_adjustments OWNER TO neondb_owner;

--
-- Name: call_meeting_minutes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.call_meeting_minutes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    conversation_id character varying,
    recording_id character varying,
    title character varying(255),
    summary text,
    key_points jsonb DEFAULT '[]'::jsonb,
    action_items jsonb DEFAULT '[]'::jsonb,
    participants jsonb DEFAULT '[]'::jsonb,
    pain_points jsonb DEFAULT '[]'::jsonb,
    recommendations jsonb DEFAULT '[]'::jsonb,
    next_steps jsonb DEFAULT '[]'::jsonb,
    full_transcript text,
    structured_minutes jsonb,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.call_meeting_minutes OWNER TO neondb_owner;

--
-- Name: call_recordings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.call_recordings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    conversation_id character varying,
    file_name character varying(255) NOT NULL,
    file_size integer,
    duration integer,
    recording_url text,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.call_recordings OWNER TO neondb_owner;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cart_items (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    package_sku character varying(100) NOT NULL,
    addon_type character varying(50) NOT NULL,
    package_name character varying(255) NOT NULL,
    base_price character varying(20) NOT NULL,
    currency character varying(10) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    purchase_mode character varying(20) DEFAULT 'user'::character varying NOT NULL,
    team_manager_name character varying(255),
    team_manager_email character varying(255),
    company_name character varying(255),
    promo_code_id character varying(255),
    promo_code_code character varying(50),
    applied_discount_amount character varying(20),
    added_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cart_items OWNER TO neondb_owner;

--
-- Name: case_studies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.case_studies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    industry character varying(100),
    product_codes text[],
    problem_statement text NOT NULL,
    solution text NOT NULL,
    implementation text,
    outcomes jsonb NOT NULL,
    customer_size character varying(50),
    time_to_value character varying(100),
    tags text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.case_studies OWNER TO neondb_owner;

--
-- Name: conversation_memories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.conversation_memories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    conversation_id character varying NOT NULL,
    user_id character varying NOT NULL,
    spin_situation text,
    spin_problems text[],
    spin_implications text[],
    spin_need_payoff text[],
    meddic_metrics jsonb,
    meddic_economic_buyer text,
    meddic_decision_criteria text[],
    meddic_decision_process text,
    meddic_pain text[],
    meddic_champion text,
    challenger_teachings text[],
    challenger_tailoring jsonb,
    challenger_control text,
    bant_budget text,
    bant_authority text,
    bant_need text,
    bant_timeline text,
    buyer_stage character varying(50),
    conversation_tone character varying(50),
    objections text[],
    urgency_level character varying(20),
    engagement_score integer,
    key_insights text[],
    customer_persona jsonb,
    competitive_landscape jsonb,
    success_metrics jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.conversation_memories OWNER TO neondb_owner;

--
-- Name: conversation_minutes_backup; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.conversation_minutes_backup (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    conversation_id character varying(255) NOT NULL,
    user_id character varying(255),
    client_name text,
    company_name text,
    industry text,
    meeting_date timestamp without time zone,
    meeting_duration_minutes integer,
    executive_summary text,
    key_topics_discussed jsonb DEFAULT '[]'::jsonb,
    client_pain_points jsonb DEFAULT '[]'::jsonb,
    client_requirements jsonb DEFAULT '[]'::jsonb,
    solutions_proposed jsonb DEFAULT '[]'::jsonb,
    competitors_discussed jsonb DEFAULT '[]'::jsonb,
    objections jsonb DEFAULT '[]'::jsonb,
    action_items jsonb DEFAULT '[]'::jsonb,
    next_steps jsonb DEFAULT '[]'::jsonb,
    full_transcript text,
    message_count integer DEFAULT 0,
    key_quotes jsonb DEFAULT '[]'::jsonb,
    marketing_hooks jsonb DEFAULT '[]'::jsonb,
    best_practices jsonb DEFAULT '[]'::jsonb,
    challenges_identified jsonb DEFAULT '[]'::jsonb,
    success_indicators jsonb DEFAULT '[]'::jsonb,
    raw_minutes_data jsonb DEFAULT '{}'::jsonb,
    discovery_insights jsonb DEFAULT '{}'::jsonb,
    backup_status text DEFAULT 'pending'::text,
    backup_source text DEFAULT 'manual'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.conversation_minutes_backup OWNER TO neondb_owner;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.conversations (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    session_id text NOT NULL,
    user_id character varying(255),
    client_name text,
    status text DEFAULT 'active'::text NOT NULL,
    discovery_insights jsonb DEFAULT '{}'::jsonb,
    call_summary text,
    created_at timestamp without time zone DEFAULT now(),
    transcription_started_at timestamp without time zone,
    ended_at timestamp without time zone
);


ALTER TABLE public.conversations OWNER TO neondb_owner;

--
-- Name: domain_expertise; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.domain_expertise (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    company_domain character varying(255),
    is_shared boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.domain_expertise OWNER TO neondb_owner;

--
-- Name: enterprise_user_assignments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.enterprise_user_assignments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    license_package_id character varying NOT NULL,
    assigned_by character varying,
    assigned_at timestamp without time zone DEFAULT now(),
    status character varying DEFAULT 'active'::character varying,
    train_me_enabled boolean DEFAULT false,
    dai_enabled boolean DEFAULT false,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    organization_id character varying,
    user_email character varying(255) NOT NULL,
    activation_token character varying(255),
    activation_token_expires_at timestamp without time zone,
    activated_at timestamp without time zone,
    revoked_by character varying(255),
    revoked_at timestamp without time zone,
    CONSTRAINT enterprise_user_assignments_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text, ('revoked'::character varying)::text])))
);


ALTER TABLE public.enterprise_user_assignments OWNER TO neondb_owner;

--
-- Name: gateway_providers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.gateway_providers (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    provider_name character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    configuration jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.gateway_providers OWNER TO neondb_owner;

--
-- Name: gateway_transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.gateway_transactions (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    provider_id character varying(255) NOT NULL,
    provider_transaction_id character varying(255),
    transaction_type character varying(50) NOT NULL,
    status character varying(50) NOT NULL,
    amount character varying(20) NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    user_id character varying(255),
    organization_id character varying(255),
    related_entity character varying(50),
    related_entity_id character varying(255),
    payload jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.gateway_transactions OWNER TO neondb_owner;

--
-- Name: gateway_webhooks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.gateway_webhooks (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    provider_id character varying(255) NOT NULL,
    event_type character varying(100) NOT NULL,
    payload jsonb NOT NULL,
    signature text,
    verified boolean DEFAULT false,
    processed boolean DEFAULT false,
    processed_at timestamp without time zone,
    error_message text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.gateway_webhooks OWNER TO neondb_owner;

--
-- Name: knowledge_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.knowledge_entries (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    domain_expertise_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    category character varying(30) NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    keywords text[],
    source_document_ids text[],
    content_hash character varying(64),
    embedding jsonb,
    confidence integer DEFAULT 80,
    is_verified boolean DEFAULT false,
    usage_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.knowledge_entries OWNER TO neondb_owner;

--
-- Name: leads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.leads (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email character varying(255) NOT NULL,
    company text,
    phone text,
    message text,
    lead_type text NOT NULL,
    department text,
    total_seats integer,
    estimated_timeline text,
    status text DEFAULT 'new'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.leads OWNER TO neondb_owner;

--
-- Name: license_assignments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.license_assignments (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    license_package_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    assigned_at timestamp without time zone DEFAULT now(),
    unassigned_at timestamp without time zone,
    assigned_by character varying(255),
    notes text
);


ALTER TABLE public.license_assignments OWNER TO neondb_owner;

--
-- Name: license_packages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.license_packages (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    organization_id character varying(255) NOT NULL,
    package_type character varying(50) NOT NULL,
    total_seats integer NOT NULL,
    price_per_seat character varying(20) NOT NULL,
    total_amount character varying(20) NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    previous_package_id character varying(255),
    razorpay_subscription_id character varying(255),
    razorpay_order_id character varying(255),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.license_packages OWNER TO neondb_owner;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.messages (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    conversation_id character varying(255) NOT NULL,
    content text NOT NULL,
    sender text NOT NULL,
    speaker_label text,
    audio_source_id character varying(255),
    customer_identification jsonb,
    discovery_questions jsonb,
    case_studies jsonb,
    competitor_analysis jsonb,
    solution_recommendations jsonb,
    product_features jsonb,
    next_steps jsonb,
    bant_qualification jsonb,
    solutions jsonb,
    problem_statement text,
    recommended_solutions jsonb,
    suggested_next_prompt text,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.messages OWNER TO neondb_owner;

--
-- Name: organization_addons; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.organization_addons (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    organization_id character varying NOT NULL,
    type character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    start_date timestamp without time zone DEFAULT now() NOT NULL,
    end_date timestamp without time zone,
    auto_renew boolean DEFAULT false,
    purchase_amount character varying,
    currency character varying(10) DEFAULT 'INR'::character varying,
    gateway_transaction_id character varying,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.organization_addons OWNER TO neondb_owner;

--
-- Name: organization_memberships; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.organization_memberships (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    organization_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    joined_at timestamp without time zone DEFAULT now(),
    left_at timestamp without time zone
);


ALTER TABLE public.organization_memberships OWNER TO neondb_owner;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.organizations (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    company_name character varying(255) NOT NULL,
    billing_email character varying(255) NOT NULL,
    primary_manager_id character varying(255),
    razorpay_customer_id character varying(255),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.organizations OWNER TO neondb_owner;

--
-- Name: otps; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.otps (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(10) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    attempts character varying(10) DEFAULT '0'::character varying NOT NULL,
    is_used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.otps OWNER TO neondb_owner;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.password_reset_tokens (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    is_used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.password_reset_tokens OWNER TO neondb_owner;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.payments (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    subscription_id character varying(255),
    organization_id character varying(255),
    razorpay_order_id character varying(255),
    razorpay_payment_id character varying(255),
    razorpay_signature character varying(500),
    amount character varying(20) NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    status character varying(20) NOT NULL,
    payment_method character varying(50),
    receipt_url character varying(500),
    metadata jsonb DEFAULT '{}'::jsonb,
    refunded_at timestamp without time zone,
    refund_amount character varying(20),
    refund_reason text,
    razorpay_refund_id character varying(255),
    refunded_by character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO neondb_owner;

--
-- Name: pending_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pending_orders (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    package_sku character varying(100) NOT NULL,
    addon_type character varying(50) NOT NULL,
    amount character varying(20) NOT NULL,
    currency character varying(10) NOT NULL,
    gateway_order_id character varying(255) NOT NULL,
    gateway_provider character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    expires_at timestamp without time zone NOT NULL,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pending_orders OWNER TO neondb_owner;

--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100),
    description text NOT NULL,
    key_features text[],
    use_cases text[],
    target_industries text[],
    pricing_model character varying(100),
    typical_price character varying(100),
    implementation_time character varying(100),
    integrates_with text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.promo_codes (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    category character varying(50),
    allowed_plan_types jsonb,
    discount_type character varying(20) NOT NULL,
    discount_value character varying(20) NOT NULL,
    max_uses character varying(10),
    uses_count character varying(10) DEFAULT '0'::character varying NOT NULL,
    is_active boolean DEFAULT true,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.promo_codes OWNER TO neondb_owner;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.refresh_tokens (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    token character varying(500) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.refresh_tokens OWNER TO neondb_owner;

--
-- Name: refunds; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.refunds (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    payment_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    amount character varying(20) NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    reason text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    razorpay_refund_id character varying(255),
    processed_by character varying(255),
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.refunds OWNER TO neondb_owner;

--
-- Name: sales_intelligence_exports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sales_intelligence_exports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    export_name text NOT NULL,
    export_type text NOT NULL,
    date_range_start timestamp without time zone,
    date_range_end timestamp without time zone,
    intent_filter text,
    industry_filter text,
    record_count integer DEFAULT 0,
    export_data jsonb DEFAULT '[]'::jsonb,
    exported_by character varying,
    purpose text,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sales_intelligence_exports OWNER TO neondb_owner;

--
-- Name: sales_intelligence_knowledge; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sales_intelligence_knowledge (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    intent_type text NOT NULL,
    industry text,
    persona text,
    sales_stage text,
    trigger_keywords jsonb DEFAULT '[]'::jsonb,
    trigger_patterns jsonb DEFAULT '[]'::jsonb,
    suggested_response text NOT NULL,
    follow_up_prompt text,
    usage_count integer DEFAULT 0,
    acceptance_count integer DEFAULT 0,
    rejection_count integer DEFAULT 0,
    performance_score integer DEFAULT 50,
    is_validated boolean DEFAULT false,
    validated_by character varying,
    validated_at timestamp without time zone,
    source text DEFAULT 'manual'::text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sales_intelligence_knowledge OWNER TO neondb_owner;

--
-- Name: sales_intelligence_learning_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sales_intelligence_learning_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    suggestion_id character varying,
    conversation_id character varying,
    user_id character varying,
    customer_question text NOT NULL,
    detected_intent text NOT NULL,
    suggested_response text NOT NULL,
    rep_used_suggestion boolean,
    rep_modified_response text,
    outcome_signals jsonb DEFAULT '{}'::jsonb,
    industry text,
    persona text,
    sales_stage text,
    product_discussed text,
    is_anonymized boolean DEFAULT false,
    can_use_for_marketing boolean DEFAULT true,
    can_use_for_training boolean DEFAULT true,
    processing_status text DEFAULT 'pending'::text,
    promoted_to_knowledge boolean DEFAULT false,
    promoted_knowledge_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    processed_at timestamp without time zone
);


ALTER TABLE public.sales_intelligence_learning_logs OWNER TO neondb_owner;

--
-- Name: sales_intelligence_suggestions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sales_intelligence_suggestions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    conversation_id character varying,
    user_id character varying,
    knowledge_id character varying,
    detected_intent text NOT NULL,
    intent_confidence integer NOT NULL,
    customer_question text NOT NULL,
    assembled_context jsonb DEFAULT '{}'::jsonb,
    suggested_response text NOT NULL,
    follow_up_prompt text,
    retrieval_confidence integer NOT NULL,
    was_displayed boolean DEFAULT true,
    was_used boolean,
    response_latency_ms integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.sales_intelligence_suggestions OWNER TO neondb_owner;

--
-- Name: session_minutes_purchases; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session_minutes_purchases (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    organization_id character varying(255),
    minutes_purchased integer NOT NULL,
    minutes_used integer DEFAULT 0 NOT NULL,
    minutes_remaining integer NOT NULL,
    purchase_date timestamp without time zone DEFAULT now() NOT NULL,
    expiry_date timestamp without time zone NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    razorpay_order_id character varying(255),
    razorpay_payment_id character varying(255),
    amount_paid character varying(20) NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    refunded_at timestamp without time zone,
    refund_amount character varying(20),
    refund_reason text,
    razorpay_refund_id character varying(255),
    refunded_by character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.session_minutes_purchases OWNER TO neondb_owner;

--
-- Name: session_minutes_usage; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session_minutes_usage (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    purchase_id character varying NOT NULL,
    conversation_id character varying,
    minutes_consumed integer NOT NULL,
    feature_used character varying(100),
    consumed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.session_minutes_usage OWNER TO neondb_owner;

--
-- Name: session_usage; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session_usage (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    session_id character varying(255) NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    duration_seconds character varying(20),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    last_resume_time timestamp without time zone,
    accumulated_duration_ms bigint DEFAULT 0 NOT NULL,
    is_paused boolean DEFAULT false NOT NULL
);


ALTER TABLE public.session_usage OWNER TO neondb_owner;

--
-- Name: COLUMN session_usage.last_resume_time; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.session_usage.last_resume_time IS 'Timestamp when session was last resumed (for calculating running time)';


--
-- Name: COLUMN session_usage.accumulated_duration_ms; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.session_usage.accumulated_duration_ms IS 'Total accumulated time in milliseconds (updated on pause)';


--
-- Name: COLUMN session_usage.is_paused; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.session_usage.is_paused IS 'Whether the session is currently paused';


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying(255) NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.subscription_plans (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    price character varying(20) NOT NULL,
    listed_price character varying(20),
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    billing_interval character varying(20) NOT NULL,
    features jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    published_on_website boolean DEFAULT false,
    available_until timestamp without time zone,
    required_addons jsonb DEFAULT '[]'::jsonb,
    razorpay_plan_id character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subscription_plans OWNER TO neondb_owner;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.subscriptions (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    plan_id character varying(255),
    plan_type character varying(20) DEFAULT 'free_trial'::character varying NOT NULL,
    status character varying(20) DEFAULT 'trial'::character varying NOT NULL,
    sessions_used character varying(10) DEFAULT '0'::character varying NOT NULL,
    sessions_limit character varying(10),
    minutes_used character varying(10) DEFAULT '0'::character varying NOT NULL,
    minutes_limit character varying(10),
    session_history jsonb DEFAULT '[]'::jsonb,
    current_period_start timestamp without time zone,
    current_period_end timestamp without time zone,
    canceled_at timestamp without time zone,
    cancellation_reason text,
    razorpay_subscription_id character varying(255),
    razorpay_customer_id character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subscriptions OWNER TO neondb_owner;

--
-- Name: super_user_overrides; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.super_user_overrides (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    reason text NOT NULL,
    granted_by character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.super_user_overrides OWNER TO neondb_owner;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.support_tickets (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255),
    subject character varying(255) NOT NULL,
    description text NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    assigned_to character varying(255),
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.support_tickets OWNER TO neondb_owner;

--
-- Name: system_config; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.system_config (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    key character varying(255) NOT NULL,
    value text,
    section character varying(50) NOT NULL,
    description text,
    updated_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.system_config OWNER TO neondb_owner;

--
-- Name: system_metrics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.system_metrics (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    metric_type character varying(50) NOT NULL,
    value character varying(100) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.system_metrics OWNER TO neondb_owner;

--
-- Name: terms_and_conditions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.terms_and_conditions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) DEFAULT 'Terms & Conditions'::character varying NOT NULL,
    content text NOT NULL,
    version character varying(20) DEFAULT '1.0'::character varying NOT NULL,
    is_active boolean DEFAULT true,
    last_modified_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.terms_and_conditions OWNER TO neondb_owner;

--
-- Name: time_extensions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.time_extensions (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    extension_type character varying(20) NOT NULL,
    extension_value character varying(20) NOT NULL,
    reason text NOT NULL,
    granted_by character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.time_extensions OWNER TO neondb_owner;

--
-- Name: traffic_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.traffic_logs (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    ip_address character varying(255),
    country character varying(255),
    state character varying(255),
    city character varying(255),
    device_type character varying(255),
    browser character varying(255),
    visited_page text,
    visit_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.traffic_logs OWNER TO neondb_owner;

--
-- Name: training_documents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.training_documents (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    domain_expertise_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_type character varying(20) NOT NULL,
    file_url text NOT NULL,
    content text,
    content_source character varying(20) DEFAULT 'extraction'::character varying,
    audio_duration integer,
    summary jsonb,
    summary_status character varying(20) DEFAULT 'not_generated'::character varying,
    summary_error text,
    last_summarized_at timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    processing_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    processing_error text,
    knowledge_extracted_at timestamp without time zone,
    content_hash character varying(64),
    uploaded_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.training_documents OWNER TO neondb_owner;

--
-- Name: user_entitlements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_entitlements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    organization_id character varying,
    has_platform_access boolean DEFAULT false,
    platform_access_expires_at timestamp without time zone,
    session_minutes_balance integer DEFAULT 0,
    session_minutes_expires_at timestamp without time zone,
    has_train_me boolean DEFAULT false,
    train_me_expires_at timestamp without time zone,
    has_dai boolean DEFAULT false,
    dai_tokens_balance integer DEFAULT 0,
    dai_expires_at timestamp without time zone,
    is_enterprise_user boolean DEFAULT false,
    enterprise_train_me_enabled boolean DEFAULT false,
    enterprise_dai_enabled boolean DEFAULT false,
    last_calculated_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_entitlements OWNER TO neondb_owner;

--
-- Name: user_feedback; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_feedback (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    conversation_id character varying(255),
    rating integer NOT NULL,
    feedback text,
    category character varying(50),
    status character varying(20) DEFAULT 'new'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_feedback OWNER TO neondb_owner;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_profiles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    preferred_methodology character varying(50),
    conversation_style character varying(50),
    primary_industries text[],
    product_expertise text[],
    avg_deal_size text,
    avg_sales_cycle text,
    successful_patterns jsonb,
    common_objections text[],
    coaching_intensity character varying(20),
    focus_areas text[],
    total_conversations integer DEFAULT 0,
    avg_conversion_rate integer,
    strongest_framework character varying(50),
    improvement_areas text[],
    learnings jsonb,
    custom_preferences jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_profiles OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    profile_image_url character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: replit_database_migrations_v1 id; Type: DEFAULT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1 ALTER COLUMN id SET DEFAULT nextval('_system.replit_database_migrations_v1_id_seq'::regclass);


--
-- Data for Name: replit_database_migrations_v1; Type: TABLE DATA; Schema: _system; Owner: neondb_owner
--

COPY _system.replit_database_migrations_v1 (id, build_id, deployment_id, statement_count, applied_at) FROM stdin;
1	0d36833d-7b4f-4de6-a9f3-9c7858cb1720	a5b7a86d-04f6-4fae-bfdd-696f86a29e45	198	2026-02-22 20:06:21.442781+00
2	918305f5-62f1-4f90-9381-dbe4fd5fea11	a5b7a86d-04f6-4fae-bfdd-696f86a29e45	41	2026-02-23 05:09:00.443167+00
3	133c9d4b-5bff-417c-b3db-a6f01d426d5e	a5b7a86d-04f6-4fae-bfdd-696f86a29e45	41	2026-02-23 05:22:44.740294+00
4	15ac5958-a935-4b62-b2ee-de93faa7a6af	a5b7a86d-04f6-4fae-bfdd-696f86a29e45	41	2026-02-24 17:33:28.670963+00
5	463c4d23-9a5f-40ae-8e1b-5e66ecfaa0aa	a5b7a86d-04f6-4fae-bfdd-696f86a29e45	41	2026-02-26 03:20:35.316904+00
6	e065680e-be42-42a5-9209-6b7bfb01f699	a5b7a86d-04f6-4fae-bfdd-696f86a29e45	41	2026-02-26 17:46:06.000501+00
\.


--
-- Data for Name: addon_purchases; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.addon_purchases (id, user_id, organization_id, addon_type, package_sku, billing_type, status, purchase_amount, currency, gateway_transaction_id, start_date, end_date, auto_renew, total_units, used_units, metadata, parent_purchase_id, renewal_scheduled_at, refunded_at, refund_amount, refund_reason, gateway_refund_id, refunded_by, created_at, updated_at) FROM stdin;
b3483dc6-623e-47b6-a2a0-7cca78f005ec	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	train_me	258106b4-6b02-4af3-8b1d-af77d7af29c1	one_time	active	20.00	USD	05c50364-febc-4281-bf6e-bf51cdbd9162	2026-02-25 19:09:11.43	2026-03-27 19:09:11.43	f	0	0	{"quantity": 1, "basePrice": "20", "paymentId": "pay_SKUM6SdnnVQbhM", "itemNumber": 1, "totalItems": 1, "cartOrderId": "a3c12c57-5820-427e-a0c1-a71d2a09d31a", "packageName": "Train Me Add-on (Monthly)", "actualCurrency": "USD", "gatewayProvider": "razorpay", "actualPaidAmount": "20.00", "purchasedViaCart": true, "originalAddonType": "service"}	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:09:14.150348	2026-02-25 19:09:14.150348
b5f9befb-c4ec-4b65-b9c3-32a4df2dcc7f	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	session_minutes	16b59eb6-e3cb-4235-9a53-df3315c4ed24	one_time	active	8.00	USD	05c50364-febc-4281-bf6e-bf51cdbd9162	2026-02-25 19:09:12.358	2026-03-27 19:09:12.358	f	500	0	{"quantity": 1, "basePrice": "8", "paymentId": "pay_SKUM6SdnnVQbhM", "cartOrderId": "a3c12c57-5820-427e-a0c1-a71d2a09d31a", "packageName": "500 Minutes Package", "actualCurrency": "USD", "gatewayProvider": "razorpay", "purchaseHistory": [{"amount": "8.00", "orderId": "a3c12c57-5820-427e-a0c1-a71d2a09d31a", "currency": "USD", "quantity": 1, "paymentId": "pay_SKUM6SdnnVQbhM", "packageSku": "16b59eb6-e3cb-4235-9a53-df3315c4ed24", "packageName": "500 Minutes Package", "purchasedAt": "2026-02-25T19:09:12.358Z", "minutesAdded": 500, "gatewayProvider": "razorpay", "purchasedViaCart": true}], "actualPaidAmount": "8.00", "purchasedViaCart": true, "originalAddonType": "usage_bundle"}	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:09:15.089129	2026-02-25 19:09:15.089129
e26a245d-8f48-4b4c-8e6e-15227d05a976	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	platform_access	61a2e346-c35f-4395-8996-b3c4cfe8fcd8	one_time	active	149.00	USD	05c50364-febc-4281-bf6e-bf51cdbd9162	2026-02-25 19:09:12.823	2026-03-27 19:09:12.823	f	0	0	{"quantity": 1, "basePrice": "149", "paymentId": "pay_SKUM6SdnnVQbhM", "itemNumber": 1, "totalItems": 1, "cartOrderId": "a3c12c57-5820-427e-a0c1-a71d2a09d31a", "packageName": "3 Months Plan", "actualCurrency": "USD", "gatewayProvider": "razorpay", "actualPaidAmount": "149.00", "purchasedViaCart": true, "originalAddonType": "platform_access"}	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:09:15.55471	2026-02-25 19:09:15.55471
f6f9c8bf-59aa-4404-8acc-6558ec16eae1	76cacf03-9e99-4098-b633-7617082f077e	\N	train_me	258106b4-6b02-4af3-8b1d-af77d7af29c1	one_time	active	0.00	USD	\N	2026-02-26 16:26:12.511	2026-03-28 16:26:12.511	f	0	0	{"quantity": 1, "basePrice": "20", "paymentId": "free_1772123170328", "itemNumber": 1, "totalItems": 1, "cartOrderId": "37cadd13-04c4-4d9f-878f-b8a0e781233d", "packageName": "Train Me Add-on (Monthly)", "actualCurrency": "USD", "gatewayProvider": "free_promo", "actualPaidAmount": "0.00", "purchasedViaCart": true, "originalAddonType": "service"}	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:26:14.140791	2026-02-26 16:26:14.140791
9ad92af9-d3a6-4842-b68d-b85f17072bc8	76cacf03-9e99-4098-b633-7617082f077e	\N	platform_access	61a2e346-c35f-4395-8996-b3c4cfe8fcd8	one_time	active	0.00	USD	\N	2026-02-26 16:26:13.012	2026-03-28 16:26:13.012	f	0	0	{"quantity": 1, "basePrice": "149", "paymentId": "free_1772123170328", "itemNumber": 1, "totalItems": 1, "cartOrderId": "37cadd13-04c4-4d9f-878f-b8a0e781233d", "packageName": "3 Months Plan", "actualCurrency": "USD", "gatewayProvider": "free_promo", "actualPaidAmount": "0.00", "purchasedViaCart": true, "originalAddonType": "platform_access"}	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:26:14.634899	2026-02-26 16:26:14.634899
fcf85d1c-bf0d-4ac0-846b-fa656ea00e34	76cacf03-9e99-4098-b633-7617082f077e	\N	session_minutes	16b59eb6-e3cb-4235-9a53-df3315c4ed24	one_time	active	0.00	USD	\N	2026-02-26 16:26:13.986	2026-03-28 16:26:13.986	f	500	0	{"quantity": 1, "basePrice": "8", "paymentId": "free_1772123170328", "cartOrderId": "37cadd13-04c4-4d9f-878f-b8a0e781233d", "packageName": "500 Minutes Package", "actualCurrency": "USD", "gatewayProvider": "free_promo", "purchaseHistory": [{"amount": "0.00", "orderId": "37cadd13-04c4-4d9f-878f-b8a0e781233d", "currency": "USD", "quantity": 1, "paymentId": "free_1772123170328", "packageSku": "16b59eb6-e3cb-4235-9a53-df3315c4ed24", "packageName": "500 Minutes Package", "purchasedAt": "2026-02-26T16:26:13.986Z", "minutesAdded": 500, "gatewayProvider": "free_promo", "purchasedViaCart": true}], "actualPaidAmount": "0.00", "purchasedViaCart": true, "originalAddonType": "usage_bundle"}	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:26:15.619357	2026-02-26 16:26:15.619357
\.


--
-- Data for Name: addons; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.addons (id, slug, display_name, type, billing_interval, pricing_tiers, flat_price, currency, features, metadata, is_active, published_on_website, created_at, updated_at) FROM stdin;
f4fdc254-fe49-4de7-890a-0a703418609d	dai-lite-monthly	DAI Lite (Monthly)	service	monthly	\N	10	USD	["100K AI tokens per month", "Access to all AI models", "Perfect for light usage", "Monthly renewal"]	{"description": "DAI Lite: 100K tokens per month", "total_tokens": 100000, "validity_days": 30}	t	t	2026-02-22 07:19:43.174955	2026-02-22 07:19:43.174955
ab78b453-03a5-48f3-80e2-b3f00b773f4d	dai-moderate-monthly	DAI Moderate (Monthly)	service	monthly	\N	25	USD	["300K AI tokens per month", "Access to all AI models", "Great for regular usage", "Monthly renewal"]	{"description": "DAI Moderate: 300K tokens per month", "total_tokens": 300000, "validity_days": 30}	t	t	2026-02-22 07:19:43.385479	2026-02-22 07:19:43.385479
9a4a9b1b-e52f-4c7b-b207-f62c303002c6	dai-professional-monthly	DAI Professional (Monthly)	service	monthly	\N	50	USD	["750K AI tokens per month", "Access to all AI models", "Ideal for power users", "Monthly renewal"]	{"description": "DAI Professional: 750K tokens per month", "total_tokens": 750000, "validity_days": 30}	t	t	2026-02-22 07:19:43.587498	2026-02-22 07:19:43.587498
9e0e2797-7274-4cf2-969c-6be53711c4c4	dai-power-monthly	DAI Power (Monthly)	service	monthly	\N	100	USD	["1.5M AI tokens per month", "Access to all AI models", "For heavy users", "Monthly renewal"]	{"description": "DAI Power: 1.5M tokens per month", "total_tokens": 1500000, "validity_days": 30}	t	t	2026-02-22 07:19:43.792395	2026-02-22 07:19:43.792395
f92de33c-cf9b-45ff-951b-9b576a2aed41	dai-enterprise-monthly	DAI Enterprise (Monthly)	service	monthly	\N	200	USD	["3M AI tokens per month", "Access to all AI models", "Enterprise-grade usage", "Monthly renewal"]	{"description": "DAI Enterprise: 3M tokens per month", "total_tokens": 3000000, "validity_days": 30}	t	t	2026-02-22 07:19:43.996669	2026-02-22 07:19:43.996669
258106b4-6b02-4af3-8b1d-af77d7af29c1	train-me	Train Me Add-on (Monthly)	service	monthly	\N	20	USD	["Create up to 5 domain expertise profiles", "Upload up to 100 documents per domain", "Support for PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, TXT", "Train AI with specific product knowledge and pricing", "Get domain-specific answers during sales calls"]	{"description": "Train AI on your specific domain and product knowledge", "validity_days": 30}	t	t	2026-02-22 07:19:44.205249	2026-02-22 07:19:44.205249
16b59eb6-e3cb-4235-9a53-df3315c4ed24	session-minutes-500	500 Minutes Package	usage_bundle	one-time	\N	8	USD	["500 session minutes", "Never expires", "One-time purchase"]	{"minutes": 500}	t	t	2026-02-22 07:19:44.409817	2026-02-22 07:19:44.409817
f19e48b0-2bbc-4a75-9d0e-73afa53b09d3	session-minutes-1000	1000 Minutes Package	usage_bundle	one-time	\N	16	USD	["1000 session minutes", "Never expires", "One-time purchase"]	{"minutes": 1000}	t	t	2026-02-22 07:19:44.617184	2026-02-22 07:19:44.617184
0297d197-2c45-410e-ad94-4ec73e77c79b	session-minutes-1500	1500 Minutes Package	usage_bundle	one-time	\N	24	USD	["1500 session minutes", "Never expires", "One-time purchase"]	{"minutes": 1500}	t	t	2026-02-22 07:19:44.818414	2026-02-22 07:19:44.818414
280dc216-bf5e-4ce4-9ade-8083dc67ec2d	session-minutes-2000	2000 Minutes Package	usage_bundle	one-time	\N	32	USD	["2000 session minutes", "Never expires", "One-time purchase"]	{"minutes": 2000}	t	t	2026-02-22 07:19:45.023939	2026-02-22 07:19:45.023939
4783537e-de2a-4a2a-a8e9-1194887d1f1e	session-minutes-3000	3000 Minutes Package	usage_bundle	one-time	\N	48	USD	["3000 session minutes", "Never expires", "One-time purchase"]	{"minutes": 3000}	t	t	2026-02-22 07:19:45.226025	2026-02-22 07:19:45.226025
ac84f933-15d3-4ff2-9a27-8b60c0f1858b	session-minutes-5000	5000 Minutes Package	usage_bundle	one-time	\N	80	USD	["5000 session minutes", "Never expires", "One-time purchase"]	{"minutes": 5000}	t	t	2026-02-22 07:19:45.432609	2026-02-22 07:19:45.432609
\.


--
-- Data for Name: ai_token_usage; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.ai_token_usage (id, user_id, organization_id, provider, prompt_tokens, completion_tokens, total_tokens, request_id, feature, metadata, occurred_at, created_at) FROM stdin;
7c822c90-b4a2-4b97-8161-71f0cd85d0b3	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	deepseek	1949	449	2398	\N	shift_gears	{"recordedAt": "2026-02-23T05:46:36.686Z"}	2026-02-23 05:46:36.686	2026-02-23 05:46:36.698552
0e54c71c-2519-4695-82f4-d10753333e1f	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	deepseek	1949	462	2411	\N	shift_gears	{"recordedAt": "2026-02-23T05:46:38.373Z"}	2026-02-23 05:46:38.373	2026-02-23 05:46:38.385212
8dc1c600-70dd-4fe1-94d2-d82304d8326d	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	deepseek	2164	513	2677	\N	shift_gears	{"recordedAt": "2026-02-23T05:48:03.672Z"}	2026-02-23 05:48:03.672	2026-02-23 05:48:03.684845
4109c27f-9df7-4551-b63c-72bdecb875fc	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	deepseek	2164	495	2659	\N	shift_gears	{"recordedAt": "2026-02-23T05:48:04.767Z"}	2026-02-23 05:48:04.767	2026-02-23 05:48:04.778408
a08d62c0-9981-439c-b845-99efa81d5522	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	deepseek	2247	466	2713	\N	shift_gears	{"recordedAt": "2026-02-23T05:48:59.789Z"}	2026-02-23 05:48:59.789	2026-02-23 05:48:59.80165
5a5ce310-b618-47d7-94ab-bea24a88f1ba	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	deepseek	2247	468	2715	\N	shift_gears	{"recordedAt": "2026-02-23T05:49:01.072Z"}	2026-02-23 05:49:01.072	2026-02-23 05:49:01.084473
74793d80-f477-417b-aeee-1d8854ffd44a	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	deepseek	876	1809	2685	\N	mind_map	{"recordedAt": "2026-02-23T05:50:44.460Z"}	2026-02-23 05:50:44.46	2026-02-23 05:50:44.472408
125c4bba-dbab-4688-a7ab-c5c81c3b3b28	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	deepseek	2247	494	2741	\N	shift_gears	{"recordedAt": "2026-02-23T05:56:44.422Z"}	2026-02-23 05:56:44.422	2026-02-23 05:56:44.436695
c177ce6f-5c53-4957-9765-6bf8447bd218	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	deepseek	2298	476	2774	\N	shift_gears	{"recordedAt": "2026-02-23T05:57:07.871Z"}	2026-02-23 05:57:07.871	2026-02-23 05:57:07.882937
2ee9b2f5-75a7-4126-9ff1-87d07eaf2494	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	deepseek	2298	507	2805	\N	shift_gears	{"recordedAt": "2026-02-23T05:57:09.558Z"}	2026-02-23 05:57:09.558	2026-02-23 05:57:09.56985
d4713fb6-3479-42d0-84f1-e39b52ab7216	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	deepseek	1946	396	2342	\N	shift_gears	{"recordedAt": "2026-02-23T06:10:47.974Z"}	2026-02-23 06:10:47.974	2026-02-23 06:10:47.985631
8b663a19-20b6-4632-8ee3-fa11aa8e6da3	262a89e3-6dde-4b37-a65f-e800fd316105	\N	deepseek	1951	412	2363	\N	shift_gears	{"recordedAt": "2026-02-23T21:09:35.445Z"}	2026-02-23 21:09:35.445	2026-02-23 21:09:35.456746
e91297d7-08ee-4bd7-97b8-079e94774a2f	262a89e3-6dde-4b37-a65f-e800fd316105	\N	deepseek	1951	383	2334	\N	shift_gears	{"recordedAt": "2026-02-23T21:09:36.096Z"}	2026-02-23 21:09:36.096	2026-02-23 21:09:36.108138
246dbd97-cccd-48e3-adae-869bd1886070	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	deepseek	337	49	386	\N	shift_gears	{"recordedAt": "2026-02-24T15:39:54.135Z"}	2026-02-24 15:39:54.135	2026-02-24 15:39:54.71164
97f74a29-cbe2-4eed-8127-a6f71c4bd8c2	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	deepseek	316	56	372	\N	shift_gears	{"recordedAt": "2026-02-24T15:39:54.428Z"}	2026-02-24 15:39:54.428	2026-02-24 15:39:54.995995
62839dd6-6fcb-44fb-97d0-665759921130	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	deepseek	1959	385	2344	\N	shift_gears	{"recordedAt": "2026-02-24T15:40:01.126Z"}	2026-02-24 15:40:01.126	2026-02-24 15:40:01.699452
020b76b6-4ddf-439f-a4bc-86b03aa23e04	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	deepseek	378	272	650	\N	shift_gears	{"recordedAt": "2026-02-24T15:40:05.063Z"}	2026-02-24 15:40:05.063	2026-02-24 15:40:05.637764
a37948a1-61ff-458e-8a04-e31456214a9f	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	deepseek	405	157	562	\N	shift_gears	{"recordedAt": "2026-02-24T15:40:05.814Z"}	2026-02-24 15:40:05.814	2026-02-24 15:40:07.175085
0dbe6fcf-eb30-4bfa-acf5-05906e4bfdbf	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	deepseek	422	409	831	\N	shift_gears	{"recordedAt": "2026-02-24T15:40:15.310Z"}	2026-02-24 15:40:15.31	2026-02-24 15:40:15.884909
b15ce987-7474-4b71-b634-01b6623cf2ca	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	deepseek	371	258	629	\N	shift_gears	{"recordedAt": "2026-02-24T15:40:18.481Z"}	2026-02-24 15:40:18.482	2026-02-24 15:40:19.057418
4bb5dd89-109a-4db2-9dcb-a789ddbe0569	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	deepseek	364	579	943	\N	shift_gears	{"recordedAt": "2026-02-24T15:40:22.473Z"}	2026-02-24 15:40:22.473	2026-02-24 15:40:23.048564
d7c40eb0-0558-46c1-be7a-0d3f1ce81e2e	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	deepseek	1956	422	2378	\N	shift_gears	{"recordedAt": "2026-02-24T15:45:02.762Z"}	2026-02-24 15:45:02.762	2026-02-24 15:45:03.337347
a3fc1d21-eed1-4ace-a85d-33e3da41a4ee	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	deepseek	1956	425	2381	\N	shift_gears	{"recordedAt": "2026-02-24T15:45:03.989Z"}	2026-02-24 15:45:03.989	2026-02-24 15:45:04.552638
41690bd2-041f-408f-9f79-706c447d0d78	262a89e3-6dde-4b37-a65f-e800fd316105	\N	deepseek	1942	413	2355	\N	shift_gears	{"recordedAt": "2026-02-25T18:17:32.526Z"}	2026-02-25 18:17:32.526	2026-02-25 18:17:32.538707
cc0c684c-e5df-4bab-9060-bb3b5301c4a5	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	deepseek	316	110	426	\N	shift_gears	{"recordedAt": "2026-02-25T18:34:31.139Z"}	2026-02-25 18:34:31.14	2026-02-25 18:34:33.862983
ec167be7-06ab-48c3-9471-5a4ae96e687d	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	deepseek	339	118	457	\N	shift_gears	{"recordedAt": "2026-02-25T18:34:37.998Z"}	2026-02-25 18:34:37.998	2026-02-25 18:34:40.720854
7c27a5ae-c4de-417f-963a-a11487569cd7	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	deepseek	1948	392	2340	\N	shift_gears	{"recordedAt": "2026-02-25T18:34:39.289Z"}	2026-02-25 18:34:39.289	2026-02-25 18:34:42.026978
2cf69624-297f-463c-851e-32ed1f99808b	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	deepseek	1948	418	2366	\N	shift_gears	{"recordedAt": "2026-02-25T18:34:39.850Z"}	2026-02-25 18:34:39.85	2026-02-25 18:34:42.565014
2f0db5e1-8750-4fa8-9d58-d89fcb592059	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	deepseek	358	286	644	\N	shift_gears	{"recordedAt": "2026-02-25T18:34:42.287Z"}	2026-02-25 18:34:42.287	2026-02-25 18:34:44.999985
84ff3731-7567-473b-a767-e134eb2c44e4	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	deepseek	380	449	829	\N	shift_gears	{"recordedAt": "2026-02-25T18:34:46.675Z"}	2026-02-25 18:34:46.675	2026-02-25 18:34:49.386048
96d47080-da58-4e9d-8e53-e0212e858595	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	deepseek	403	600	1003	\N	shift_gears	{"recordedAt": "2026-02-25T18:34:55.096Z"}	2026-02-25 18:34:55.096	2026-02-25 18:34:57.809787
1d79d639-e1d4-41f5-ab18-2a3aff9a46f8	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	deepseek	350	298	648	\N	shift_gears	{"recordedAt": "2026-02-25T18:34:57.401Z"}	2026-02-25 18:34:57.402	2026-02-25 18:35:00.126855
a8e3eddd-0ed7-4e30-8444-0e1189cc49aa	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	deepseek	360	600	960	\N	shift_gears	{"recordedAt": "2026-02-25T18:34:58.641Z"}	2026-02-25 18:34:58.641	2026-02-25 18:35:01.368959
02f2d462-c5f2-4bf6-90d6-b960a2ec05ee	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	315	62	377	\N	shift_gears	{"recordedAt": "2026-02-25T18:41:33.291Z"}	2026-02-25 18:41:33.292	2026-02-25 18:41:36.01307
1982b444-cb23-45ad-be91-f0bbfb3e0449	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	1947	416	2363	\N	shift_gears	{"recordedAt": "2026-02-25T18:41:41.230Z"}	2026-02-25 18:41:41.23	2026-02-25 18:41:43.983368
4e7e61ec-287a-4d8b-bea8-60757abf3dda	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	1947	409	2356	\N	shift_gears	{"recordedAt": "2026-02-25T18:41:42.014Z"}	2026-02-25 18:41:42.014	2026-02-25 18:41:44.764702
4903bba9-8da4-4dbc-bac0-211825114a49	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	340	412	752	\N	shift_gears	{"recordedAt": "2026-02-25T18:41:44.610Z"}	2026-02-25 18:41:44.61	2026-02-25 18:41:47.345303
117fec29-1862-4c28-b6e8-bc01e43a5529	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	370	444	814	\N	shift_gears	{"recordedAt": "2026-02-25T18:41:49.969Z"}	2026-02-25 18:41:49.969	2026-02-25 18:41:52.684707
e7b3956c-565a-4c5f-8a06-1ab5aaf1658a	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	1975	392	2367	\N	shift_gears	{"recordedAt": "2026-02-25T18:41:53.286Z"}	2026-02-25 18:41:53.286	2026-02-25 18:41:56.012621
92a8e2f9-dfd3-4528-85ce-8b3d1ea6613a	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	404	600	1004	\N	shift_gears	{"recordedAt": "2026-02-25T18:41:59.077Z"}	2026-02-25 18:41:59.077	2026-02-25 18:42:01.802804
170865dc-949f-4f46-b00f-4477a5a0e97f	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	431	496	927	\N	shift_gears	{"recordedAt": "2026-02-25T18:41:59.793Z"}	2026-02-25 18:41:59.793	2026-02-25 18:42:02.525743
8bcc1956-c082-4989-84aa-fa4fc6b3d6bb	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	395	371	766	\N	shift_gears	{"recordedAt": "2026-02-25T18:42:00.309Z"}	2026-02-25 18:42:00.309	2026-02-25 18:42:03.030213
202f9ec4-c97a-498e-a386-ee8682a61cb4	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	395	477	872	\N	shift_gears	{"recordedAt": "2026-02-25T18:42:06.049Z"}	2026-02-25 18:42:06.049	2026-02-25 18:42:08.778547
b174f69a-5921-4734-a13b-7cde306c0653	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	403	541	944	\N	shift_gears	{"recordedAt": "2026-02-25T18:42:10.978Z"}	2026-02-25 18:42:10.978	2026-02-25 18:42:13.706686
1c92cdfb-cc51-4565-a299-12642415ba8e	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	397	340	737	\N	shift_gears	{"recordedAt": "2026-02-25T18:42:13.478Z"}	2026-02-25 18:42:13.478	2026-02-25 18:42:16.206414
e2b0c6de-4fc6-424f-b0b4-45d76a6a31b4	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	390	196	586	\N	shift_gears	{"recordedAt": "2026-02-25T18:42:14.531Z"}	2026-02-25 18:42:14.531	2026-02-25 18:42:17.258236
a20beb12-3611-4716-8594-76c7fcf7e20e	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	397	486	883	\N	shift_gears	{"recordedAt": "2026-02-25T18:42:23.450Z"}	2026-02-25 18:42:23.45	2026-02-25 18:42:26.175051
45eca2fc-89eb-49b2-b313-ecf891802937	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	404	327	731	\N	shift_gears	{"recordedAt": "2026-02-25T18:42:38.454Z"}	2026-02-25 18:42:38.454	2026-02-25 18:42:41.170702
274b980e-61ac-46fe-b0d6-97eca9da2723	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	415	364	779	\N	shift_gears	{"recordedAt": "2026-02-25T18:42:43.751Z"}	2026-02-25 18:42:43.751	2026-02-25 18:42:46.503266
a89ccf4c-3ac7-4cc3-ad3a-3ad6b4fa996b	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	410	458	868	\N	shift_gears	{"recordedAt": "2026-02-25T18:42:50.388Z"}	2026-02-25 18:42:50.388	2026-02-25 18:42:53.111857
6c6a7ac4-e122-4e77-8afa-6386eeafbeed	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	413	520	933	\N	shift_gears	{"recordedAt": "2026-02-25T18:42:53.473Z"}	2026-02-25 18:42:53.473	2026-02-25 18:42:56.195355
881e8f70-16ae-4868-be79-563893c69846	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	418	507	925	\N	shift_gears	{"recordedAt": "2026-02-25T18:42:58.633Z"}	2026-02-25 18:42:58.633	2026-02-25 18:43:01.360181
e3397cf0-4266-4b46-8351-43d0c4432ba8	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	402	311	713	\N	shift_gears	{"recordedAt": "2026-02-25T18:42:59.090Z"}	2026-02-25 18:42:59.09	2026-02-25 18:43:01.842942
7d5100cc-7d5f-4e95-baba-99bff95673f7	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	314	62	376	\N	shift_gears	{"recordedAt": "2026-02-25T18:51:16.188Z"}	2026-02-25 18:51:16.189	2026-02-25 18:51:18.908359
333d5086-5fc3-43d9-99f4-0d9ae1042ab7	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	1946	394	2340	\N	shift_gears	{"recordedAt": "2026-02-25T18:51:21.445Z"}	2026-02-25 18:51:21.445	2026-02-25 18:51:24.166462
02dac007-1125-40d8-b380-36173eb788e5	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	1963	395	2358	\N	shift_gears	{"recordedAt": "2026-02-25T18:51:24.634Z"}	2026-02-25 18:51:24.635	2026-02-25 18:51:27.352788
749c9631-aeac-474e-bbcc-27791e003045	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	345	536	881	\N	shift_gears	{"recordedAt": "2026-02-25T18:51:27.631Z"}	2026-02-25 18:51:27.631	2026-02-25 18:51:30.352576
81c596d9-1f8f-4f07-ba18-d86b3d698feb	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	380	534	914	\N	shift_gears	{"recordedAt": "2026-02-25T18:51:32.680Z"}	2026-02-25 18:51:32.68	2026-02-25 18:51:35.397886
6a9e5856-0915-46ee-a854-6e8587e3c7ca	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	418	311	729	\N	shift_gears	{"recordedAt": "2026-02-25T18:51:32.768Z"}	2026-02-25 18:51:32.768	2026-02-25 18:51:35.483874
095a4ef6-c2c4-449f-8153-5d803e79563b	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	454	584	1038	\N	shift_gears	{"recordedAt": "2026-02-25T18:51:41.659Z"}	2026-02-25 18:51:41.659	2026-02-25 18:51:44.379868
10f67ae0-091d-4f70-b897-c3f47d34c06e	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	410	509	919	\N	shift_gears	{"recordedAt": "2026-02-25T18:51:43.556Z"}	2026-02-25 18:51:43.556	2026-02-25 18:51:46.280107
fa8f43bd-4242-402b-9c37-377cd075000d	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	410	474	884	\N	shift_gears	{"recordedAt": "2026-02-25T18:51:48.180Z"}	2026-02-25 18:51:48.18	2026-02-25 18:51:50.894946
fa8cd7b8-9609-4c49-9884-05a6501f139f	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	406	414	820	\N	shift_gears	{"recordedAt": "2026-02-25T18:51:51.639Z"}	2026-02-25 18:51:51.64	2026-02-25 18:51:54.358693
1c9b99e3-7f74-41ed-becf-4660cf954598	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	409	139	548	\N	shift_gears	{"recordedAt": "2026-02-25T18:51:55.052Z"}	2026-02-25 18:51:55.052	2026-02-25 18:51:57.784945
6c12eb13-054b-4887-b1f2-cf85f155b6c3	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	405	440	845	\N	shift_gears	{"recordedAt": "2026-02-25T18:52:04.263Z"}	2026-02-25 18:52:04.263	2026-02-25 18:52:06.979683
ff1db7a4-a1ac-4f28-9500-d1af446debb2	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	407	344	751	\N	shift_gears	{"recordedAt": "2026-02-25T18:52:18.212Z"}	2026-02-25 18:52:18.212	2026-02-25 18:52:20.939769
0af6a846-c9a7-438a-902e-4ee80da514a5	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	412	339	751	\N	shift_gears	{"recordedAt": "2026-02-25T18:52:21.840Z"}	2026-02-25 18:52:21.84	2026-02-25 18:52:24.558126
6ae94c2b-7163-458c-a774-0e3f405184d3	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	394	492	886	\N	shift_gears	{"recordedAt": "2026-02-25T18:52:28.539Z"}	2026-02-25 18:52:28.539	2026-02-25 18:52:31.25944
9603384e-c0d9-4751-8164-23efa267828a	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	381	353	734	\N	shift_gears	{"recordedAt": "2026-02-25T18:52:29.927Z"}	2026-02-25 18:52:29.927	2026-02-25 18:52:32.656663
c67aa251-5e85-4a1e-bbf4-7dcb3317e294	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	362	409	771	\N	shift_gears	{"recordedAt": "2026-02-25T18:52:35.691Z"}	2026-02-25 18:52:35.691	2026-02-25 18:52:38.417921
93274881-9be0-4b4d-87c5-dec31688826f	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	362	210	572	\N	shift_gears	{"recordedAt": "2026-02-25T18:52:37.092Z"}	2026-02-25 18:52:37.092	2026-02-25 18:52:39.808147
dc000a0f-c448-4d03-81c6-42f8e6c3271a	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	370	218	588	\N	shift_gears	{"recordedAt": "2026-02-25T18:52:46.590Z"}	2026-02-25 18:52:46.59	2026-02-25 18:52:49.30924
b44112b6-0dc4-4b5f-8816-c57bef09b925	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	deepseek	1941	388	2329	\N	shift_gears	{"recordedAt": "2026-02-25T18:55:09.312Z"}	2026-02-25 18:55:09.312	2026-02-25 18:55:12.042264
39c07864-933e-4298-a96b-7e0d91f9bb4b	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	316	113	429	\N	shift_gears	{"recordedAt": "2026-02-25T18:56:06.098Z"}	2026-02-25 18:56:06.098	2026-02-25 18:56:08.842008
ca930d8f-f29c-4372-a84e-57d741be0404	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	344	66	410	\N	shift_gears	{"recordedAt": "2026-02-25T18:56:08.207Z"}	2026-02-25 18:56:08.207	2026-02-25 18:56:10.949217
98030875-58ea-4080-ab6a-aced243abdd5	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	1948	391	2339	\N	shift_gears	{"recordedAt": "2026-02-25T18:56:08.841Z"}	2026-02-25 18:56:08.841	2026-02-25 18:56:11.568788
81a600cc-f25d-41a4-a8c2-edacd1ee2053	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	371	389	760	\N	shift_gears	{"recordedAt": "2026-02-25T18:56:18.615Z"}	2026-02-25 18:56:18.615	2026-02-25 18:56:21.347197
6b7a697b-d7c3-4166-9447-86a908f8c7e3	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	398	575	973	\N	shift_gears	{"recordedAt": "2026-02-25T18:56:25.407Z"}	2026-02-25 18:56:25.407	2026-02-25 18:56:28.135468
2b16f430-afb2-4a22-b958-d96652f565fb	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	377	251	628	\N	shift_gears	{"recordedAt": "2026-02-25T18:56:27.131Z"}	2026-02-25 18:56:27.131	2026-02-25 18:56:29.850416
4738455e-3cca-4359-9e69-35c4a9d48779	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	419	600	1019	\N	shift_gears	{"recordedAt": "2026-02-25T18:56:30.231Z"}	2026-02-25 18:56:30.231	2026-02-25 18:56:32.954923
fc5c276f-7102-4c1f-8631-dcc84bb49011	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	373	439	812	\N	shift_gears	{"recordedAt": "2026-02-25T18:56:34.414Z"}	2026-02-25 18:56:34.414	2026-02-25 18:56:37.149199
a0a6c478-f928-40e7-b743-9801024f66fc	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	369	530	899	\N	shift_gears	{"recordedAt": "2026-02-25T18:56:39.645Z"}	2026-02-25 18:56:39.645	2026-02-25 18:56:42.365223
c8ca8bc7-6523-435e-906a-7a7512e289b8	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	359	368	727	\N	shift_gears	{"recordedAt": "2026-02-25T18:56:40.927Z"}	2026-02-25 18:56:40.927	2026-02-25 18:56:43.651171
878bbe4c-83c5-431c-a9aa-4efb8589eeed	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	342	457	799	\N	shift_gears	{"recordedAt": "2026-02-25T18:56:46.242Z"}	2026-02-25 18:56:46.242	2026-02-25 18:56:48.970376
7cbd34fe-3c7b-401a-a8f3-f0423b0ba36d	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	347	567	914	\N	shift_gears	{"recordedAt": "2026-02-25T18:56:51.719Z"}	2026-02-25 18:56:51.719	2026-02-25 18:56:54.442509
f05c9537-b283-46cc-ab42-8872fe145991	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	347	400	747	\N	shift_gears	{"recordedAt": "2026-02-25T18:56:53.818Z"}	2026-02-25 18:56:53.818	2026-02-25 18:56:56.537983
d814b542-9585-4976-ac6e-2f6d5f5c6b83	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	364	237	601	\N	shift_gears	{"recordedAt": "2026-02-25T18:56:56.051Z"}	2026-02-25 18:56:56.051	2026-02-25 18:56:58.773122
6c4260cb-6e62-4491-9e51-b652f40ca709	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	373	300	673	\N	shift_gears	{"recordedAt": "2026-02-25T18:57:01.813Z"}	2026-02-25 18:57:01.813	2026-02-25 18:57:04.535999
558a70a2-e37d-4c8c-8183-1c04166910d3	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	413	281	694	\N	shift_gears	{"recordedAt": "2026-02-25T18:57:20.933Z"}	2026-02-25 18:57:20.933	2026-02-25 18:57:23.659119
8bf0dfd8-df60-4c99-ab7b-603bc9674115	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	396	511	907	\N	shift_gears	{"recordedAt": "2026-02-25T18:57:21.478Z"}	2026-02-25 18:57:21.478	2026-02-25 18:57:24.883244
647b13bb-eabb-4563-af96-c8c5e6a5af77	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	413	523	936	\N	shift_gears	{"recordedAt": "2026-02-25T18:57:28.675Z"}	2026-02-25 18:57:28.675	2026-02-25 18:57:31.39495
1d191901-4bc8-41f1-baba-1226b80b4022	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	411	465	876	\N	shift_gears	{"recordedAt": "2026-02-25T18:57:32.361Z"}	2026-02-25 18:57:32.361	2026-02-25 18:57:35.751306
26c09d07-051e-4e04-b45b-d27b37effea2	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	410	600	1010	\N	shift_gears	{"recordedAt": "2026-02-25T18:57:39.971Z"}	2026-02-25 18:57:39.971	2026-02-25 18:57:42.711466
ebb1dd13-1009-4e1e-8a5a-7919e296d7e8	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	398	289	687	\N	shift_gears	{"recordedAt": "2026-02-25T18:57:40.928Z"}	2026-02-25 18:57:40.928	2026-02-25 18:57:43.653014
98e5daa9-9e93-4c00-8d83-3c6baff7223d	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	398	600	998	\N	shift_gears	{"recordedAt": "2026-02-25T18:57:42.619Z"}	2026-02-25 18:57:42.619	2026-02-25 18:57:45.34205
8591ed38-e332-4fee-a81d-cf2d2e5f5640	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	397	389	786	\N	shift_gears	{"recordedAt": "2026-02-25T18:57:48.069Z"}	2026-02-25 18:57:48.069	2026-02-25 18:57:51.468668
a04a22ab-8919-4eb5-8819-f54f38c83e76	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	400	600	1000	\N	shift_gears	{"recordedAt": "2026-02-25T18:57:55.686Z"}	2026-02-25 18:57:55.686	2026-02-25 18:57:58.415237
41762aaf-ae5f-45c0-a282-4d0a290d9d1e	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	379	600	979	\N	shift_gears	{"recordedAt": "2026-02-25T18:57:58.779Z"}	2026-02-25 18:57:58.779	2026-02-25 18:58:01.5063
7b30c3a7-4d06-48b0-b62d-7f27d30ac93a	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	deepseek	380	554	934	\N	shift_gears	{"recordedAt": "2026-02-25T18:58:02.221Z"}	2026-02-25 18:58:02.221	2026-02-25 18:58:04.941953
87a88677-b507-440b-84c5-3800881cdb12	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	310	308	618	\N	shift_gears	{"recordedAt": "2026-02-25T19:10:36.563Z"}	2026-02-25 19:10:36.564	2026-02-25 19:10:39.307336
2a9e0988-697c-434e-a58e-aba839576b16	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1942	374	2316	\N	shift_gears	{"recordedAt": "2026-02-25T19:10:39.537Z"}	2026-02-25 19:10:39.537	2026-02-25 19:10:42.281334
8644eb40-b91a-498f-88dd-3a6763123211	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	330	600	930	\N	shift_gears	{"recordedAt": "2026-02-25T19:10:46.378Z"}	2026-02-25 19:10:46.378	2026-02-25 19:10:49.121533
7c7a5132-6536-4d35-834e-ec292ed8088c	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	359	600	959	\N	shift_gears	{"recordedAt": "2026-02-25T19:10:50.228Z"}	2026-02-25 19:10:50.228	2026-02-25 19:10:52.966344
929471bf-6889-42da-b930-85ef83d9fe5e	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	390	600	990	\N	shift_gears	{"recordedAt": "2026-02-25T19:10:54.042Z"}	2026-02-25 19:10:54.042	2026-02-25 19:10:56.802371
84f1ba38-39b9-4e9e-948f-711d46916795	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	384	408	792	\N	shift_gears	{"recordedAt": "2026-02-25T19:10:56.765Z"}	2026-02-25 19:10:56.766	2026-02-25 19:10:59.503849
ef30bb55-9d21-4290-a3fb-aa526d657990	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	417	600	1017	\N	shift_gears	{"recordedAt": "2026-02-25T19:10:57.551Z"}	2026-02-25 19:10:57.551	2026-02-25 19:11:00.28835
990ae820-165d-4449-9546-b3a4df098aaf	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	400	325	725	\N	shift_gears	{"recordedAt": "2026-02-25T19:10:59.138Z"}	2026-02-25 19:10:59.138	2026-02-25 19:11:01.875878
4892e89c-7ac7-4da5-8aae-cf2abcca2d4b	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	405	343	748	\N	shift_gears	{"recordedAt": "2026-02-25T19:11:04.532Z"}	2026-02-25 19:11:04.532	2026-02-25 19:11:07.276603
2a335e4d-06f5-4867-9330-452665639cc6	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	404	411	815	\N	shift_gears	{"recordedAt": "2026-02-25T19:11:09.248Z"}	2026-02-25 19:11:09.248	2026-02-25 19:11:11.997171
6bc5aa5e-8e7c-422e-8bfc-1c67ad86d181	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	413	600	1013	\N	shift_gears	{"recordedAt": "2026-02-25T19:11:16.860Z"}	2026-02-25 19:11:16.86	2026-02-25 19:11:19.594628
4e50502e-d0dd-4160-a9e8-6bd0d197bf5c	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	416	337	753	\N	shift_gears	{"recordedAt": "2026-02-25T19:11:17.044Z"}	2026-02-25 19:11:17.044	2026-02-25 19:11:21.031538
a4075e34-f987-4417-8c73-13df8b76ed9d	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	415	257	672	\N	shift_gears	{"recordedAt": "2026-02-25T19:11:23.993Z"}	2026-02-25 19:11:23.993	2026-02-25 19:11:26.729861
60b77d6f-7a26-432d-8471-03129c6ae90b	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	418	142	560	\N	shift_gears	{"recordedAt": "2026-02-25T19:11:41.946Z"}	2026-02-25 19:11:41.946	2026-02-25 19:11:44.670983
62d7b9fa-8a87-418f-a3e2-f4f96873eb87	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	419	380	799	\N	shift_gears	{"recordedAt": "2026-02-25T19:11:51.085Z"}	2026-02-25 19:11:51.085	2026-02-25 19:11:53.822211
b032bb8f-1733-4159-ae3f-a0150dd3e5f9	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	316	50	366	\N	shift_gears	{"recordedAt": "2026-02-25T19:12:32.572Z"}	2026-02-25 19:12:32.572	2026-02-25 19:12:35.307075
51f4099e-7655-4003-bbf4-92b4eecaabf2	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1949	402	2351	\N	shift_gears	{"recordedAt": "2026-02-25T19:12:36.961Z"}	2026-02-25 19:12:36.961	2026-02-25 19:12:39.690518
eaad7948-9644-47a8-9e8e-21d3666d45c6	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	346	96	442	\N	shift_gears	{"recordedAt": "2026-02-25T19:12:36.980Z"}	2026-02-25 19:12:36.98	2026-02-25 19:12:39.715198
35f8d456-3dfe-4b36-b7d6-894ac12102a3	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1949	454	2403	\N	shift_gears	{"recordedAt": "2026-02-25T19:12:40.260Z"}	2026-02-25 19:12:40.26	2026-02-25 19:12:42.994779
002ffed2-2fd2-49a5-9f7d-57b6b5ee1dd8	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	374	274	648	\N	shift_gears	{"recordedAt": "2026-02-25T19:12:43.327Z"}	2026-02-25 19:12:43.327	2026-02-25 19:12:46.050609
cd9bb445-e5ba-4d77-a4c7-629aa2859f77	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	377	169	546	\N	shift_gears	{"recordedAt": "2026-02-25T19:12:49.268Z"}	2026-02-25 19:12:49.268	2026-02-25 19:12:52.002814
de80651a-684e-4f91-87c7-15f8a48fc4de	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	401	600	1001	\N	shift_gears	{"recordedAt": "2026-02-25T19:12:49.991Z"}	2026-02-25 19:12:49.991	2026-02-25 19:12:52.715092
1622abf0-04b2-430a-b722-49acfca9e88d	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	370	97	467	\N	shift_gears	{"recordedAt": "2026-02-25T19:12:51.702Z"}	2026-02-25 19:12:51.702	2026-02-25 19:12:54.442838
964b70f2-ffac-43c7-98ed-3fb01185b5f3	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	424	600	1024	\N	shift_gears	{"recordedAt": "2026-02-25T19:12:54.711Z"}	2026-02-25 19:12:54.711	2026-02-25 19:12:57.454463
dc29e7b6-4098-4747-b975-9af0aa27be19	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	320	164	484	\N	shift_gears	{"recordedAt": "2026-02-25T19:15:31.108Z"}	2026-02-25 19:15:31.108	2026-02-25 19:15:31.262247
b5acf506-a333-497c-8489-a6f1646b63d8	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1953	401	2354	\N	shift_gears	{"recordedAt": "2026-02-25T19:15:34.197Z"}	2026-02-25 19:15:34.197	2026-02-25 19:15:34.332185
be12cdd5-823e-4d6b-9b1b-e9eea105e064	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1953	411	2364	\N	shift_gears	{"recordedAt": "2026-02-25T19:15:37.559Z"}	2026-02-25 19:15:37.559	2026-02-25 19:15:37.665913
d5a3b87b-052d-4125-bd00-08a6d8641381	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	312	115	427	\N	shift_gears	{"recordedAt": "2026-02-25T19:18:10.641Z"}	2026-02-25 19:18:10.642	2026-02-25 19:18:10.764868
c794d0aa-fdbf-408d-b913-1503730f96de	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	335	179	514	\N	shift_gears	{"recordedAt": "2026-02-25T19:18:15.511Z"}	2026-02-25 19:18:15.511	2026-02-25 19:18:15.653777
78d63b59-3f3f-4c27-b1bc-20459bc3beef	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1944	381	2325	\N	shift_gears	{"recordedAt": "2026-02-25T19:18:16.639Z"}	2026-02-25 19:18:16.64	2026-02-25 19:18:16.76747
594fb764-581a-41e2-ba8c-b81f47101ae8	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	368	455	823	\N	shift_gears	{"recordedAt": "2026-02-25T19:18:25.587Z"}	2026-02-25 19:18:25.588	2026-02-25 19:18:25.762125
b9855cdc-ffbe-4694-8c9b-600b11f26266	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	404	325	729	\N	shift_gears	{"recordedAt": "2026-02-25T19:18:26.266Z"}	2026-02-25 19:18:26.266	2026-02-25 19:18:26.373568
3e5aece7-fd0b-4015-a6c9-b54f45187da2	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	435	600	1035	\N	shift_gears	{"recordedAt": "2026-02-25T19:18:35.157Z"}	2026-02-25 19:18:35.157	2026-02-25 19:18:35.266551
cde54a60-6faf-45bf-af24-4a9aca30c143	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	314	122	436	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:04.830Z"}	2026-02-25 19:19:04.83	2026-02-25 19:19:04.964867
f0658483-c3e9-4d9b-9d51-a4c046b9e680	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	338	131	469	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:07.457Z"}	2026-02-25 19:19:07.457	2026-02-25 19:19:07.584569
85bae81f-ebdd-4a4a-84dd-7576b4d45250	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1946	390	2336	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:08.339Z"}	2026-02-25 19:19:08.339	2026-02-25 19:19:08.462658
12d847c8-c17f-4dd0-b224-e70fb6172210	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1946	400	2346	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:09.215Z"}	2026-02-25 19:19:09.215	2026-02-25 19:19:09.326071
ae837868-c5b2-4aaf-a848-e37d4c9b7706	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1956	444	2400	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:16.304Z"}	2026-02-25 19:19:16.304	2026-02-25 19:19:16.420526
ad7b0a5b-a09e-4d9c-bd08-b219d566e0f6	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	377	232	609	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:16.443Z"}	2026-02-25 19:19:16.443	2026-02-25 19:19:16.561525
db3937fc-82ea-4e06-8171-abd5c3394db7	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	415	328	743	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:21.782Z"}	2026-02-25 19:19:21.782	2026-02-25 19:19:21.894807
e2a9835d-541a-427f-9acd-be6ad01d695d	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	441	303	744	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:25.832Z"}	2026-02-25 19:19:25.834	2026-02-25 19:19:25.955133
a49dd2eb-8b28-4d70-87cd-6da0d826df3e	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	2020	397	2417	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:33.381Z"}	2026-02-25 19:19:33.381	2026-02-25 19:19:33.491059
ebfdbc48-cd72-464b-b6f9-1e5d05fe7ead	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	2020	411	2431	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:34.064Z"}	2026-02-25 19:19:34.064	2026-02-25 19:19:34.172427
8e3296a7-bccd-4518-b082-c5650b9f65bb	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	405	563	968	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:34.068Z"}	2026-02-25 19:19:34.068	2026-02-25 19:19:34.842331
533febdb-cdcd-45c2-9a29-769a09c4413c	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	402	273	675	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:35.355Z"}	2026-02-25 19:19:35.355	2026-02-25 19:19:35.48766
7325f0a2-20e5-4691-b48d-1ec45495048b	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	401	499	900	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:46.980Z"}	2026-02-25 19:19:46.98	2026-02-25 19:19:47.088879
9c0f90f7-1a42-4e0d-8aa2-1b594ddf0bed	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	368	600	968	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:48.843Z"}	2026-02-25 19:19:48.843	2026-02-25 19:19:48.964947
87dfc6a9-2f7f-42f6-b49b-062cbb6b2e98	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	2067	430	2497	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:52.012Z"}	2026-02-25 19:19:52.012	2026-02-25 19:19:52.121434
b7abb704-3e9b-4cda-9f73-c12673168cc3	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	376	600	976	\N	shift_gears	{"recordedAt": "2026-02-25T19:19:54.533Z"}	2026-02-25 19:19:54.533	2026-02-25 19:19:54.648003
3021c422-17fa-4d6a-84ed-22e933e4295c	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	308	111	419	\N	shift_gears	{"recordedAt": "2026-02-25T19:24:17.796Z"}	2026-02-25 19:24:17.801	2026-02-25 19:24:17.927504
80ca0402-50d9-481d-9080-b74edf007aa4	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1940	406	2346	\N	shift_gears	{"recordedAt": "2026-02-25T19:24:24.507Z"}	2026-02-25 19:24:24.507	2026-02-25 19:24:24.627249
e7d93dee-41a0-4020-beec-95b02510f976	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	330	201	531	\N	shift_gears	{"recordedAt": "2026-02-25T19:24:24.822Z"}	2026-02-25 19:24:24.822	2026-02-25 19:24:24.946076
780d166c-bd93-4550-96f5-d687c3a39630	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	365	345	710	\N	shift_gears	{"recordedAt": "2026-02-25T19:24:30.302Z"}	2026-02-25 19:24:30.302	2026-02-25 19:24:30.423976
cd4186c4-7f6b-4a8f-b8a1-5e3706e61632	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	401	376	777	\N	shift_gears	{"recordedAt": "2026-02-25T19:24:36.624Z"}	2026-02-25 19:24:36.624	2026-02-25 19:24:36.74274
811c66a4-32d1-4e7d-9828-c974452d70c9	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1972	459	2431	\N	shift_gears	{"recordedAt": "2026-02-25T19:24:36.788Z"}	2026-02-25 19:24:36.788	2026-02-25 19:24:36.896832
d9c457d7-c147-43a6-9547-398e504f39a2	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1998	404	2402	\N	shift_gears	{"recordedAt": "2026-02-25T19:24:42.227Z"}	2026-02-25 19:24:42.227	2026-02-25 19:24:42.34534
ff4fa8ca-5c63-4e00-a94c-9e99db63a162	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	386	143	529	\N	shift_gears	{"recordedAt": "2026-02-25T19:24:43.576Z"}	2026-02-25 19:24:43.576	2026-02-25 19:24:43.697133
2bd53203-b29e-4734-b813-824db2174c11	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	430	600	1030	\N	shift_gears	{"recordedAt": "2026-02-25T19:24:46.391Z"}	2026-02-25 19:24:46.391	2026-02-25 19:24:46.500012
c5586a38-b47d-4028-ad65-b5917604437a	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	381	500	881	\N	shift_gears	{"recordedAt": "2026-02-25T19:24:46.801Z"}	2026-02-25 19:24:46.801	2026-02-25 19:24:46.922741
bf2009cc-bfbe-49b6-a774-c5b8fff13dcf	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	318	85	403	\N	shift_gears	{"recordedAt": "2026-02-25T19:25:17.508Z"}	2026-02-25 19:25:17.508	2026-02-25 19:25:17.619962
227230cb-75a7-489e-8318-9bcd0d29647e	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1950	414	2364	\N	shift_gears	{"recordedAt": "2026-02-25T19:25:26.304Z"}	2026-02-25 19:25:26.304	2026-02-25 19:25:26.434256
de49b267-e4d1-49c1-9581-58659542b1b4	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1950	450	2400	\N	shift_gears	{"recordedAt": "2026-02-25T19:25:26.920Z"}	2026-02-25 19:25:26.92	2026-02-25 19:25:27.037676
69f449b5-87b8-4368-8cbc-1a096469be53	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	343	265	608	\N	shift_gears	{"recordedAt": "2026-02-25T19:25:28.100Z"}	2026-02-25 19:25:28.101	2026-02-25 19:25:28.886137
b32b90a1-d448-4346-b87a-5a37c0a2f6c9	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	360	455	815	\N	shift_gears	{"recordedAt": "2026-02-25T19:25:35.057Z"}	2026-02-25 19:25:35.057	2026-02-25 19:25:35.166353
c3ca13ef-2d7d-4dc2-9f76-0fe006f26e97	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	380	250	630	\N	shift_gears	{"recordedAt": "2026-02-25T19:25:35.077Z"}	2026-02-25 19:25:35.077	2026-02-25 19:25:35.197337
4cb5087e-9916-40c3-bf38-5c8ea28ba3f2	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	413	222	635	\N	shift_gears	{"recordedAt": "2026-02-25T19:25:37.875Z"}	2026-02-25 19:25:37.875	2026-02-25 19:25:38.000301
686763fa-6907-4323-b7cb-ab870325cba3	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	378	86	464	\N	shift_gears	{"recordedAt": "2026-02-25T19:25:40.329Z"}	2026-02-25 19:25:40.329	2026-02-25 19:25:40.450988
a7c630e0-1675-4261-ae6a-efbf561b9fe5	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1993	426	2419	\N	shift_gears	{"recordedAt": "2026-02-25T19:25:41.922Z"}	2026-02-25 19:25:41.922	2026-02-25 19:25:42.04299
d91179e9-ff9a-4853-8f48-7671163114dc	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	359	204	563	\N	shift_gears	{"recordedAt": "2026-02-25T19:26:11.669Z"}	2026-02-25 19:26:11.67	2026-02-25 19:26:11.790498
85b78461-8d1c-4fdf-bada-70629b9c8fd5	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	367	198	565	\N	shift_gears	{"recordedAt": "2026-02-25T19:26:20.096Z"}	2026-02-25 19:26:20.096	2026-02-25 19:26:20.234042
0db9f099-2d19-4c1a-95f7-0a2a7772adf8	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	359	488	847	\N	shift_gears	{"recordedAt": "2026-02-25T19:26:20.567Z"}	2026-02-25 19:26:20.567	2026-02-25 19:26:20.674438
187d56a4-9acc-40e8-877f-1899ddeaf5bc	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	2018	408	2426	\N	shift_gears	{"recordedAt": "2026-02-25T19:26:21.768Z"}	2026-02-25 19:26:21.768	2026-02-25 19:26:21.913372
cbce6e1d-e7bd-45d5-8aa7-88b430b0a098	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	359	217	576	\N	shift_gears	{"recordedAt": "2026-02-25T19:26:25.189Z"}	2026-02-25 19:26:25.189	2026-02-25 19:26:25.31311
3e21f97b-62d1-4196-8af9-bd0c5d15b5d8	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	344	274	618	\N	shift_gears	{"recordedAt": "2026-02-25T19:26:31.671Z"}	2026-02-25 19:26:31.671	2026-02-25 19:26:31.780714
05d84f00-32fd-4192-9c6c-f1d82a710939	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	2053	395	2448	\N	shift_gears	{"recordedAt": "2026-02-25T19:26:40.141Z"}	2026-02-25 19:26:40.141	2026-02-25 19:26:40.274943
4d2dce68-97f0-42de-8688-ddd3f7327a2e	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	350	379	729	\N	shift_gears	{"recordedAt": "2026-02-25T19:26:41.848Z"}	2026-02-25 19:26:41.848	2026-02-25 19:26:41.973931
9a4b0104-815a-441f-9b2b-0674340ea081	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	341	599	940	\N	shift_gears	{"recordedAt": "2026-02-25T19:26:42.701Z"}	2026-02-25 19:26:42.701	2026-02-25 19:26:42.834028
4d4f7ae2-92d0-41ff-9874-ea310b822cde	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	345	517	862	\N	shift_gears	{"recordedAt": "2026-02-25T19:26:48.624Z"}	2026-02-25 19:26:48.624	2026-02-25 19:26:48.769459
7bc96932-09c3-4df2-a211-e9da04e03f6d	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	359	371	730	\N	shift_gears	{"recordedAt": "2026-02-25T19:26:53.339Z"}	2026-02-25 19:26:53.339	2026-02-25 19:26:53.44805
1bebafd8-e11f-4362-bf43-5d9b61b47c6e	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	357	566	923	\N	shift_gears	{"recordedAt": "2026-02-25T19:26:54.944Z"}	2026-02-25 19:26:54.944	2026-02-25 19:26:55.05828
e9ec90cb-b67d-4ea8-8566-3bce5f3ae35b	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	357	377	734	\N	shift_gears	{"recordedAt": "2026-02-25T19:26:56.731Z"}	2026-02-25 19:26:56.731	2026-02-25 19:26:57.660552
6a116707-ba0a-49f3-9525-b479d3aa1c55	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	357	135	492	\N	shift_gears	{"recordedAt": "2026-02-25T19:27:00.579Z"}	2026-02-25 19:27:00.579	2026-02-25 19:27:00.68903
77d1fca9-a8a0-4fcc-be95-3e389134a4cf	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	357	300	657	\N	shift_gears	{"recordedAt": "2026-02-25T19:27:00.790Z"}	2026-02-25 19:27:00.79	2026-02-25 19:27:00.89817
42c17547-0962-44dc-ad90-e34d5c494d70	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	2115	412	2527	\N	shift_gears	{"recordedAt": "2026-02-25T19:27:05.423Z"}	2026-02-25 19:27:05.423	2026-02-25 19:27:05.5511
efae7f16-cdf2-45c7-a63f-27441ff1bf86	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	349	366	715	\N	shift_gears	{"recordedAt": "2026-02-25T19:27:08.079Z"}	2026-02-25 19:27:08.079	2026-02-25 19:27:08.205001
29a748df-b9f0-4682-8881-2b0a5228fe05	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1948	382	2330	\N	shift_gears	{"recordedAt": "2026-02-25T19:30:19.264Z"}	2026-02-25 19:30:19.264	2026-02-25 19:30:19.376009
ef3802e7-eefd-41d8-be66-4fbdbb80b0b9	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	316	339	655	\N	shift_gears	{"recordedAt": "2026-02-25T19:30:19.424Z"}	2026-02-25 19:30:19.424	2026-02-25 19:30:19.549068
f06e9639-f96a-4521-9ad2-0c016ba3fbf2	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1948	399	2347	\N	shift_gears	{"recordedAt": "2026-02-25T19:30:20.804Z"}	2026-02-25 19:30:20.804	2026-02-25 19:30:20.934375
63610de5-633b-4320-9e79-8a91e7429924	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	337	402	739	\N	shift_gears	{"recordedAt": "2026-02-25T19:30:26.352Z"}	2026-02-25 19:30:26.352	2026-02-25 19:30:27.202083
b8e608de-f340-43ab-911a-eecf6475c071	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	361	508	869	\N	shift_gears	{"recordedAt": "2026-02-25T19:30:29.229Z"}	2026-02-25 19:30:29.229	2026-02-25 19:30:29.343484
d4705855-49e2-469f-af23-e5ec2696311f	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1950	426	2376	\N	shift_gears	{"recordedAt": "2026-02-25T19:32:51.642Z"}	2026-02-25 19:32:51.642	2026-02-25 19:32:51.755631
6251fd34-c2b3-4abd-af8c-473bd4dccd35	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	318	390	708	\N	shift_gears	{"recordedAt": "2026-02-25T19:32:52.371Z"}	2026-02-25 19:32:52.372	2026-02-25 19:32:52.494275
aff0c179-1cf9-4c11-8ab7-abc304eca534	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1950	403	2353	\N	shift_gears	{"recordedAt": "2026-02-25T19:32:52.822Z"}	2026-02-25 19:32:52.822	2026-02-25 19:32:52.946378
25b5bc1b-498c-4a10-9363-65ace2605870	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	349	452	801	\N	shift_gears	{"recordedAt": "2026-02-25T19:32:56.376Z"}	2026-02-25 19:32:56.376	2026-02-25 19:32:56.499214
4cee9872-682e-4f74-85bc-78bc314e5625	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	376	296	672	\N	shift_gears	{"recordedAt": "2026-02-25T19:32:58.102Z"}	2026-02-25 19:32:58.102	2026-02-25 19:32:58.212892
ab2ffc6c-f0b6-48f5-a449-f99e84d20cfe	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	314	108	422	\N	shift_gears	{"recordedAt": "2026-02-25T19:34:29.535Z"}	2026-02-25 19:34:29.535	2026-02-25 19:34:29.656805
52999532-6d53-4aca-8b2f-61fb5cdbe643	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	340	99	439	\N	shift_gears	{"recordedAt": "2026-02-25T19:34:31.380Z"}	2026-02-25 19:34:31.38	2026-02-25 19:34:31.516186
de27fa6f-bd1c-45d4-9a3b-5a66aaef92e7	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1946	415	2361	\N	shift_gears	{"recordedAt": "2026-02-25T19:34:33.691Z"}	2026-02-25 19:34:33.691	2026-02-25 19:34:33.813786
80d579d9-14c6-4e92-8f27-0a019b801299	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1946	411	2357	\N	shift_gears	{"recordedAt": "2026-02-25T19:34:34.525Z"}	2026-02-25 19:34:34.525	2026-02-25 19:34:34.646907
2f1a088e-1309-4fb4-905d-f11e5041539b	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	368	286	654	\N	shift_gears	{"recordedAt": "2026-02-25T19:34:37.999Z"}	2026-02-25 19:34:37.999	2026-02-25 19:34:38.120599
2f528f39-bda4-4adc-b7f7-eb18d980f73d	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	390	528	918	\N	shift_gears	{"recordedAt": "2026-02-25T19:34:46.135Z"}	2026-02-25 19:34:46.135	2026-02-25 19:34:46.259637
d7ba7d0d-f874-48a6-b3ef-ac357c9f01ed	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	417	551	968	\N	shift_gears	{"recordedAt": "2026-02-25T19:34:49.549Z"}	2026-02-25 19:34:49.549	2026-02-25 19:34:49.66236
693f1b14-3235-45d1-a313-b98785b2066e	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	391	548	939	\N	shift_gears	{"recordedAt": "2026-02-25T19:34:54.755Z"}	2026-02-25 19:34:54.755	2026-02-25 19:34:54.871327
adb05c91-1289-40e1-af16-b64932d50382	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	400	473	873	\N	shift_gears	{"recordedAt": "2026-02-25T19:34:57.968Z"}	2026-02-25 19:34:57.968	2026-02-25 19:34:58.083037
4e44e8af-f493-4ca1-a6f8-fccfa0167c74	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	394	315	709	\N	shift_gears	{"recordedAt": "2026-02-25T19:34:59.726Z"}	2026-02-25 19:34:59.726	2026-02-25 19:34:59.84821
bbbdbe3b-7540-4916-8db2-d5c3ac7dbddf	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	388	257	645	\N	shift_gears	{"recordedAt": "2026-02-25T19:35:02.034Z"}	2026-02-25 19:35:02.034	2026-02-25 19:35:02.143423
f16fe7ce-b935-45dd-864c-dc3386557822	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	410	540	950	\N	shift_gears	{"recordedAt": "2026-02-25T19:35:14.012Z"}	2026-02-25 19:35:14.012	2026-02-25 19:35:14.134594
33f13380-e70c-41a4-b349-7e7e8265ac3f	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	420	600	1020	\N	shift_gears	{"recordedAt": "2026-02-25T19:35:18.880Z"}	2026-02-25 19:35:18.88	2026-02-25 19:35:18.991445
99bd915f-b0ce-4f57-bab2-48443e7e1789	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	409	495	904	\N	shift_gears	{"recordedAt": "2026-02-25T19:35:42.064Z"}	2026-02-25 19:35:42.064	2026-02-25 19:35:42.176026
4288bf54-035d-4eaf-916a-c85e24d1b85c	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	415	388	803	\N	shift_gears	{"recordedAt": "2026-02-25T19:35:45.649Z"}	2026-02-25 19:35:45.649	2026-02-25 19:35:45.775519
53f4feb1-fb29-4b91-bd1e-6d6422e5cdf4	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	416	446	862	\N	shift_gears	{"recordedAt": "2026-02-25T19:36:02.960Z"}	2026-02-25 19:36:02.96	2026-02-25 19:36:03.068794
f8f8806e-49b1-4e46-8dc4-5ef9855ff456	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	419	261	680	\N	shift_gears	{"recordedAt": "2026-02-25T19:36:03.372Z"}	2026-02-25 19:36:03.372	2026-02-25 19:36:03.488779
7badf3ab-3719-40ef-8275-04463163bd16	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	312	139	451	\N	shift_gears	{"recordedAt": "2026-02-26T16:19:24.325Z"}	2026-02-26 16:19:24.325	2026-02-26 16:19:25.933293
8db09551-04ba-495f-9a28-edeaf690a0ff	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1945	409	2354	\N	shift_gears	{"recordedAt": "2026-02-26T16:19:30.597Z"}	2026-02-26 16:19:30.597	2026-02-26 16:19:32.215913
4da5939d-fb3d-4075-ab4a-e4117cfa565a	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1945	401	2346	\N	shift_gears	{"recordedAt": "2026-02-26T16:19:31.865Z"}	2026-02-26 16:19:31.865	2026-02-26 16:19:33.473583
08c6d0b0-f521-4d7a-ab2f-7a89f5fdd468	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	339	485	824	\N	shift_gears	{"recordedAt": "2026-02-26T16:19:36.349Z"}	2026-02-26 16:19:36.349	2026-02-26 16:19:37.969156
16cf1360-4631-4323-ba1f-5464723b6303	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	448	262	710	\N	shift_gears	{"recordedAt": "2026-02-26T16:19:37.848Z"}	2026-02-26 16:19:37.849	2026-02-26 16:19:40.170986
e1b51287-ce8d-4c5e-80b2-cef26d4520f1	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	394	401	795	\N	shift_gears	{"recordedAt": "2026-02-26T16:19:41.482Z"}	2026-02-26 16:19:41.482	2026-02-26 16:19:43.090646
03f938b5-34d6-4f83-91cd-79cb3b5615c9	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	481	432	913	\N	shift_gears	{"recordedAt": "2026-02-26T16:19:47.939Z"}	2026-02-26 16:19:47.939	2026-02-26 16:19:49.605543
f237b1b2-5a31-486e-9767-c41a46a61e5d	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	313	101	414	\N	shift_gears	{"recordedAt": "2026-02-26T16:21:01.572Z"}	2026-02-26 16:21:01.573	2026-02-26 16:21:03.18791
f105940c-d26a-456a-8706-853b88e6cc13	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	340	122	462	\N	shift_gears	{"recordedAt": "2026-02-26T16:21:08.533Z"}	2026-02-26 16:21:08.533	2026-02-26 16:21:10.167159
b0d7949a-940a-4e53-bfec-4658939bcff2	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1945	386	2331	\N	shift_gears	{"recordedAt": "2026-02-26T16:21:10.089Z"}	2026-02-26 16:21:10.089	2026-02-26 16:21:11.719492
846e5589-95af-400b-a232-1fe9f2a8ade1	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	deepseek	1945	402	2347	\N	shift_gears	{"recordedAt": "2026-02-26T16:21:13.479Z"}	2026-02-26 16:21:13.479	2026-02-26 16:21:15.112428
37208d43-4024-4f60-8283-3463b835cce2	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	311	161	472	\N	shift_gears	{"recordedAt": "2026-02-26T16:31:58.751Z"}	2026-02-26 16:31:58.751	2026-02-26 16:32:00.377041
ea412a8e-ceb9-4eb7-b9be-ea757dbb4311	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	337	155	492	\N	shift_gears	{"recordedAt": "2026-02-26T16:32:02.830Z"}	2026-02-26 16:32:02.83	2026-02-26 16:32:04.468313
d996378b-5d5a-45cc-8546-0d1737401078	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	1943	349	2292	\N	shift_gears	{"recordedAt": "2026-02-26T16:32:04.377Z"}	2026-02-26 16:32:04.377	2026-02-26 16:32:06.021975
7da06867-76f7-489d-98a4-5fdb6018a888	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	1943	375	2318	\N	shift_gears	{"recordedAt": "2026-02-26T16:32:06.883Z"}	2026-02-26 16:32:06.883	2026-02-26 16:32:08.576525
51c030c8-9723-4e17-ad51-68e70d765b38	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	371	151	522	\N	shift_gears	{"recordedAt": "2026-02-26T16:32:07.156Z"}	2026-02-26 16:32:07.156	2026-02-26 16:32:08.845084
8d4575ae-318d-4212-91b3-bc35718fd851	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	392	171	563	\N	shift_gears	{"recordedAt": "2026-02-26T16:32:28.486Z"}	2026-02-26 16:32:28.486	2026-02-26 16:32:30.143582
392d85bc-2456-4f8a-928a-dccfa763b57f	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	433	354	787	\N	shift_gears	{"recordedAt": "2026-02-26T16:32:28.507Z"}	2026-02-26 16:32:28.507	2026-02-26 16:32:30.188438
cefb5852-0002-468c-9a7c-f1b9ab7cc7b7	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	404	370	774	\N	shift_gears	{"recordedAt": "2026-02-26T16:32:25.480Z"}	2026-02-26 16:32:25.48	2026-02-26 16:32:30.588137
b3da47c5-0370-4d6b-8674-44b3d1e3c700	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	397	130	527	\N	shift_gears	{"recordedAt": "2026-02-26T16:32:33.318Z"}	2026-02-26 16:32:33.318	2026-02-26 16:32:35.583138
a7d360d0-bc28-44dd-aa2e-0a0aa74a9509	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	386	130	516	\N	shift_gears	{"recordedAt": "2026-02-26T16:32:40.030Z"}	2026-02-26 16:32:40.03	2026-02-26 16:32:41.703567
f379910c-2809-43c4-a372-62fe65c02997	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	384	229	613	\N	shift_gears	{"recordedAt": "2026-02-26T16:32:47.748Z"}	2026-02-26 16:32:47.748	2026-02-26 16:32:49.471985
bb33b230-75fd-451b-8797-c30f38a3e9e2	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	374	322	696	\N	shift_gears	{"recordedAt": "2026-02-26T16:32:54.655Z"}	2026-02-26 16:32:54.655	2026-02-26 16:32:56.285285
09ba1692-ba4b-458e-a81f-dd90258e7d76	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	377	341	718	\N	shift_gears	{"recordedAt": "2026-02-26T16:32:57.261Z"}	2026-02-26 16:32:57.261	2026-02-26 16:32:58.895484
1d9f5110-b419-47ac-bf84-5f540045d7bf	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	314	98	412	\N	shift_gears	{"recordedAt": "2026-02-26T16:33:38.061Z"}	2026-02-26 16:33:38.061	2026-02-26 16:33:39.689154
c448289a-c1a6-4706-a542-8edb576441cc	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	337	128	465	\N	shift_gears	{"recordedAt": "2026-02-26T16:33:41.677Z"}	2026-02-26 16:33:41.677	2026-02-26 16:33:43.301216
b8baa4fb-8779-41e8-a272-a8665ec1dcf1	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	1947	385	2332	\N	shift_gears	{"recordedAt": "2026-02-26T16:33:45.697Z"}	2026-02-26 16:33:45.697	2026-02-26 16:33:47.455613
d450dc34-3a7f-40a4-b5c9-d40fb6110599	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	1947	412	2359	\N	shift_gears	{"recordedAt": "2026-02-26T16:33:48.642Z"}	2026-02-26 16:33:48.643	2026-02-26 16:33:50.314568
8b18e6d1-2a64-4116-9efd-6bb88fc43d0c	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	356	599	955	\N	shift_gears	{"recordedAt": "2026-02-26T16:33:57.206Z"}	2026-02-26 16:33:57.206	2026-02-26 16:33:58.856922
f31dd74a-b273-46a0-8930-a27a4b0c1ad5	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	380	296	676	\N	shift_gears	{"recordedAt": "2026-02-26T16:34:00.512Z"}	2026-02-26 16:34:00.512	2026-02-26 16:34:02.23461
52470171-a88c-479c-b69b-023a7ddb12b5	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	346	125	471	\N	shift_gears	{"recordedAt": "2026-02-26T16:34:00.617Z"}	2026-02-26 16:34:00.617	2026-02-26 16:34:02.268803
0fc066f8-9a34-4e52-9ce4-5d50af653547	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	342	233	575	\N	shift_gears	{"recordedAt": "2026-02-26T16:34:08.781Z"}	2026-02-26 16:34:08.781	2026-02-26 16:34:10.410937
785aba36-ebb0-4624-a1a3-fbf663b1ff07	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	356	600	956	\N	shift_gears	{"recordedAt": "2026-02-26T16:34:27.178Z"}	2026-02-26 16:34:27.178	2026-02-26 16:34:28.918174
c1585044-6262-4a9b-bb79-0dbe8e76805e	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	399	600	999	\N	shift_gears	{"recordedAt": "2026-02-26T16:34:08.751Z"}	2026-02-26 16:34:08.751	2026-02-26 16:34:10.416602
095c9468-a487-49a9-b359-ed718b8364ef	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	353	206	559	\N	shift_gears	{"recordedAt": "2026-02-26T16:34:35.093Z"}	2026-02-26 16:34:35.093	2026-02-26 16:34:36.775748
1624f6ee-f713-43eb-9326-7e8c32f1fbd3	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	351	600	951	\N	shift_gears	{"recordedAt": "2026-02-26T16:34:32.885Z"}	2026-02-26 16:34:32.885	2026-02-26 16:34:45.698771
f939b6e6-c1f4-4104-ad1a-462716160c86	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	349	100	449	\N	shift_gears	{"recordedAt": "2026-02-26T16:34:32.962Z"}	2026-02-26 16:34:32.962	2026-02-26 16:34:45.757591
526372e2-cae1-45d6-8964-b139c7cf2698	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	348	530	878	\N	shift_gears	{"recordedAt": "2026-02-26T16:34:34.718Z"}	2026-02-26 16:34:34.718	2026-02-26 16:34:45.792548
3f0600be-c5c5-4077-b6fe-4cdc199e6fd0	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	339	576	915	\N	shift_gears	{"recordedAt": "2026-02-26T16:34:48.652Z"}	2026-02-26 16:34:48.653	2026-02-26 16:34:50.279814
16d61175-ff98-4c71-992e-f7440571b90f	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	351	100	451	\N	shift_gears	{"recordedAt": "2026-02-26T16:34:52.660Z"}	2026-02-26 16:34:52.66	2026-02-26 16:34:54.600016
02bf1212-078e-4561-bd3f-84e746248b6f	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	624	2088	2712	\N	mind_map	{"recordedAt": "2026-02-26T16:34:54.353Z"}	2026-02-26 16:34:54.354	2026-02-26 16:34:55.996617
bf379dfe-7c07-4c8b-ab2f-b83a12ca707e	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	340	408	748	\N	shift_gears	{"recordedAt": "2026-02-26T16:34:57.213Z"}	2026-02-26 16:34:57.213	2026-02-26 16:35:02.198718
5f0bd3ca-cdd1-4910-8347-f1477fa58b79	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	359	379	738	\N	shift_gears	{"recordedAt": "2026-02-26T16:35:10.160Z"}	2026-02-26 16:35:10.16	2026-02-26 16:35:11.787304
6b8b11ec-890b-45fa-afa3-a01b83038a3c	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	373	431	804	\N	shift_gears	{"recordedAt": "2026-02-26T16:35:17.682Z"}	2026-02-26 16:35:17.682	2026-02-26 16:35:19.315023
679df578-d3fe-4a2c-8cd5-fb4ced51875d	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	383	458	841	\N	shift_gears	{"recordedAt": "2026-02-26T16:35:18.163Z"}	2026-02-26 16:35:18.163	2026-02-26 16:35:19.807966
4477e8a6-48d7-43f4-be07-e075240be6fe	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	407	468	875	\N	shift_gears	{"recordedAt": "2026-02-26T16:35:26.511Z"}	2026-02-26 16:35:26.511	2026-02-26 16:35:28.134129
82180368-d47e-46a5-96ee-25b3410bf59f	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	400	600	1000	\N	shift_gears	{"recordedAt": "2026-02-26T16:35:27.082Z"}	2026-02-26 16:35:27.082	2026-02-26 16:35:28.759396
512e77bf-a116-4fb8-bdad-a1c679e428de	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	419	115	534	\N	shift_gears	{"recordedAt": "2026-02-26T16:35:27.997Z"}	2026-02-26 16:35:27.997	2026-02-26 16:35:29.618478
cdfdbe4d-564f-4431-9b68-c858506b3f1d	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	443	140	583	\N	shift_gears	{"recordedAt": "2026-02-26T16:35:31.291Z"}	2026-02-26 16:35:31.291	2026-02-26 16:35:32.958144
90892df0-51ac-4d5d-920e-4efa13d2c572	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	401	576	977	\N	shift_gears	{"recordedAt": "2026-02-26T16:35:31.555Z"}	2026-02-26 16:35:31.555	2026-02-26 16:35:33.178273
61fb84ec-6c17-4bdd-a98e-485253e896d5	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	436	292	728	\N	shift_gears	{"recordedAt": "2026-02-26T16:35:38.638Z"}	2026-02-26 16:35:38.638	2026-02-26 16:35:40.262516
46102a44-5c9a-48c0-9ae7-afd522ae9882	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	428	134	562	\N	shift_gears	{"recordedAt": "2026-02-26T16:35:43.737Z"}	2026-02-26 16:35:43.737	2026-02-26 16:35:46.232727
df3c84d9-a83e-4e17-bb0c-fd1b3ebc4404	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	428	495	923	\N	shift_gears	{"recordedAt": "2026-02-26T16:35:50.306Z"}	2026-02-26 16:35:50.306	2026-02-26 16:35:51.934825
687c69e7-95de-4a16-a977-4e8bfa144fcc	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	428	285	713	\N	shift_gears	{"recordedAt": "2026-02-26T16:35:52.635Z"}	2026-02-26 16:35:52.635	2026-02-26 16:35:54.303964
06772824-cb85-4842-97b5-e045510a4e9f	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	363	225	588	\N	shift_gears	{"recordedAt": "2026-02-26T16:36:34.756Z"}	2026-02-26 16:36:34.756	2026-02-26 16:36:36.380434
415c9f44-bed0-4548-9cae-c44725b9769b	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	375	223	598	\N	shift_gears	{"recordedAt": "2026-02-26T16:36:34.831Z"}	2026-02-26 16:36:34.831	2026-02-26 16:36:36.45552
529e0a7c-015a-44a7-b472-deb868cac5cb	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	376	137	513	\N	shift_gears	{"recordedAt": "2026-02-26T16:36:35.361Z"}	2026-02-26 16:36:35.361	2026-02-26 16:36:36.985711
4b02efab-faab-4f46-aec1-43b4caf7e288	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	374	255	629	\N	shift_gears	{"recordedAt": "2026-02-26T16:36:37.741Z"}	2026-02-26 16:36:37.741	2026-02-26 16:36:39.374426
175a6e81-f399-4561-af35-1ca45cdbd5b1	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	374	353	727	\N	shift_gears	{"recordedAt": "2026-02-26T16:36:38.927Z"}	2026-02-26 16:36:38.927	2026-02-26 16:36:40.558944
5400c5c6-44d5-459e-8962-68b81b6be006	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	315	78	393	\N	shift_gears	{"recordedAt": "2026-02-26T16:39:10.567Z"}	2026-02-26 16:39:10.568	2026-02-26 16:39:12.24903
c0c0498f-fb79-451e-982d-dd4a3df03f3d	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	342	101	443	\N	shift_gears	{"recordedAt": "2026-02-26T16:39:17.153Z"}	2026-02-26 16:39:17.153	2026-02-26 16:39:18.780759
2b9c11b4-54ab-42f9-b87c-d8af686b18a3	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	1947	407	2354	\N	shift_gears	{"recordedAt": "2026-02-26T16:39:18.611Z"}	2026-02-26 16:39:18.611	2026-02-26 16:39:20.277753
10dfbedf-7f41-4f1b-9eaa-b5f422977f48	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	361	86	447	\N	shift_gears	{"recordedAt": "2026-02-26T16:39:21.021Z"}	2026-02-26 16:39:21.021	2026-02-26 16:39:22.649354
556d6e23-9cc1-45dd-8edf-97f4b9cb9b31	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	1947	421	2368	\N	shift_gears	{"recordedAt": "2026-02-26T16:39:23.594Z"}	2026-02-26 16:39:23.594	2026-02-26 16:39:25.216438
b91e0029-2d9d-416b-b11c-3e7ed223e031	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	380	141	521	\N	shift_gears	{"recordedAt": "2026-02-26T16:39:27.080Z"}	2026-02-26 16:39:27.081	2026-02-26 16:39:28.711528
5713c512-c36c-475b-b616-c7165682c02c	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	357	110	467	\N	shift_gears	{"recordedAt": "2026-02-26T16:39:40.424Z"}	2026-02-26 16:39:40.424	2026-02-26 16:39:42.059547
ad565081-866d-4b30-919e-b29ea23c4849	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	375	110	485	\N	shift_gears	{"recordedAt": "2026-02-26T16:39:44.050Z"}	2026-02-26 16:39:44.05	2026-02-26 16:39:45.673171
94887a85-741b-4fb2-ab20-d6b7dd9367ef	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	363	368	731	\N	shift_gears	{"recordedAt": "2026-02-26T16:39:44.136Z"}	2026-02-26 16:39:44.136	2026-02-26 16:39:45.748674
ef3aafab-1b70-46ef-bffa-3ae5d70dea17	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	360	414	774	\N	shift_gears	{"recordedAt": "2026-02-26T16:39:47.051Z"}	2026-02-26 16:39:47.051	2026-02-26 16:39:48.679728
6b87b60d-203d-4d96-95bf-f5b801bae6d0	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	404	600	1004	\N	shift_gears	{"recordedAt": "2026-02-26T16:39:48.601Z"}	2026-02-26 16:39:48.601	2026-02-26 16:39:50.241227
54e24d86-cd70-4323-9c75-e7b0d0bb26b3	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	377	340	717	\N	shift_gears	{"recordedAt": "2026-02-26T16:39:54.948Z"}	2026-02-26 16:39:54.948	2026-02-26 16:39:56.569555
b5338003-08ed-4fe8-8db4-091ecae12eca	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	375	365	740	\N	shift_gears	{"recordedAt": "2026-02-26T16:40:00.400Z"}	2026-02-26 16:40:00.4	2026-02-26 16:40:02.040479
756b816b-447f-4dea-a335-841699ba4761	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	364	217	581	\N	shift_gears	{"recordedAt": "2026-02-26T16:40:05.436Z"}	2026-02-26 16:40:05.436	2026-02-26 16:40:07.065278
0a9c22d3-d2af-4dfb-aa04-a316248106a8	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	371	429	800	\N	shift_gears	{"recordedAt": "2026-02-26T16:40:05.994Z"}	2026-02-26 16:40:05.994	2026-02-26 16:40:07.615662
21ac3789-774e-4d7e-8da2-9140fdde07c2	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	356	575	931	\N	shift_gears	{"recordedAt": "2026-02-26T16:40:19.864Z"}	2026-02-26 16:40:19.864	2026-02-26 16:40:22.154162
721cf93a-50a8-4d7e-a8ed-0be81ddbb777	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	349	508	857	\N	shift_gears	{"recordedAt": "2026-02-26T16:40:24.641Z"}	2026-02-26 16:40:24.641	2026-02-26 16:40:26.329681
0c26b644-bcfe-485d-afca-644c8df1208c	76cacf03-9e99-4098-b633-7617082f077e	\N	deepseek	359	600	959	\N	shift_gears	{"recordedAt": "2026-02-26T16:40:33.684Z"}	2026-02-26 16:40:33.684	2026-02-26 16:40:35.363792
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.announcements (id, title, content, target_audience, status, published_at, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: api_key_usage_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.api_key_usage_logs (id, api_key_id, endpoint, method, status_code, response_time, ip_address, user_agent, request_body, created_at) FROM stdin;
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.api_keys (id, name, key_prefix, key_hash, created_by, organization_id, scopes, rate_limit, rate_limit_window, status, last_used_at, usage_count, expires_at, ip_whitelist, metadata, created_at, revoked_at, revoked_by) FROM stdin;
\.


--
-- Data for Name: audio_sources; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audio_sources (id, conversation_id, source_type, created_at, source_id, teams_meeting_id, status, metadata, connected_at, disconnected_at) FROM stdin;
216fc395-bcc6-4936-8d7d-3e0d25670f9f	cf2c86a6-1764-416c-8c88-67361c569681	device-microphone	2026-02-23 05:46:26.982469	\N	\N	active	{}	2026-02-23 05:46:26.982469	\N
d169ea35-e1d5-435d-b3cf-6d1a311b543a	84d21720-c0d8-4634-be64-20d2ebdc6aee	device-microphone	2026-02-23 21:09:15.520619	\N	\N	active	{}	2026-02-23 21:09:15.520619	\N
a9cb9871-76dc-45f0-bead-6aa3bc06328a	20bdd2e6-ecd0-4715-8305-7619b37a39f3	device-microphone	2026-02-24 14:03:23.988526	\N	\N	active	{}	2026-02-24 14:03:23.988526	\N
1b6a11a7-ab66-4f46-8ab6-186aa57c105e	df355c60-9175-4384-8187-2b84da941a38	device-microphone	2026-02-24 14:19:25.383423	\N	\N	active	{}	2026-02-24 14:19:25.383423	\N
89cd8290-39a5-4cfd-a6ae-108ffa4e3c63	0a5f16aa-9e49-4dc1-94e7-776dfd8a74ea	device-microphone	2026-02-24 14:24:43.28632	\N	\N	active	{}	2026-02-24 14:24:43.28632	\N
0c4c5417-62c2-4a63-9491-c9352feeb853	48e50603-e936-4c64-8f52-cf47f689c85f	device-microphone	2026-02-24 14:25:32.252627	\N	\N	active	{}	2026-02-24 14:25:32.252627	\N
bb30fc98-2485-447c-b4f0-8797f3f96d87	54b25796-301a-47af-8a8b-1bbb7c64a790	device-microphone	2026-02-24 14:28:11.691466	\N	\N	active	{}	2026-02-24 14:28:11.691466	\N
434ecf97-48cd-4779-8266-ac90f4021a03	51aa62ef-606b-4bb2-b472-178146ac544c	device-microphone	2026-02-24 14:35:33.372353	\N	\N	active	{}	2026-02-24 14:35:33.372353	\N
05fc6396-0eda-4661-a553-043923733bf0	9c9b9783-2adc-4e8f-bce8-82aec57e2a81	device-microphone	2026-02-24 14:38:09.494257	\N	\N	active	{}	2026-02-24 14:38:09.494257	\N
76b3cf65-79d8-49b0-9022-02424e097e04	05d0255d-ee12-49bc-83b8-21435ba33a89	device-microphone	2026-02-24 14:49:07.610472	\N	\N	active	{}	2026-02-24 14:49:07.610472	\N
980cfe57-9857-4205-ba57-70848b4ef480	78823ad1-c099-4a34-a09a-d125514dc3fc	device-microphone	2026-02-24 14:51:55.06188	\N	\N	active	{}	2026-02-24 14:51:55.06188	\N
47c0d3ab-1c03-4813-aa53-975c833bab03	56c0cac5-8979-4d9a-baf6-9d708b56352d	device-microphone	2026-02-24 14:53:58.453749	\N	\N	active	{}	2026-02-24 14:53:58.453749	\N
b4a50e99-2a5d-4f25-8760-405021ecb6be	72de624f-e4c1-4411-ac82-f261746e1075	device-microphone	2026-02-24 14:57:54.843198	\N	\N	active	{}	2026-02-24 14:57:54.843198	\N
a778aee5-8b47-493b-8b93-04aba6ac9cdf	35a6cdaf-3549-405c-aa08-a42cb7efe7ea	device-microphone	2026-02-24 14:59:07.324167	\N	\N	active	{}	2026-02-24 14:59:07.324167	\N
106add5d-099e-476f-a39c-9550714ba386	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	device-microphone	2026-02-24 15:07:48.604216	\N	\N	active	{}	2026-02-24 15:07:48.604216	\N
903964ca-73c5-4df9-890e-9bf6098bd8e1	e5bd917c-5f2b-47fa-94d2-29234031731a	device-microphone	2026-02-24 15:18:36.3863	\N	\N	active	{}	2026-02-24 15:18:36.3863	\N
841ca94f-55f1-4fc6-b535-792f4307b6f8	ecfcf0d0-c5e0-4f2a-9f63-cbb3d29469c5	device-microphone	2026-02-24 15:23:55.701807	\N	\N	active	{}	2026-02-24 15:23:55.701807	\N
1428141b-b469-47ed-8e86-a53622411be1	6ba03c92-c041-4feb-8467-6fe2851640d7	device-microphone	2026-02-24 15:39:48.396573	\N	\N	active	{}	2026-02-24 15:39:48.396573	\N
19a46238-c7f6-4f0f-ab18-40ccd163eca6	6ba03c92-c041-4feb-8467-6fe2851640d7	device-microphone	2026-02-24 15:39:48.459031	\N	\N	active	{}	2026-02-24 15:39:48.459031	\N
1f10df52-c682-456c-8046-f4cf7796e523	9f37ae75-c0b2-4700-b576-8c384e1dfff5	device-microphone	2026-02-24 16:49:57.577087	\N	\N	active	{}	2026-02-24 16:49:57.577087	\N
ae88081c-9a87-4c2f-be3b-0ef8d9b97b5d	bf638377-45e5-464c-acb7-75e23e7d2560	device-microphone	2026-02-24 16:54:26.872047	\N	\N	active	{}	2026-02-24 16:54:26.872047	\N
1ddd4a22-a368-4aee-b167-b9467b87d023	121c9a95-e644-4396-b489-b91817697880	device-microphone	2026-02-25 18:34:26.991268	\N	\N	active	{}	2026-02-25 18:34:26.991268	\N
e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	bf7a407c-9acd-4516-acf8-9dd3e96f9405	device-microphone	2026-02-25 18:41:30.396519	\N	\N	active	{}	2026-02-25 18:41:30.396519	\N
5918838e-d2c1-4145-8a45-5e414556a210	ea1ad94f-2510-4d83-812c-1b77750eb020	device-microphone	2026-02-25 18:51:14.084966	\N	\N	active	{}	2026-02-25 18:51:14.084966	\N
789bcfe3-7942-439a-b69c-3bb73b3494dc	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	device-microphone	2026-02-25 18:56:02.184875	\N	\N	active	{}	2026-02-25 18:56:02.184875	\N
9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	e8e20ace-9190-4cae-b336-36253e1c9b62	device-microphone	2026-02-25 19:10:30.037412	\N	\N	active	{}	2026-02-25 19:10:30.037412	\N
24dfbbd7-4268-4239-bc2e-674cdc1d3ed3	8eef9221-1419-4d2f-8c24-45558da7c113	device-microphone	2026-02-25 19:12:28.854655	\N	\N	active	{}	2026-02-25 19:12:28.854655	\N
e82fb652-ada5-4480-b3eb-303cd72260a8	1676231b-ce00-4651-920a-470228903ead	device-microphone	2026-02-25 19:15:21.696269	\N	\N	active	{}	2026-02-25 19:15:21.696269	\N
77956531-22bd-4901-9af1-87bb54caea1c	46d6ded0-abad-47ef-a933-037fc29be1e0	device-microphone	2026-02-25 19:18:05.049622	\N	\N	active	{}	2026-02-25 19:18:05.049622	\N
4d429306-aee2-4885-b2a3-e9ee4eded1dd	0b14eb48-a6b4-4bb2-b40c-0c3585d781fe	device-microphone	2026-02-25 19:18:57.70581	\N	\N	active	{}	2026-02-25 19:18:57.70581	\N
a4bd7e28-5e77-4d93-9a88-cdb58ebb1031	86285ce1-7050-4ec6-bc1a-eb5bc433d5e2	device-microphone	2026-02-25 19:24:12.203301	\N	\N	active	{}	2026-02-25 19:24:12.203301	\N
0a11a5b2-f86d-42ed-9f1d-f34bce68058f	de11b189-63a6-479b-83ef-6357766066f5	device-microphone	2026-02-25 19:25:12.681139	\N	\N	active	{}	2026-02-25 19:25:12.681139	\N
65c9b54a-97ee-48df-a430-e00b33ef0fbc	9da3f838-3138-42d4-88c5-2868c6078c3a	device-microphone	2026-02-25 19:30:08.65925	\N	\N	active	{}	2026-02-25 19:30:08.65925	\N
85958507-14e9-4a62-8e21-8fbdf0215194	2eedfc49-21a0-45b3-a703-45890436cf4d	device-microphone	2026-02-25 19:32:41.106919	\N	\N	active	{}	2026-02-25 19:32:41.106919	\N
9c10b637-3f6e-4ce5-b1d2-a848a02b762f	1e2890f9-f8a3-4da9-88c6-94471ff5d671	device-microphone	2026-02-25 19:34:23.80884	\N	\N	active	{}	2026-02-25 19:34:23.80884	\N
9be9d15c-a919-4d86-8755-ee548891cdd0	79d29370-7f02-4172-bce1-3375f2b5b47f	device-microphone	2026-02-26 16:19:16.929622	\N	\N	active	{}	2026-02-26 16:19:16.929622	\N
9b5a5993-1684-42e1-86ce-7325469b616c	cf336250-12d3-436b-90c0-a950da4ee474	device-microphone	2026-02-26 16:20:54.915995	\N	\N	active	{}	2026-02-26 16:20:54.915995	\N
9fb00fa0-9bea-400e-90cb-3d30c55d96e2	b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	device-microphone	2026-02-26 16:31:49.965369	\N	\N	active	{}	2026-02-26 16:31:49.965369	\N
a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	49f2c9ee-2011-416a-88f0-42cdaed39655	device-microphone	2026-02-26 16:33:12.064536	\N	\N	active	{}	2026-02-26 16:33:12.064536	\N
6423a2b0-6eb4-438c-b79a-5299c01eaa14	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	device-microphone	2026-02-26 16:39:04.026757	\N	\N	active	{}	2026-02-26 16:39:04.026757	\N
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_logs (id, actor_id, action, target_type, target_id, metadata, ip_address, user_agent, created_at) FROM stdin;
c8eaa617-6634-4262-be39-f88fe8c57c78	667aa0de-c6cd-49ac-b091-fd6f2e390019	user.registered	user	667aa0de-c6cd-49ac-b091-fd6f2e390019	{"email": "sanket@plasmax.tech", "username": "sanketdhuri"}	103.74.199.184	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-23 05:24:59.324914
fe222b57-b407-461b-836c-b6121d6b4c30	667aa0de-c6cd-49ac-b091-fd6f2e390019	user.verified	user	667aa0de-c6cd-49ac-b091-fd6f2e390019	{"note": "New user registration verified - fresh session created", "email": "sanket@plasmax.tech", "username": "sanketdhuri"}	103.74.199.184	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-23 05:25:18.959425
4b66efeb-1200-4744-bfe4-ecb54f91e81b	667aa0de-c6cd-49ac-b091-fd6f2e390019	user.ai_engine_updated	user	667aa0de-c6cd-49ac-b091-fd6f2e390019	{"aiEngine": "default"}	103.74.199.184	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-23 05:25:25.616572
477407bf-6f25-44e4-847e-8453a039950e	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	user.registered	user	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	{"email": "wymylufe@denipl.net", "username": "saxo1010"}	171.61.122.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-02-23 05:32:32.160298
84255e05-35ca-40ba-aa5f-2fbab0f465a7	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	user.verified	user	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	{"note": "New user registration verified - fresh session created", "email": "wymylufe@denipl.net", "username": "saxo1010"}	171.61.122.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-02-23 05:32:54.718561
a683fcc6-925b-4f16-aaf8-7fe8b44e436a	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	user.ai_engine_updated	user	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	{"aiEngine": "default"}	171.61.122.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	2026-02-23 05:33:00.854058
a5fe91fb-c120-4de1-9671-022c923335f1	262a89e3-6dde-4b37-a65f-e800fd316105	user.registered	user	262a89e3-6dde-4b37-a65f-e800fd316105	{"email": "natiqo@forexzig.com", "username": "hello@379"}	103.211.112.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-23 21:07:07.990263
a1f18d0d-5196-4601-81b0-5bbc397ae622	262a89e3-6dde-4b37-a65f-e800fd316105	user.verified	user	262a89e3-6dde-4b37-a65f-e800fd316105	{"note": "New user registration verified - fresh session created", "email": "natiqo@forexzig.com", "username": "hello@379"}	103.211.112.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-23 21:07:19.476863
40e42420-bde0-4d00-9c9d-a674d8e17ce4	262a89e3-6dde-4b37-a65f-e800fd316105	user.ai_engine_updated	user	262a89e3-6dde-4b37-a65f-e800fd316105	{"aiEngine": "default"}	103.211.112.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-23 21:07:24.891477
696288fd-d905-4e8c-a108-83ff491142c0	262a89e3-6dde-4b37-a65f-e800fd316105	user.logged_in	user	262a89e3-6dde-4b37-a65f-e800fd316105	{}	103.211.112.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-23 21:23:23.245667
dc8d98cd-b63d-40c7-8183-0e7a1643a6bb	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	admin.login	user	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	{"email": "admin@revwinner.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 13:56:46.858099
2a01b1b3-fe6c-4bf3-bb65-568131d315c7	76cacf03-9e99-4098-b633-7617082f077e	user.ai_engine_updated	user	76cacf03-9e99-4098-b633-7617082f077e	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:02:27.206235
831f492f-c354-4d4e-8c4a-3088c0f10a94	6786fa29-edbe-4087-97b5-ea4b77bdb286	user.registered	user	6786fa29-edbe-4087-97b5-ea4b77bdb286	{"email": "pepocyjy@forexzig.com", "username": "pepocyjy@forexzig"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:18:47.984931
556a2c57-1bfb-4043-b405-adc1b44db7ed	6786fa29-edbe-4087-97b5-ea4b77bdb286	user.verified	user	6786fa29-edbe-4087-97b5-ea4b77bdb286	{"note": "New user registration verified - fresh session created", "email": "pepocyjy@forexzig.com", "username": "pepocyjy@forexzig"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:19:01.488882
887794c3-4560-4513-8daf-5b44d33c96c8	87f0700a-53a9-4909-845a-f79e438f153f	user.verified	user	87f0700a-53a9-4909-845a-f79e438f153f	{"note": "New user registration verified - fresh session created", "email": "qereqevu@denipl.net", "username": "qereqevu@denipl.net"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:27:47.489972
e24afd08-b241-4dab-b9ae-e8d79e007236	87f0700a-53a9-4909-845a-f79e438f153f	user.ai_engine_updated	user	87f0700a-53a9-4909-845a-f79e438f153f	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:27:57.287614
f9719232-8618-429e-8d5a-a2d52e9ce45f	cb64b05a-101b-4055-ae05-00ec49f58fd8	user.logged_in	user	cb64b05a-101b-4055-ae05-00ec49f58fd8	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:40:27.877426
1877f8ef-e02c-4249-a0cf-b088cbf42d12	782bfd26-63f3-4eb9-a91a-380ffafd0bca	user.registered	user	782bfd26-63f3-4eb9-a91a-380ffafd0bca	{"email": "hytekola@denipl.com", "username": "hytekola@denipl.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:47:49.736199
a502bf04-a53c-4c62-8471-0fd2b85fdc4f	782bfd26-63f3-4eb9-a91a-380ffafd0bca	user.logged_in	user	782bfd26-63f3-4eb9-a91a-380ffafd0bca	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:53:40.053161
01ef4c9a-4128-4c11-adf8-a832fa562a94	e68e2d03-b390-4c81-8f11-57e1dbac38b0	user.ai_engine_updated	user	e68e2d03-b390-4c81-8f11-57e1dbac38b0	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 15:06:43.795739
d11cb244-33f1-441c-807f-1a1371836de2	8528cd51-bf28-464b-9676-cafe71ab87e4	user.registered	user	8528cd51-bf28-464b-9676-cafe71ab87e4	{"email": "lixufelo@fxzig.com", "username": "lixufelo@fxzig"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 15:17:22.089512
c672a77c-2de1-413d-b398-0d632a279edd	8528cd51-bf28-464b-9676-cafe71ab87e4	user.verified	user	8528cd51-bf28-464b-9676-cafe71ab87e4	{"note": "New user registration verified - fresh session created", "email": "lixufelo@fxzig.com", "username": "lixufelo@fxzig"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 15:17:36.095706
d186b25e-5052-4a4e-957d-8beeb31e1a86	79323d9c-33e1-43de-bb7c-94dc82af4eca	user.registered	user	79323d9c-33e1-43de-bb7c-94dc82af4eca	{"email": "visoxecy@denipl.net", "username": "visoxecy@denipl"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 13:58:08.999338
06387e7e-be64-46b9-8cf2-a9cee7f1f3b4	6786fa29-edbe-4087-97b5-ea4b77bdb286	user.ai_engine_updated	user	6786fa29-edbe-4087-97b5-ea4b77bdb286	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:19:08.37815
04129697-7b7f-4d53-a2e5-631fc325d427	cb64b05a-101b-4055-ae05-00ec49f58fd8	user.registered	user	cb64b05a-101b-4055-ae05-00ec49f58fd8	{"email": "puqykywy@fxzig.com", "username": "2022.kunal.patil3379"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:34:46.29887
9e890ff0-d407-417e-8b9e-ab9d9491e581	782bfd26-63f3-4eb9-a91a-380ffafd0bca	user.verified	user	782bfd26-63f3-4eb9-a91a-380ffafd0bca	{"note": "New user registration verified - fresh session created", "email": "hytekola@denipl.com", "username": "hytekola@denipl.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:48:36.046564
2746a8ba-72a9-442f-9778-4abe24ca5ded	827ed084-6bfa-41e7-8956-b336bc88cf7b	user.registered	user	827ed084-6bfa-41e7-8956-b336bc88cf7b	{"email": "vecowaja@denipl.com", "username": "vecowaja@denipl.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:57:10.819879
97c35566-54f1-47f6-bd6e-0174e2322587	827ed084-6bfa-41e7-8956-b336bc88cf7b	user.verified	user	827ed084-6bfa-41e7-8956-b336bc88cf7b	{"note": "New user registration verified - fresh session created", "email": "vecowaja@denipl.com", "username": "vecowaja@denipl.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:57:23.14638
f36dd8e4-0d02-4eac-86eb-e62c45bc6355	8528cd51-bf28-464b-9676-cafe71ab87e4	user.ai_engine_updated	user	8528cd51-bf28-464b-9676-cafe71ab87e4	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 15:17:44.068568
f39f62dc-311f-4c55-9903-53bb20260d72	8528cd51-bf28-464b-9676-cafe71ab87e4	user.logged_in	user	8528cd51-bf28-464b-9676-cafe71ab87e4	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 15:31:13.411428
f1feb410-98c4-4e6f-8961-734771e25886	11d8a2a5-5819-4c1f-a465-c106977bc7fe	user.verified	user	11d8a2a5-5819-4c1f-a465-c106977bc7fe	{"note": "New user registration verified - fresh session created", "email": "lamumify@forexzig.com", "username": "lamumify@forexzig.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 15:33:46.713462
237c89d3-26c8-4e76-8d99-f7bb7e04ad40	c82bdfb4-7184-455b-b48b-c03bdc9b904d	user.ai_engine_updated	user	c82bdfb4-7184-455b-b48b-c03bdc9b904d	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:05:06.941376
7474e57e-aa37-4d73-b36f-20b4093076fb	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	user.ai_engine_updated	user	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:27:03.078759
4561a160-60c4-4600-a59b-f5940bee65ed	07911237-2594-463c-bb5d-65ac53b9a9a7	user.registered	user	07911237-2594-463c-bb5d-65ac53b9a9a7	{"email": "gotize@denipl.com", "username": "gotize@denipl.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:44:28.98883
f1efd9bb-de5e-445b-b759-5c9cb3d1aeeb	07911237-2594-463c-bb5d-65ac53b9a9a7	user.verified	user	07911237-2594-463c-bb5d-65ac53b9a9a7	{"note": "New user registration verified - fresh session created", "email": "gotize@denipl.com", "username": "gotize@denipl.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:44:43.550376
f2cd1e01-108e-473b-b090-cd27ea575abd	87fd5820-718b-4c0d-9e22-bf284e65fcb6	user.ai_engine_updated	user	87fd5820-718b-4c0d-9e22-bf284e65fcb6	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:54:09.280029
bdfaf89d-8a23-4af7-91cf-d9c8575c6d7a	87fd5820-718b-4c0d-9e22-bf284e65fcb6	user.logged_in	user	87fd5820-718b-4c0d-9e22-bf284e65fcb6	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:55:04.495723
58d72bbf-f12e-46bf-b4af-dd0d9cf23689	76cacf03-9e99-4098-b633-7617082f077e	user.logged_in	user	76cacf03-9e99-4098-b633-7617082f077e	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:40:18.369127
f138e5a4-08c5-4a53-b915-19b215f98e31	c2ee8f98-90ad-497f-9f52-6f2637cad230	user.verified	user	c2ee8f98-90ad-497f-9f52-6f2637cad230	{"note": "New user registration verified - fresh session created", "email": "facoxa@denipl.net", "username": "facoxa@denipl.net"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:41:09.473541
42d8940e-5b07-4e35-a689-ce6b240ff571	c2ee8f98-90ad-497f-9f52-6f2637cad230	user.ai_engine_updated	user	c2ee8f98-90ad-497f-9f52-6f2637cad230	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:41:16.620708
d3d59424-7e2c-4bad-b62c-037313298bd8	1c6eb844-e1ca-440f-b68c-66071162b92f	user.registered	user	1c6eb844-e1ca-440f-b68c-66071162b92f	{"email": "mazajaja@denipl.com", "username": "mazajaja@denipl.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:55:26.388693
2c65eabc-2ca8-4dd5-8c68-11d8035fe215	1c6eb844-e1ca-440f-b68c-66071162b92f	user.verified	user	1c6eb844-e1ca-440f-b68c-66071162b92f	{"note": "New user registration verified - fresh session created", "email": "mazajaja@denipl.com", "username": "mazajaja@denipl.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:55:41.381987
070bb72e-f72d-4be6-9624-993cafbaeaa2	1c6eb844-e1ca-440f-b68c-66071162b92f	user.ai_engine_updated	user	1c6eb844-e1ca-440f-b68c-66071162b92f	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:55:49.662268
bf792681-9eed-4fa0-b3b8-46028ad5802c	9fa878f1-83a8-4afb-aae0-939a0942fa33	user.registered	user	9fa878f1-83a8-4afb-aae0-939a0942fa33	{"email": "delape@denipl.net", "username": "delape@denipl.net"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 19:06:17.986732
3e907f9c-6312-4632-a4cd-fb85ed784fe4	76cacf03-9e99-4098-b633-7617082f077e	user.logged_in	user	76cacf03-9e99-4098-b633-7617082f077e	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 16:25:05.380491
f02f5b84-cb39-4d4b-b3d2-66e4a4c88cdf	38aa366c-d07c-4b95-b3dc-6a5754d7dfc9	user.registered	user	38aa366c-d07c-4b95-b3dc-6a5754d7dfc9	{"email": "tabaresi@forexzig.com", "username": "tabaresi@forexzig"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:00:31.294181
ce14de43-e315-49ef-80ee-9d3b34afbb02	6786fa29-edbe-4087-97b5-ea4b77bdb286	user.logged_in	user	6786fa29-edbe-4087-97b5-ea4b77bdb286	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:23:47.055609
0fee1d26-bce4-4462-8fd4-a6b06f76fdf8	cb64b05a-101b-4055-ae05-00ec49f58fd8	user.verified	user	cb64b05a-101b-4055-ae05-00ec49f58fd8	{"note": "New user registration verified - fresh session created", "email": "puqykywy@fxzig.com", "username": "2022.kunal.patil3379"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:35:02.908096
641d78d4-9ed3-4258-98fd-be28eb541ab4	cb64b05a-101b-4055-ae05-00ec49f58fd8	user.ai_engine_updated	user	cb64b05a-101b-4055-ae05-00ec49f58fd8	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:35:11.270733
798f374b-a9bc-425f-886f-386089b4a363	782bfd26-63f3-4eb9-a91a-380ffafd0bca	user.ai_engine_updated	user	782bfd26-63f3-4eb9-a91a-380ffafd0bca	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:48:46.405108
4fd18533-ac0c-40ee-b62f-9777e1d2bfad	827ed084-6bfa-41e7-8956-b336bc88cf7b	user.ai_engine_updated	user	827ed084-6bfa-41e7-8956-b336bc88cf7b	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:57:31.748546
9cf7d2f8-9c54-4941-b089-e169496b4479	f9eeafb9-ae3f-4dd6-9efd-59e7ed1f603b	user.registered	user	f9eeafb9-ae3f-4dd6-9efd-59e7ed1f603b	{"email": "gixeje@denipl.net", "username": "gixeje@denipl.net"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 15:32:32.475664
eb8d8042-c8fa-4c8c-83a2-34ef0d59de15	11d8a2a5-5819-4c1f-a465-c106977bc7fe	user.ai_engine_updated	user	11d8a2a5-5819-4c1f-a465-c106977bc7fe	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 15:33:53.019365
28d81cbd-04ee-4622-9789-b356b3f6766e	0bbf93eb-18b0-473d-8716-ff861b523068	user.registered	user	0bbf93eb-18b0-473d-8716-ff861b523068	{"email": "rakumyvy@forexzig.com", "username": "rakumyvy@forexzig.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 15:47:05.367893
5380a156-dcf2-431f-b307-147ef177354f	0bbf93eb-18b0-473d-8716-ff861b523068	user.verified	user	0bbf93eb-18b0-473d-8716-ff861b523068	{"note": "New user registration verified - fresh session created", "email": "rakumyvy@forexzig.com", "username": "rakumyvy@forexzig.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 15:47:18.844672
147ac8e8-b39d-41f1-b184-f6ac945fa483	c82bdfb4-7184-455b-b48b-c03bdc9b904d	user.registered	user	c82bdfb4-7184-455b-b48b-c03bdc9b904d	{"email": "tetenime@denipl.net", "username": "tetenime@denipl.net"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:04:43.224827
04c4dd2b-93f8-4c57-811b-402f45e236ae	8528cd51-bf28-464b-9676-cafe71ab87e4	user.logged_in	user	8528cd51-bf28-464b-9676-cafe71ab87e4	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:07:45.842574
96b17b2a-eb73-4cd5-912c-8b5207edfd0e	4d6a0432-1e08-4c01-ad9c-42e035f71a87	user.registered	user	4d6a0432-1e08-4c01-ad9c-42e035f71a87	{"email": "viniqi@forexzig.com", "username": "viniqi@forexzig.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:14:15.11142
c1ab6824-2be2-4250-9c2e-8a0306ad5a1c	4d6a0432-1e08-4c01-ad9c-42e035f71a87	user.verified	user	4d6a0432-1e08-4c01-ad9c-42e035f71a87	{"note": "New user registration verified - fresh session created", "email": "viniqi@forexzig.com", "username": "viniqi@forexzig.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:14:27.57093
3abef4ac-b795-40d1-9b5a-63ab4fbecde3	4d6a0432-1e08-4c01-ad9c-42e035f71a87	user.logged_in	user	4d6a0432-1e08-4c01-ad9c-42e035f71a87	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:22:17.871042
b3e730b8-ec68-46bc-830a-09df242d10a8	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	user.registered	user	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	{"email": "donipewe@fxzig.com", "username": "donipewe@fxzig.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:26:40.762606
5ce96d5a-5473-499e-bacf-37412111f84c	acfaf022-ca19-4d8d-a1a0-c30160a675cc	user.registered	user	acfaf022-ca19-4d8d-a1a0-c30160a675cc	{"email": "hocepozy@denipl.com", "username": "hocepozy@denipl.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:37:26.714545
b3f4b334-94ee-4016-bd33-4873f290c111	acfaf022-ca19-4d8d-a1a0-c30160a675cc	user.verified	user	acfaf022-ca19-4d8d-a1a0-c30160a675cc	{"note": "New user registration verified - fresh session created", "email": "hocepozy@denipl.com", "username": "hocepozy@denipl.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:37:47.666127
742b9230-934e-4c1a-8fee-b451e1694a24	07911237-2594-463c-bb5d-65ac53b9a9a7	user.ai_engine_updated	user	07911237-2594-463c-bb5d-65ac53b9a9a7	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:44:53.874033
7f61ffa6-1bcb-49fd-a125-a61a3181e638	262a89e3-6dde-4b37-a65f-e800fd316105	user.logged_in	user	262a89e3-6dde-4b37-a65f-e800fd316105	{}	103.211.112.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:16:48.750144
649c684b-7e91-46fb-9cef-93a46145118d	87fd5820-718b-4c0d-9e22-bf284e65fcb6	user.logged_in	user	87fd5820-718b-4c0d-9e22-bf284e65fcb6	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:27:07.473392
6b3d802e-4835-4835-a455-4a969dcf1e88	dd3482f7-9478-4fcc-b162-940fb9ecadba	user.registered	user	dd3482f7-9478-4fcc-b162-940fb9ecadba	{"email": "lacopizi@denipl.net", "username": "lacopizi@denipl.net"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:32:22.639954
830e5298-04af-4537-919d-abb0f3f50ce7	dd3482f7-9478-4fcc-b162-940fb9ecadba	user.verified	user	dd3482f7-9478-4fcc-b162-940fb9ecadba	{"note": "New user registration verified - fresh session created", "email": "lacopizi@denipl.net", "username": "lacopizi@denipl.net"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:32:38.078314
4d5c750d-82f5-41d0-b46a-82dd7015a14a	76cacf03-9e99-4098-b633-7617082f077e	user.registered	user	76cacf03-9e99-4098-b633-7617082f077e	{"email": "zulekyra@denipl.com", "username": "zulekyra@denipl"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:02:05.739777
3824b2af-cdf1-4601-82c7-817389336384	76cacf03-9e99-4098-b633-7617082f077e	user.verified	user	76cacf03-9e99-4098-b633-7617082f077e	{"note": "New user registration verified - fresh session created", "email": "zulekyra@denipl.com", "username": "zulekyra@denipl"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:02:19.746324
4cee4567-bd4e-4aeb-979b-59ad6ef63547	87f0700a-53a9-4909-845a-f79e438f153f	user.registered	user	87f0700a-53a9-4909-845a-f79e438f153f	{"email": "qereqevu@denipl.net", "username": "qereqevu@denipl.net"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:27:24.528855
f6fafaca-8965-43da-b444-8e7792c112a4	cb64b05a-101b-4055-ae05-00ec49f58fd8	user.logged_in	user	cb64b05a-101b-4055-ae05-00ec49f58fd8	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:37:50.405806
f8a3c45b-c656-4d9b-9224-22df2d7fe457	782bfd26-63f3-4eb9-a91a-380ffafd0bca	user.logged_in	user	782bfd26-63f3-4eb9-a91a-380ffafd0bca	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 14:53:09.197083
ef55cb3b-42f9-472a-9968-944d32e44409	e68e2d03-b390-4c81-8f11-57e1dbac38b0	user.registered	user	e68e2d03-b390-4c81-8f11-57e1dbac38b0	{"email": "nycezohe@fxzig.com", "username": "afklsfjflkjfsfjf"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 15:06:05.037357
1757316e-2e64-43c9-8ae4-d0e3fd1f266b	e68e2d03-b390-4c81-8f11-57e1dbac38b0	user.verified	user	e68e2d03-b390-4c81-8f11-57e1dbac38b0	{"note": "New user registration verified - fresh session created", "email": "nycezohe@fxzig.com", "username": "afklsfjflkjfsfjf"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 15:06:24.445404
85920055-ba16-4a5a-9b23-0132e661b077	11d8a2a5-5819-4c1f-a465-c106977bc7fe	user.registered	user	11d8a2a5-5819-4c1f-a465-c106977bc7fe	{"email": "lamumify@forexzig.com", "username": "lamumify@forexzig.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 15:33:30.814731
38965b76-692f-4f8e-ac90-8dfb5732c66b	0bbf93eb-18b0-473d-8716-ff861b523068	user.ai_engine_updated	user	0bbf93eb-18b0-473d-8716-ff861b523068	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 15:47:24.978805
44101f1a-cec2-4d08-bc1f-79417e01bce2	c82bdfb4-7184-455b-b48b-c03bdc9b904d	user.verified	user	c82bdfb4-7184-455b-b48b-c03bdc9b904d	{"note": "New user registration verified - fresh session created", "email": "tetenime@denipl.net", "username": "tetenime@denipl.net"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:05:00.285351
1936dc37-0af8-4830-8178-1b8c0a9b5eb0	c82bdfb4-7184-455b-b48b-c03bdc9b904d	user.logged_in	user	c82bdfb4-7184-455b-b48b-c03bdc9b904d	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:08:21.035308
08337135-ebce-4f5c-bd0e-00299671e8ca	262a89e3-6dde-4b37-a65f-e800fd316105	admin.access_denied	user	262a89e3-6dde-4b37-a65f-e800fd316105	{"role": "user", "reason": "User is not an admin or super admin"}	103.211.112.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-23 21:22:58.621255
88b2be51-af72-4cc1-8e31-21759e4c0bef	262a89e3-6dde-4b37-a65f-e800fd316105	admin.access_denied	user	262a89e3-6dde-4b37-a65f-e800fd316105	{"role": "user", "reason": "User is not an admin or super admin"}	103.211.112.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-23 21:22:59.448788
5b1766a8-740b-4dce-9ef6-f1a67a126825	4d6a0432-1e08-4c01-ad9c-42e035f71a87	user.ai_engine_updated	user	4d6a0432-1e08-4c01-ad9c-42e035f71a87	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:14:35.25785
023dccb2-ddb0-418f-8c2d-fb316c77a1c8	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	user.verified	user	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	{"note": "New user registration verified - fresh session created", "email": "donipewe@fxzig.com", "username": "donipewe@fxzig.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:26:55.001143
eeb294b8-54e7-4c43-8452-8d4250794cf9	acfaf022-ca19-4d8d-a1a0-c30160a675cc	user.ai_engine_updated	user	acfaf022-ca19-4d8d-a1a0-c30160a675cc	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:37:58.09239
10a60d13-256e-4378-873a-6a232582739a	87fd5820-718b-4c0d-9e22-bf284e65fcb6	user.registered	user	87fd5820-718b-4c0d-9e22-bf284e65fcb6	{"email": "posetaga@denipl.com", "username": "posetaga@denipl.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:53:49.207083
042d8bf6-f830-4567-914b-c95d93a9bce7	87fd5820-718b-4c0d-9e22-bf284e65fcb6	user.verified	user	87fd5820-718b-4c0d-9e22-bf284e65fcb6	{"note": "New user registration verified - fresh session created", "email": "posetaga@denipl.com", "username": "posetaga@denipl.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-24 16:54:02.561494
391835e1-2de6-48c7-bba7-70fa63a35c3a	1149ec26-0e2d-4478-b60d-958f48175671	user.registered	user	1149ec26-0e2d-4478-b60d-958f48175671	{"email": "wecolaqe@denipl.net", "username": "posetaga@denipl"}	103.211.112.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:19:09.261913
75938c76-3b14-4252-863e-818ebab92288	dd3482f7-9478-4fcc-b162-940fb9ecadba	user.ai_engine_updated	user	dd3482f7-9478-4fcc-b162-940fb9ecadba	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:32:47.116413
0e223d60-a761-4cbd-8584-ab0c2abcff64	87fd5820-718b-4c0d-9e22-bf284e65fcb6	user.logged_in	user	87fd5820-718b-4c0d-9e22-bf284e65fcb6	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:40:03.186758
62b58051-d63b-439b-aa47-4d9da4e384af	c2ee8f98-90ad-497f-9f52-6f2637cad230	user.registered	user	c2ee8f98-90ad-497f-9f52-6f2637cad230	{"email": "facoxa@denipl.net", "username": "facoxa@denipl.net"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 18:40:51.989897
113e4ceb-39de-4d22-848c-6eb81f0ef13b	1c6eb844-e1ca-440f-b68c-66071162b92f	user.logged_in	user	1c6eb844-e1ca-440f-b68c-66071162b92f	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 19:03:42.215963
e61261bc-eda6-4874-85e5-be394f65c8a2	9fa878f1-83a8-4afb-aae0-939a0942fa33	user.verified	user	9fa878f1-83a8-4afb-aae0-939a0942fa33	{"note": "New user registration verified - fresh session created", "email": "delape@denipl.net", "username": "delape@denipl.net"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 19:06:33.413734
e414baab-b488-4c96-8a3d-7cf9ccdb969a	9fa878f1-83a8-4afb-aae0-939a0942fa33	subscription.activated	subscription	5f07a66c-1f9b-407f-af58-563d3aa09fcb	{"source": "cart_checkout", "orderId": "a3c12c57-5820-427e-a0c1-a71d2a09d31a", "packageSku": "61a2e346-c35f-4395-8996-b3c4cfe8fcd8", "billingType": "monthly"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 19:09:16.472155
4b4899d8-62c6-437e-988a-c913e1a57937	9fa878f1-83a8-4afb-aae0-939a0942fa33	user.ai_engine_updated	user	9fa878f1-83a8-4afb-aae0-939a0942fa33	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-25 19:09:49.037038
8e05f645-2e6c-4960-b2ee-1a93907e83b3	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	user.logged_in	user	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	{}	171.61.122.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-26 03:01:04.30027
0efee7bf-fa5c-49bf-835a-dcb2ba7e8217	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	user.ai_engine_updated	user	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	{"aiEngine": "default"}	171.61.122.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-26 03:01:11.323731
22f5303d-12cd-4a66-b838-404a229cbc7e	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	admin.login	user	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	{"email": "admin@revwinner.com"}	171.61.122.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-26 03:01:30.765615
06c0776e-1216-472f-aca3-e88f65d88609	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	promo_code.created	promo_code	b3587600-8147-4bbc-93f8-3fe7c555ee78	{"code": "SAVE100MS", "adminId": "27b733ea-2ada-40cb-a13c-0d8bb98bd0ca", "category": "session_minutes", "discountType": "percentage", "discountValue": "100", "allowedPlanTypes": ["500"]}	171.61.122.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-26 03:06:09.305937
d967547b-a97e-49e9-b40d-f223cbb6e861	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	promo_code.created	promo_code	f60f83b7-122a-4e94-8a49-dc1a75036055	{"code": "SAVE100DAI", "adminId": "27b733ea-2ada-40cb-a13c-0d8bb98bd0ca", "category": "dai", "discountType": "percentage", "discountValue": "100", "allowedPlanTypes": ["dai_premium", "dai_basic"]}	171.61.122.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-26 03:07:03.632362
7aa461d0-1531-4e81-b278-2022e84d71ec	0269fc29-2a9c-4d32-a87f-d2974ef069e8	user.registered	user	0269fc29-2a9c-4d32-a87f-d2974ef069e8	{"email": "theo712@attendness.com", "username": "TestRW"}	171.61.122.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-26 03:09:38.24664
3b83ab28-01ca-4f52-97a6-368095b85d40	1134e97a-58a6-4a2e-93f5-9305d1dd47ea	user.registered	user	1134e97a-58a6-4a2e-93f5-9305d1dd47ea	{"email": "newlicense@openmail.pro", "username": "TestRW1"}	171.61.122.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-26 03:11:22.51629
20666133-0333-47a8-8b67-d55b1ae04a37	cb2fa4c6-1095-4772-9dae-cce6f5de3450	user.registered	user	cb2fa4c6-1095-4772-9dae-cce6f5de3450	{"email": "18msb@dollicons.com", "username": "Kali"}	171.61.122.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 03:16:04.468235
9f5ceb20-dbf7-49b8-9ed7-9f92af95b662	1b528552-997f-4186-8c72-cf24e635bf6c	user.registered	user	1b528552-997f-4186-8c72-cf24e635bf6c	{"email": "pefobo7412@hutudns.com", "username": "sfdf2wr42"}	103.74.199.184	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 03:23:12.093692
f4358e4b-f2d0-41ad-b22e-4627575f5134	20aed491-cc9e-4efc-93d5-6fd5d8e055c8	user.registered	user	20aed491-cc9e-4efc-93d5-6fd5d8e055c8	{"email": "qzof5hqoxg@mkzaso.com", "username": "Kamla"}	171.61.122.60	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 03:30:59.339022
eee25259-39e0-4a88-94b1-cc728e45efcc	61ea7a73-e090-4860-9285-8e2f1cbb3036	user.registered	user	61ea7a73-e090-4860-9285-8e2f1cbb3036	{"email": "2022.kunal.patil@ves.ac.in", "username": "Sjjekroofkm"}	42.106.216.149	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-02-26 04:10:47.080917
24f19944-ed0a-40ca-b297-47cbb430d7c1	bc1f8029-fd4a-437d-b16a-8c9d98acbece	user.registered	user	bc1f8029-fd4a-437d-b16a-8c9d98acbece	{"email": "worldwide.mosquito.emgx@hidingmail.com", "username": "IKR"}	110.226.76.166	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-02-26 15:08:03.733906
fc04ad7a-402a-4243-9cbe-9afdbdf57748	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	admin.login	user	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	{"email": "admin@revwinner.com"}	110.226.76.166	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-02-26 15:17:06.52669
ad75514d-9d19-456d-942d-e24aba38392e	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	admin.login	user	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	{"email": "admin@revwinner.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 16:23:13.627038
8fdc9a1a-42b2-4782-a13c-5844893d1960	76cacf03-9e99-4098-b633-7617082f077e	subscription.activated	subscription	4502b2f6-dd32-44d3-835a-1c437a9469f0	{"source": "cart_checkout", "orderId": "37cadd13-04c4-4d9f-878f-b8a0e781233d", "packageSku": "61a2e346-c35f-4395-8996-b3c4cfe8fcd8", "billingType": "monthly"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 16:26:16.597455
9b77adc0-a64e-45b6-89cc-1dcd49cc0202	dcf1ea0d-4af6-4582-8e60-1ab2da460605	user.registered	user	dcf1ea0d-4af6-4582-8e60-1ab2da460605	{"email": "voteh90097@hutudns.com", "username": "fsfd23rff3fwefs"}	103.74.199.184	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 17:47:57.573813
c47ae5f5-67fc-48ab-9dbc-c375f961b005	c1fb98be-3e66-4b87-8d5f-18a3571f889b	user.registered	user	c1fb98be-3e66-4b87-8d5f-18a3571f889b	{"email": "pociwil865@bultoc.com", "username": "adminsfsdsfss"}	103.211.112.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0	2026-02-26 19:46:21.523792
63600822-39af-4edd-a6c3-3eba423eb3b9	262a89e3-6dde-4b37-a65f-e800fd316105	user.logged_in	user	262a89e3-6dde-4b37-a65f-e800fd316105	{}	103.211.112.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 19:48:14.035379
67be4c6e-eda2-4c19-b4b1-152274612740	76cacf03-9e99-4098-b633-7617082f077e	user.logged_in	user	76cacf03-9e99-4098-b633-7617082f077e	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 19:53:12.897391
54687f4c-9b97-4651-84bb-837a77a77ccb	4749b239-bcef-433c-a4b2-f984ec3a47e9	user.registered	user	4749b239-bcef-433c-a4b2-f984ec3a47e9	{"email": "heqyzu@denipl.net", "username": "heqyzu@denipl.net"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 19:58:34.795871
e7e1394f-90b7-4e02-ab18-44ee6a9b3bfd	4749b239-bcef-433c-a4b2-f984ec3a47e9	user.verified	user	4749b239-bcef-433c-a4b2-f984ec3a47e9	{"note": "New user registration verified - fresh session created", "email": "heqyzu@denipl.net", "username": "heqyzu@denipl.net"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 19:58:52.547738
c25d2ff3-194d-41ae-bd54-bdfd48587ef9	4749b239-bcef-433c-a4b2-f984ec3a47e9	user.ai_engine_updated	user	4749b239-bcef-433c-a4b2-f984ec3a47e9	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 19:58:58.853699
30a43bd0-4233-41ab-804b-83239b6c3e4a	76cacf03-9e99-4098-b633-7617082f077e	user.logged_in	user	76cacf03-9e99-4098-b633-7617082f077e	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-26 20:14:43.317566
\.


--
-- Data for Name: auth_users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.auth_users (id, email, mobile, first_name, last_name, organization, username, hashed_password, role, status, trial_start_date, trial_end_date, train_me_subscription_date, email_verified, stripe_customer_id, ai_engine, encrypted_api_key, ai_engine_setup_completed, terms_accepted, terms_accepted_at, session_version, call_recording_enabled, created_at, updated_at) FROM stdin;
fd5a0c4b-c413-4eee-890a-dd1c7254ca45	testuser@microsoft.com	\N	Test	Microsoft	\N	test_microsoft	$2b$10$3p4NHdDgbxVbHzyUvnKW0uTUtWzj98st4ZaOp.OsBC95fPv/YTwI6	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-23 05:23:53.558738	2026-02-23 05:23:53.558738
4e04548e-f4c3-43e2-a394-3c3631bb2a1b	testuser@salesforce.com	\N	Test	Salesforce	\N	test_salesforce	$2b$10$9220fRwp1DX.n8gvkDoUr.tRgcrgFdh5kD.NKLw5JIinsmpoo1S9i	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-23 05:23:53.795063	2026-02-23 05:23:53.795063
eb0b172e-fba1-4c16-bd9c-f1a121a4ab4d	testuser@jpmorgan.com	\N	Test	JP Morgan	\N	test_jpmorgan	$2b$10$hGmhDwdjsGimYBYh81p.sObcwiD5TZYdw/STjF0rVzBxlN5Yh548a	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-23 05:23:53.959693	2026-02-23 05:23:53.959693
6d22f8e3-319c-4ab3-82a3-ba0ab1546068	testuser@pfizer.com	\N	Test	Pfizer	\N	test_pfizer	$2b$10$QEkNjoYx/DjBaxYruhAZIeBBqAeo4PIrTWvTV99LItH0vYBy/r/Na	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-23 05:23:54.122185	2026-02-23 05:23:54.122185
b9d6aed6-54bb-4c9e-aa09-2afe87a5c0b4	testuser@amazon.com	\N	Test	Amazon	\N	test_amazon	$2b$10$tq77Jqi.Nd0x.wIgr/uOu.io4uPsvGv9lajLngKGE6/K9KyGD1iJ2	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-23 05:23:54.289756	2026-02-23 05:23:54.289756
c1bfea7d-a96b-4f33-8a8e-340400b3bd77	testuser@uber.com	\N	Test	Uber	\N	test_uber	$2b$10$bJ55ihVh.Q4tfs9dBM1rs.KIddQQpb5z7ei.uFYxExcZFBkSFOtnK	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-23 05:23:54.463053	2026-02-23 05:23:54.463053
30fac2ee-dc1d-4166-a200-43f1d97302e8	testuser@delltechnologies.com	\N	Test	Dell Technologies	\N	test_delltechnologies	$2b$10$AWbzotvTqQtilbkHRqYDUeKq6omyz0gwNU9YFziXg0XGWtAkXZtYu	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-23 05:23:54.627914	2026-02-23 05:23:54.627914
2ddc250f-5d0d-446a-965a-b6aed3374d9d	testuser@ibm.com	\N	Test	IBM	\N	test_ibm	$2b$10$yYGwQ8qtuh4KUE5Ww/sbGOvVHUKb74a8DWx/JL5VrGWGB.NWAu9WK	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-23 05:23:54.794242	2026-02-23 05:23:54.794242
ce7506e3-dffb-4026-b571-7248d239c8a8	testuser@oracle.com	\N	Test	Oracle	\N	test_oracle	$2b$10$wuRde7OHKk1wxKoemlPNo.3/HXx6lftUHS0GgSZUz6EwC9PZuesia	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-23 05:23:54.959083	2026-02-23 05:23:54.959083
badb3a6b-c3b4-4e7c-afad-698034f47149	testuser@accenture.com	\N	Test	Accenture	\N	test_accenture	$2b$10$SpjaXFrsT0DJsXPY6B695eR9ZdORF8pOefNZJTSPOpws2KHTnbz46	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-23 05:23:55.122611	2026-02-23 05:23:55.122611
962a65a4-72f1-4a63-895b-c96410e1ef4f	testuser@meta.com	\N	Test	Meta	\N	test_meta	$2b$10$dpLBKQCElwWW8CzEweBqiOKAqgSB3klE2tzxB.KktLOPgzrUSybr2	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-23 05:23:55.286723	2026-02-23 05:23:55.286723
667aa0de-c6cd-49ac-b091-fd6f2e390019	sanket@plasmax.tech	9619132050	Sanket	Dhuri	Plasma Tech	sanketdhuri	$2b$12$6MMBS2b9oqDgmyoEDfWE3.Bj8YYXakNEyUvgXwwzSGhSL9jn482IO	user	active	\N	\N	\N	t	\N	default	NPVEOiY/pQqMmzHgKxeAUQW5ZQSjbYWyexR71mskEW6tEkFQicl/3W6vqiKy2tgfQqLVoxoqrJSDdpf16g9VQHS5wh3zPSQzYahQ/dfuQ+UXfJPBNP2S/1ZXS2abgui2n6Pmn7mFzw==	t	t	2026-02-23 05:24:57.877	1	f	2026-02-23 05:24:57.895503	2026-02-23 05:25:25.577
76cacf03-9e99-4098-b633-7617082f077e	zulekyra@denipl.com	+919892885090	kunal	patil	Student	zulekyra@denipl	$2b$12$z0hoMTeRbYRuhfP89/tBzOuYHIfaisgaBlp0t82mLMYI8lcOH2ohu	user	active	\N	\N	\N	t	\N	default	XrR4VHgfQsHb5egN7lS6y8hcdnlttqu2+Stwq0pApsmQ0KeQg/7ScPJpv9G+rsH9FoTUKH0Va3RLljqgw1JaaudEJPzaoj4366VLHdDiZb6Be+gcE4nng/AVqv1+rHgF0GjPnE2wLw==	t	t	2026-02-24 14:02:00.695	5	f	2026-02-24 14:02:01.245634	2026-02-26 20:14:42.71
79323d9c-33e1-43de-bb7c-94dc82af4eca	visoxecy@denipl.net	+919892885090	kunal	patil	Student	visoxecy@denipl	$2b$12$hNWhQHWtlODb14F/lL/8z.VU8qg4ejQhzFhSFwgqdDZiRVhsEssjm	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-24 13:58:06.669	0	f	2026-02-24 13:58:07.225872	2026-02-24 13:58:07.225872
d317c887-0d10-4fcf-8c17-fcb61c8ab73b	wymylufe@denipl.net	+917048985724	test	Testing	Plasma Tech	saxo1010	$2b$12$YZlPmDigapTAAQkq2K19ku45k5A42REKcU6JeeVRCr7wsrvX3Mnau	user	active	\N	\N	\N	t	\N	default	2bkilDlXOxytC5mhVmAyiHvmbPCYc82qr8AoXx+mHYl4Fh9Fn6pWcCU/wkIyo37JONewV/5KL6tA9+kDgk5WV7WOa+lln9rwG1fP+ZUDGaD+TogK7jx0LPgqY0V1lBnpdPdIABzd/A==	t	t	2026-02-23 05:32:31.346	1	f	2026-02-23 05:32:31.358446	2026-02-23 05:33:00.819
38aa366c-d07c-4b95-b3dc-6a5754d7dfc9	tabaresi@forexzig.com	+919892885090	kunal	patil	Student	tabaresi@forexzig	$2b$12$Ju.Lts1jnxiMtepcrlkBZuhyUQsnAQFUpd0n4/RRKCJoQNUxushn2	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-24 14:00:29.128	0	f	2026-02-24 14:00:29.674159	2026-02-24 14:00:29.674159
f0c1181f-9d2f-4152-a2e2-9041e2224315	admin@admin.com	\N	admin	admin	System Administrator	admin_1	$2b$12$03DvV1t90blB2atn5Gsarujg3TlQTzEjZPzUdUUP7H6miLbdC49Y2	admin	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-23 21:17:07.953273	2026-02-23 21:17:07.953273
27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	admin@revwinner.com	\N	Admin	User	\N	admin	$2b$10$BnDjt.m4LKdaQY8182qUfePFVTwaJ.RI69MIwWQ9QMM5OsuLnv.Lm	super_admin	active	\N	\N	\N	t	\N	default	kKnuZXI/5Jc6Hgwha6ZFXAHJrgjNPC/RwXxjCnPOnxmlXGmSM4V6KyImzSx1tw85Y5WhineuNVQKaOAsVW94QbKXdgb4aRFke3i1mirIGgIlVG/opn2RZK77A0DZ1DJsNbwC+KbypA==	t	f	\N	5	f	2026-02-24 13:56:33.647558	2026-02-26 16:23:11.739
87f0700a-53a9-4909-845a-f79e438f153f	qereqevu@denipl.net	+919892885090	kunal	patil	Student	qereqevu@denipl.net	$2b$12$GGyvAn5F60WGKdzb6u0VwexXyeebZzwWjOaEq1n7624cMd3Vkh6WK	user	active	\N	\N	\N	t	\N	default	Se2x4hovzwF50YpBBqIHyEwoXG9xgbLOU1+OsjwQFy1ASTXElSQFEzXbkq69IFoydnIz1iGqOOt+yLCbiI0nqRafKMPjs5u7JUHXXHw8LGAFaZqvXbR3bePlLENtfNRmYDKA+2Dyug==	t	t	2026-02-24 14:27:20.6	1	f	2026-02-24 14:27:21.149948	2026-02-24 14:27:56.477
6786fa29-edbe-4087-97b5-ea4b77bdb286	pepocyjy@forexzig.com	+919892885090	kunal	patil	Student	pepocyjy@forexzig	$2b$12$0OwGu0Cm1n8k9U7jWKLfZuTGhPtVRRM4d5y9MNH6zBQhktef0inne	user	active	\N	\N	\N	t	\N	default	t/A+97Bd064ByG8s4MpyrWTyDqko0w3jTZlqThO124xe28e13dHroNDF3emp9GKnqAEmD/MEr+GMLC+W5MdqjFybtOESldNOLd1Qmjn1Add4uAuv7pksS8gEeI4sxRbqR6z8pprwwQ==	t	t	2026-02-24 14:18:44.247	2	f	2026-02-24 14:18:44.797432	2026-02-24 14:23:46.041
cb64b05a-101b-4055-ae05-00ec49f58fd8	puqykywy@fxzig.com	+919892885090	kunal	patil	Student	2022.kunal.patil3379	$2b$12$Ov2Y5NRye2H3rVFY5mHjtOzx.N1Mq8.aF16Mb6z/iI9XDymziOwMq	user	active	\N	\N	\N	t	\N	default	DpoRwpqVaCb2r0vCoXf1/tEpR0QVmoUteSHqsrPiR2chXXOcEgyDhQKKd1Bduek+E7145FUJduMo94LTbMWvmkMupXvJ0g4kX3y/UhQmPBgtRAfXztWZiiJ1aS+t+fc6mE7jYyqafA==	t	t	2026-02-24 14:34:42.697	3	f	2026-02-24 14:34:43.244677	2026-02-24 14:40:26.838
782bfd26-63f3-4eb9-a91a-380ffafd0bca	hytekola@denipl.com	+919892885090	kunal	patil	Student	hytekola@denipl.com	$2b$12$FDH2ywNmlhUD1fbj9GEBq.bTspiE6s542qlKK4yst4MaMgq7/mM0S	user	active	\N	\N	\N	t	\N	default	snq8vwMhAGyMsbi9kjNICTUbfvwU6NR1M8ylVh83eBdCQklnGmfsUhK8w5slxtcbvxwto7Gfhf2mRfrVYhfO4uhySf2b5JEAqxh/Ahb0TsL78RbkSI8efCRt1dWprTLjo8WXv9rpXA==	t	t	2026-02-24 14:47:45.946	3	f	2026-02-24 14:47:46.509815	2026-02-24 14:53:39.018
827ed084-6bfa-41e7-8956-b336bc88cf7b	vecowaja@denipl.com	+919892885090	kunal	patil	Student	vecowaja@denipl.com	$2b$12$QlLt6JqtTvkKhQQs28QWsOeTOkSWcL1DWi8xl1ZArYJ63540bC7hi	user	active	\N	\N	\N	t	\N	default	k7TQ7ph4CzRCaZHOKVn2pAl6jUsoA5FA0heuPT2iF8SmZHp/nA/1V5kh//q0wb/0IPcCf5SSO6DPe1LVqTNICf870dkwvCN/5j0wjSV5WTLXRqG2aAsoSYsQnv4h3AscJpoVuoj4Bg==	t	t	2026-02-24 14:57:04.139	1	f	2026-02-24 14:57:04.695164	2026-02-24 14:57:30.931
e68e2d03-b390-4c81-8f11-57e1dbac38b0	nycezohe@fxzig.com	+919892885090	kunal	patil	Student	afklsfjflkjfsfjf	$2b$12$ab2JXZsAnzxbR7n3ZghVS./faAwpODYvyF6XsDdH0.lJnmm4i1G.G	user	active	\N	\N	\N	t	\N	default	7+uEXMzYG8oIItA0AOZyGiQhqe6Cke/FQpImQGajxw10CM4dg4v9Xa+flLIYO19QSXXswrZU3Cf7VWkNDu327Z3MYisomazO/KVbbTlZwAgZ/5bfTlbF0FFEBIqWvcGk2F+ZOJ/S9Q==	t	t	2026-02-24 15:06:01.169	1	f	2026-02-24 15:06:01.722542	2026-02-24 15:06:42.99
f9eeafb9-ae3f-4dd6-9efd-59e7ed1f603b	gixeje@denipl.net	+919892885090	kunal	patil	Student	gixeje@denipl.net	$2b$12$eBK5DD/ybiELzzHSx3q6TuX65eONc07Ok8PvB5eewckDUXbwAHucq	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-24 15:32:30.093	0	f	2026-02-24 15:32:30.657171	2026-02-24 15:32:30.657171
8528cd51-bf28-464b-9676-cafe71ab87e4	lixufelo@fxzig.com	+919892885090	kunal	patil	Student	lixufelo@fxzig	$2b$12$yUJ.805aXqK7hJG72EXavublLZFhlGr0PmDJtru8PmmbVGv9eZ012	user	active	\N	\N	\N	t	\N	default	9FDkmP0TfE9TpZUabKCvqAnZfIUM9537jOJn9AAzKScF03JPBZUOmkzxXTW927p55GoYnT/McTSCTLJJF+4w9vuccTQxpARZG7nMhOULd5RMRd1sqE3VXO+mdAwHNyr6zzvJV4PXTA==	t	t	2026-02-24 15:17:17.712	3	f	2026-02-24 15:17:18.285217	2026-02-24 16:07:44.769
11d8a2a5-5819-4c1f-a465-c106977bc7fe	lamumify@forexzig.com	+919892885090	kunal	patil	Student	lamumify@forexzig.com	$2b$12$Qw5nwWOgnFZGxkMBA1XE3uGY.tzjI7SOcNJHQJdQPm4mSSV6E.hxa	user	active	\N	\N	\N	t	\N	default	wHeFI4lDrxQXJV2tXnqiyjxpeYNOlKgt0qPCM7iOPov/N102Fpu9toDJ+A45uGxBySxfIoulF49v1o7eupr73nHIGQF/oeegXMqGXPh321rdG1NohVj4hgkdkYOXqfqGshlkxTmsGw==	t	t	2026-02-24 15:33:26.919	1	f	2026-02-24 15:33:27.486917	2026-02-24 15:33:52.228
87fd5820-718b-4c0d-9e22-bf284e65fcb6	posetaga@denipl.com	+919892885090	kunal	patil	Student	posetaga@denipl.com	$2b$12$3JSq6KdatNFFB6kj5F0IJ.4/yCy3H/FQ/a57ZxkTkDvYDiFibekYe	user	active	\N	\N	\N	t	\N	default	6u3dEgmWJL6u6m3lAd7Z/lszD7rX64FHv/y4tdYqjcqdmLrR1l0xlEXJq5hT3+Z74rgwk66zX0xIvKKQsyN6XJYdK0PNkzzMbgPSqZi+LqxMsfqP7EY4bFfnEkOep0+ta8hCUtbbRw==	t	t	2026-02-24 16:53:45.444	4	f	2026-02-24 16:53:46.0344	2026-02-25 18:39:59.972
0bbf93eb-18b0-473d-8716-ff861b523068	rakumyvy@forexzig.com	+919892885090	kunal	patil	Student	rakumyvy@forexzig.com	$2b$12$Bbsq.Y3ycVk5yvQsWVbZQuOZz2nPNeLrmF8baHTivW5TQfzICknwm	user	active	\N	\N	\N	t	\N	default	b0302M114jLgKQNf2U5sinXuK40lj8TLL89xmcVynohntxVeFfqxqvQtuLtCER/iGyUBf/cWUfrQ9LZ+FJrJECDwBbZTb2FsVYxDzuSXwRVO1Pqxt2+yY60M1DPEWl8rFi4Hs2006w==	t	t	2026-02-24 15:47:01.609	1	f	2026-02-24 15:47:02.178807	2026-02-24 15:47:24.179
07911237-2594-463c-bb5d-65ac53b9a9a7	gotize@denipl.com	+919892885090	kunal	patil	Student	gotize@denipl.com	$2b$12$YAOgYUOYnGQPEnx8x/aP6ueoH9JPvp7nPVihbI2ciaQjzc9JTBvEW	user	active	\N	\N	\N	t	\N	default	cpSiO/0haxAWD4PCqC1jqCa8ozw98Ka1kB+e3ZtLh+lGHbnfYOnK0+H0fjPFXL0H54OE82kBpXtKGGUfbQ6zxDR88GEh6/zROV3Q4aLMlpMEtc5zsbaHnWPnH77ZfeKFmuw3qJLSvg==	t	t	2026-02-24 16:44:25.299	1	f	2026-02-24 16:44:25.895454	2026-02-24 16:44:53.061
c82bdfb4-7184-455b-b48b-c03bdc9b904d	tetenime@denipl.net	+919892885090	kunal	patil	Student	tetenime@denipl.net	$2b$12$ykmnglvoVHVCx2jMC39wyuoUfCvW/K0rPK/0NPjIgSX0q8tUoGJhi	user	active	\N	\N	\N	t	\N	default	cMeAJ5gc+ACP6NTxM35pHURxm6OU3ozkv6pyc/q6r6kT/G4x2NmL71cCOIEz/lkD3Lw40Ug6eaUm5J5swN9U3YwIkLJQnUgUh/4rBudh6JVAwGm5UABQadI0M7Zj3GqBSAt4iWSyMg==	t	t	2026-02-24 16:04:39.389	2	f	2026-02-24 16:04:39.957436	2026-02-24 16:08:19.968
20aed491-cc9e-4efc-93d5-6fd5d8e055c8	qzof5hqoxg@mkzaso.com	7048985723	Kamla	Kamla	Healthcaa	Kamla	$2b$12$vc/lI3sVE4emEZqj.QxzQ.fmM6J2YbFgCrcs1u9XdNH1NqkPVGztO	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-26 03:30:59.083	0	f	2026-02-26 03:30:59.095697	2026-02-26 03:30:59.095697
c2ee8f98-90ad-497f-9f52-6f2637cad230	facoxa@denipl.net	+919892885090	kunal	patil	Student	facoxa@denipl.net	$2b$12$HqJSUpHhwUCMoUEEiBOD8OSnpNOmZPHtwECnRczkxwPLRx7qbslYS	user	active	\N	\N	\N	t	\N	default	93prt0/V/jI9vaWHr7YtV9LP8odUsZJ+FESaDkFR3c2gGNVVjkDhjYp2S2H3rVL4YLA1OFX0/ng6ARMEMrmW4R6GcE8I6O/kxvoOav1kae+PpsnoJOVZ2DQ00HY1N3EuyBr0gSTOyA==	t	t	2026-02-25 18:40:46.13	1	f	2026-02-25 18:40:48.858285	2026-02-25 18:41:13.663
4d6a0432-1e08-4c01-ad9c-42e035f71a87	viniqi@forexzig.com	+919892885090	kunal	patil	Student	viniqi@forexzig.com	$2b$12$Vd8zt3d6mNe0JOtKIhinpOeGvZLEGcQ6pzAeeOzEp7L.zQJ4DX7/O	user	active	\N	\N	\N	t	\N	default	iwTD3YrKHm2DP5dZak0ovB5K6k1OxaMsW4C0GONApD0Iqfcg5YnLKd6TPQTX73D8siFckA0E/Xe9wslKvPvv8zpA5Ak1E/0mHFPCxwNlCVTD+NeLys48bGgcV+Hu2PUFY7tY5kgOJQ==	t	t	2026-02-24 16:14:11.396	2	f	2026-02-24 16:14:11.976544	2026-02-24 16:22:16.775
1149ec26-0e2d-4478-b60d-958f48175671	wecolaqe@denipl.net	+919892885090	kunal	patil	Student	posetaga@denipl	$2b$12$aQ5kjTyFw2ZVGNAt0xQQKOh9yfDxg4EHm/6W8ZXfGa0Uh4IYZorBi	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-25 18:19:08.895	0	f	2026-02-25 18:19:08.90688	2026-02-25 18:19:08.90688
1a29b73b-7428-45eb-84c8-8363f2d6b1a6	donipewe@fxzig.com	+919892885090	kunal	patil	Student	donipewe@fxzig.com	$2b$12$2Eu6Wkvv1bsuxynspm900OzXQyeVbm11IA8f8rkJLFzTSPhAGKhWO	user	active	\N	\N	\N	t	\N	default	RxDXZkIsgUqKQ0QcwPCVwTAL336Hayr4+go42hAAA+3Z+nJpVAn1dUKQdXbSMekAPbnILAXmmtxm57ggTYfyyFxgzEmhZ057cZ2BGMqry/tGBqXVNZTLzsqwkRm7Drf1KJuA4yT1Kw==	t	t	2026-02-24 16:26:36.786	1	f	2026-02-24 16:26:37.371638	2026-02-24 16:27:02.247
61ea7a73-e090-4860-9285-8e2f1cbb3036	2022.kunal.patil@ves.ac.in	9191919191	Kunal	Patil	Kdjdjxmek	Sjjekroofkm	$2b$12$eLehDicPlP7hE1//kr9/K.1wmfpcd0WVahREEPxiv6a3RHPHCYPVe	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-26 04:10:46.795	0	f	2026-02-26 04:10:46.807533	2026-02-26 04:10:46.807533
acfaf022-ca19-4d8d-a1a0-c30160a675cc	hocepozy@denipl.com	+919892885090	kunal	patil	Student	hocepozy@denipl.com	$2b$12$m2kANm0kLAJihUwJSnqWj.Z5jOzbMw5S12W1WIZYMalANqY3qmte.	user	active	\N	\N	\N	t	\N	default	08aZZQRoIF6AeZUIH7rzkUQJLpo1TAAPeB3SgP/g8iUIsy716kq2isDhqpxvY8MJmR6hrlocJ60KDI2vJ5lGWm1/rOeXnFJvYn+kE3ftTYqsVTuswgqUzNmsdK9baAYwlSsG7J9Gug==	t	t	2026-02-24 16:37:22.742	1	f	2026-02-24 16:37:23.327522	2026-02-24 16:37:57.288
9fa878f1-83a8-4afb-aae0-939a0942fa33	delape@denipl.net	+919892885090	kunal	patil	Student	delape@denipl.net	$2b$12$JTO.dQ4/Mtt.JU8aCr1Evei51Dxi5LGmrBtj/ZJ/cRrnLXy1iH7E2	user	active	\N	\N	\N	t	\N	default	ntHOnDjuci8wGeD2PcXtmnMngW4wFOm6je1gJG1dXkoOAD/Du1KobOjBSuX1/zDvx9HoAMrbwWLmw+BN6WgLkQXuKTEWx+G0fVqc92hUdFsb5oaUGvxZ8C4auRT5h8gBZQ3H2LiBmA==	t	t	2026-02-25 19:06:12.196	1	f	2026-02-25 19:06:14.914432	2026-02-25 19:09:46.067
0269fc29-2a9c-4d32-a87f-d2974ef069e8	theo712@attendness.com	+917048985724	Sandeep	Sharma	Healthcaa	TestRW	$2b$12$AjMF2DG6pwNhD1qCnjUHYez53DZQH1OBmOuqOE0bzyEY0N6uNxsra	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-26 03:09:37.955	0	f	2026-02-26 03:09:37.967621	2026-02-26 03:09:37.967621
dd3482f7-9478-4fcc-b162-940fb9ecadba	lacopizi@denipl.net	+919892885090	kunal	patil	Student	lacopizi@denipl.net	$2b$12$GRst2ftEkMjdgdK3z6lie.iQ6BNXfUZlnXWd2NsLKOMQr3nIkF5xm	user	active	\N	\N	\N	t	\N	default	SgCUORemhdVc2YcTAhCuKvqcBBwP5bX5u1ju41BRK8jSk9BzHOOQ1ioCiE+eZztB+BNlKCizsBuldjrnp/2jy2+uYbiccemZTHjKZSyNSMysTYOk6f20spTYUzuvmqVw8aOTAotipg==	t	t	2026-02-25 18:32:16.376	1	f	2026-02-25 18:32:19.10145	2026-02-25 18:32:44.146
1134e97a-58a6-4a2e-93f5-9305d1dd47ea	newlicense@openmail.pro	+917048985724	Sandeep	Sharma	Healthcaa	TestRW1	$2b$12$u3ox4Y2THSI5FBNKT/ZnouKg9WKxg5ffZXP.GVYfipFjnZ9sCRmkS	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-26 03:11:22.276	0	f	2026-02-26 03:11:22.287548	2026-02-26 03:11:22.287548
1c6eb844-e1ca-440f-b68c-66071162b92f	mazajaja@denipl.com	+919892885090	kunal	patil	Student	mazajaja@denipl.com	$2b$12$5LDOR6bBd9LNHcuvTRAt5.pjj6fVQBAILkzttCA3TCEQIKxQlaSoS	user	active	\N	\N	\N	t	\N	default	x8NT6JtbEXvS4HIA5h5FRnh9mabrvwGR13X2NcQ6nG8R1vyEPjNihJIO1D74+bglTR+py5BKoECzNMkxyH0Ox9uvgqYRpxszzKIAis1yZuWP9/F5QCuImShl4GZNVC8VFIJy1ltiSA==	t	t	2026-02-25 18:55:20.33	2	f	2026-02-25 18:55:23.048681	2026-02-25 19:03:39.019
cb2fa4c6-1095-4772-9dae-cce6f5de3450	18msb@dollicons.com	7048985723	Kali	Charan	Healthcaa	Kali	$2b$12$.LBfbAoNINhL14JKPJc7V.DKR9hyCRFxhjvjpVjVcBXCuL6EeKeGm	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-26 03:16:04.205	0	f	2026-02-26 03:16:04.217271	2026-02-26 03:16:04.217271
1b528552-997f-4186-8c72-cf24e635bf6c	pefobo7412@hutudns.com	9619132050	test	tes	fsedf fwc	sfdf2wr42	$2b$12$C6VuTrlMEK8SVfErS3aEaekxJ6gxrxSHNE.SIhgE4n8Q7pKmVnOYq	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-26 03:23:11.872	0	f	2026-02-26 03:23:11.884172	2026-02-26 03:23:11.884172
bc1f8029-fd4a-437d-b16a-8c9d98acbece	worldwide.mosquito.emgx@hidingmail.com	+917048985724	Indrakant	Sharma	Healthcaa	IKR	$2b$12$I3nCYCJ8/c1q84H9KqYkWe6Uqt1.kSdvq/9H60v0Y3JEO.Pho5j3a	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-26 15:08:03.325	0	f	2026-02-26 15:08:03.337354	2026-02-26 15:08:03.337354
dcf1ea0d-4af6-4582-8e60-1ab2da460605	voteh90097@hutudns.com	9619132050	Better	Mind	fsedf fwc	fsfd23rff3fwefs	$2b$12$wtDep.x5ScFJ/pzb4O92/uerw5XLXPiuxgyGSBi56uFHMFZKuey.u	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-26 17:47:57.285	0	f	2026-02-26 17:47:57.298817	2026-02-26 17:47:57.298817
c1fb98be-3e66-4b87-8d5f-18a3571f889b	pociwil865@bultoc.com	+918369281313	kunal-patil	Patil	asdrqw	adminsfsdsfss	$2b$12$B2ejgqSRfJj065Zcp7y0mOc9n/yq63gr9wPKu8ak2S/2zhgxqjW2K	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-26 19:46:21.268	0	f	2026-02-26 19:46:21.280305	2026-02-26 19:46:21.280305
262a89e3-6dde-4b37-a65f-e800fd316105	natiqo@forexzig.com	+919892885090	kunal	patil	Student	hello@379	$2b$12$NmxWTgKhCY1wGfxm/yF6Me7tJNHeCFuAg0/CavoNjm.3epJNt9AOq	user	active	\N	\N	\N	t	\N	default	JizsBczNs1Y8uv0+8FuZpDy5v8oE+9/JgskDA6YuCHAIvJd7rqdNuuDAj0Em5ShmSqUT0McSLOT+sLIscajs9N0bZqinh4A5SQ+YwWCMdEwpDUx6AFMYY875fdP0ff2nsb5tQjJ95Q==	t	t	2026-02-23 21:07:07.235	4	f	2026-02-23 21:07:07.248118	2026-02-26 19:48:13.969
4749b239-bcef-433c-a4b2-f984ec3a47e9	heqyzu@denipl.net	+919892885090	kunal	patil	Student	heqyzu@denipl.net	$2b$12$rEgwZk9va7C90hybAkVRauNFUrmbjFPll4HIFHeablgUL9rzTJ6lG	user	active	\N	\N	\N	t	\N	default	270Hkd1oHZfRp90qURsbidGqTSNTO8DX/r0kJ9IBJKm7ZB/PFNC+nIfXuyI0iG4tA2FTvQWEdR965K4Qsu4C9v40P+/NLm6GYYIvo4pIyJsImoaun7jKZBHn9z+gK7JL0266PpYR2A==	t	t	2026-02-26 19:58:31.168	1	f	2026-02-26 19:58:31.301187	2026-02-26 19:58:58.476
\.


--
-- Data for Name: billing_adjustments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.billing_adjustments (id, organization_id, license_package_id, adjustment_type, delta_seats, razorpay_order_id, razorpay_payment_id, amount, currency, status, processed_at, added_by, created_at) FROM stdin;
\.


--
-- Data for Name: call_meeting_minutes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.call_meeting_minutes (id, user_id, conversation_id, recording_id, title, summary, key_points, action_items, participants, pain_points, recommendations, next_steps, full_transcript, structured_minutes, status, expires_at, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: call_recordings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.call_recordings (id, user_id, conversation_id, file_name, file_size, duration, recording_url, status, expires_at, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.cart_items (id, user_id, package_sku, addon_type, package_name, base_price, currency, quantity, metadata, purchase_mode, team_manager_name, team_manager_email, company_name, promo_code_id, promo_code_code, applied_discount_amount, added_at) FROM stdin;
\.


--
-- Data for Name: case_studies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.case_studies (id, title, industry, product_codes, problem_statement, solution, implementation, outcomes, customer_size, time_to_value, tags, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: conversation_memories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.conversation_memories (id, conversation_id, user_id, spin_situation, spin_problems, spin_implications, spin_need_payoff, meddic_metrics, meddic_economic_buyer, meddic_decision_criteria, meddic_decision_process, meddic_pain, meddic_champion, challenger_teachings, challenger_tailoring, challenger_control, bant_budget, bant_authority, bant_need, bant_timeline, buyer_stage, conversation_tone, objections, urgency_level, engagement_score, key_insights, customer_persona, competitive_landscape, success_metrics, created_at, updated_at) FROM stdin;
b3fe9c9f-91da-4112-b788-64c86e78f2d3	78823ad1-c099-4a34-a09a-d125514dc3fc	782bfd26-63f3-4eb9-a91a-380ffafd0bca	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-24 14:51:58.719801	2026-02-24 14:52:00.573
50c30a1c-b8ee-46b6-be28-934d39b14b29	56c0cac5-8979-4d9a-baf6-9d708b56352d	782bfd26-63f3-4eb9-a91a-380ffafd0bca	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-24 14:54:02.263037	2026-02-24 14:54:02.263037
902471af-e656-43f7-ac7f-379610caf0b6	72de624f-e4c1-4411-ac82-f261746e1075	827ed084-6bfa-41e7-8956-b336bc88cf7b	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-24 14:57:58.271254	2026-02-24 14:57:58.271254
eedf571b-4e59-486e-9ab9-d5e0ec639e81	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	e68e2d03-b390-4c81-8f11-57e1dbac38b0	\N	{"What challenges or opportunities are you looking to explore"}	{"Can answer 5 questions about Kubernetes because they watched videos, they've learned it, they've learned it, cannot explain what is a Docker container like you would explain to a 5 year old"}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	60	{}	\N	\N	\N	2026-02-24 15:07:51.715051	2026-02-24 15:08:54.881
8baa38da-fed5-4b97-9a9e-37f073151ec9	e5bd917c-5f2b-47fa-94d2-29234031731a	8528cd51-bf28-464b-9676-cafe71ab87e4	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-24 15:18:41.026421	2026-02-24 15:18:41.026421
1eec0fe4-33df-4ffa-9812-670d329cebf5	51aa62ef-606b-4bb2-b472-178146ac544c	cb64b05a-101b-4055-ae05-00ec49f58fd8	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	40	{}	\N	\N	\N	2026-02-24 14:35:38.255383	2026-02-24 14:36:14.337
3b671f26-b220-4be6-b267-e2371ae1f990	df355c60-9175-4384-8187-2b84da941a38	6786fa29-edbe-4087-97b5-ea4b77bdb286	\N	{"What challenges or opportunities are you looking to explore","User authentication solved problem"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-24 14:19:29.893917	2026-02-24 14:20:12.623
f99efe06-1e66-453d-bebc-f32929fb9dd5	ecfcf0d0-c5e0-4f2a-9f63-cbb3d29469c5	8528cd51-bf28-464b-9676-cafe71ab87e4	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-24 15:23:58.486783	2026-02-24 15:23:58.486783
49906b17-ad5c-4da9-979e-8ed875f6876a	ea1ad94f-2510-4d83-812c-1b77750eb020	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	60	{}	\N	\N	\N	2026-02-25 18:51:20.095465	2026-02-25 18:52:47.285
45fc1e47-7dbd-4312-9de9-a30740c70dd7	54b25796-301a-47af-8a8b-1bbb7c64a790	87f0700a-53a9-4909-845a-f79e438f153f	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-24 14:28:22.132377	2026-02-24 14:28:40.113
55c95d0f-8a47-40c6-9a4e-93b4fe9e94b7	54b25796-301a-47af-8a8b-1bbb7c64a790	87f0700a-53a9-4909-845a-f79e438f153f	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-24 14:28:22.134599	2026-02-24 14:28:40.113
7bdb2373-ee76-416e-96ff-3e36af6305a8	54b25796-301a-47af-8a8b-1bbb7c64a790	87f0700a-53a9-4909-845a-f79e438f153f	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-24 14:28:22.195432	2026-02-24 14:28:40.113
3f76c46b-968d-46cc-b3ef-3ab7b4698bbd	48e50603-e936-4c64-8f52-cf47f689c85f	6786fa29-edbe-4087-97b5-ea4b77bdb286	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-24 14:25:38.285504	2026-02-24 14:25:38.285504
8f39007b-2f18-489a-8b82-9b31497ea104	0a5f16aa-9e49-4dc1-94e7-776dfd8a74ea	6786fa29-edbe-4087-97b5-ea4b77bdb286	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-24 14:24:48.511124	2026-02-24 14:25:40.474
7a5bfebc-80a3-4170-ac6b-b3d429563947	6ba03c92-c041-4feb-8467-6fe2851640d7	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-24 15:39:55.464405	2026-02-24 15:40:19.258
7bc7984c-34ac-4f57-8456-76eaaf11822f	35a6cdaf-3549-405c-aa08-a42cb7efe7ea	827ed084-6bfa-41e7-8956-b336bc88cf7b	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-24 14:59:10.208219	2026-02-24 15:01:56.316
807e118c-b5f7-4151-a334-042d1363ba51	9c9b9783-2adc-4e8f-bce8-82aec57e2a81	cb64b05a-101b-4055-ae05-00ec49f58fd8	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	40	{}	\N	\N	\N	2026-02-24 14:38:13.742513	2026-02-24 14:38:37.822
a3496edd-3a3e-4df9-bedf-c721481e884c	05d0255d-ee12-49bc-83b8-21435ba33a89	782bfd26-63f3-4eb9-a91a-380ffafd0bca	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-24 14:49:10.388076	2026-02-24 14:49:10.388076
561e2adc-dbcc-4755-80ba-713986a92d7d	121c9a95-e644-4396-b489-b91817697880	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-25 18:34:34.583512	2026-02-25 18:34:58.104
4c0aae31-096d-491b-927f-41d11437e1a4	bf7a407c-9acd-4516-acf8-9dd3e96f9405	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	{"What challenges or opportunities are you looking to explore"}	{"And if I need to showcase specific results,"}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	60	{}	\N	\N	\N	2026-02-25 18:41:36.743878	2026-02-25 18:42:59.864
ff624e79-7c27-4e6b-9a38-96685a4301df	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	60	{}	\N	\N	\N	2026-02-25 18:56:09.608812	2026-02-25 18:57:59.897
3cc8d07f-ad1f-4d57-8c3e-9538b3559c47	e8e20ace-9190-4cae-b336-36253e1c9b62	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	40	{}	\N	\N	\N	2026-02-25 19:10:40.064308	2026-02-25 19:11:51.129
95487408-708f-4942-9eee-85a04bb44041	1676231b-ce00-4651-920a-470228903ead	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-25 19:15:31.985543	2026-02-25 19:15:31.985543
ceb591f4-e57b-4488-bad6-3cc03f566c35	8eef9221-1419-4d2f-8c24-45558da7c113	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-25 19:12:36.038761	2026-02-25 19:12:52.425
04c072f0-56dd-45ce-8624-1836275471c0	9da3f838-3138-42d4-88c5-2868c6078c3a	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-25 19:30:19.891901	2026-02-25 19:30:27.706
7284d9c9-92fa-43ba-a70d-689306c48dbd	b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	76cacf03-9e99-4098-b633-7617082f077e	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	40	{}	\N	\N	\N	2026-02-26 16:32:01.152286	2026-02-26 16:32:52.635
d512cb19-5fa5-4de3-9bda-626a2902e7e2	46d6ded0-abad-47ef-a933-037fc29be1e0	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-25 19:18:11.906239	2026-02-25 19:18:31.972
c78775be-08ef-460f-a7ca-1f1f76ce815a	2eedfc49-21a0-45b3-a703-45890436cf4d	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-25 19:32:52.682963	2026-02-25 19:32:58.787
01535fea-5e04-4601-8128-9cdcfa6d1241	79d29370-7f02-4172-bce1-3375f2b5b47f	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-26 16:19:26.632507	2026-02-26 16:19:43.284
216dd223-2544-4444-ae62-460bc10b7d01	cf336250-12d3-436b-90c0-a950da4ee474	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-26 16:21:04.188618	2026-02-26 16:21:09.28
bd225a6a-f922-4d11-a81e-09bc03e3659a	0b14eb48-a6b4-4bb2-b40c-0c3585d781fe	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	40	{}	\N	\N	\N	2026-02-25 19:19:05.750818	2026-02-25 19:19:52.103
53bae93a-8bea-4bb1-ae37-3bbf7feb52ad	86285ce1-7050-4ec6-bc1a-eb5bc433d5e2	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	20	{}	\N	\N	\N	2026-02-25 19:24:19.052299	2026-02-25 19:24:46.288
b3eda034-c491-4b89-bdea-2568f83385dc	49f2c9ee-2011-416a-88f0-42cdaed39655	76cacf03-9e99-4098-b633-7617082f077e	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	✓ as soon as possible	awareness	\N	\N	\N	60	{}	\N	\N	\N	2026-02-26 16:33:38.125234	2026-02-26 16:36:38.429
79a4a9f1-1aac-482d-9913-ee4068a3bd97	1e2890f9-f8a3-4da9-88c6-94471ff5d671	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	40	{}	\N	\N	\N	2026-02-25 19:34:30.352832	2026-02-25 19:36:02.854
f02c67fe-2309-45de-b9ab-cebcc0fe3736	de11b189-63a6-479b-83ef-6357766066f5	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	40	{}	\N	\N	\N	2026-02-25 19:25:18.338368	2026-02-25 19:27:08.767
eda4facd-4ac9-4ec2-9842-cbfd54b629a0	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	76cacf03-9e99-4098-b633-7617082f077e	\N	{"What challenges or opportunities are you looking to explore"}	{}	\N	{}	\N	\N	\N	{}	\N	\N	\N	\N	\N	\N	\N	\N	awareness	\N	\N	\N	40	{}	\N	\N	\N	2026-02-26 16:39:13.540832	2026-02-26 16:40:23.909
\.


--
-- Data for Name: conversation_minutes_backup; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.conversation_minutes_backup (id, conversation_id, user_id, client_name, company_name, industry, meeting_date, meeting_duration_minutes, executive_summary, key_topics_discussed, client_pain_points, client_requirements, solutions_proposed, competitors_discussed, objections, action_items, next_steps, full_transcript, message_count, key_quotes, marketing_hooks, best_practices, challenges_identified, success_indicators, raw_minutes_data, discovery_insights, backup_status, backup_source, created_at, updated_at) FROM stdin;
a996960c-ddb9-4b31-8863-8d9fbf1b65e4	fb3906e4-e441-43bc-9922-f806ca8ba6fa	fd5a0c4b-c413-4eee-890a-dd1c7254ca45	Sarah Chen	Microsoft	Technology	2025-12-10 10:00:00	45	Productive discovery call with Microsoft's enterprise procurement team. Strong interest in AI-powered sales intelligence for their global sales organization of 15,000+ reps. Key concern around data security and integration with existing CRM.	["Global sales enablement challenges", "Integration with Dynamics 365", "AI accuracy and training requirements", "Data privacy and sovereignty", "Multi-language support"]	["Sales reps spend 40% of time on administrative tasks instead of selling", "Inconsistent messaging across global teams", "Delayed insights from quarterly reviews vs real-time feedback", "High onboarding time for new sales hires (6+ months to productivity)", "Lack of visibility into conversation quality metrics"]	["SOC 2 Type II compliance required", "Integration with Dynamics 365 CRM", "Support for 12+ languages", "GDPR compliance for EU operations", "On-premise deployment option for sensitive data"]	["Rev Winner Enterprise with dedicated infrastructure", "Custom Dynamics 365 connector", "Multi-language AI model training", "Private cloud deployment option"]	["Gong", "Chorus.ai", "Clari"]	[{"outcome": "Client expressed interest in a proof of concept to validate claims", "response": "Our AI achieves 94% accuracy on sales intent detection, and unlike competitors, we offer domain-specific training that improves accuracy by 15-20% for enterprise customers.", "objection": "How does your AI accuracy compare to Gong's established platform?"}, {"outcome": "Requested detailed pricing proposal", "response": "Our enterprise pricing includes dedicated implementation support, training, and ongoing success management. Most customers see positive ROI within 4 months.", "objection": "What's the total cost of ownership including implementation?"}]	["Send SOC 2 Type II certification documents", "Prepare Dynamics 365 integration demo", "Schedule technical deep-dive with IT security team", "Provide customer references in enterprise software"]	["Technical security review scheduled for next week", "Follow-up call with procurement in 10 days", "Prepare pilot proposal for 500-user deployment"]	Sarah: Thank you for taking the time today. We've been evaluating several sales intelligence platforms for our global sales team.\n\nSales Rep: Absolutely, Sarah. I'm excited to learn more about Microsoft's needs. Can you tell me about the current challenges your sales organization is facing?\n\nSarah: Our biggest issue is that our 15,000+ sales reps spend about 40% of their time on administrative tasks instead of actually selling. Things like updating CRM, writing call summaries, and preparing for meetings.\n\nSales Rep: That's a significant time drain. What impact does that have on your revenue targets?\n\nSarah: It's substantial. We estimate we're leaving about $200 million on the table annually just from lost selling time. Plus, our new hires take 6+ months to become productive because there's so much tribal knowledge they need to absorb.\n\nSales Rep: Rev Winner can help with both of those challenges. Our AI automatically generates meeting summaries, updates your CRM, and provides real-time coaching to new reps. How important is integration with your existing tools?\n\nSarah: Critical. We're heavily invested in Dynamics 365, so any solution needs to work seamlessly with that. And security is non-negotiable - we need SOC 2 Type II compliance at minimum.\n\nSales Rep: We have SOC 2 Type II certification and can provide custom Dynamics 365 integration. Can you tell me about your current tools and what's not working?\n\nSarah: We've evaluated Gong and Chorus.ai. Gong has good transcription but their coaching features are limited. We need something that can actually improve sales performance, not just record conversations.\n\nSales Rep: That's exactly our differentiator. Our domain expertise training means the AI understands your specific industry context, improving accuracy by 15-20% compared to generic solutions.\n\nSarah: That's impressive. What's the implementation timeline look like?\n\nSales Rep: For an enterprise deployment of your scale, we typically see 90 days to full rollout with dedicated implementation support. We'd start with a 500-user pilot.\n\nSarah: I'd like to see a technical deep-dive with our IT security team. Can you set that up?\n\nSales Rep: Absolutely. I'll send over our security documentation and we'll schedule that review for next week.	127	["Our sales reps are drowning in admin work - if we could get even 10% of that time back, it would be transformational", "The real-time coaching aspect is what sets this apart from our current tools", "I'm impressed by the domain expertise training - that's something our current vendor can't do"]	["Transform 40% admin time into active selling time", "Real-time coaching for 15,000+ global sales reps", "Enterprise-grade security with SOC 2 Type II compliance"]	["Lead with security certifications for enterprise prospects", "Demonstrate ROI calculations early in the conversation", "Emphasize domain-specific training advantages over competitors"]	["Sales reps spend 40% of time on administrative tasks instead of selling", "Inconsistent messaging across global teams", "Delayed insights from quarterly reviews vs real-time feedback", "High onboarding time for new sales hires (6+ months to productivity)", "Lack of visibility into conversation quality metrics"]	[]	{}	{}	completed	manual	2026-02-23 05:23:53.611	2026-02-23 05:23:53.623681
524dcb6e-1f62-49c6-96dc-17e7ffe9d5da	c7edc56b-98d8-4925-91a2-bb9548d39f98	fd5a0c4b-c413-4eee-890a-dd1c7254ca45	James Rodriguez	Microsoft	Technology	2025-12-12 14:00:00	60	Deep-dive technical session with Microsoft Azure team exploring cloud infrastructure requirements. Strong alignment on scalability needs and API architecture.	["Azure integration requirements", "API rate limits and scalability", "Data residency requirements", "SSO integration with Azure AD", "Performance benchmarks"]	["Current tools don't scale well beyond 10,000 concurrent users", "API limitations causing bottlenecks during peak usage", "Complex authentication requirements for enterprise SSO", "Need for regional data processing to meet compliance"]	["Azure AD SSO integration required", "Support for 50,000+ concurrent users", "API SLA of 99.95% uptime", "Data processing in specific Azure regions"]	["Dedicated Azure infrastructure deployment", "High-availability API cluster with auto-scaling", "Azure AD native integration", "Multi-region deployment architecture"]	["Gong", "SalesLoft", "Outreach"]	[{"outcome": "Agreed to run a load testing pilot", "response": "We currently process 2M+ conversations daily for enterprise clients. Our Azure-native architecture auto-scales to handle peak loads.", "objection": "Can your infrastructure really handle our scale?"}]	["Provide Azure architecture documentation", "Schedule load testing session", "Share API performance benchmarks"]	["Technical architecture review with Azure team", "Load testing pilot in Q1"]	James: Let's dive into the technical requirements we discussed. I'm from the Azure infrastructure team and I need to understand your scalability story.\n\nSales Rep: Absolutely, James. What's your current scale and where do you need to be?\n\nJames: We have 50,000 sales reps globally. During peak periods like quarter-end, we can have 10,000+ concurrent users. Our current tools start degrading at around 5,000.\n\nSales Rep: That's a common challenge. Rev Winner's architecture is built on Azure-native services with auto-scaling. We currently process over 2 million conversations daily for our enterprise clients.\n\nJames: What's your uptime SLA? We require 99.95% minimum for business-critical systems.\n\nSales Rep: We guarantee 99.95% uptime with our enterprise tier. We also offer multi-region deployment so data stays within specific Azure regions for compliance.\n\nJames: That's important - we have strict data residency requirements for EMEA. How does your SSO integration work with Azure AD?\n\nSales Rep: We have native Azure AD integration. Your users authenticate through your existing Azure AD tenant - no separate credentials needed. We support SAML 2.0 and OIDC.\n\nJames: I'd want to run a load test before we commit. Can you support that?\n\nSales Rep: Definitely. We typically do a 2-week pilot where we simulate your peak loads. We'll provide detailed performance metrics and can run the test in an isolated environment.\n\nJames: The Azure-native approach is exactly what we need for our hybrid cloud strategy. Let me schedule a follow-up with our Azure architecture team.\n\nSales Rep: Perfect. I'll send over our architecture documentation and API specs. We can also arrange a session with our solutions architects.	189	["If you can prove the scalability, we're very interested in moving forward", "The Azure-native approach is exactly what we need for our hybrid cloud strategy"]	["Enterprise-scale: 50,000+ concurrent users supported", "Azure-native architecture for seamless integration", "99.95% API uptime SLA"]	["Lead technical conversations with architecture diagrams", "Prepare benchmark data for scalability discussions", "Offer load testing as proof point"]	["Current tools don't scale well beyond 10,000 concurrent users", "API limitations causing bottlenecks during peak usage", "Complex authentication requirements for enterprise SSO", "Need for regional data processing to meet compliance"]	[]	{}	{}	completed	manual	2026-02-23 05:23:53.666	2026-02-23 05:23:53.678942
4ad4a7b6-75a6-493b-b82a-5d048dc724de	dc91b76e-19d1-4323-871f-ba98a424f9e4	4e04548e-f4c3-43e2-a394-3c3631bb2a1b	Maria Santos	Salesforce	Technology	2025-12-08 09:00:00	50	Strategic discussion with Salesforce's revenue operations team about enhancing their sales coaching program. Strong interest in AI-driven insights but concerns about internal buy-in.	["Sales coaching methodology integration", "Salesforce CRM native integration", "Change management for 8,000 reps", "Measuring coaching effectiveness", "Executive dashboard requirements"]	["Current coaching is inconsistent across regions", "No objective metrics for coaching quality", "Managers spend too much time on call reviews", "New hire ramp time is 9+ months", "Top performer behaviors not systematically captured"]	["Native Salesforce integration", "Executive-level reporting dashboards", "Coaching playbook customization", "Integration with existing LMS"]	["Rev Winner Sales Coaching module", "Native Salesforce AppExchange integration", "Custom coaching scorecards", "AI-powered ramp time acceleration"]	["Gong", "Mindtickle", "Lessonly"]	[{"outcome": "Interest in change management workshop", "response": "We position AI as a coaching assistant, not replacement. Our platform surfaces insights while managers retain full control of coaching decisions.", "objection": "Our managers are resistant to AI-based coaching recommendations"}, {"outcome": "Agreed to integration assessment", "response": "Rev Winner complements existing investments - we integrate with your LMS and coaching workflows rather than replacing them.", "objection": "We've invested heavily in our internal coaching tools"}]	["Demo native Salesforce integration", "Prepare change management playbook", "Share case study from similar enterprise deployment"]	["Change management workshop next month", "Technical integration assessment", "Pilot proposal for APAC region"]	Maria: Thanks for accommodating our schedule. We're really looking for a solution that works with our existing Salesforce investment...	156	["Reducing ramp time from 9 months to 6 would save us millions in lost productivity", "The native Salesforce integration is a must-have for us", "We need to prove this to our leadership team with hard metrics"]	["Reduce sales ramp time by 33%", "Native Salesforce AppExchange integration", "AI-assisted coaching that empowers managers"]	["Address change management concerns proactively", "Position AI as assistant to human managers", "Emphasize integration over replacement"]	["Current coaching is inconsistent across regions", "No objective metrics for coaching quality", "Managers spend too much time on call reviews", "New hire ramp time is 9+ months", "Top performer behaviors not systematically captured"]	[]	{}	{}	completed	manual	2026-02-23 05:23:53.83	2026-02-23 05:23:53.842841
45c07d41-3af1-4996-bd2e-56ae08826163	8465d8be-dd82-4234-9124-8773e32cf99d	eb0b172e-fba1-4c16-bd9c-f1a121a4ab4d	Robert Kim	JP Morgan	Financial Services	2025-12-05 11:00:00	55	Initial discovery with JP Morgan's wealth management division. Stringent security requirements but strong interest in AI-powered client engagement insights.	["Client engagement optimization", "Regulatory compliance (SEC, FINRA)", "Data security and encryption", "Wealth advisor productivity", "Client sentiment analysis"]	["Wealth advisors missing cross-sell opportunities", "Inconsistent client experience across advisors", "Manual compliance review of client communications", "Limited visibility into client satisfaction", "High-value client churn increasing"]	["SEC and FINRA compliance", "End-to-end encryption for all data", "Audit trail for all interactions", "Integration with existing CRM and compliance systems", "Air-gapped deployment option"]	["Rev Winner Financial Services edition", "Compliance-ready conversation intelligence", "Secure private cloud deployment", "Real-time sentiment analysis"]	["Gong", "Relativity", "Verint"]	[{"outcome": "Requested compliance documentation review", "response": "Our platform is built with financial services compliance in mind. We have dedicated compliance modules for SEC, FINRA, and MiFID II requirements, with automatic redaction and archiving.", "objection": "How do you handle the regulatory complexity of financial services?"}, {"outcome": "Scheduled security architecture review", "response": "We offer fully air-gapped deployment options with all processing done within your infrastructure. Our enterprise security team can work with your IT to design the right architecture.", "objection": "Our data can never leave our infrastructure"}]	["Provide SEC/FINRA compliance documentation", "Schedule security architecture review", "Share financial services customer references"]	["Compliance team review in two weeks", "Security architecture workshop", "Reference calls with similar financial institutions"]	Robert: Thank you for coming to our offices. Security and compliance are our top priorities...	134	["If we can prove this reduces compliance review time, the ROI case writes itself", "Our wealth advisors need to focus on clients, not paperwork", "We've lost several high-value clients because we weren't proactive enough"]	["SEC and FINRA compliant from day one", "Air-gapped deployment for maximum security", "Reduce compliance review time by 60%"]	["Lead with compliance and security for financial services", "Offer on-premise/air-gapped options upfront", "Reference similar regulated industry deployments"]	["Wealth advisors missing cross-sell opportunities", "Inconsistent client experience across advisors", "Manual compliance review of client communications", "Limited visibility into client satisfaction", "High-value client churn increasing"]	[]	{}	{}	completed	manual	2026-02-23 05:23:53.996	2026-02-23 05:23:54.008134
7b04a499-0e2f-4514-8a7b-c600f832a40d	87dbedba-507c-4359-a359-d4ebe1c25ef6	6d22f8e3-319c-4ab3-82a3-ba0ab1546068	Dr. Amanda Collins	Pfizer	Healthcare & Pharmaceuticals	2025-12-03 15:00:00	40	Discussion with Pfizer's commercial operations team about improving HCP (Healthcare Professional) engagement. Focus on compliance with pharma regulations while improving rep effectiveness.	["HCP engagement optimization", "FDA compliance for promotional content", "Medical legal regulatory review", "Rep training and coaching", "Omnichannel engagement tracking"]	["HCPs have limited time for sales interactions", "Compliance review slows content updates", "Reps struggle with complex scientific messaging", "Limited insights into HCP preferences", "Inconsistent messaging across channels"]	["FDA promotional guideline compliance", "Medical legal regulatory (MLR) workflow integration", "HIPAA compliance", "Integration with Veeva CRM", "Scientific accuracy validation"]	["Rev Winner Pharma edition", "Pre-approved messaging templates", "AI-powered scientific accuracy checks", "Veeva CRM integration"]	["Veeva Engage", "IQVIA", "Aktana"]	[{"outcome": "Interest in seeing the MLR integration demo", "response": "Our pharma-specific AI is trained on approved messaging only. All suggestions go through your MLR workflow before deployment.", "objection": "How do you ensure scientific accuracy in AI recommendations?"}]	["Demo Veeva CRM integration", "Provide FDA compliance documentation", "Share pharma customer case studies"]	["MLR team demonstration next week", "Compliance documentation review", "Pilot proposal for oncology business unit"]	Dr. Collins: Our field reps are highly trained, but we're looking for ways to help them be more effective in their limited HCP interactions...	98	["Every minute with an HCP is precious - we need to maximize the impact of each interaction", "If you can integrate with our MLR workflow, that would be a game-changer", "The scientific accuracy aspect is critical - we can't have any off-label messaging"]	["FDA-compliant conversation intelligence for pharma", "Seamless Veeva CRM integration", "Maximize HCP engagement with AI-powered insights"]	["Emphasize compliance and scientific accuracy for pharma", "Lead with Veeva integration capabilities", "Offer MLR workflow integration as differentiator"]	["HCPs have limited time for sales interactions", "Compliance review slows content updates", "Reps struggle with complex scientific messaging", "Limited insights into HCP preferences", "Inconsistent messaging across channels"]	[]	{}	{}	completed	manual	2026-02-23 05:23:54.157	2026-02-23 05:23:54.170348
af75ce32-2487-4802-990f-1897697549b8	5c16cd02-96b3-40a5-b683-7ddaad066bc4	b9d6aed6-54bb-4c9e-aa09-2afe87a5c0b4	Jennifer Wright	Amazon	E-commerce & Cloud	2025-12-15 16:00:00	65	Strategic discussion with Amazon AWS enterprise sales leadership about deploying conversation intelligence across their B2B sales teams. High interest in scale and AWS integration.	["AWS integration opportunities", "Global sales team deployment", "Real-time coaching at scale", "Data sovereignty across regions", "Competitive win/loss analysis"]	["Sales cycles becoming longer and more complex", "Difficulty tracking competitive dynamics in real-time", "Inconsistent discovery processes across teams", "Limited visibility into deal progression signals", "New product launch messaging inconsistency"]	["Native AWS infrastructure deployment", "Support for 25,000+ sales reps globally", "Real-time competitive intelligence", "Integration with internal tools and Salesforce", "Multi-region data processing"]	["Rev Winner Enterprise on AWS", "Global multi-region deployment", "Real-time competitive intelligence module", "Custom Salesforce and internal tool integrations"]	["Gong", "Clari", "People.ai"]	[{"outcome": "Interested in integration architecture session", "response": "Rev Winner is designed to complement, not replace. We've successfully integrated with custom internal tools at other hyperscalers.", "objection": "We already have significant investments in internal tools"}, {"outcome": "Requested case study from similar scale deployment", "response": "We've architected for hyperscale from day one. Our largest customer processes 3M+ conversations monthly without performance degradation.", "objection": "How do you handle our scale of 25,000+ reps?"}]	["Prepare AWS-native architecture proposal", "Share hyperscale customer case study", "Schedule integration architecture workshop"]	["Technical architecture workshop next month", "Pilot proposal for AWS enterprise sales team", "Executive sponsor meeting"]	Jennifer: Thanks for making time. We're looking at how to better enable our sales teams as we continue to scale...	203	["Scale is non-negotiable - if you can't handle 25,000 reps, we can't consider you", "Real-time competitive intelligence is increasingly critical for our enterprise deals", "We need something that works with our existing investments, not replaces them"]	["Hyperscale-ready: 25,000+ reps supported", "AWS-native deployment for maximum performance", "Real-time competitive intelligence for enterprise deals"]	["Lead with scale capabilities for large enterprises", "Emphasize complementary rather than replacement approach", "Prepare detailed architecture for hyperscale requirements"]	["Sales cycles becoming longer and more complex", "Difficulty tracking competitive dynamics in real-time", "Inconsistent discovery processes across teams", "Limited visibility into deal progression signals", "New product launch messaging inconsistency"]	[]	{}	{}	completed	manual	2026-02-23 05:23:54.331	2026-02-23 05:23:54.34615
772611fa-5b78-479f-830c-04e77ab62f1d	ea911deb-4ab9-4bf9-8a36-e7133c52a051	c1bfea7d-a96b-4f33-8a8e-340400b3bd77	Michael Thompson	Uber	Transportation & Technology	2025-12-18 13:00:00	45	Discovery call with Uber's B2B sales team focused on Uber for Business and Uber Freight sales optimization. Interest in reducing sales cycle time and improving win rates.	["B2B sales cycle optimization", "Freight sales enablement", "Enterprise deal tracking", "Competitive positioning against Lyft Business", "Multi-product sales coordination"]	["Long enterprise sales cycles (6-9 months)", "Complex multi-product deals hard to track", "Inconsistent messaging across Uber for Business and Freight", "Limited visibility into deal health", "Competitive pressure from Lyft Business"]	["Integration with Salesforce", "Multi-product deal tracking", "Competitive intelligence dashboard", "Mobile-first experience for field reps", "Real-time deal health scoring"]	["Rev Winner Pro with competitive intelligence", "Custom multi-product deal tracking", "Mobile-optimized coaching", "Real-time deal health analytics"]	["Gong", "Chorus.ai", "SalesLoft"]	[{"outcome": "Requested mobile app demo", "response": "Our mobile experience is designed for field sales. Reps can access coaching, competitive intel, and deal insights right from their phones.", "objection": "Our field reps are always on the go - desktop solutions don't work for us"}]	["Schedule mobile app demonstration", "Prepare multi-product deal tracking demo", "Share transportation industry case studies"]	["Mobile app demo next week", "Pilot proposal for Uber Freight team", "Competitive intelligence workshop"]	Michael: Our B2B sales teams are growing fast and we need better tools to help them win more deals...	112	["Shortening our sales cycle from 9 months to 6 would be a massive win", "Mobile-first is essential - our reps are never at their desks", "The multi-product tracking is really interesting for our complex deals"]	["Reduce enterprise sales cycles by 30%", "Mobile-first sales enablement for field teams", "Multi-product deal intelligence"]	["Lead with mobile capabilities for field sales teams", "Emphasize sales cycle reduction ROI", "Demonstrate multi-product deal tracking"]	["Long enterprise sales cycles (6-9 months)", "Complex multi-product deals hard to track", "Inconsistent messaging across Uber for Business and Freight", "Limited visibility into deal health", "Competitive pressure from Lyft Business"]	[]	{}	{}	completed	manual	2026-02-23 05:23:54.499	2026-02-23 05:23:54.511349
60d9fb8c-a9d1-4546-a283-e3dbede95ac8	de6b165c-603b-44b1-912b-b1117479919b	30fac2ee-dc1d-4166-a200-43f1d97302e8	Patricia Lee	Dell Technologies	Technology Hardware	2025-12-01 10:00:00	50	Strategic conversation with Dell's channel sales leadership about improving partner sales enablement. Focus on empowering 50,000+ channel partners with AI-driven insights.	["Channel partner enablement", "Partner training and certification", "Deal registration tracking", "Competitive positioning against HP and Lenovo", "Partner performance analytics"]	["50,000+ channel partners with inconsistent training", "Partner messaging often off-brand", "Limited visibility into partner sales conversations", "Competitive losses to HP on similar deals", "Partner certification tracking is manual"]	["Partner portal integration", "White-label capabilities", "Certification tracking and automation", "Competitive battle cards for partners", "Partner performance dashboards"]	["Rev Winner Channel Partner Edition", "White-label partner coaching platform", "Integrated certification tracking", "AI-powered competitive battle cards"]	["Impartner", "Zift Solutions", "Salesforce PRM"]	[{"outcome": "Interest in portal integration demo", "response": "We integrate directly into your existing partner portal. Partners access coaching and insights where they already work.", "objection": "Our partners won't adopt another tool"}]	["Demo partner portal integration", "Prepare white-label proposal", "Share channel partner case studies"]	["Partner portal integration review", "Pilot with top 100 partners", "White-label branding workshop"]	Patricia: Our channel business is critical, but we struggle to ensure our partners are as effective as our direct sales team...	145	["If we could bring our top partners to the level of our direct team, it would be transformational", "Integration with our existing portal is critical - partners won't log into another system", "The competitive battle cards would be huge for our partners"]	["Enable 50,000+ channel partners with AI coaching", "White-label platform for your brand", "Embedded in your existing partner portal"]	["Emphasize integration over standalone tools for channel", "Offer white-label to preserve brand experience", "Lead with partner adoption strategies"]	["50,000+ channel partners with inconsistent training", "Partner messaging often off-brand", "Limited visibility into partner sales conversations", "Competitive losses to HP on similar deals", "Partner certification tracking is manual"]	[]	{}	{}	completed	manual	2026-02-23 05:23:54.664	2026-02-23 05:23:54.676135
64bc6d4a-dc3a-435a-baf2-34b82c563802	e35ea7e1-66d4-4e21-ae92-0704991dfca6	2ddc250f-5d0d-446a-965a-b6aed3374d9d	David Chen	IBM	Technology & Consulting	2025-11-28 14:00:00	55	Deep-dive with IBM's consulting sales leadership on complex solution selling challenges. Interest in AI-powered proposal assistance and deal strategy insights.	["Complex solution sales methodology", "Multi-stakeholder deal management", "Proposal automation and assistance", "Consulting engagement optimization", "Cross-sell/upsell identification"]	["Complex deals with 10+ stakeholders", "Proposal creation takes weeks", "Inconsistent solution positioning", "Missed cross-sell opportunities in existing accounts", "Long sales cycles (12-18 months)"]	["Stakeholder mapping and tracking", "AI-powered proposal assistance", "Solution configurator integration", "Account planning capabilities", "Integration with existing CRM"]	["Rev Winner Enterprise with Deal Strategy module", "AI proposal assistant", "Stakeholder influence mapping", "Cross-sell recommendation engine"]	["Gong", "Clari", "Conga"]	[{"outcome": "Interested in customization capabilities", "response": "We train our AI on your solution portfolio and methodology. The system learns your specific language and positioning.", "objection": "Our solutions are too complex for AI to understand"}, {"outcome": "Requested deal strategy demo", "response": "For long cycles, our deal strategy module provides ongoing deal health monitoring and stakeholder engagement tracking throughout the process.", "objection": "18-month sales cycles are our reality - how can you help?"}]	["Demo deal strategy and stakeholder mapping", "Prepare proposal assistant demo", "Share enterprise consulting case studies"]	["Deal strategy module demonstration", "Proposal assistant pilot proposal", "Account planning workshop"]	David: Our sales cycles are incredibly complex - we're talking about deals that can take 18 months with dozens of stakeholders...	178	["If we could cut proposal time from weeks to days, it would free our teams to focus on selling", "Stakeholder mapping is where deals often get lost - we need better visibility", "Cross-sell identification is leaving money on the table with our existing accounts"]	["Navigate complex deals with AI-powered stakeholder mapping", "Reduce proposal time from weeks to days", "Identify cross-sell opportunities in existing accounts"]	["Address solution complexity with customization options", "Emphasize long-cycle deal management capabilities", "Lead with stakeholder visibility benefits"]	["Complex deals with 10+ stakeholders", "Proposal creation takes weeks", "Inconsistent solution positioning", "Missed cross-sell opportunities in existing accounts", "Long sales cycles (12-18 months)"]	[]	{}	{}	completed	manual	2026-02-23 05:23:54.83	2026-02-23 05:23:54.842603
01f728f0-095c-4615-a9d5-ada803be230c	0a07fe1a-7676-4576-b48c-8d77e26c9416	ce7506e3-dffb-4026-b571-7248d239c8a8	Lisa Park	Oracle	Enterprise Software	2025-11-25 11:00:00	45	Initial discovery with Oracle's cloud sales organization. Focus on accelerating cloud adoption messaging and competitive positioning against AWS and Azure.	["Cloud adoption sales enablement", "Competitive messaging against AWS/Azure", "Database to cloud migration positioning", "Enterprise license optimization", "Sales rep productivity"]	["Cloud messaging is inconsistent across teams", "Reps struggle with AWS/Azure competitive objections", "Legacy database customers need cloud migration messaging", "Complex pricing/licensing requires expert positioning", "New cloud products launching faster than training can keep up"]	["Competitive intelligence for AWS and Azure", "Product launch enablement workflows", "Integration with Oracle systems", "Multi-language support for global teams", "Just-in-time learning capabilities"]	["Rev Winner with competitive intelligence module", "Rapid product launch enablement", "Just-in-time coaching for new products", "Oracle systems integration"]	["Gong", "Highspot", "Seismic"]	[{"outcome": "Requested integration roadmap", "response": "We're building native Oracle Cloud integration and can work with your systems. Our API-first architecture allows flexible integration.", "objection": "We need solutions that work with our Oracle systems"}]	["Provide Oracle integration roadmap", "Demo competitive intelligence module", "Share cloud sales case studies"]	["Integration architecture discussion", "Competitive intelligence pilot proposal", "Product launch enablement workshop"]	Lisa: Our cloud business is growing fast, but our sales teams need better support to compete with AWS and Azure...	123	["Our reps need instant access to competitive responses - they can't wait for training updates", "Product launches are outpacing our ability to train the field", "Integration with our Oracle systems is essential"]	["Win against AWS and Azure with real-time competitive intelligence", "Just-in-time coaching for rapid product launches", "Native Oracle Cloud integration"]	["Lead with competitive intelligence for cloud sellers", "Emphasize just-in-time learning for fast-paced environments", "Address integration requirements upfront"]	["Cloud messaging is inconsistent across teams", "Reps struggle with AWS/Azure competitive objections", "Legacy database customers need cloud migration messaging", "Complex pricing/licensing requires expert positioning", "New cloud products launching faster than training can keep up"]	[]	{}	{}	completed	manual	2026-02-23 05:23:54.996	2026-02-23 05:23:55.007982
1a728c30-ca8d-4fb3-b75c-10ed32c9f8af	75ba1f39-e40c-4d5b-9263-a67926d2ea89	badb3a6b-c3b4-4e7c-afad-698034f47149	Rachel Green	Accenture	Consulting	2025-11-20 09:00:00	60	Strategic discussion with Accenture's managed services sales team. Interest in improving managed services deal management and long-term relationship selling.	["Managed services sales optimization", "Long-term contract relationship management", "Value realization tracking", "Renewal optimization", "Executive relationship mapping"]	["Multi-year deals require ongoing relationship management", "Value realization communication is inconsistent", "Renewal conversations start too late", "Executive sponsor changes derail deals", "Cross-practice coordination is challenging"]	["Relationship health monitoring", "Value realization tracking and communication", "Early renewal warning system", "Executive sponsor change alerts", "Cross-practice collaboration tools"]	["Rev Winner Relationship Intelligence module", "Value realization dashboard", "Proactive renewal management", "Executive sponsor tracking"]	["Gainsight", "ChurnZero", "Gong"]	[{"outcome": "Interest in integration architecture", "response": "Rev Winner complements customer success tools by focusing on the sales conversation intelligence that feeds into relationship health. We integrate with Gainsight and similar platforms.", "objection": "We have a customer success platform already"}]	["Demo relationship intelligence module", "Prepare Gainsight integration overview", "Share consulting customer case studies"]	["Relationship intelligence demo", "Customer success integration workshop", "Pilot proposal for managed services team"]	Rachel: Our managed services business relies on long-term relationships, but we struggle to systematically track relationship health...	167	["Renewals shouldn't be a last-minute panic - we need ongoing relationship monitoring", "When executive sponsors change, we often lose the institutional knowledge of the relationship", "Cross-practice coordination is where we lose opportunities"]	["Proactive relationship health monitoring for managed services", "Never miss a renewal with early warning system", "Track executive sponsor changes in real-time"]	["Emphasize relationship management for managed services", "Position as complement to customer success tools", "Lead with renewal optimization benefits"]	["Multi-year deals require ongoing relationship management", "Value realization communication is inconsistent", "Renewal conversations start too late", "Executive sponsor changes derail deals", "Cross-practice coordination is challenging"]	[]	{}	{}	completed	manual	2026-02-23 05:23:55.158	2026-02-23 05:23:55.17072
a3a86881-4a28-4343-bd20-56be381d1637	453269f2-c26e-4196-bcc1-1f324ad9969f	962a65a4-72f1-4a63-895b-c96410e1ef4f	Kevin Zhang	Meta	Technology & Advertising	2025-11-18 15:00:00	40	Discovery with Meta's advertising sales team focused on improving large advertiser relationship management and campaign optimization selling.	["Large advertiser relationship management", "Campaign performance conversation quality", "Upsell and expansion opportunities", "Competitive positioning against Google Ads", "Creative strategy selling"]	["Large advertisers need more strategic conversations", "Campaign performance discussions are reactive", "Missing expansion opportunities in existing accounts", "Competition from Google Ads intensifying", "Creative strategy recommendations inconsistent"]	["Strategic conversation frameworks", "Performance-based coaching prompts", "Expansion opportunity identification", "Competitive messaging for Google Ads", "Creative strategy templates"]	["Rev Winner for Advertising Sales", "Performance conversation intelligence", "Account expansion radar", "Competitive messaging library"]	["Gong", "SalesLoft", "Outreach"]	[{"outcome": "Interest in advertising-specific customization", "response": "We've worked with advertising sales teams and understand the campaign-centric selling model. Our system can be customized for performance-based conversations.", "objection": "Our sales model is unique to advertising - how do you handle that?"}]	["Prepare advertising sales customization proposal", "Demo account expansion features", "Share advertising customer references"]	["Customization workshop for advertising sales", "Pilot proposal for large advertiser team", "Competitive messaging development"]	Kevin: Our large advertiser relationships require a different kind of selling - it's very performance and ROI focused...	98	["Every conversation should be about how we're driving their business results", "We're leaving expansion dollars on the table because we don't identify opportunities early enough", "Google Ads competition is real - we need better competitive messaging"]	["Transform advertising sales with performance-focused AI coaching", "Identify expansion opportunities in every conversation", "Win against Google Ads with real-time competitive intelligence"]	["Customize for advertising-specific sales models", "Emphasize ROI and performance focus", "Lead with expansion opportunity identification"]	["Large advertisers need more strategic conversations", "Campaign performance discussions are reactive", "Missing expansion opportunities in existing accounts", "Competition from Google Ads intensifying", "Creative strategy recommendations inconsistent"]	[]	{}	{}	completed	manual	2026-02-23 05:23:55.322	2026-02-23 05:23:55.334696
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.conversations (id, session_id, user_id, client_name, status, discovery_insights, call_summary, created_at, transcription_started_at, ended_at) FROM stdin;
fb3906e4-e441-43bc-9922-f806ca8ba6fa	marketing-test-baa41e63-ccb4-432b-9ee9-bbd3ce8048c9	fd5a0c4b-c413-4eee-890a-dd1c7254ca45	Sarah Chen	ended	{}	\N	2026-02-23 05:23:53.574	\N	\N
c7edc56b-98d8-4925-91a2-bb9548d39f98	marketing-test-091c829d-9a61-430c-92e7-c509a3eb30fe	fd5a0c4b-c413-4eee-890a-dd1c7254ca45	James Rodriguez	ended	{}	\N	2026-02-23 05:23:53.641	\N	\N
dc91b76e-19d1-4323-871f-ba98a424f9e4	marketing-test-da3202bc-6453-4abd-8069-48f4a5b3f2b7	4e04548e-f4c3-43e2-a394-3c3631bb2a1b	Maria Santos	ended	{}	\N	2026-02-23 05:23:53.807	\N	\N
8465d8be-dd82-4234-9124-8773e32cf99d	marketing-test-c6881e62-e73f-4cff-bf55-89eadcbf06f4	eb0b172e-fba1-4c16-bd9c-f1a121a4ab4d	Robert Kim	ended	{}	\N	2026-02-23 05:23:53.971	\N	\N
87dbedba-507c-4359-a359-d4ebe1c25ef6	marketing-test-46c9c90e-e298-48eb-b601-4da0d7b1a823	6d22f8e3-319c-4ab3-82a3-ba0ab1546068	Dr. Amanda Collins	ended	{}	\N	2026-02-23 05:23:54.134	\N	\N
5c16cd02-96b3-40a5-b683-7ddaad066bc4	marketing-test-cf6d33d5-642f-47ad-8886-d44d12a7ded7	b9d6aed6-54bb-4c9e-aa09-2afe87a5c0b4	Jennifer Wright	ended	{}	\N	2026-02-23 05:23:54.302	\N	\N
ea911deb-4ab9-4bf9-8a36-e7133c52a051	marketing-test-13bedca0-a9f8-490a-9759-702a757d60a8	c1bfea7d-a96b-4f33-8a8e-340400b3bd77	Michael Thompson	ended	{}	\N	2026-02-23 05:23:54.475	\N	\N
de6b165c-603b-44b1-912b-b1117479919b	marketing-test-5db6397c-f29c-47aa-9841-521d1ffa10a4	30fac2ee-dc1d-4166-a200-43f1d97302e8	Patricia Lee	ended	{}	\N	2026-02-23 05:23:54.64	\N	\N
e35ea7e1-66d4-4e21-ae92-0704991dfca6	marketing-test-104301a6-9c9e-40b4-83de-77132b022639	2ddc250f-5d0d-446a-965a-b6aed3374d9d	David Chen	ended	{}	\N	2026-02-23 05:23:54.807	\N	\N
0a07fe1a-7676-4576-b48c-8d77e26c9416	marketing-test-57e64f04-1f91-4780-98ec-cf11d6ef1f92	ce7506e3-dffb-4026-b571-7248d239c8a8	Lisa Park	ended	{}	\N	2026-02-23 05:23:54.971	\N	\N
75ba1f39-e40c-4d5b-9263-a67926d2ea89	marketing-test-86ec0f33-8d1c-46b5-a369-78f2bbe0fa23	badb3a6b-c3b4-4e7c-afad-698034f47149	Rachel Green	ended	{}	\N	2026-02-23 05:23:55.135	\N	\N
453269f2-c26e-4196-bcc1-1f324ad9969f	marketing-test-b9970c07-2bc6-477c-bb18-b5b1c4b3104b	962a65a4-72f1-4a63-895b-c96410e1ef4f	Kevin Zhang	ended	{}	\N	2026-02-23 05:23:55.299	\N	\N
5be9b41e-4c21-499b-81ca-7ac7f1949e73	session_1771824319779_wk8cibb5j	667aa0de-c6cd-49ac-b091-fd6f2e390019	\N	active	{}	\N	2026-02-23 05:25:19.781	\N	\N
b46ac2a9-63cd-4ef2-adb7-a7af85d72c0b	session_1771941739988_uupqhptkd	76cacf03-9e99-4098-b633-7617082f077e	\N	active	{}	\N	2026-02-24 14:02:19.993	\N	\N
cf2c86a6-1764-416c-8c88-67361c569681	session_1771824775562_2axd2nbc3	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	completed	{}	Key challenges: Asset mapping reliability issues with current provider (NinjaOne); Approximately 200 devices not detected during asset mapping; Temporary fixes from current provider instead of permanent solutions; Need for reliable asset mapping that works consistently; Considering migration from current solution within 3 months; Also evaluating backup solutions (currently using Veeam with 32TB devices). Discovery insights: Client: Sandeep from RML; Current solution: NinjaOne; Environment: 1,500 endpoints across 37 clients; Decision makers: Sandeep and consulting vendor (acts as vice president); Evaluation timeline: Considering migration within 3 months; Competitors being evaluated: Datto and ConnectWise; Additional need: Backup solution to complement asset management; Current backup: Veeam with 32TB devices; Primary pain point: Unreliable asset mapping requiring frequent temporary fixes. Objections & responses: Not explicitly raised yet - initial discovery phase; Potential objections to address: Migration complexity, cost comparison, integration with existing systems, proof of asset mapping reliability. Next steps: Schedule detailed demo focusing on asset mapping capabilities; Provide case studies showing reliable asset mapping performance; Arrange technical deep-dive on how asset mapping works in your solution; Prepare comparison matrix vs. NinjaOne, Datto, and ConnectWise; Include backup solution offerings in next presentation; Schedule meeting with both decision makers (Sandeep and consulting vendor); Provide references from clients with similar endpoint scale (1,500+). Recommended solutions: Enterprise asset management platform with reliable mapping technology; Integrated backup solution compatible with existing Veeam environment; Migration services for transitioning from NinjaOne within 3-month timeline; Proof-of-concept deployment to demonstrate asset mapping reliability; Multi-tenant management solution for managing 37 clients efficiently.	2026-02-23 05:32:55.563	2026-02-23 05:46:26.872	2026-02-23 06:03:40.924
63f6814d-4f53-4472-b65e-b783fef8b7e3	session_1771827022823_lnfqqwito	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	active	{}	\N	2026-02-23 06:10:22.823	2026-02-23 06:10:37.13	\N
f062e1df-57ee-499a-95e3-a7bff6768717	session_1771827127217_6oumb64um	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	active	{}	\N	2026-02-23 06:12:07.218	\N	\N
baea65bf-226a-4576-9dec-62e39bb140c2	session_1771880840352_wl5xbwg4c	262a89e3-6dde-4b37-a65f-e800fd316105	\N	active	{}	\N	2026-02-23 21:07:20.353	\N	\N
4361641f-c873-4048-959d-8975e5b66a82	session_1771944794461_1ove8unk9	782bfd26-63f3-4eb9-a91a-380ffafd0bca	\N	active	{}	\N	2026-02-24 14:53:14.466	\N	\N
20bdd2e6-ecd0-4715-8305-7619b37a39f3	session_1771941757018_7w0xqfluz	76cacf03-9e99-4098-b633-7617082f077e	\N	completed	{}	Key challenges: Error generating summary. Next steps: Follow up with client.	2026-02-24 14:02:37.022	2026-02-24 14:03:21.972	2026-02-24 14:04:51.884
ed3a30a6-46ac-4b61-8539-0ecb7bf13f22	session_1771942615668_v7fpw3bz3	76cacf03-9e99-4098-b633-7617082f077e	\N	active	{}	\N	2026-02-24 14:16:55.757	2026-02-24 14:17:36.01	\N
91761f4f-5667-4e60-b5a6-fd5b6760d0bd	session_1771942687039_0f4h2npw0	76cacf03-9e99-4098-b633-7617082f077e	\N	active	{}	\N	2026-02-24 14:18:07.045	\N	\N
8ceef912-5da8-41ce-b13f-40e1cbb969ab	session_1771942847044_wsagh7qeb	6786fa29-edbe-4087-97b5-ea4b77bdb286	\N	active	{}	\N	2026-02-24 14:20:47.047	\N	\N
1f79fe3b-9069-47cf-aec2-c68466bc45eb	session_1771942892226_rgpzs1v47	6786fa29-edbe-4087-97b5-ea4b77bdb286	\N	active	{}	\N	2026-02-24 14:21:32.232	\N	\N
0a5f16aa-9e49-4dc1-94e7-776dfd8a74ea	session_1771943059131_0k0chsdyu	6786fa29-edbe-4087-97b5-ea4b77bdb286	\N	completed	{}	Key challenges: Error generating summary. Next steps: Follow up with client.	2026-02-24 14:24:19.143	2026-02-24 14:24:41.956	2026-02-24 14:25:02.142
ce3b23d3-41d5-4da7-8176-71dd5e0c5d78	session_1771943140891_rv3d0k6kl	6786fa29-edbe-4087-97b5-ea4b77bdb286	\N	active	{}	\N	2026-02-24 14:25:40.902	\N	\N
54b25796-301a-47af-8a8b-1bbb7c64a790	session_1771943267717_sdx79899y	87f0700a-53a9-4909-845a-f79e438f153f	\N	completed	{}	Key challenges: Error generating summary. Next steps: Follow up with client.	2026-02-24 14:27:47.723	2026-02-24 14:28:09.761	2026-02-24 14:31:36.55
51aa62ef-606b-4bb2-b472-178146ac544c	session_1771943703139_nrhr1lf5h	cb64b05a-101b-4055-ae05-00ec49f58fd8	\N	active	{}	\N	2026-02-24 14:35:03.146	2026-02-24 14:35:31.457	\N
906ec10f-a400-4b27-90da-7632a4c8dee5	session_1771944028104_i2g6c2i4e	cb64b05a-101b-4055-ae05-00ec49f58fd8	\N	active	{}	\N	2026-02-24 14:40:28.109	2026-02-24 14:40:45.406	\N
05d0255d-ee12-49bc-83b8-21435ba33a89	session_1771944516428_huxdr7kjw	782bfd26-63f3-4eb9-a91a-380ffafd0bca	\N	completed	{}	Key challenges: Error generating summary. Next steps: Follow up with client.	2026-02-24 14:48:36.433	2026-02-24 14:49:05.552	2026-02-24 14:50:11.799
8145ddfe-d542-4b8a-97c2-9ba646f0bcd3	session_1771944789457_0l9o7cqyx	782bfd26-63f3-4eb9-a91a-380ffafd0bca	\N	active	{}	\N	2026-02-24 14:53:09.462	\N	\N
6ef77389-bd28-47a6-9f81-3c95eb66ebc9	session_1771944800940_uopvi6sfe	782bfd26-63f3-4eb9-a91a-380ffafd0bca	\N	active	{}	\N	2026-02-24 14:53:20.946	\N	\N
c010847e-764b-4079-8d39-0b2443c05af4	session_1771944980849_gysh3wtb2	782bfd26-63f3-4eb9-a91a-380ffafd0bca	\N	active	{}	\N	2026-02-24 14:56:20.857	\N	\N
35a6cdaf-3549-405c-aa08-a42cb7efe7ea	session_1771945128114_bua94vqav	827ed084-6bfa-41e7-8956-b336bc88cf7b	\N	completed	{}	Key challenges: Error generating summary. Next steps: Follow up with client.	2026-02-24 14:58:48.124	2026-02-24 14:59:05.243	2026-02-24 15:02:00.721
bff0ee7e-c66c-46f7-9c54-34230b37abc0	session_1771945824364_7k6c40z61	e68e2d03-b390-4c81-8f11-57e1dbac38b0	\N	active	{}	\N	2026-02-24 15:10:24.376	\N	\N
10105af9-3c13-4731-88ab-b492f34d4d92	session_1771982292632_ujzgu53m4	\N	\N	active	{}	\N	2026-02-25 01:18:12.636	\N	\N
67ac0882-c796-4e5f-beee-a5b65cf89036	session_1771941905772_uov12qsjg	76cacf03-9e99-4098-b633-7617082f077e	\N	active	{}	\N	2026-02-24 14:05:05.79	\N	\N
4c9b6b4d-17af-4a34-a919-4bd03c9be73e	session_1771942682101_9c5slyx6i	76cacf03-9e99-4098-b633-7617082f077e	\N	active	{}	\N	2026-02-24 14:18:02.118	\N	\N
df355c60-9175-4384-8187-2b84da941a38	session_1771942741743_7g9ldpkct	6786fa29-edbe-4087-97b5-ea4b77bdb286	\N	active	{}	\N	2026-02-24 14:19:01.748	2026-02-24 14:19:23.493	\N
398ff223-dfb8-45cc-9998-fe4a1e2f8256	session_1771942857081_ilvk8f39u	6786fa29-edbe-4087-97b5-ea4b77bdb286	\N	active	{}	\N	2026-02-24 14:20:57.085	\N	\N
dc78666e-4aea-40db-8749-9eb18dd36378	session_1771943027327_28un4q3zg	6786fa29-edbe-4087-97b5-ea4b77bdb286	\N	active	{}	\N	2026-02-24 14:23:47.332	\N	\N
48e50603-e936-4c64-8f52-cf47f689c85f	session_1771943116273_t3nq4cno4	6786fa29-edbe-4087-97b5-ea4b77bdb286	\N	completed	{}	Key challenges: Error generating summary. Next steps: Follow up with client.	2026-02-24 14:25:16.302	2026-02-24 14:25:30.243	2026-02-24 14:25:33.423
84d21720-c0d8-4634-be64-20d2ebdc6aee	session_1771880884893_f22zrcpxa	262a89e3-6dde-4b37-a65f-e800fd316105	\N	completed	{}	Key challenges: No specific business challenges identified yet as the conversation has just begun; Client has not yet articulated their pain points or opportunities. Discovery insights: Client initiated contact but hasn't yet shared specific details about their situation; No demographic, firmographic, or situational information gathered so far. Objections & responses: No objections raised yet as the conversation is in the initial greeting phase. Next steps: Schedule a follow-up discovery call to explore client's specific needs; Prepare discovery questions to uncover business challenges and opportunities; Request additional context about the client's industry and current situation. Recommended solutions: Cannot recommend specific solutions until more information is gathered about client needs; Focus initial recommendations on discovery tools and needs assessment frameworks.	2026-02-23 21:08:04.893	2026-02-23 21:09:26.502	2026-02-23 21:10:26.502
fefee3f2-dc60-40ec-aefa-a9b5fe57f191	session_1771943567759_r5n8cr571	87f0700a-53a9-4909-845a-f79e438f153f	\N	active	{}	\N	2026-02-24 14:32:47.768	2026-02-24 14:33:06.07	\N
9c9b9783-2adc-4e8f-bce8-82aec57e2a81	session_1771943870627_m80326szc	cb64b05a-101b-4055-ae05-00ec49f58fd8	\N	active	{}	\N	2026-02-24 14:37:50.634	2026-02-24 14:38:07.588	\N
78823ad1-c099-4a34-a09a-d125514dc3fc	session_1771944697621_tdd8ztl1j	782bfd26-63f3-4eb9-a91a-380ffafd0bca	\N	active	{}	\N	2026-02-24 14:51:37.627	2026-02-24 14:51:53.152	\N
293179f3-4db4-46c1-b12e-7b529344df4f	session_1771944793127_da7iu1fcp	782bfd26-63f3-4eb9-a91a-380ffafd0bca	\N	active	{}	\N	2026-02-24 14:53:13.133	\N	\N
75cff7cc-5ff8-4695-8431-6f72083e445a	session_1771947273929_8aphnifjs	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	active	{}	\N	2026-02-24 15:34:33.934	\N	\N
56c0cac5-8979-4d9a-baf6-9d708b56352d	session_1771944820432_75i1rxkw5	782bfd26-63f3-4eb9-a91a-380ffafd0bca	\N	completed	{}	Key challenges: Error generating summary. Next steps: Follow up with client.	2026-02-24 14:53:40.435	2026-02-24 14:53:57.23	2026-02-24 14:54:34.676
e5bd917c-5f2b-47fa-94d2-29234031731a	session_1771946267249_6tan2fjg3	8528cd51-bf28-464b-9676-cafe71ab87e4	\N	completed	{}	Key challenges: Error generating summary. Next steps: Follow up with client.	2026-02-24 15:17:47.255	2026-02-24 15:18:35.085	2026-02-24 15:20:33.124
72de624f-e4c1-4411-ac82-f261746e1075	session_1771945043366_fa3rvlci5	827ed084-6bfa-41e7-8956-b336bc88cf7b	\N	completed	{}	Key challenges: Error generating summary. Next steps: Follow up with client.	2026-02-24 14:57:23.371	2026-02-24 14:57:53.516	2026-02-24 14:58:08.148
548556bb-e428-4a61-bdf0-38d5ae758542	session_1771945429168_c7qbl39uc	827ed084-6bfa-41e7-8956-b336bc88cf7b	\N	active	{}	\N	2026-02-24 15:03:49.176	2026-02-24 15:04:42.799	\N
c00defeb-e9e6-4e65-b7fa-4d69cad576f8	session_1771945585027_btetucgie	e68e2d03-b390-4c81-8f11-57e1dbac38b0	\N	completed	{}	Key challenges: Error generating summary. Next steps: Follow up with client.	2026-02-24 15:06:25.034	2026-02-24 15:07:48.105	2026-02-24 15:10:27.235
d2f751bb-c9b9-4196-85b3-3d4759d79ef9	session_1771945849549_j8wkqzy9r	e68e2d03-b390-4c81-8f11-57e1dbac38b0	\N	active	{}	\N	2026-02-24 15:10:49.559	\N	\N
85da4ee1-80f4-4fe9-bc61-0be0911ce566	session_1771945938148_s79jn8x8d	e68e2d03-b390-4c81-8f11-57e1dbac38b0	\N	active	{}	\N	2026-02-24 15:12:18.152	\N	\N
f586fa5d-2177-4b6c-bfc0-bd1bcba21690	session_1771945984602_k8eqoyfgl	e68e2d03-b390-4c81-8f11-57e1dbac38b0	\N	active	{}	\N	2026-02-24 15:13:04.607	\N	\N
f2b70160-065b-4c12-902f-49339b4bb63c	session_1771946027186_wg71bv0rp	e68e2d03-b390-4c81-8f11-57e1dbac38b0	\N	active	{}	\N	2026-02-24 15:13:47.207	\N	\N
dd90f621-b18b-4ee3-a2bc-cef26edad024	session_1771946166456_nr6vsbgxv	e68e2d03-b390-4c81-8f11-57e1dbac38b0	\N	active	{}	\N	2026-02-24 15:16:06.47	\N	\N
cc91e810-bef4-4217-9d28-169976e6da5d	session_1771946256292_5vg93pwjg	8528cd51-bf28-464b-9676-cafe71ab87e4	\N	active	{}	\N	2026-02-24 15:17:36.296	\N	\N
bab63ff6-cdc5-4216-988b-bc586652c4d9	session_1771946434732_w3c3qb5gs	8528cd51-bf28-464b-9676-cafe71ab87e4	\N	active	{}	\N	2026-02-24 15:20:34.745	\N	\N
ecfcf0d0-c5e0-4f2a-9f63-cbb3d29469c5	session_1771946568748_lei8wegjl	8528cd51-bf28-464b-9676-cafe71ab87e4	\N	active	{}	\N	2026-02-24 15:22:48.759	2026-02-24 15:23:54.428	\N
4f46ac75-e032-4146-bac0-91c7e80d9913	session_1771946907853_v885bcjsw	8528cd51-bf28-464b-9676-cafe71ab87e4	\N	active	{}	\N	2026-02-24 15:28:27.868	\N	\N
2db73666-4750-4e91-b55a-706c4f600012	session_1771946940522_b0kaetapq	8528cd51-bf28-464b-9676-cafe71ab87e4	\N	active	{}	\N	2026-02-24 15:29:00.535	\N	\N
6d29773d-c811-47f3-bc3d-0ae9054800b3	session_1771947020807_8bqmilsia	8528cd51-bf28-464b-9676-cafe71ab87e4	\N	active	{}	\N	2026-02-24 15:30:20.813	\N	\N
54af89e0-3442-4c45-ab7a-15cf17acb283	session_1771947226942_qufi9ylk0	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	active	{}	\N	2026-02-24 15:33:46.948	\N	\N
b74d4e29-7e2c-4d97-86c3-48848431b2aa	session_1771947269186_9u5nstt8z	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	active	{}	\N	2026-02-24 15:34:29.192	\N	\N
e18aae1f-f389-4198-bc8a-e60a067dbba3	session_1771947321221_tuz11va8z	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	active	{}	\N	2026-02-24 15:35:21.226	\N	\N
ce283b9c-4e61-4c32-bf03-e1bbfd410652	session_1771947738979_vrifxq4qo	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	active	{}	\N	2026-02-24 15:42:18.983	\N	\N
0c912445-b906-4845-8a2d-75d601a7a4a1	session_1771947637849_gtdv147ke	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	active	{}	\N	2026-02-24 15:40:37.852	\N	\N
c4f38ad4-c3d9-45d2-a18e-8582846b146e	session_1771881785259_dx24yo6w5	262a89e3-6dde-4b37-a65f-e800fd316105	\N	active	{}	\N	2026-02-23 21:23:05.259	\N	\N
c5926e58-1c60-4a2e-94df-2805981290c1	session_1771881804120_tcmbugka5	262a89e3-6dde-4b37-a65f-e800fd316105	\N	active	{}	\N	2026-02-23 21:23:24.121	\N	\N
76b70cb9-18b7-4559-8c02-86a79a638137	session_1771881815931_805kwuuyj	262a89e3-6dde-4b37-a65f-e800fd316105	\N	active	{}	\N	2026-02-23 21:23:35.932	\N	\N
a0c974e2-fa95-4f9e-bbc6-0d64b195bd0d	session_1771881824644_viehztsuo	262a89e3-6dde-4b37-a65f-e800fd316105	\N	active	{}	\N	2026-02-23 21:23:44.645	\N	\N
82d8fede-6f36-4ef8-a79e-0245c7c6512e	session_1771947755618_m2v7lfhro	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	active	{}	\N	2026-02-24 15:42:35.621	\N	\N
9cebd895-9246-4f16-9350-a155e1f7c7d7	session_1771947851404_fr798fyxu	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	active	{}	\N	2026-02-24 15:44:11.412	2026-02-24 15:44:48.701	\N
574087f0-eb3a-48ea-bb39-723c70b2aee5	session_1771948039069_hfgt3a48s	0bbf93eb-18b0-473d-8716-ff861b523068	\N	active	{}	\N	2026-02-24 15:47:19.075	\N	\N
6ba03c92-c041-4feb-8467-6fe2851640d7	session_1771947553269_mzj3tzaqd	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	completed	{}	Key challenges: The user appears to be struggling with understanding or explaining fundamental concepts of number systems, specifically the relationship between decimal and binary systems, and the representation of characters or numbers within these systems.. Discovery insights: The user is focused on numerical representation systems, particularly binary (base-2) and decimal (base-10). They are exploring how characters or numbers are represented, mentioning concepts like counting (1, 2, 3, 4, 5 in base-10), binary digits (0 and 1, where 0 is 'off' and 1 is 'on'), and the uniqueness of characters in these systems. Their statements suggest they may be working with data encoding, computer science fundamentals, or digital systems where binary representation is crucial.. Objections & responses: No explicit objections were raised in the conversation. The user's responses were fragmented and conceptual, indicating they might be in an exploratory or learning phase rather than raising objections to a specific solution.. Next steps: Schedule a follow-up call to clarify the user's specific use case or project involving binary and decimal systems. Prepare to discuss practical applications, such as data encoding, computer programming, or digital communication, and ask targeted questions to understand their goals, such as 'Are you working on a software project, educational material, or hardware design that requires understanding binary representation?'. Recommended solutions: Based on the conversation, propose educational resources or tools related to number systems, such as online courses on binary mathematics, software for binary-decimal conversion, or consulting services for implementing binary logic in projects. If applicable, suggest products like programming guides, data encoding software, or hardware components that utilize binary systems, tailored to the user's clarified needs from the follow-up..	2026-02-24 15:39:13.28	2026-02-24 15:39:46.429	2026-02-24 15:40:48.574
1ec39f55-ccea-4408-8fe9-389178073002	session_1771948111117_setqbts0i	0bbf93eb-18b0-473d-8716-ff861b523068	\N	active	{}	\N	2026-02-24 15:48:31.122	\N	\N
f13210b2-d7ae-45f6-9ed6-c8359bd935a5	session_1771948192431_rl246usyv	0bbf93eb-18b0-473d-8716-ff861b523068	\N	active	{}	\N	2026-02-24 15:49:52.439	\N	\N
4080d3b6-0039-4c8e-8e66-4debf7b5edef	session_1771948228083_3zvxn9dep	0bbf93eb-18b0-473d-8716-ff861b523068	\N	active	{}	\N	2026-02-24 15:50:28.087	\N	\N
7015aef4-0c7b-456b-8ea3-d63761f2ee96	session_1771949000227_gg7lha1cc	0bbf93eb-18b0-473d-8716-ff861b523068	\N	active	{}	\N	2026-02-24 16:03:20.239	\N	\N
adfc3d09-65bf-4550-867d-a09401af7292	session_1771949003897_pefacmlcs	0bbf93eb-18b0-473d-8716-ff861b523068	\N	active	{}	\N	2026-02-24 16:03:23.933	\N	\N
38a40ebd-9f37-4907-9b1a-4928d85b82af	session_1771949100478_fvjtfnm7g	c82bdfb4-7184-455b-b48b-c03bdc9b904d	\N	active	{}	\N	2026-02-24 16:05:00.482	\N	\N
441bc1f4-740e-475d-adb0-6b3562bed1c6	session_1771949301336_i2ksguitp	c82bdfb4-7184-455b-b48b-c03bdc9b904d	\N	active	{}	\N	2026-02-24 16:08:21.343	\N	\N
e5285e2e-4fe7-470f-a780-7a43caf7a1f1	session_1771949369513_cui45l6ko	c82bdfb4-7184-455b-b48b-c03bdc9b904d	\N	active	{}	\N	2026-02-24 16:09:29.523	\N	\N
8f1de13a-649e-4581-967c-38a8456fa2ce	session_1771949417878_cn3mwi5es	c82bdfb4-7184-455b-b48b-c03bdc9b904d	\N	active	{}	\N	2026-02-24 16:10:17.881	\N	\N
b4d2c809-442a-43dd-a5ab-043737559748	session_1771949502488_g2b6xo3s7	c82bdfb4-7184-455b-b48b-c03bdc9b904d	\N	active	{}	\N	2026-02-24 16:11:42.491	\N	\N
a07b1fb8-710d-4f85-87a2-99b26969e854	session_1771949626096_8buh7l6ry	c82bdfb4-7184-455b-b48b-c03bdc9b904d	\N	active	{}	\N	2026-02-24 16:13:46.105	\N	\N
af6add19-447b-4290-927e-56ae0483ede0	session_1771949667817_1v00bge7b	4d6a0432-1e08-4c01-ad9c-42e035f71a87	\N	active	{}	\N	2026-02-24 16:14:27.821	\N	\N
c21fdb16-ed43-436c-b768-86daeee66740	session_1771949815301_47rsh3rdm	4d6a0432-1e08-4c01-ad9c-42e035f71a87	\N	active	{}	\N	2026-02-24 16:16:55.306	\N	\N
dcfb8afc-5725-4ffe-abb0-20e03ed64f41	session_1771949862742_1p84bkpaj	4d6a0432-1e08-4c01-ad9c-42e035f71a87	\N	active	{}	\N	2026-02-24 16:17:42.762	\N	\N
5eecc24a-111b-4fd6-ae2c-e5af5ff19aa0	session_1771949888152_bu0qs46nv	4d6a0432-1e08-4c01-ad9c-42e035f71a87	\N	active	{}	\N	2026-02-24 16:18:08.155	\N	\N
edf2b8a7-fea3-4593-8418-4f83443a4627	session_1771949900072_ca276o5xx	4d6a0432-1e08-4c01-ad9c-42e035f71a87	\N	active	{}	\N	2026-02-24 16:18:20.075	\N	\N
aa5f52c2-d779-4be4-b07d-d525109d3bc3	session_1771950138072_69x8ca9h9	4d6a0432-1e08-4c01-ad9c-42e035f71a87	\N	active	{}	\N	2026-02-24 16:22:18.082	\N	\N
9f264589-8743-451a-9123-b5bd8c9db949	session_1771950380384_vtsgt6jig	4d6a0432-1e08-4c01-ad9c-42e035f71a87	\N	active	{}	\N	2026-02-24 16:26:20.395	\N	\N
cf35aae7-8fbc-4cd2-9307-13feb1073596	session_1771950415204_k8ccufyr9	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	\N	active	{}	\N	2026-02-24 16:26:55.208	\N	\N
1dc2e979-6a2b-4a5e-8199-8976c4afdcd5	session_1771950569125_78i41mmhu	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	\N	active	{}	\N	2026-02-24 16:29:29.126	\N	\N
364b7149-d760-4751-9d8c-f140f33edee6	session_1771950747060_wxrds45b1	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	\N	active	{}	\N	2026-02-24 16:32:27.068	\N	\N
c2953fa0-88a6-4533-8375-476f578a0cac	session_1771950785323_40fggyh5i	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	\N	active	{}	\N	2026-02-24 16:33:05.332	\N	\N
473adac1-9992-42c2-ab7c-3fed2b68e95d	session_1771951067854_cwg2pef8c	acfaf022-ca19-4d8d-a1a0-c30160a675cc	\N	active	{}	\N	2026-02-24 16:37:47.864	\N	\N
2b1207a6-b36c-4fe8-a31d-bb6d2e1b513b	session_1771951232323_v347gmj86	acfaf022-ca19-4d8d-a1a0-c30160a675cc	\N	active	{}	\N	2026-02-24 16:40:32.331	\N	\N
e1a014e2-448e-4efc-992b-f45e5843bffc	session_1771951260561_jtakuwk2d	acfaf022-ca19-4d8d-a1a0-c30160a675cc	\N	active	{}	\N	2026-02-24 16:41:00.57	\N	\N
16f540e0-d256-4411-ae90-2d8184869167	session_1771951428883_8xh2ezhed	acfaf022-ca19-4d8d-a1a0-c30160a675cc	\N	active	{}	\N	2026-02-24 16:43:48.892	\N	\N
b4489028-8d07-4be6-858b-c065e0d03993	session_1771951483751_7v9f3lrpx	07911237-2594-463c-bb5d-65ac53b9a9a7	\N	active	{}	\N	2026-02-24 16:44:43.755	\N	\N
531b79db-253c-4f84-9a5f-8532ac86f857	session_1771951566064_ghgf6z3s9	07911237-2594-463c-bb5d-65ac53b9a9a7	\N	active	{}	\N	2026-02-24 16:46:06.065	\N	\N
9f37ae75-c0b2-4700-b576-8c384e1dfff5	session_1771951648143_djh4ohdd9	07911237-2594-463c-bb5d-65ac53b9a9a7	\N	completed	{}	Next steps: Continue the discovery call by asking about the client's specific challenges or opportunities to gather initial insights..	2026-02-24 16:47:28.152	\N	2026-02-24 16:50:01.057
ee8239f1-6d6d-41e9-a487-45c426875083	session_1771951869418_tjwezdkdk	07911237-2594-463c-bb5d-65ac53b9a9a7	\N	active	{}	\N	2026-02-24 16:51:09.425	\N	\N
5f8be309-5986-4f3b-a1ec-d3586206c6e7	session_1771951896054_bhbsh1sj1	07911237-2594-463c-bb5d-65ac53b9a9a7	\N	active	{}	\N	2026-02-24 16:51:36.055	\N	\N
578affeb-1dce-4207-9393-e27004d71706	session_1771951907064_qkg3gb491	07911237-2594-463c-bb5d-65ac53b9a9a7	\N	active	{}	\N	2026-02-24 16:51:47.067	\N	\N
d0c226c0-fb21-431e-a564-c55631c99203	session_1771951912144_harru8vgb	07911237-2594-463c-bb5d-65ac53b9a9a7	\N	active	{}	\N	2026-02-24 16:51:52.148	\N	\N
27b7a9a1-111c-49b5-aa21-b054492451e4	session_1771951918145_auoi6dzw8	07911237-2594-463c-bb5d-65ac53b9a9a7	\N	active	{}	\N	2026-02-24 16:51:58.149	\N	\N
33693abb-1974-42c0-9708-6cb4fe751cdb	session_1771951931040_tun9f1bha	07911237-2594-463c-bb5d-65ac53b9a9a7	\N	active	{}	\N	2026-02-24 16:52:11.045	\N	\N
bf638377-45e5-464c-acb7-75e23e7d2560	session_1771952043044_x10vztnah	87fd5820-718b-4c0d-9e22-bf284e65fcb6	\N	completed	{}	Key challenges: No specific challenges identified yet as the conversation has just begun with the assistant's opening question.. Discovery insights: The client has not yet responded to the initial discovery question, so no insights have been gathered about their needs, challenges, or opportunities.. Objections & responses: No objections have been raised as the conversation is in its initial stage.. Next steps: Wait for the client's response to the opening question to proceed with discovery.; If no response is received, follow up to re-engage the client and gather initial information about their business context.. Recommended solutions: No solutions can be recommended yet without understanding the client's challenges or needs. Focus on gathering more information through follow-up questions..	2026-02-24 16:54:03.048	\N	2026-02-24 16:54:32.28
e50a6d84-7fd2-4814-9851-5ca5b349d892	session_1771952104720_75jz187k5	87fd5820-718b-4c0d-9e22-bf284e65fcb6	\N	active	{}	\N	2026-02-24 16:55:04.724	\N	\N
c0eacef4-6fc1-4d4c-afcf-9a7e99168c83	session_1771952139855_oh5rvegdh	87fd5820-718b-4c0d-9e22-bf284e65fcb6	\N	active	{}	\N	2026-02-24 16:55:39.861	\N	\N
d305fec0-6c0e-4df3-9ed6-749bcbbcd961	session_1771953554190_n91k8u3zi	87fd5820-718b-4c0d-9e22-bf284e65fcb6	\N	active	{}	\N	2026-02-24 17:19:14.2	\N	\N
7e340c5f-d827-441e-8e92-47a30a597d8b	session_1771982478093_x5w33jq0i	\N	\N	active	{}	\N	2026-02-25 01:21:18.093	\N	\N
f4b1e49b-5f7d-4f48-94c9-6a570b93e902	session_1771997398088_eiohr0kyi	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	active	{}	\N	2026-02-25 05:29:58.09	\N	\N
816576c9-548c-4b6e-9d90-55e7a332154f	session_1771997824880_ycwbf5z0r	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	active	{}	\N	2026-02-25 05:37:04.88	\N	\N
27262233-51c6-4309-894c-8a6382bec70c	session_1771997848711_0xwvhlon5	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	active	{}	\N	2026-02-25 05:37:28.711	\N	\N
43881d93-47d2-4a45-b435-4e5ba3b0962d	session_1772000174200_taclpdlbs	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	active	{}	\N	2026-02-25 06:16:14.201	\N	\N
fc7754b2-5c24-47fb-a0bd-c10883d6de3c	session_1772043410492_w2loxvj71	262a89e3-6dde-4b37-a65f-e800fd316105	\N	active	{}	\N	2026-02-25 18:16:50.493	2026-02-25 18:17:22.294	\N
feca82e8-c5ed-4575-9b53-93cb4de7b640	session_1772044356149_hqfhkzlfs	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	active	{}	\N	2026-02-25 18:32:36.155	\N	\N
0a963761-8280-418c-ab8f-ba6b739e5cec	session_1772044397222_wzktqidut	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	active	{}	\N	2026-02-25 18:33:17.243	\N	\N
f428c0a9-deb2-455b-9673-0602df401672	session_1772044428349_3ufivnsft	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	active	{}	\N	2026-02-25 18:33:48.352	\N	\N
fd18faf3-fcf8-4f9b-9fe8-02924c39b26a	session_1772044434354_na7905e6g	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	active	{}	\N	2026-02-25 18:33:54.355	\N	\N
9186a495-44bb-41f2-8753-ac32589b9dc3	session_1772044437141_smfghzdb7	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	active	{}	\N	2026-02-25 18:33:57.142	\N	\N
00d1e53c-2dfb-48ce-8226-9a48abb52f01	session_1772045559499_884tccxuy	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	active	{}	\N	2026-02-25 18:52:39.502	\N	\N
121c9a95-e644-4396-b489-b91817697880	session_1772044445765_xsbv2ezs8	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	completed	{}	Key challenges: Email marketing platform limitations in audience targeting beyond customers; Inconsistent branding across email and social media channels; Inefficient email campaign creation process requiring repetitive work; Lack of dynamic content personalization in email campaigns. Discovery insights: Client is exploring expanded email marketing capabilities beyond traditional customer communications; Client wants to integrate social media presence directly into email campaigns; Client seeks to streamline email creation through reusable templates and components; Client needs conditional content display for targeted messaging based on recipient criteria; Client values consistency between website and email marketing elements. Objections & responses: No objections were raised during this initial discovery phase. Next steps: Schedule follow-up call to discuss specific use cases for employee/supplier email campaigns; Request examples of current email templates to assess customization needs; Demonstrate conditional content features with real campaign scenarios; Explore integration requirements with existing social media platforms. Recommended solutions: Advanced email marketing platform with multi-audience segmentation capabilities; Social media integration tools for email campaigns; Template library with reusable block components; Conditional content engine for dynamic email personalization; Cross-platform branding consistency tools.	2026-02-25 18:34:05.787	2026-02-25 18:34:23.576	2026-02-25 18:34:59.037
691f790e-38ff-40c3-b09f-a6c755e301e9	session_1772044614782_ds6y86h2o	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	active	{}	\N	2026-02-25 18:36:54.784	\N	\N
94ab7011-2f8e-48ab-ae45-feb3abaf0a80	session_1772044622471_z8b9qarrk	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	active	{}	\N	2026-02-25 18:37:02.475	\N	\N
e8e20ace-9190-4cae-b336-36253e1c9b62	session_1772046610185_tuda9e9yd	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	completed	{}	Key challenges: Manual order processing inefficiencies; Time-consuming customer setup for deliveries; Complex scheduling and preparation coordination; Limited staff permissions for sensitive operations. Discovery insights: Client uses presets to streamline takeout orders, saving significant time; Delivery operations involve multiple platforms (Takeaway, Kareem, Grubhub, Deliveroo, etc.); Kitchen workflow requires sequential preparation (appetizers before main courses); Staff have restricted permissions for financial operations (POS sessions, cash handling, discounts). Objections & responses: No explicit objections raised during this conversation. Next steps: Schedule follow-up to discuss specific pain points with current system; Request details about current order volume and peak times; Demonstrate how Odoo can further automate preset creation and delivery integrations; Explore permission management requirements for different staff roles. Recommended solutions: Odoo POS with preset order configurations; Odoo Delivery integration for multi-platform management; Odoo Inventory for kitchen workflow optimization; Odoo User Access Controls for staff permission management.	2026-02-25 19:10:10.211	2026-02-25 19:10:25.923	2026-02-25 19:11:48.432
a92f566d-1be2-44b8-80e8-23dd796fd134	session_1772044973711_iogtyerol	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	active	{}	\N	2026-02-25 18:42:53.75	\N	\N
bf7a407c-9acd-4516-acf8-9dd3e96f9405	session_1772044867853_rf7cippe8	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	completed	{}	Key challenges: Manual document organization and retrieval; Inefficient email attachment handling and conversion; Limited file format compatibility for previewing; Complex report generation and signing processes; Difficulty in showcasing specific accounting results. Discovery insights: Client values automated document organization by type (e.g., insurance documents); Prefers automatic activity creation for assignees based on document type; Needs automated email-to-PDF conversion for receipts/invoices in email bodies; Requires ability to preview multiple file types (HTML, PDF, TXT, XML) without external software; Wants quick document actions (share, download, rename) with minimal clicks; Seeks streamlined report generation with dynamic legal text options; Needs collaborative signing capabilities for reports with flexible field addition; Desires comprehensive accounting reporting with customizable result showcasing. Objections & responses: No objections raised during this conversation. Next steps: Schedule demonstration of document management automation features; Showcase email-to-PDF conversion workflow in real-time; Present reporting module with dynamic text and signing capabilities; Discuss integration options with existing systems; Provide case studies of similar insurance industry implementations. Recommended solutions: Odoo Documents for automated organization and file previewing; Odoo Email Integration for automatic PDF conversion from emails; Odoo Reporting with dynamic legal text templates; Odoo Electronic Signature for collaborative document signing; Odoo Accounting Reports with customizable result presentation.	2026-02-25 18:41:07.858	2026-02-25 18:41:26.945	2026-02-25 18:42:59.659
4f70c9b7-0b61-4fc9-960a-a13fd55619fe	session_1772045337577_v69phfouf	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	active	{}	\N	2026-02-25 18:48:57.583	\N	\N
914bb773-5575-4855-85f6-4d4dd59b5206	session_1772045345159_9booxhhrc	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	active	{}	\N	2026-02-25 18:49:05.163	\N	\N
ac774953-ff1d-4a2f-954f-ec8f804ad97e	session_1772045404240_dtowhjpso	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	active	{}	\N	2026-02-25 18:50:04.243	\N	\N
ea1ad94f-2510-4d83-812c-1b77750eb020	session_1772045440919_nguu3ayvt	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	completed	{}	Key challenges: Manual transaction review requiring accountant oversight; Incorrect bank statement balances from OCR processing; Complex tax mapping configurations; Inefficient payment follow-up processes; Cumbersome document signing workflows. Discovery insights: User relies on descriptive account selection due to non-accountant background; Requires accountant review capability with tracking functionality; Needs manual correction capability for OCR errors in bank statements; Prefers simplified tax mapping directly within tax records; Values multi-channel payment reminders including WhatsApp; Prioritizes streamlined document signing with bulk upload capability; Appreciates time-saving features like copy-paste functionality in forms. Objections & responses: None explicitly raised in this conversation. Next steps: Schedule demonstration of accountant review workflow with tracking features; Showcase OCR correction capabilities for bank statements; Present tax mapping simplification features; Demonstrate multi-channel payment reminder system; Provide hands-on walkthrough of document signing interface with bulk upload. Recommended solutions: Automated transaction categorization with accountant review workflow; OCR correction tools for financial document processing; Simplified tax configuration module; Multi-channel payment reminder system (including WhatsApp integration); Streamlined document signing platform with bulk processing capabilities.	2026-02-25 18:50:40.924	2026-02-25 18:51:10.642	2026-02-25 18:52:45.832
a17d704a-784f-4ea2-89c2-f663b1e2642e	session_1772045567924_0bzd6pd05	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	active	{}	\N	2026-02-25 18:52:47.931	\N	\N
ca3e60ef-da5d-4dd7-90cf-25753ef16cc9	session_1772045583082_50rqlr2tm	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	active	{}	\N	2026-02-25 18:53:03.083	\N	\N
21cdfa9b-b581-4e7b-b46b-753edeae5f6b	session_1772045626548_mxnlysard	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	active	{}	\N	2026-02-25 18:53:46.552	\N	\N
82ef5cc1-4820-4763-8e8b-cadb756ede9d	session_1772045685102_1l6695285	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	active	{}	\N	2026-02-25 18:54:45.107	2026-02-25 18:54:58.506	\N
a47094ad-1994-4ce9-90d6-513bcb5e39d4	session_1772136825647_f3a4rkl7n	4749b239-bcef-433c-a4b2-f984ec3a47e9	\N	active	{}	\N	2026-02-26 20:13:45.65	\N	\N
cd4ebce3-2a9f-4ea8-861b-6f143ca366ec	session_1772045871567_si74eo92l	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	active	{}	\N	2026-02-25 18:57:51.571	\N	\N
5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	session_1772045739428_9v8mak4gd	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	completed	{}	Key challenges: Manual content creation and translation processes consuming valuable time; Difficulty managing live chat conversations efficiently without overwhelming staff; Complex inventory and purchase management requiring manual tracking and coordination; Need for multi-platform product visibility across social media and marketplaces. Discovery insights: Client sells furniture/sofas with wood customization options; Client heavily relies on digital marketing through Google, social platforms, and marketplaces; Client values automation for content generation and translation; Client needs efficient live chat management with operator expertise matching and conversation limits; Client requires comprehensive purchase and inventory management tools with predictive ordering; Client prioritizes customer experience through clear product visualization and accessible communication. Objections & responses: No direct objections raised during this initial discovery phase. Next steps: Schedule follow-up demo focusing on AI content generation capabilities; Present live chat management features with operator expertise routing; Showcase purchase dashboard functionality including RFQ tracking and supplier performance metrics; Discuss integration options for multi-platform catalog management; Provide case studies of similar furniture retailers using the platform. Recommended solutions: AI-powered content generation and translation tools; Intelligent live chat system with operator expertise matching and conversation limits; Comprehensive purchase management dashboard with predictive ordering; Multi-platform catalog synchronization for social media and marketplaces; Inventory management system with real-time stock updates and supplier performance tracking.	2026-02-25 18:55:39.431	2026-02-25 18:55:58.62	2026-02-25 18:57:59.027
a0069ef5-16c3-4779-b9d2-dfd4feef0302	session_1772045884381_3qez8mqlq	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	active	{}	\N	2026-02-25 18:58:04.384	\N	\N
e6326623-36b1-4c40-a7d6-37043358e8f5	session_1772045889912_qstgt7rvg	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	active	{}	\N	2026-02-25 18:58:09.916	\N	\N
2e9c90b8-48bd-4570-9883-1e20cee4622f	session_1772045893148_kee5bolc5	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	active	{}	\N	2026-02-25 18:58:13.151	\N	\N
a7706383-3826-40c2-b204-9869ac2e6b9a	session_1772045912032_z4orsq6do	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	active	{}	\N	2026-02-25 18:58:32.035	\N	\N
1c58278f-d830-4810-b510-110be745aff3	session_1772045944347_ezy1w0va7	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	active	{}	\N	2026-02-25 18:59:04.351	\N	\N
154a70e5-1be5-4397-b2f2-23adcbeb8b19	session_1772045956459_g6jr24lni	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	active	{}	\N	2026-02-25 18:59:16.463	\N	\N
db734d5f-94a3-4331-b0d2-1f22e04ee1cb	session_1772046125202_k4auxgg1z	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	active	{}	\N	2026-02-25 19:02:05.203	\N	\N
e0939882-dad2-4bd4-8d73-d61cd109c341	session_1772046145919_abr4cv3a5	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	active	{}	\N	2026-02-25 19:02:25.92	\N	\N
cb8642f8-3c37-4e17-b697-68d12ab8845a	session_1772046153437_lqbh7kiq3	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	active	{}	\N	2026-02-25 19:02:33.461	\N	\N
b7500bbe-15e4-4df0-9ccc-80c4c970b414	session_1772046159861_710jtdwle	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	active	{}	\N	2026-02-25 19:02:39.866	\N	\N
17054413-9cf2-4d63-8a17-6edf87264af4	session_1772046164818_iu0tpzfrg	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	active	{}	\N	2026-02-25 19:02:44.82	\N	\N
5383df42-fad8-45e2-a771-2a9398b02281	session_1772046580702_v1dfrugh3	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:09:40.706	\N	\N
4ca1d79c-56d6-4177-a59f-5e8cf6d3a462	session_1772046771868_3rjue5iqb	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:12:51.871	\N	\N
8eef9221-1419-4d2f-8c24-45558da7c113	session_1772046729921_m1399xirv	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	completed	{}	Key challenges: Manual booking process requiring phone calls and staff coordination; Limited automation in order and payment processing; Potential inefficiencies in managing table reservations and combo orders. Discovery insights: Client operates a restaurant or dining establishment with combo meal offerings; Currently handles table bookings via phone with basic information collection (name, date, time, party size); Has a system for online payment and order customization for combo meals with free item options; Provides digital receipt access to customers; Desires streamlined customer experience from booking to payment to order fulfillment. Objections & responses: No objections raised during this initial discovery phase. Next steps: Schedule follow-up call to discuss current technology stack and pain points in detail; Request sample booking data to understand volume and patterns; Demonstrate automated booking and order management solutions; Discuss integration possibilities with existing payment system. Recommended solutions: Automated table reservation system with online booking portal; Integrated POS system with combo meal customization and free item management; Customer relationship management (CRM) tool for booking history and preferences; Mobile app or web platform for end-to-end customer journey (booking, ordering, payment, receipts).	2026-02-25 19:12:09.93	2026-02-25 19:12:25.456	2026-02-25 19:12:54.923
1430a0d3-0695-4981-a64f-3a0cf6b7d65c	session_1772136884916_fxyivz0bq	76cacf03-9e99-4098-b633-7617082f077e	\N	active	{}	\N	2026-02-26 20:14:44.918	\N	\N
c7ab08ab-5539-4233-af8f-d2a8c02e0ee9	session_1772046931546_c8p0bo7e8	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:15:31.555	\N	\N
1676231b-ce00-4651-920a-470228903ead	session_1772046897402_s12de9u0i	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	completed	{}	Key challenges: The client's current process for tracking carbon footprint across all purchases is manual and time-consuming, requiring constant updates to maintain accuracy.. Discovery insights: The client tracks carbon footprint for all purchases, indicating a strong commitment to sustainability. They maintain an always-up-to-date carbon footprint, suggesting they prioritize real-time or frequent updates. This implies a need for automated, scalable solutions to handle continuous data input and calculation.. Objections & responses: No objections were raised during this brief interaction. The client simply stated their current practice without expressing concerns or resistance.. Next steps: Schedule a follow-up call to explore the specifics of their current carbon tracking process, including tools used, data sources, and pain points. Request details on purchase volume, frequency, and reporting requirements to assess scalability needs. Discuss potential inefficiencies or gaps in their manual approach.. Recommended solutions: Propose an automated carbon footprint tracking software that integrates with their procurement systems to streamline data collection and calculation. Suggest a platform with real-time updates and reporting dashboards to replace their manual process. Offer a solution with API connectivity for seamless purchase data ingestion and automated footprint updates..	2026-02-25 19:14:57.404	2026-02-25 19:15:18.21	2026-02-25 19:15:32.59
c9427942-2710-4110-aca4-ff1f782efb17	session_1772046937581_yrjwsntsh	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:15:37.585	\N	\N
dc540ffc-b7eb-43fb-a303-02d963a9d58a	session_1772046945928_72u0m1dnl	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:15:45.933	\N	\N
08443cb5-af2b-46de-bdc7-0da15013e76d	session_1772046953899_6tlyenk9a	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:15:53.923	\N	\N
36749878-ddf7-43e2-8149-e5115543b7b8	session_1772046957488_fthx52bph	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:15:57.494	\N	\N
85dbe640-0d40-431b-920e-f0603c4e0461	session_1772046965372_uz9tjqn1i	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:16:05.375	\N	\N
2d130594-3f7d-4cad-81ef-993a7d0cfcfb	session_1772046967728_mdfkypdpr	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:16:07.741	\N	\N
3a3f09c6-bd15-408b-b9cd-54c791de8efd	session_1772046974320_b930c543n	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:16:14.322	\N	\N
8ad81539-275b-4224-8cbf-464e50a1f612	session_1772046984706_hecjw51m7	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:16:24.707	\N	\N
ade60ab0-c63e-4fdc-b9aa-0535535acf12	session_1772046991453_jbbqpe09t	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:16:31.455	\N	\N
0dee2176-d7b8-4a0c-82a2-43001b4e89c5	session_1772046997771_ui81xr6y9	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:16:37.773	\N	\N
b4e40507-46f7-4e67-b768-fb1523e3fd15	session_1772047226284_ozsaobx4t	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:20:26.287	\N	\N
21582840-54d9-46a1-8e2d-563412cf6ef1	session_1772047106095_747dinwe1	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:18:26.098	\N	\N
46d6ded0-abad-47ef-a933-037fc29be1e0	session_1772047067791_6rkkos054	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	completed	{}	Key challenges: Manual employee performance tracking and compensation adjustment processes; Difficulty accessing historical employee data for decision-making; Time-consuming administrative tasks related to HR management. Discovery insights: Client values real-time data synchronization capabilities; Client prioritizes one-click export functionality for efficiency; Client needs historical employee performance tracking across different periods and positions; Client is actively managing compensation adjustments (specifically planning a raise for an employee); Client works with structured time periods (mentions October 1 as a new period start date). Objections & responses: No objections were raised during this initial discovery phase. Next steps: Schedule follow-up call to demonstrate specific HR/performance management features; Request access to current HR system for integration assessment; Discuss specific requirements for employee performance tracking and compensation management; Explore additional pain points around team management and reporting. Recommended solutions: HR management platform with real-time data synchronization; Performance tracking system with historical data access; Compensation management module with period-based adjustments; One-click reporting and export functionality; Employee lifecycle management solution.	2026-02-25 19:17:47.796	2026-02-25 19:18:04.09	2026-02-25 19:18:31.837
0b14eb48-a6b4-4bb2-b40c-0c3585d781fe	session_1772047111197_tdd2pdgp2	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	completed	{}	Key challenges: The client appears to be presenting marketing content rather than discussing their own business challenges; No specific business problems or pain points were identified from the conversation. Discovery insights: The user is promoting Odoo's capabilities across multiple industries (beverage distribution, real estate, law firms, retail, hospitality, manufacturing, wellness, fitness, e-commerce, construction); The user is highlighting Odoo's ability to provide customized database solutions for various business needs; The user is directing potential customers to odoo.com to explore Odoo 19 solutions; The conversation appears to be one-sided promotional content rather than a discovery dialogue. Objections & responses: No objections were raised as this was not a typical discovery conversation; The assistant attempted to initiate discovery but received marketing content in response. Next steps: Schedule a proper discovery call to understand the actual business needs; Ask clarifying questions to determine if this is a potential customer or marketing outreach; If this is a potential customer, redirect the conversation to their specific business challenges; If this is marketing content, acknowledge the information and request to speak with a decision-maker about their specific needs. Recommended solutions: Await proper discovery before recommending specific solutions; Potential areas to explore based on the industries mentioned: Odoo ERP modules for inventory management, CRM, document management, e-commerce, point of sale, manufacturing, subscription management, project management.	2026-02-25 19:18:31.2	2026-02-25 19:18:56.837	2026-02-25 19:20:26.46
feba299f-4008-4146-a4cc-84f7ad8b90a8	session_1772047237604_w1x62utuk	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:20:37.605	\N	\N
07a4ad53-e0c6-45a9-8d05-184c17411123	session_1772047245775_6yvolh5ly	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:20:45.778	\N	\N
86285ce1-7050-4ec6-bc1a-eb5bc433d5e2	session_1772047381330_4p4ubiz8y	\N	\N	active	{}	\N	2026-02-25 19:23:01.334	2026-02-25 19:24:11.389	\N
de11b189-63a6-479b-83ef-6357766066f5	session_1772047480690_61ef6d2yw	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:24:40.693	2026-02-25 19:25:11.895	\N
1c968c58-b59c-42d8-86f8-dc7f84393849	session_1772047624807_8ij79vnc0	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:27:04.809	\N	\N
7d0a8c81-9de1-420b-a984-0b2a046dc2b5	session_1772047652014_m4b6u0x1u	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:27:32.018	\N	\N
5eba7c94-d804-421b-814a-8662c35c5773	session_1772047665541_246ypl1uk	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:27:45.543	\N	\N
ceb40c06-3c8c-45c6-a84a-712a55ad58d6	session_1772047682067_pq1pux5bw	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:28:02.068	\N	\N
2865a164-ee81-4524-9984-0450e4bb4213	session_1772047766576_ccf8ouh5l	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:29:26.582	\N	\N
9da3f838-3138-42d4-88c5-2868c6078c3a	session_1772047790825_g3trffu9k	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:29:50.83	2026-02-25 19:30:07.876	\N
ff8d8745-2dfd-4109-8b84-eec427ed15e0	session_1772074795280_4562bxn4r	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	active	{}	\N	2026-02-26 02:59:55.281	\N	\N
2eedfc49-21a0-45b3-a703-45890436cf4d	session_1772047869110_bbokkjh94	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	completed	{}	Key challenges: Need for professional web design templates that match various styles; Requirement for templates that can showcase both full collections and best sellers effectively; Desire for templates that align with the user's personal or brand style consistently. Discovery insights: User is focused on web design templates for showcasing products; User values professional design quality and style alignment; User has varying presentation needs (full collections vs. curated best sellers); User prioritizes templates that are ready-to-use and match their specific aesthetic requirements. Objections & responses: No objections were raised during this initial conversation. Next steps: Schedule a follow-up call to discuss specific template categories and styles; Request examples of current website or design preferences for better matching; Provide sample templates that showcase both collection displays and best seller highlights; Discuss customization options and integration capabilities. Recommended solutions: Professional web design template packages with multiple style options; Template collections specifically designed for e-commerce product showcases; Customizable templates that can highlight both full collections and curated selections; Style-matching services to ensure templates align with user's brand identity.	2026-02-25 19:31:09.119	2026-02-25 19:32:40.314	2026-02-25 19:32:58.599
67702751-a80c-4af1-b222-ba8bd4930ef3	session_1772048001619_0omjsi1ra	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:33:21.623	\N	\N
a25effeb-5ac4-4c1d-b1c0-8a72fa07df30	session_1772048011588_dnlhc4u55	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-25 19:33:31.59	\N	\N
e6d0d140-922a-4319-af02-48953503b32d	session_1772074809199_g4oebkurc	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	active	{}	\N	2026-02-26 03:00:09.2	\N	\N
1e2890f9-f8a3-4da9-88c6-94471ff5d671	session_1772048049001_5akw0yunp	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	completed	{}	Key challenges: Difficulty in managing and prioritizing customer inquiries efficiently; Challenges in maintaining up-to-date stock levels for sales operations; Complexities in tracking and managing purchase orders and supplier performance. Discovery insights: Client uses a live chat dashboard to track ongoing conversations; Client requires automated conversation archiving for easy client reference; Client needs real-time stock management tools to support sales; Client manages purchase processes including RFQs, approvals, and supplier delivery metrics; Client utilizes drag-and-drop functionality for converting sales orders to purchase orders; Client benefits from purchase catalog suggestions for optimal ordering quantities. Objections & responses: No objections were raised during this conversation. Next steps: Schedule a demonstration of advanced inventory management features; Present case studies showing improved customer response times with automated tools; Arrange a technical deep-dive on purchase order automation and supplier performance tracking; Discuss integration capabilities with existing systems. Recommended solutions: Advanced live chat platform with conversation archiving and prioritization features; Real-time inventory management system with stock level alerts; Comprehensive purchase dashboard with RFQ tracking, approval workflows, and supplier performance analytics; Automated purchase order generation from sales orders; Intelligent purchase catalog with predictive ordering recommendations.	2026-02-25 19:34:09.005	2026-02-25 19:34:22.965	2026-02-25 19:35:14.357
669a3c0c-785c-498e-a1ba-ce0c878d310f	session_1772074865126_1khlb6t3e	27b733ea-2ada-40cb-a13c-0d8bb98bd0ca	\N	active	{}	\N	2026-02-26 03:01:05.126	\N	\N
199faedf-36fd-4f47-9a2f-2869bd0f06c4	session_1772122777682_qxfhmn6m8	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-26 16:19:37.696	\N	\N
79d29370-7f02-4172-bce1-3375f2b5b47f	session_1772122697151_ism9vxhwk	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	completed	{}	Key challenges: Need for stronger manufacturing controls; Requirement for better collaboration tools to reduce team friction; Desire for more efficient team workflows. Discovery insights: Client is focused on improving manufacturing operations through enhanced controls; Client values AI capabilities for automating data organization and document analysis; Client is interested in time-based data grouping (day, month, quarter, year) for better insights; Client seeks automated document analysis capabilities through AI agents. Objections & responses: No objections were raised during this initial discovery phase of the conversation. Next steps: Schedule a detailed demo focusing on AI-powered manufacturing controls; Prepare a customized presentation showing how AI agents can automate date grouping and document analysis; Gather more information about current manufacturing processes and collaboration pain points; Identify key stakeholders for a follow-up technical discussion. Recommended solutions: Odoo Manufacturing module with AI integration; Odoo AI-powered collaboration tools; Odoo document management system with AI analysis capabilities; Customized AI agent solutions for automated data organization.	2026-02-26 16:18:17.158	2026-02-26 16:19:14.615	2026-02-26 16:19:44.696
64603515-2ca4-4d7c-91f6-d443b8372d19	session_1772122799136_q6wgp3ahe	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-26 16:19:59.138	\N	\N
cf336250-12d3-436b-90c0-a950da4ee474	session_1772122826536_etcoekdob	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-26 16:20:26.539	2026-02-26 16:20:52.426	\N
7010965a-722f-4c4c-8683-701aab90852a	session_1772122865901_hbk47oq8t	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-26 16:21:05.903	\N	\N
d0bd2c67-a796-4c94-9b34-457dd56c9e3f	session_1772123052229_esxvdao28	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	active	{}	\N	2026-02-26 16:24:12.237	\N	\N
36f8747f-af55-4639-90ad-04cbb549c9c0	session_1772135558165_c8ouo5wds	76cacf03-9e99-4098-b633-7617082f077e	\N	active	{}	\N	2026-02-26 19:52:38.171	\N	\N
b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	session_1772123483266_wn03n4adg	76cacf03-9e99-4098-b633-7617082f077e	\N	completed	{}	Key challenges: Managing customer communication and order customization efficiently; Streamlining multilingual website content management; Optimizing digital content presentation for mobile users. Discovery insights: Client is focused on enhancing customer experience through technology improvements; They prioritize self-service capabilities for customers at point of sale; They value efficiency in content management and translation workflows; They're interested in mobile-optimized content display formats. Objections & responses: No objections were raised during this initial discovery phase. Next steps: Schedule a demo of the POS customization features mentioned; Provide case studies showing improved customer satisfaction with similar implementations; Discuss integration requirements with existing systems; Explore budget and timeline for implementation. Recommended solutions: Advanced POS system with customer note integration and combo suggestion features; Website translation management platform with batch translation capabilities; Mobile-optimized content management system supporting vertical video formats.	2026-02-26 16:31:23.28	2026-02-26 16:31:47.591	2026-02-26 16:32:57.977
dd0052ad-b995-4f50-be0f-0b7b26a7bd8d	session_1772135593565_78949g77v	76cacf03-9e99-4098-b633-7617082f077e	\N	active	{}	\N	2026-02-26 19:53:13.572	\N	\N
49f2c9ee-2011-416a-88f0-42cdaed39655	session_1772123571093_eox1jynag	76cacf03-9e99-4098-b633-7617082f077e	\N	completed	{}	Key challenges: No specific challenges identified yet as the conversation has just begun. Discovery insights: Client has not yet shared any information about their business challenges or opportunities. Objections & responses: No objections raised at this early stage of the conversation. Next steps: Continue discovery conversation to understand client's business context, pain points, and objectives; Schedule follow-up call if needed after initial information gathering. Recommended solutions: Cannot recommend specific solutions until client needs and challenges are identified.	2026-02-26 16:32:51.101	2026-02-26 16:33:23.978	2026-02-26 16:33:17.369
46ce04d1-2343-4f4e-a55a-90ed76eab146	session_1772123875198_q3chmwt2r	76cacf03-9e99-4098-b633-7617082f077e	\N	active	{}	\N	2026-02-26 16:37:55.2	\N	\N
28d1e770-ce14-40cb-b578-a4e301a20215	session_1772135933214_jr13s11hn	4749b239-bcef-433c-a4b2-f984ec3a47e9	\N	active	{}	\N	2026-02-26 19:58:53.217	\N	\N
823fc94d-de98-4c6c-963a-cad2ae4e9eaa	session_1772124017428_0ka2l3fan	76cacf03-9e99-4098-b633-7617082f077e	\N	active	{}	\N	2026-02-26 16:40:17.441	\N	\N
93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	session_1772123918419_x0mpk0y6o	76cacf03-9e99-4098-b633-7617082f077e	\N	completed	{}	Key challenges: Inefficient order processing and communication between customers and kitchen staff; Complex website translation processes requiring multiple steps; Poor mobile navigation experience for customers; Limited email marketing segmentation capabilities; Inflexible pricing structure for product variants. Discovery insights: Customer is focused on improving operational efficiency across multiple business areas; They prioritize customer experience enhancements, particularly in mobile optimization; They're implementing AI/automation features to streamline processes; They have a multi-channel approach (point of sale, website, email marketing) that needs integration; They're actively updating their technology stack with real-time feedback systems. Objections & responses: No direct objections were raised during this initial discovery conversation. Next steps: Schedule a demo of our integrated POS and website management platform; Provide case studies showing improved kitchen efficiency with real-time note display systems; Arrange a technical consultation to discuss API integration with their existing systems; Share pricing models for scalable email marketing segmentation tools; Prepare a proposal addressing mobile optimization and variant pricing solutions. Recommended solutions: Integrated POS system with AI-powered combo suggestions and kitchen display integration; Website management platform with batch translation capabilities and mobile-optimized navigation; Email marketing automation with advanced segmentation and campaign management; Product variant management system with direct price editing capabilities; Mobile-first design consultation for improved user experience.	2026-02-26 16:38:38.423	2026-02-26 16:39:01.567	2026-02-26 16:40:25.817
4966abcc-5656-475f-949a-336255dfc465	session_1772136068989_h1se0xi8s	4749b239-bcef-433c-a4b2-f984ec3a47e9	\N	active	{}	\N	2026-02-26 20:01:08.992	\N	\N
5f05f871-3e63-4c53-89af-7210a077d33b	session_1772136109554_kv0svxgrx	4749b239-bcef-433c-a4b2-f984ec3a47e9	\N	active	{}	\N	2026-02-26 20:01:49.557	\N	\N
bdb12c64-2acb-4111-9ad2-0bd6bfafc424	session_1772136357705_7c1mj5l3y	4749b239-bcef-433c-a4b2-f984ec3a47e9	\N	active	{}	\N	2026-02-26 20:05:57.712	\N	\N
0af7802f-cf6b-48fc-887d-b92acbe17e95	session_1772136576956_zdq6wyjj3	4749b239-bcef-433c-a4b2-f984ec3a47e9	\N	active	{}	\N	2026-02-26 20:09:36.958	\N	\N
c1f492a5-3eca-47a9-bf25-1e0c2d0bcc1e	session_1772136593374_dgeodv2r1	4749b239-bcef-433c-a4b2-f984ec3a47e9	\N	active	{}	\N	2026-02-26 20:09:53.376	\N	\N
71ba8aff-0514-4a7b-8edf-c7b18cb8c3e7	session_1772136648580_3z6e9ys5c	4749b239-bcef-433c-a4b2-f984ec3a47e9	\N	active	{}	\N	2026-02-26 20:10:48.607	\N	\N
7421dd4d-3612-4db1-adf6-3019d68d2bae	session_1772136819437_k10uerhgc	4749b239-bcef-433c-a4b2-f984ec3a47e9	\N	active	{}	\N	2026-02-26 20:13:39.448	\N	\N
\.


--
-- Data for Name: domain_expertise; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.domain_expertise (id, user_id, name, description, company_domain, is_shared, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: enterprise_user_assignments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.enterprise_user_assignments (id, user_id, license_package_id, assigned_by, assigned_at, status, train_me_enabled, dai_enabled, notes, created_at, updated_at, organization_id, user_email, activation_token, activation_token_expires_at, activated_at, revoked_by, revoked_at) FROM stdin;
\.


--
-- Data for Name: gateway_providers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.gateway_providers (id, provider_name, is_active, is_default, configuration, created_at, updated_at) FROM stdin;
80b21709-3efa-4227-a748-d74f452d62f7	razorpay	t	t	{"features": ["orders", "refunds", "webhooks", "subscriptions"], "supportedCurrencies": ["INR", "USD"]}	2026-02-23 05:23:53.372918	2026-02-23 05:23:53.372918
\.


--
-- Data for Name: gateway_transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.gateway_transactions (id, provider_id, provider_transaction_id, transaction_type, status, amount, currency, user_id, organization_id, related_entity, related_entity_id, payload, metadata, created_at) FROM stdin;
7d2db1c1-86fa-4949-b17f-a20a304e0e05	80b21709-3efa-4227-a748-d74f452d62f7	order_SKULUmJsN2JQ9j	order	created	177.00	USD	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	\N	\N	{}	{"itemCount": 3, "checkoutType": "cart", "roundoffAmount": 0, "originalCurrency": "USD"}	2026-02-25 19:08:15.452444
05c50364-febc-4281-bf6e-bf51cdbd9162	80b21709-3efa-4227-a748-d74f452d62f7	pay_SKUM6SdnnVQbhM	payment	completed	177.00	USD	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	cart_checkout	\N	{"orderId": "a3c12c57-5820-427e-a0c1-a71d2a09d31a", "cartItems": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"totalUnits": 500, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "8", "packageSku": "16b59eb6-e3cb-4235-9a53-df3315c4ed24", "companyName": null, "packageName": "500 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "platform_access", "basePrice": "149", "packageSku": "61a2e346-c35f-4395-8996-b3c4cfe8fcd8", "companyName": null, "packageName": "3 Months Plan", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "gatewayProvider": "razorpay"}	{"orderId": "a3c12c57-5820-427e-a0c1-a71d2a09d31a", "itemCount": 3, "cartCheckout": true}	2026-02-25 19:09:13.451133
\.


--
-- Data for Name: gateway_webhooks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.gateway_webhooks (id, provider_id, event_type, payload, signature, verified, processed, processed_at, error_message, created_at) FROM stdin;
\.


--
-- Data for Name: knowledge_entries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.knowledge_entries (id, domain_expertise_id, user_id, category, title, content, details, keywords, source_document_ids, content_hash, embedding, confidence, is_verified, usage_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.leads (id, name, email, company, phone, message, lead_type, department, total_seats, estimated_timeline, status, created_at) FROM stdin;
\.


--
-- Data for Name: license_assignments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.license_assignments (id, license_package_id, user_id, status, assigned_at, unassigned_at, assigned_by, notes) FROM stdin;
\.


--
-- Data for Name: license_packages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.license_packages (id, organization_id, package_type, total_seats, price_per_seat, total_amount, currency, start_date, end_date, previous_package_id, razorpay_subscription_id, razorpay_order_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages (id, conversation_id, content, sender, speaker_label, audio_source_id, customer_identification, discovery_questions, case_studies, competitor_analysis, solution_recommendations, product_features, next_steps, bant_qualification, solutions, problem_statement, recommended_solutions, suggested_next_prompt, "timestamp") FROM stdin;
f8f24d9b-bf6a-40eb-8b66-73309bd9c778	5be9b41e-4c21-499b-81ca-7ac7f1949e73	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:25:19.805
55d416ae-263b-4bd9-ba79-0ad76f9918e5	cf2c86a6-1764-416c-8c88-67361c569681	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:32:55.59
b482ae1e-e853-44ba-bd8e-187c256099df	cf2c86a6-1764-416c-8c88-67361c569681	Hi. My name is Sandeep, and I'm looking for	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:46:26.996
6d5fedd5-957f-4bf3-a7c9-4d0674d70f8f	cf2c86a6-1764-416c-8c88-67361c569681	RML. Currently, I'm using NinjaOne.	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:46:31.456
59be85c7-7633-48d2-9319-dc3eaf0e1d8d	cf2c86a6-1764-416c-8c88-67361c569681	We have around 1,500 we have 1,500 endpoints.	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:46:37.612
5014bcae-4bd8-47a1-a09d-e15aa4d7c59d	cf2c86a6-1764-416c-8c88-67361c569681	Across 37 clients, and	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:46:44.328
5a734987-ca19-4dcb-81ab-fd44d4023720	cf2c86a6-1764-416c-8c88-67361c569681	I'm facing issues with	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:46:53.418
e3a9e0ff-04a5-4afd-b452-7f6f4c2e40b9	cf2c86a6-1764-416c-8c88-67361c569681	Ninja 1 with asset mapping.	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:46:56.443
8de83078-91bb-4d94-afc2-75fb499f64b7	cf2c86a6-1764-416c-8c88-67361c569681	So the problem is when I try to do asset mapping,	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:01.433
48232b35-c02c-4e0a-9c98-789e00b05c1d	cf2c86a6-1764-416c-8c88-67361c569681	I	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:02.355
9904ee2a-8f32-4cd3-b333-a04c3c5ae533	cf2c86a6-1764-416c-8c88-67361c569681	around 200 devices are not getting detected.	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:07.346
8252a454-f608-488b-84ea-400f0b11e935	cf2c86a6-1764-416c-8c88-67361c569681	And when I reach out to Ninja 1, they give me some	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:09.91
52c67a0e-0b39-454d-acde-21056c974a7a	cf2c86a6-1764-416c-8c88-67361c569681	temporary remedy. This has happened in past.	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:14.97
58eb1032-e2d3-4c6f-ac9e-5854f49c8735	cf2c86a6-1764-416c-8c88-67361c569681	I want a reliable loss as mapping. It should when somebody's saying that	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:18.56
7e71092e-d5b8-48bd-b78e-c085c9a845f6	cf2c86a6-1764-416c-8c88-67361c569681	you guys when somebody says that, you know,	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:23.134
5fe84758-1c18-4f6b-bd8f-e06a39b51372	cf2c86a6-1764-416c-8c88-67361c569681	they'll divide asset mapping. It should work. Not like, you know, you give a temporary	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:26.123
42dc0b4a-ebae-41bc-9d32-a46f9916ff1d	cf2c86a6-1764-416c-8c88-67361c569681	fix. So I'm considering move away from Ninja 1 within	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:30.717
03e797a7-5da2-4493-887e-d4d611c5dea2	cf2c86a6-1764-416c-8c88-67361c569681	3 months time. And I'm evaluating multiple solution. Datto is 1 of	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:35.351
68e175c8-a9e6-47ee-ae94-658284eab78a	cf2c86a6-1764-416c-8c88-67361c569681	them, and then I'll be also checking with ConnectWise in coming days.	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:40.425
dcc11e83-9604-4802-aa13-257c197ad163	cf2c86a6-1764-416c-8c88-67361c569681	Could you please tell me how you're better than Ninja 1 and why should we consider you?	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:45.389
68f5265c-8bda-4962-8be6-87ddc610e40f	cf2c86a6-1764-416c-8c88-67361c569681	How how your asset mapping works?	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:49.105
b76d8c65-1eda-423a-b271-ce1ab968b50c	cf2c86a6-1764-416c-8c88-67361c569681	For	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:51.312
a9e77758-7dd8-4a80-9dfa-31511f8c1584	cf2c86a6-1764-416c-8c88-67361c569681	for the decision making, I'm a single run	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:47:57.051
324cabfc-a781-4724-8193-beae42e43121	cf2c86a6-1764-416c-8c88-67361c569681	Actually, not	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:48:01.087
a15a2bc9-6473-4c30-a7f4-064d581ea109	cf2c86a6-1764-416c-8c88-67361c569681	I have	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:48:02.061
a4f509d3-290a-4ee0-956b-0013f3e6503f	cf2c86a6-1764-416c-8c88-67361c569681	I I do consult	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:48:06.953
52cfc551-ce32-437a-9c72-d2494aadfb93	cf2c86a6-1764-416c-8c88-67361c569681	my consulting	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:48:08.474
c6d3b50b-d822-47bb-87be-70cadeed6cfd	cf2c86a6-1764-416c-8c88-67361c569681	vendor before I finalize the decision.	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:48:13.467
f52c5740-54f2-4e4c-894b-88ec22fcab67	cf2c86a6-1764-416c-8c88-67361c569681	So he's	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:48:16.026
eacda3c8-31b9-4ee3-b799-4b083921f345	cf2c86a6-1764-416c-8c88-67361c569681	he acts like a vice president, so he's also a member who would be making a decision with me. So both of us will be	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:48:24.3
7af950be-248d-4eef-8e18-64eb02046aa0	cf2c86a6-1764-416c-8c88-67361c569681	discussing this, and then we'll make our final call on it.	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:48:27.701
febed732-d1c8-43ce-a623-7201109207d8	cf2c86a6-1764-416c-8c88-67361c569681	Basically, which solution we have to go with.	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:48:32.379
54a32dfc-738d-4c43-a45d-24c64cae582d	cf2c86a6-1764-416c-8c88-67361c569681	Also, could you please tell me, do you have any back	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:56:46.152
e5249979-7346-42eb-9059-85e484f59696	cf2c86a6-1764-416c-8c88-67361c569681	solution available? I'm also looking for backup solution. I'm currently using Beam.	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:56:49.154
ae9cbf90-52dc-4c97-9e60-04f6d1fc1e3c	cf2c86a6-1764-416c-8c88-67361c569681	I have 3 32 terabyte VCD devices.	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:56:53.785
9fd1ce96-6d16-42ed-be11-e562a2b00349	cf2c86a6-1764-416c-8c88-67361c569681	So I wanna know what are your offerings.	user	Speaker 1	216fc395-bcc6-4936-8d7d-3e0d25670f9f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 05:56:56.495
542e6bef-dea1-4e0e-b14e-44e487f511f6	63f6814d-4f53-4472-b65e-b783fef8b7e3	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 06:10:22.85
9c8d6331-9db7-4d98-8b7f-6865e4562a2a	f062e1df-57ee-499a-95e3-a7bff6768717	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 06:12:07.324
adb8a07f-27cc-4e34-9389-cb377ed7928b	baea65bf-226a-4576-9dec-62e39bb140c2	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:07:20.463
355a6f65-d91d-4fea-8019-f64e5ae1cbc6	84d21720-c0d8-4634-be64-20d2ebdc6aee	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:08:05.005
03e81c4e-3672-46ae-8f0a-624b9b71394e	84d21720-c0d8-4634-be64-20d2ebdc6aee	When building a view, you can now ask an AI agent for grouping by day,	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:09:26.669
d4803b37-782c-47d7-8e42-851ca84c70fd	84d21720-c0d8-4634-be64-20d2ebdc6aee	month, quarter, or year. And Odoo AI applies the correct date grouping automatically. While previewing a document, simply ask the AI agent about its content without leaving the file.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:09:40.35
c624747f-f477-434d-b861-cef2d54bbbb8	84d21720-c0d8-4634-be64-20d2ebdc6aee	And agents now support file uploads and conversations.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:09:45.056
eb60dd17-cea4-4783-8eac-bdd8c46006e8	84d21720-c0d8-4634-be64-20d2ebdc6aee	Then ask any questions based on their content.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:09:48.923
2b2c369d-7afc-4795-aebd-cd809fdfdaf6	84d21720-c0d8-4634-be64-20d2ebdc6aee	Finally, instead of a generic thinking message,	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:09:52.392
847b83d5-7379-48b3-833d-2d26c3a6006f	84d21720-c0d8-4634-be64-20d2ebdc6aee	AI agents now show what they're actually doing.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:09:55.503
a6847c34-5187-4a93-942f-6951840831e3	84d21720-c0d8-4634-be64-20d2ebdc6aee	This gives you clearer feedback while your request is being processed.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:09:58.687
055302fd-b8a7-464a-bb39-52aea0c3264f	84d21720-c0d8-4634-be64-20d2ebdc6aee	On point of sales, customers can now leave notes at checkout when self ordering.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:10:05.664
2448eea5-b332-4688-b874-97d7af8d51b2	84d21720-c0d8-4634-be64-20d2ebdc6aee	These notes are then clearly displayed on the kitchen screen.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:10:10.4
9d7c34f2-0b57-4853-95ad-a407f72a7eb5	84d21720-c0d8-4634-be64-20d2ebdc6aee	When selecting several	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:10:14.226
0e02f8f8-029f-4db4-acd5-def4d49c1160	84d21720-c0d8-4634-be64-20d2ebdc6aee	items that can be combined into a combo, the point of sale now suggests	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:10:18.172
d2b12949-9c1f-462e-be40-a5f6bdda12eb	84d21720-c0d8-4634-be64-20d2ebdc6aee	creating a combo automatically.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:10:22.193
5b6e683b-3c7b-41b5-8cfd-110f76367d12	84d21720-c0d8-4634-be64-20d2ebdc6aee	Let's move to website.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:10:25.214
a69654e4-bedd-48f0-af92-455212f3ee39	84d21720-c0d8-4634-be64-20d2ebdc6aee	When translating a contact form that includes a selection field,	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:10:29.938
19c0d925-7d06-4329-ab5b-70437889feca	84d21720-c0d8-4634-be64-20d2ebdc6aee	you can now translate all values at once in a single click	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:10:34.53
cdf93906-f1a5-4566-8047-b2cdebb83e9e	84d21720-c0d8-4634-be64-20d2ebdc6aee	without leaving the page.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:10:38.471
6aef08f5-c501-4e03-99da-6f67891694ab	84d21720-c0d8-4634-be64-20d2ebdc6aee	Add videos in a vertical format for a better display.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:10:41.786
a0e428f1-7cd4-4260-88bb-06f70c6689ab	84d21720-c0d8-4634-be64-20d2ebdc6aee	And add anchors to cards for easier navigation.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:10:45.166
a31298f4-f03e-4cf8-8ae3-35c692697b87	84d21720-c0d8-4634-be64-20d2ebdc6aee	Especially on mobile devices.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:10:50.19
5a18c093-9f25-4221-9ce9-a9628e963525	84d21720-c0d8-4634-be64-20d2ebdc6aee	Edit the sales price directly on individual product variants	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:10:53.932
1f4b7642-2c47-479a-ada9-eba29d06ec9a	84d21720-c0d8-4634-be64-20d2ebdc6aee	so the price can reflect differences in size, color, or configuration.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:10:58.223
f101f00d-f1cb-46ff-938a-15316ba255e4	84d21720-c0d8-4634-be64-20d2ebdc6aee	In email marketing, you can now send campaigns not only to customers,	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:11:06.476
d6a9ba2f-b42b-40ce-87eb-80d8ac411f6c	84d21720-c0d8-4634-be64-20d2ebdc6aee	but also to employees and suppliers.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:11:11.386
b6f7e369-3212-4f2e-acf0-0f3d46075960	84d21720-c0d8-4634-be64-20d2ebdc6aee	Add your social media accounts anywhere in your email.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:11:14.508
d7a9410c-397c-4b57-86db-0dfbc7456daa	84d21720-c0d8-4634-be64-20d2ebdc6aee	And customize how they appear in your mailings.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:11:15.366
5d6fab85-3d4a-4f46-81fc-f815f7bdd0bf	84d21720-c0d8-4634-be64-20d2ebdc6aee	Just like on the website builder, save your favorite email blocks	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:11:24.244
60edddc3-c864-408e-95da-45e85db34da4	84d21720-c0d8-4634-be64-20d2ebdc6aee	and reuse them across future campaigns.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:11:27.527
620e4013-bb6b-4ae6-a12f-47134ec8000b	84d21720-c0d8-4634-be64-20d2ebdc6aee	And display specific blocks only when certain conditions are met	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:11:30.943
24d1d8a9-0249-43bd-aac6-df5c243b28bf	84d21720-c0d8-4634-be64-20d2ebdc6aee	so you can tailor each mailing to individual recipients.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:11:35.88
e8a1af1d-38a1-428d-9e66-0df574ef7426	84d21720-c0d8-4634-be64-20d2ebdc6aee	Pin important messages in the chatter so key information stays visible for everyone.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:11:43.476
1b8accf8-d1b9-4a11-9186-7b9f701adcf5	84d21720-c0d8-4634-be64-20d2ebdc6aee	When totals are converted between currencies,	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:11:48.654
39cb3a30-4fcf-48b1-ada5-4743c370eb28	84d21720-c0d8-4634-be64-20d2ebdc6aee	the exchange rate date is now clearly displayed for better	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:11:51.806
725267de-1b1d-47e7-b3fb-98e9e1c0f8bf	84d21720-c0d8-4634-be64-20d2ebdc6aee	You can now import product variants in bulk	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:11:54.893
10be2090-109d-435e-8b5e-4c4675c945db	84d21720-c0d8-4634-be64-20d2ebdc6aee	including their attribute values, costs, quantities, and more.	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:11:58.636
aa99503d-824b-4546-9d0c-bbbf410dcc09	84d21720-c0d8-4634-be64-20d2ebdc6aee	Create polls directly inside your converse	user	Speaker 1	d169ea35-e1d5-435d-b3cf-6d1a311b543a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:12:02.556
1e6e7e2f-857a-43b1-a2fc-f6064cd6fb0e	b46ac2a9-63cd-4ef2-adb7-a7af85d72c0b	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:02:20.934
7e95ef45-63cd-4fd5-9011-37b1ad412089	20bdd2e6-ecd0-4715-8305-7619b37a39f3	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:02:37.25
32fdefcd-7cfc-4989-9342-9ffaaa53480d	20bdd2e6-ecd0-4715-8305-7619b37a39f3	represent male beautiness	user	Speaker 2	a9cb9871-76dc-45f0-bead-6aa3bc06328a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:03:41.503
89dad8d2-e6d9-4554-aa1f-4fe85670efed	20bdd2e6-ecd0-4715-8305-7619b37a39f3	framework introduce framework. Sorry. I remember. I know.	user	Speaker 2	a9cb9871-76dc-45f0-bead-6aa3bc06328a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:04:04.05
31e966da-f528-4a44-b481-e3097f9da54e	20bdd2e6-ecd0-4715-8305-7619b37a39f3	at least to say 50% of	user	Speaker 2	a9cb9871-76dc-45f0-bead-6aa3bc06328a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:04:16.592
abcc8868-2145-4d3e-b228-74a81bc54cb6	20bdd2e6-ecd0-4715-8305-7619b37a39f3	or framework s a n k nest	user	Speaker 2	a9cb9871-76dc-45f0-bead-6aa3bc06328a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:04:43.39
98c65a78-bbd2-4826-8215-2499f35ea23d	ed3a30a6-46ac-4b61-8539-0ecb7bf13f22	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:16:56.059
8b322e83-fec6-4705-8539-99551f0bb321	df355c60-9175-4384-8187-2b84da941a38	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:19:02.788
ebcb5ad5-5068-4218-a000-53f78cde2a52	df355c60-9175-4384-8187-2b84da941a38	Process process.	user	Speaker 1	1b6a11a7-ab66-4f46-8ab6-186aa57c105e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:19:32.277
f213add5-5366-445e-bf52-c9dc2c460c2e	8ceef912-5da8-41ce-b13f-40e1cbb969ab	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:20:47.269
bdf421c1-314e-4ca4-885a-6da7abbe00ae	dc78666e-4aea-40db-8749-9eb18dd36378	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:23:48.262
b9023c1b-5c10-466f-8721-840356c1358e	0a5f16aa-9e49-4dc1-94e7-776dfd8a74ea	file	user	Speaker 1	89cd8290-39a5-4cfd-a6ae-108ffa4e3c63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:24:48.031
60e770d7-085f-46da-9382-43fd2162120f	48e50603-e936-4c64-8f52-cf47f689c85f	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:25:16.62
fcd1a3b9-cd49-4ffa-87ca-f4e5254f8978	0a5f16aa-9e49-4dc1-94e7-776dfd8a74ea	interpreter line line transform machine code convert CPU score	user	Speaker 1	89cd8290-39a5-4cfd-a6ae-108ffa4e3c63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:25:18.917
ba1e4786-6071-4e45-a21a-8580d7f4529f	0a5f16aa-9e49-4dc1-94e7-776dfd8a74ea	folder open Java first program.	user	Speaker 1	89cd8290-39a5-4cfd-a6ae-108ffa4e3c63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:25:33.763
1756a3bb-6261-4909-ba8d-046ee6d8158d	54b25796-301a-47af-8a8b-1bbb7c64a790	File proper machine code intermediate	user	Speaker 1	bb30fc98-2485-447c-b4f0-8797f3f96d87	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:28:11.375
96ed0b4e-8ebb-49e0-b7e8-521b26cba1b0	54b25796-301a-47af-8a8b-1bbb7c64a790	dot class file generate.	user	Speaker 1	bb30fc98-2485-447c-b4f0-8797f3f96d87	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:28:18.91
0201b230-763b-4977-b93e-5358a4f68d59	54b25796-301a-47af-8a8b-1bbb7c64a790	Program run basically, screen hello world output.	user	Speaker 1	bb30fc98-2485-447c-b4f0-8797f3f96d87	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:28:21.992
aa9d7ede-cc72-41f1-8091-1a78da5b620c	54b25796-301a-47af-8a8b-1bbb7c64a790	JVM machine code command Java	user	Speaker 1	bb30fc98-2485-447c-b4f0-8797f3f96d87	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:28:29.367
65963d18-5b5a-467e-8bdb-dca0cc0a8058	54b25796-301a-47af-8a8b-1bbb7c64a790	Machine code	user	Speaker 1	bb30fc98-2485-447c-b4f0-8797f3f96d87	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:28:37.248
0e52d174-50cc-4559-b4d1-0668e7857e49	51aa62ef-606b-4bb2-b472-178146ac544c	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:35:03.4
85462a74-7f04-4544-a18d-a4f76b7b351f	51aa62ef-606b-4bb2-b472-178146ac544c	I have a separate video right here on how to reduce your user count	user	Speaker 1	434ecf97-48cd-4779-8266-ac90f4021a03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:35:48.87
608dc2ce-8a1b-4d23-9c7e-bdd9086bba0e	51aa62ef-606b-4bb2-b472-178146ac544c	to slash your Odoo bill in half. You should check that out after this	user	Speaker 1	434ecf97-48cd-4779-8266-ac90f4021a03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:35:52.862
8a9ae06e-d126-4bed-9343-ed253f4810a7	9c9b9783-2adc-4e8f-bce8-82aec57e2a81	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:37:50.88
90ab0b08-5728-4495-b774-d01a412e16d0	9c9b9783-2adc-4e8f-bce8-82aec57e2a81	the drop in score seems warranted. Now let's talk about the ability to	user	Speaker 1	05fc6396-0eda-4661-a553-043923733bf0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:38:19.292
37fea303-3845-4a3c-8286-617838be2238	906ec10f-a400-4b27-90da-7632a4c8dee5	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:40:29.049
954edeea-6af8-4f14-a08a-7d787845db53	05d0255d-ee12-49bc-83b8-21435ba33a89	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:48:37.396
a23cb1c5-e941-46af-9aa0-c0bc7cc644c7	78823ad1-c099-4a34-a09a-d125514dc3fc	Cam? That's a nice English color.	user	Speaker 1	980cfe57-9857-4205-ba57-70848b4ef480	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:51:54.735
281e016a-138a-4a5a-954e-6f2b3b271eb3	56c0cac5-8979-4d9a-baf6-9d708b56352d	You mean Jetline. Oh, Jet lag.	user	Speaker 1	47c0d3ab-1c03-4813-aa53-975c833bab03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:53:58.127
7796f0d8-7c6d-4460-bb46-66d907982532	20bdd2e6-ecd0-4715-8305-7619b37a39f3	Sadly,	user	Speaker 1	a9cb9871-76dc-45f0-bead-6aa3bc06328a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:03:23.672
71e8dba9-05b2-4bad-a2d2-bbed00ecf006	20bdd2e6-ecd0-4715-8305-7619b37a39f3	handsomeness.	user	Speaker 2	a9cb9871-76dc-45f0-bead-6aa3bc06328a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:03:45.027
7d2acd6d-f11f-4378-9ca3-bff3ab35933f	20bdd2e6-ecd0-4715-8305-7619b37a39f3	Mapping or discussion	user	Speaker 2	a9cb9871-76dc-45f0-bead-6aa3bc06328a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:04:08.893
dc24d556-f243-4b22-95b9-36dc62faa12f	20bdd2e6-ecd0-4715-8305-7619b37a39f3	next GSK, but Adhanis	user	Speaker 2	a9cb9871-76dc-45f0-bead-6aa3bc06328a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:04:21.81
bd9c242f-10ef-44de-8c12-6f4fc8aa2984	20bdd2e6-ecd0-4715-8305-7619b37a39f3	next but is key.	user	Speaker 2	a9cb9871-76dc-45f0-bead-6aa3bc06328a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:04:47.465
1e4c2e0c-2573-4944-958b-b146b0b32e96	4c9b6b4d-17af-4a34-a919-4bd03c9be73e	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:18:02.353
25d5490c-3c11-49c1-a293-51a2f1a95923	df355c60-9175-4384-8187-2b84da941a38	User authentication solved problem.	user	Speaker 1	1b6a11a7-ab66-4f46-8ab6-186aa57c105e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:19:25.067
00ada0a9-e114-4c81-9699-aa6c12320314	df355c60-9175-4384-8187-2b84da941a38	User register	user	Speaker 1	1b6a11a7-ab66-4f46-8ab6-186aa57c105e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:19:34.255
f933aaa9-6de9-4536-ae72-c44c13bbb64a	df355c60-9175-4384-8187-2b84da941a38	machine code machine code CPU	user	Speaker 2	1b6a11a7-ab66-4f46-8ab6-186aa57c105e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:19:44.138
ce8e6d05-fc78-421e-b6a5-73dfd4c666bb	df355c60-9175-4384-8187-2b84da941a38	processor	user	Speaker 2	1b6a11a7-ab66-4f46-8ab6-186aa57c105e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:19:47.915
78ac1ef7-036b-4c78-a7b5-8ce315bd6e76	df355c60-9175-4384-8187-2b84da941a38	output or more output screen	user	Speaker 2	1b6a11a7-ab66-4f46-8ab6-186aa57c105e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:19:51.597
7e863389-bbf5-4b0d-bdbd-6610f7aab289	df355c60-9175-4384-8187-2b84da941a38	Is byte code run command	user	Speaker 2	1b6a11a7-ab66-4f46-8ab6-186aa57c105e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:20:01.558
ece24c09-ea87-498b-8afd-c41f43a72d34	398ff223-dfb8-45cc-9998-fe4a1e2f8256	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:20:57.317
c5aa8391-dacf-46c3-b18a-babb6127f7bf	0a5f16aa-9e49-4dc1-94e7-776dfd8a74ea	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:24:20.084
76389932-5dcf-4e88-9874-a295b1ba97a7	0a5f16aa-9e49-4dc1-94e7-776dfd8a74ea	JIT compiler use or	user	Speaker 1	89cd8290-39a5-4cfd-a6ae-108ffa4e3c63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:24:59.269
e6ae23dd-56c7-4146-9d3f-151dfa373adf	0a5f16aa-9e49-4dc1-94e7-776dfd8a74ea	convert or to less frequent code	user	Speaker 1	89cd8290-39a5-4cfd-a6ae-108ffa4e3c63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:25:14.916
7017e8e6-57a1-43d5-978c-01f4c1b9e239	0a5f16aa-9e49-4dc1-94e7-776dfd8a74ea	output	user	Speaker 1	89cd8290-39a5-4cfd-a6ae-108ffa4e3c63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:25:23.22
9fe8ce23-f72d-4218-82b6-06159d0f9343	0a5f16aa-9e49-4dc1-94e7-776dfd8a74ea	screen	user	Speaker 1	89cd8290-39a5-4cfd-a6ae-108ffa4e3c63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:25:28.16
39702853-17ec-4d45-80a7-a2362e60edf4	0a5f16aa-9e49-4dc1-94e7-776dfd8a74ea	Or you have to make file demo dot Java.	user	Speaker 1	89cd8290-39a5-4cfd-a6ae-108ffa4e3c63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:25:35.516
dafeefcc-8307-4379-9960-bd1e58346094	ce3b23d3-41d5-4da7-8176-71dd5e0c5d78	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:25:41.18
af9ca0a5-65a2-46ef-8efd-ff48757883c5	54b25796-301a-47af-8a8b-1bbb7c64a790	code	user	Speaker 1	bb30fc98-2485-447c-b4f0-8797f3f96d87	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:28:15.927
7ec65d42-41de-4dcd-aed2-88c961a815cc	54b25796-301a-47af-8a8b-1bbb7c64a790	demo to be file. I'm just gonna enter the Mongo.	user	Speaker 1	bb30fc98-2485-447c-b4f0-8797f3f96d87	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:28:34.407
6f007da4-9fcb-4c97-9099-8b7c00755e16	51aa62ef-606b-4bb2-b472-178146ac544c	Odoo isn't the budget underdog anymore. Now as you can see, Odu still wins pretty handily, but they've slipped a bit.	user	Speaker 1	434ecf97-48cd-4779-8266-ac90f4021a03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:35:33.056
e9a7ba30-2484-4407-a928-c65514bae2d2	51aa62ef-606b-4bb2-b472-178146ac544c	and starting to sweat a little, you don't actually have to pay for everyone.	user	Speaker 1	434ecf97-48cd-4779-8266-ac90f4021a03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:35:44.007
5055c6c4-363e-4225-96b9-a1b8cbcee5d8	51aa62ef-606b-4bb2-b472-178146ac544c	here, so so we can't ignore implementation and upgrade costs.	user	Speaker 1	434ecf97-48cd-4779-8266-ac90f4021a03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:35:59.653
15f0b352-3904-482b-812d-b1d34d351d32	51aa62ef-606b-4bb2-b472-178146ac544c	there's a lot you can do to keep implementation and upgrade costs down.	user	Speaker 1	434ecf97-48cd-4779-8266-ac90f4021a03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:36:11.581
ae4fa737-c09b-44ab-8632-36c74fbe1719	9c9b9783-2adc-4e8f-bce8-82aec57e2a81	Odu gets a 7 in this category right now.	user	Speaker 1	05fc6396-0eda-4661-a553-043923733bf0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:38:09.173
b8f9c973-54bd-4906-b175-e648c13ce073	9c9b9783-2adc-4e8f-bce8-82aec57e2a81	customize Odoo, probably another big reason you're looking at it.	user	Speaker 1	05fc6396-0eda-4661-a553-043923733bf0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:38:24.22
4124c427-8062-4312-93ff-ec9061741aa8	9c9b9783-2adc-4e8f-bce8-82aec57e2a81	Odoo is wildly customizable. And, yes,	user	Speaker 1	05fc6396-0eda-4661-a553-043923733bf0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:38:29.288
28b59113-4244-4c14-9e63-cad87b6a64c5	9c9b9783-2adc-4e8f-bce8-82aec57e2a81	I chose that word deliberately. You have Odoo Studio that allows you to change up	user	Speaker 1	05fc6396-0eda-4661-a553-043923733bf0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:38:31.679
f45d383a-b4c5-4b61-86b6-1fbf4dd9ce27	05d0255d-ee12-49bc-83b8-21435ba33a89	Good afternoon.	user	Speaker 1	76b3cf65-79d8-49b0-9022-02424e097e04	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:49:07.29
db9fbb3b-13ec-41c6-924e-bed4f7b38eb7	78823ad1-c099-4a34-a09a-d125514dc3fc	Very smart. London's area.	user	Speaker 1	980cfe57-9857-4205-ba57-70848b4ef480	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:51:58.358
60c4d4be-bc5c-45fe-ae6b-81a29a2209db	293179f3-4db4-46c1-b12e-7b529344df4f	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:53:13.374
6b1f8044-e9e8-4361-a6dd-8347f27d9e78	56c0cac5-8979-4d9a-baf6-9d708b56352d	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:53:41.433
985ec732-630f-4071-b24b-12fbc8458dff	c010847e-764b-4079-8d39-0b2443c05af4	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:56:21.782
11dcd3b5-9d2f-4a82-a5a1-73fd7b7fc4f8	72de624f-e4c1-4411-ac82-f261746e1075	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:57:23.628
ca54dd47-1b0f-4681-84e8-6292184d6452	20bdd2e6-ecd0-4715-8305-7619b37a39f3	character	user	Speaker 1	a9cb9871-76dc-45f0-bead-6aa3bc06328a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:03:28.391
e6cf26d2-d3ce-4c79-a9a9-cbe3f0178670	c4f38ad4-c3d9-45d2-a18e-8582846b146e	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:23:07.362
8525f0ad-047d-4470-9974-982505b19796	c5926e58-1c60-4a2e-94df-2805981290c1	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:23:24.142
9f978191-66ca-4ea4-891c-d71178448c0a	76b70cb9-18b7-4559-8c02-86a79a638137	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:23:35.955
0f602f80-9c16-40fc-9c36-8ead05973019	a0c974e2-fa95-4f9e-bbc6-0d64b195bd0d	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-23 21:23:44.667
6007213e-7c97-4418-b146-2490d4540b1a	20bdd2e6-ecd0-4715-8305-7619b37a39f3	They are shired	user	Speaker 2	a9cb9871-76dc-45f0-bead-6aa3bc06328a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:03:53.326
2df86287-4cd5-428c-84a1-be673bf2158e	20bdd2e6-ecd0-4715-8305-7619b37a39f3	But framework	user	Speaker 2	a9cb9871-76dc-45f0-bead-6aa3bc06328a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:04:12.508
2a26b600-cd39-4b0f-8d11-d1712ac015e4	20bdd2e6-ecd0-4715-8305-7619b37a39f3	100% completely different	user	Speaker 2	a9cb9871-76dc-45f0-bead-6aa3bc06328a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:04:38.416
e9ca7796-6820-4746-88b8-4cb554df819f	67ac0882-c796-4e5f-beee-a5b65cf89036	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:05:07.066
14c000b1-1653-4697-9a91-56f302f5f164	91761f4f-5667-4e60-b5a6-fd5b6760d0bd	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:18:07.293
66aa44e2-fd05-4692-b78e-0d01ca0228bf	df355c60-9175-4384-8187-2b84da941a38	User authentication manually.	user	Speaker 1	1b6a11a7-ab66-4f46-8ab6-186aa57c105e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:19:29.406
fad154a3-685e-4c15-912f-7abb062cd338	df355c60-9175-4384-8187-2b84da941a38	or command	user	Speaker 2	1b6a11a7-ab66-4f46-8ab6-186aa57c105e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:19:55.842
decf8ad5-295a-49de-ba37-1c7e3a7f6dad	df355c60-9175-4384-8187-2b84da941a38	demo.	user	Speaker 1	1b6a11a7-ab66-4f46-8ab6-186aa57c105e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:20:10.017
f84c7f46-7a7a-4798-98fc-4c0456d03d3f	1f79fe3b-9069-47cf-aec2-c68466bc45eb	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:21:33.218
eca72570-6afc-44cc-88ac-8e2fa8db6c52	0a5f16aa-9e49-4dc1-94e7-776dfd8a74ea	Basically, keyword Java or file	user	Speaker 1	89cd8290-39a5-4cfd-a6ae-108ffa4e3c63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:24:42.975
e987c259-6a28-47a7-8a04-3b6ff4222d26	0a5f16aa-9e49-4dc1-94e7-776dfd8a74ea	Use other frequently GIT compiler	user	Speaker 1	89cd8290-39a5-4cfd-a6ae-108ffa4e3c63	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:25:11.312
9ce2983c-0ffc-4422-bf4c-a022a4a5182d	48e50603-e936-4c64-8f52-cf47f689c85f	Folder open Java first program.	user	Speaker 1	0c4c5417-62c2-4a63-9491-c9352feeb853	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:25:33.167
d319d5a3-f59f-433f-bc66-3eac12922927	54b25796-301a-47af-8a8b-1bbb7c64a790	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:27:48.012
8d734f3a-7274-4c5d-9528-01c030855856	54b25796-301a-47af-8a8b-1bbb7c64a790	Byte code	user	Speaker 1	bb30fc98-2485-447c-b4f0-8797f3f96d87	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:28:26.4
14ad8dcf-4678-4598-aeb7-b468e0f72e2b	fefee3f2-dc60-40ec-aefa-a9b5fe57f191	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:32:48.739
08842a36-da66-4632-89c6-12dd82e8f6e3	51aa62ef-606b-4bb2-b472-178146ac544c	And, yeah, these prices may vary. There's a lot of factors that go into these.	user	Speaker 1	434ecf97-48cd-4779-8266-ac90f4021a03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:35:36.559
82c67c8b-19a2-4710-9c41-5998a033b504	51aa62ef-606b-4bb2-b472-178146ac544c	But for illustration purposes, these are pretty solid. If you're looking at that per user cost,	user	Speaker 1	434ecf97-48cd-4779-8266-ac90f4021a03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:35:39.697
4f469c1a-dcf6-4741-b783-32775e686478	51aa62ef-606b-4bb2-b472-178146ac544c	if you wanna keep your costs down. And we're looking at total cost	user	Speaker 1	434ecf97-48cd-4779-8266-ac90f4021a03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:35:56.43
290ce577-8c04-4ed3-bb16-5791245e9574	51aa62ef-606b-4bb2-b472-178146ac544c	Looking at the data here, Odoo still wins most times when it comes to implementation cost,	user	Speaker 1	434ecf97-48cd-4779-8266-ac90f4021a03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:36:03.472
c4db7fbe-8002-473f-be6b-4e18e0340a60	51aa62ef-606b-4bb2-b472-178146ac544c	but you still have to take it into account. And, yeah,	user	Speaker 1	434ecf97-48cd-4779-8266-ac90f4021a03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:36:08.513
1c12bcca-b620-4d9d-8948-878992e9eaaf	51aa62ef-606b-4bb2-b472-178146ac544c	We'll talk more about that in a future video, but we still need to consider it as	user	Speaker 1	434ecf97-48cd-4779-8266-ac90f4021a03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:36:16.026
ebe1c1c7-d9de-4cbb-874b-3ec4650b5392	9c9b9783-2adc-4e8f-bce8-82aec57e2a81	They used to be a solid 9, but with the increase in user cost,	user	Speaker 1	05fc6396-0eda-4661-a553-043923733bf0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:38:13.317
5db1666e-ce9e-49e8-b9b0-a7028dc31bbe	9c9b9783-2adc-4e8f-bce8-82aec57e2a81	and the other costs they started charging, including their legacy fee,	user	Speaker 1	05fc6396-0eda-4661-a553-043923733bf0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:38:16.079
f71ffe77-1093-41b2-bfc6-6a0f50955f42	9c9b9783-2adc-4e8f-bce8-82aec57e2a81	your views requiring different fields, adding new fields,	user	Speaker 1	05fc6396-0eda-4661-a553-043923733bf0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:38:35.432
849abf76-09ad-43ac-8594-68d599855a91	78823ad1-c099-4a34-a09a-d125514dc3fc	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:51:38.615
db4912e5-bed9-42fb-bb29-6bb5cffb4974	8145ddfe-d542-4b8a-97c2-9ba646f0bcd3	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:53:10.382
635be2a7-cb06-48b4-839b-8006a70f9b7f	4361641f-c873-4048-959d-8975e5b66a82	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:53:14.689
5bdf943a-7bdf-4845-b919-052765d4f207	6ef77389-bd28-47a6-9f81-3c95eb66ebc9	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:53:21.169
eb92ff73-d3ed-457e-953e-177bad2af2c5	72de624f-e4c1-4411-ac82-f261746e1075	Society	user	Speaker 1	b4a50e99-2a5d-4f25-8760-405021ecb6be	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:57:54.522
d6b6390f-7421-46ca-8502-1aad7de850b7	35a6cdaf-3549-405c-aa08-a42cb7efe7ea	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:58:52.179
46b6ff40-b78b-4d79-8e2b-b094a916845e	35a6cdaf-3549-405c-aa08-a42cb7efe7ea	Tronics.	user	Speaker 1	a778aee5-8b47-493b-8b93-04aba6ac9cdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:59:07.004
60d9bc7e-4867-4559-9250-74fdecacc798	35a6cdaf-3549-405c-aa08-a42cb7efe7ea	Now my Scott though is some	user	Speaker 2	a778aee5-8b47-493b-8b93-04aba6ac9cdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:59:29.562
bd3400bf-988e-43a4-8ecc-f6575fc14010	35a6cdaf-3549-405c-aa08-a42cb7efe7ea	1827 James Lewis, a British East India Company	user	Speaker 2	a778aee5-8b47-493b-8b93-04aba6ac9cdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:59:40.391
4101b651-d03a-40cc-91fc-b6fb09473063	35a6cdaf-3549-405c-aa08-a42cb7efe7ea	traveling.	user	Speaker 2	a778aee5-8b47-493b-8b93-04aba6ac9cdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 14:59:48.772
eead784e-5703-42a4-95f8-71ef2028fcb0	35a6cdaf-3549-405c-aa08-a42cb7efe7ea	civilization.	user	Speaker 2	a778aee5-8b47-493b-8b93-04aba6ac9cdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:00:26.936
0966283b-534a-458d-991b-37f790944ec3	35a6cdaf-3549-405c-aa08-a42cb7efe7ea	1920	user	Speaker 1	a778aee5-8b47-493b-8b93-04aba6ac9cdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:00:26.976
a2302862-4ee1-4a45-86ef-7077dc741291	35a6cdaf-3549-405c-aa08-a42cb7efe7ea	Actually	user	Speaker 2	a778aee5-8b47-493b-8b93-04aba6ac9cdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:00:38.794
f3b672fd-e0c6-4f54-8f89-ceee923cbdbd	35a6cdaf-3549-405c-aa08-a42cb7efe7ea	The Mound Of The Dead.	user	Speaker 2	a778aee5-8b47-493b-8b93-04aba6ac9cdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:00:51.05
7fc680fb-a296-4bc9-9db3-52b9713bca29	35a6cdaf-3549-405c-aa08-a42cb7efe7ea	We try to understand within this valley civilization's exercise,	user	Speaker 1	a778aee5-8b47-493b-8b93-04aba6ac9cdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:01:53.47
20794f5b-2e9c-49e5-9bff-ebf0b30ffecb	548556bb-e428-4a61-bdf0-38d5ae758542	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:03:49.401
d655d8e4-d875-496e-925d-0d8a640925d2	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:06:26
b4e5c8a0-201b-4be7-b592-d64d9971d560	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	Chapter 2, basics have left the college. So what happened is after about the fourth or fifth interview, I had to go through a	user	Speaker 1	106add5d-099e-476f-a39c-9550714ba386	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:07:48.274
ccb0740a-7691-4f97-96cc-0add6b83b732	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	what I would do is I would say, hey, let's not talk about AI. Let's talk about basics of computer science. What happens when you type something in the browser? What happens after that? What is the difference between a browser and a browser? What is the difference between a browser? What is the difference between a browser	user	Speaker 1	106add5d-099e-476f-a39c-9550714ba386	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:07:53.164
d3f6949c-1aa8-4c79-a236-0a5e2bc80618	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	first	user	Speaker 1	106add5d-099e-476f-a39c-9550714ba386	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:08:12.322
3188106a-eddc-4922-a79d-24c340427b48	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	students are super or they haven't learned this. It is not that the students are super or they haven't learned this. It is not that the students are super or they haven't learned this. It is that	user	Speaker 1	106add5d-099e-476f-a39c-9550714ba386	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:08:16.399
acc3d276-7f7b-430c-8cf5-d86acaa2d3dd	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	third year of college. But today, they don't think it is cool enough to revise these. And if you're learning 1 of these topics, you	user	Speaker 1	106add5d-099e-476f-a39c-9550714ba386	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:08:20.517
dab28f5d-e76b-40eb-ace0-50bd14fc1ccb	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	question. I said, hey, if you didn't have let's say if you had a couple of	user	Speaker 1	106add5d-099e-476f-a39c-9550714ba386	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:08:29.175
999125a0-4677-450b-b49a-30db65b3cb64	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	I	user	Speaker 1	106add5d-099e-476f-a39c-9550714ba386	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:08:32.627
d2be9ab2-4122-4e3b-9611-26f6e8a9c00a	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	I brought it further. I said, make this TypeScript work, what is required on a machine. If it's a bare bone Linux	user	Speaker 1	106add5d-099e-476f-a39c-9550714ba386	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:08:35.896
cd96ba10-ffb9-4260-b57c-5af179af3ebc	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	Then I got deeper with a couple of other people. Similar lines. What I observed is they know the tools,	user	Speaker 1	106add5d-099e-476f-a39c-9550714ba386	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:08:40.006
97f710bb-1458-4b58-a9ac-4a4039db1ecc	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	of it. Can answer 5 questions about Kubernetes because they watched videos, they've learned it, they've learned it,	user	Speaker 1	106add5d-099e-476f-a39c-9550714ba386	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:08:44.956
ff747dd6-76c5-480b-a410-bcd627e822af	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	cannot explain what is a Docker container like you would explain to a 5 year old. 0. So	user	Speaker 1	106add5d-099e-476f-a39c-9550714ba386	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:08:48.497
83b6c81f-f426-4c69-8344-6a9f1613a8b3	c00defeb-e9e6-4e65-b7fa-4d69cad576f8	if you know how to deploy on Vercel but do not understand, now type basics first in the comments.	user	Speaker 1	106add5d-099e-476f-a39c-9550714ba386	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:08:52.051
dbd475e7-2134-4965-adba-fa110501a64c	bff0ee7e-c66c-46f7-9c54-34230b37abc0	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:10:25.355
f3b1a55b-6cbd-41c7-877e-fb7eb5e26cc1	d2f751bb-c9b9-4196-85b3-3d4759d79ef9	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:10:50.491
ded05ce1-b648-4497-b937-d80b99441158	85da4ee1-80f4-4fe9-bc61-0be0911ce566	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:12:19.054
fed285cd-9f47-4e77-926e-8d4b79a4da57	f586fa5d-2177-4b6c-bfc0-bd1bcba21690	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:13:05.6
d354f56c-0d0c-4266-af7d-44c81e633342	f2b70160-065b-4c12-902f-49339b4bb63c	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:13:48.199
6d1bbb15-ebb9-4f67-b5ce-59a8a3985ab2	dd90f621-b18b-4ee3-a2bc-cef26edad024	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:16:09.409
dc0f9b8a-70cc-4181-8418-ff5438487195	cc91e810-bef4-4217-9d28-169976e6da5d	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:17:36.57
9d8459c6-6a0d-4246-979b-1bc860fd1cf3	e5bd917c-5f2b-47fa-94d2-29234031731a	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:17:47.475
e4f04557-b40e-4596-b5b5-ad886afa6784	e5bd917c-5f2b-47fa-94d2-29234031731a	First number or as a second	user	Speaker 1	903964ca-73c5-4df9-890e-9bf6098bd8e1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:18:36.061
8852c0a8-8deb-4608-a285-b16855279f3f	bab63ff6-cdc5-4216-988b-bc586652c4d9	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:20:35.708
846c78c5-c767-40ad-a50d-f663a713c741	ecfcf0d0-c5e0-4f2a-9f63-cbb3d29469c5	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:22:49.721
f765d29e-ba3b-4065-8165-b8a2c3afd98b	ecfcf0d0-c5e0-4f2a-9f63-cbb3d29469c5	Equal to 10.	user	Speaker 1	841ca94f-55f1-4fc6-b535-792f4307b6f8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:23:55.375
a1bd3d79-38dd-47db-b15c-850f3ff5b404	4f46ac75-e032-4146-bac0-91c7e80d9913	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:28:28.846
2b2ed878-c38c-4b00-b224-d71dd4a4bdce	2db73666-4750-4e91-b55a-706c4f600012	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:29:01.581
41df001d-1239-4bc3-997c-f39867605e91	6d29773d-c811-47f3-bc3d-0ae9054800b3	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:30:21.769
1cc981ce-4a39-4caa-ab58-1ee9d503e914	54af89e0-3442-4c45-ab7a-15cf17acb283	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:33:47.955
ece70347-fa53-4938-92d9-7fd2ac2a723f	b74d4e29-7e2c-4d97-86c3-48848431b2aa	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:34:30.192
17165b85-839a-4ed0-a9e0-98712d761c0b	75cff7cc-5ff8-4695-8431-6f72083e445a	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:34:34.165
16440090-5b5a-4847-8fe1-687ef88517b1	e18aae1f-f389-4198-bc8a-e60a067dbba3	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:35:22.349
fc51f774-f028-4beb-a63a-4ff6df8751e0	6ba03c92-c041-4feb-8467-6fe2851640d7	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:39:14.305
28dd2ddc-e0f4-41ce-8148-a2cd2920dde2	6ba03c92-c041-4feb-8467-6fe2851640d7	Thus characters represent.	user	Speaker 1	1428141b-b469-47ed-8e86-a53622411be1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:39:48.059
3f8240ab-5a61-43c3-8436-c6f79b654802	6ba03c92-c041-4feb-8467-6fe2851640d7	Or 4 number normally counting 1 2 3 4 5 base 10 0 to 9.	user	Speaker 1	19a46238-c7f6-4f0f-ab18-40ccd163eca6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:39:48.124
a27a784e-37d4-4902-a3da-f49f44b1bf74	6ba03c92-c041-4feb-8467-6fe2851640d7	1 or 0 11 to 1 or 1 repeat.	user	Speaker 1	1428141b-b469-47ed-8e86-a53622411be1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:39:55.644
ddc6aed6-ac7c-4200-881a-66884ad13a97	6ba03c92-c041-4feb-8467-6fe2851640d7	Same 12 13. Right? Unique character	user	Speaker 1	1428141b-b469-47ed-8e86-a53622411be1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:39:58.588
7d1ddb27-bd36-41cd-9435-4042d70ab806	6ba03c92-c041-4feb-8467-6fe2851640d7	decimal number system	user	Speaker 1	1428141b-b469-47ed-8e86-a53622411be1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:40:02.33
59b01a93-c268-4119-9045-98245cdebb0d	6ba03c92-c041-4feb-8467-6fe2851640d7	binary	user	Speaker 1	1428141b-b469-47ed-8e86-a53622411be1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:40:05.371
20772381-3f8d-4234-b376-c12b317a9c0e	6ba03c92-c041-4feb-8467-6fe2851640d7	zeros or 1 0 off, 1 on.	user	Speaker 1	1428141b-b469-47ed-8e86-a53622411be1	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:40:09.292
845f44b6-6207-4aec-af71-16e7c69d649a	0c912445-b906-4845-8a2d-75d601a7a4a1	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:40:38.957
c0d0b67d-049c-49b6-9f48-f8df79acd5ad	ce283b9c-4e61-4c32-bf03-e1bbfd410652	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:42:22.576
1a255ae2-448e-482e-a9b8-c8731becf7f0	82d8fede-6f36-4ef8-a79e-0245c7c6512e	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:42:35.844
e71b59d8-1e59-4b66-96c8-9c3664f77a4b	9cebd895-9246-4f16-9350-a155e1f7c7d7	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:44:17.365
243c4810-cfb8-4b33-826c-dc0cd78386d9	574087f0-eb3a-48ea-bb39-723c70b2aee5	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:47:20.014
961b7b23-feb9-46d2-b7b3-d762687e90a2	1ec39f55-ccea-4408-8fe9-389178073002	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:48:32.151
add68967-e1a2-4e42-8c5f-634780df81af	f13210b2-d7ae-45f6-9ed6-c8359bd935a5	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:49:53.354
807216d8-e322-431a-9c52-03c8e7b08515	4080d3b6-0039-4c8e-8e66-4debf7b5edef	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 15:50:28.336
2f2f89e5-ca21-46c4-b986-38ce4febcf78	7015aef4-0c7b-456b-8ea3-d63761f2ee96	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:03:21.266
7ad43290-59ad-47f9-a980-9933ae1790f7	ea1ad94f-2510-4d83-812c-1b77750eb020	Onto our	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:52:16.923
681c7d7f-b739-4f74-873c-bf966f86a6c1	adfc3d09-65bf-4550-867d-a09401af7292	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:03:24.189
a032fc78-0608-4c7f-aaac-5547e9b813d9	38a40ebd-9f37-4907-9b1a-4928d85b82af	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:05:00.737
e77a6559-b47c-4ea9-841c-4b6cf9fcc90a	441bc1f4-740e-475d-adb0-6b3562bed1c6	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:08:22.269
769e0967-5043-465a-acc2-93c871d6ab79	e5285e2e-4fe7-470f-a780-7a43caf7a1f1	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:09:29.754
3781284f-c2ef-4470-9f7b-de3581fa1e69	8f1de13a-649e-4581-967c-38a8456fa2ce	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:10:18.825
f8752758-82c8-4b1c-ad9d-e8f017f970c8	b4d2c809-442a-43dd-a5ab-043737559748	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:11:42.723
01d7e50d-5d92-4069-a830-8ef02e1e816d	a07b1fb8-710d-4f85-87a2-99b26969e854	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:13:47.104
188cc2fc-cb8b-495f-87eb-b7a62cf4b8bb	af6add19-447b-4290-927e-56ae0483ede0	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:14:28.072
a41b1efc-c325-41a0-84dc-45dc57c919ec	c21fdb16-ed43-436c-b768-86daeee66740	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:16:55.576
1b707ea4-f33e-4657-8555-9de232cf7d3f	dcfb8afc-5725-4ffe-abb0-20e03ed64f41	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:17:43.72
4fdc421a-6f3f-4bd3-900b-140e1870830c	5eecc24a-111b-4fd6-ae2c-e5af5ff19aa0	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:18:09.084
39fd55d0-ccf1-4776-bcbb-0471affbc5eb	edf2b8a7-fea3-4593-8418-4f83443a4627	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:18:20.996
5df9e33a-4e81-430d-8f9e-f30545ad2774	aa5f52c2-d779-4be4-b07d-d525109d3bc3	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:22:18.372
728712ec-3dea-44dc-9482-ea9517890ba5	9f264589-8743-451a-9123-b5bd8c9db949	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:26:23.349
02d4adc1-e0e6-4ff8-96c7-1d0b02846939	cf35aae7-8fbc-4cd2-9307-13feb1073596	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:26:55.467
13ebd373-2396-4d0f-b80f-2326556b75e0	1dc2e979-6a2b-4a5e-8199-8976c4afdcd5	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:29:29.348
25862524-8a3c-4e99-b499-390f53a848e7	364b7149-d760-4751-9d8c-f140f33edee6	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:32:30.465
e959bbc4-dcf1-4679-8e70-e7802c3d9855	c2953fa0-88a6-4533-8375-476f578a0cac	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:33:07.424
e8811d13-1496-42a4-8a7b-d01bc52c2142	473adac1-9992-42c2-ab7c-3fed2b68e95d	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:37:48.111
f1acbe40-6fec-4694-bcfc-c2467b9fa25a	2b1207a6-b36c-4fe8-a31d-bb6d2e1b513b	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:40:33.3
ff5ba817-aecd-432d-bbe2-d004d99f4a96	e1a014e2-448e-4efc-992b-f45e5843bffc	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:41:01.509
8dc5e67b-f5ea-4845-ab2e-a934fcb05f7d	16f540e0-d256-4411-ae90-2d8184869167	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:43:49.89
fd797a0e-8bb2-41e6-80c3-7f6744ff27d6	b4489028-8d07-4be6-858b-c065e0d03993	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:44:43.989
863a99ea-b147-4fe3-baa8-683c11861cb1	531b79db-253c-4f84-9a5f-8532ac86f857	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:46:06.997
036ffa2b-c109-4374-ac74-fa39bf7ec75e	9f37ae75-c0b2-4700-b576-8c384e1dfff5	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:47:29.129
400cfe77-9c24-4327-b5a1-908d8134e198	ee8239f1-6d6d-41e9-a487-45c426875083	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:51:10.359
06349276-efa3-434d-b728-da493d4ab88c	5f8be309-5986-4f3b-a1ec-d3586206c6e7	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:51:36.28
0eb75e36-2d5e-4ea9-864c-8f0cf1511916	ea1ad94f-2510-4d83-812c-1b77750eb020	And I can easily follow-up on payments by sending reminders to	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:52:08.763
e35d92f9-9c00-4587-b992-d80c2cc0071f	578affeb-1dce-4207-9393-e27004d71706	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:51:47.995
05d93c83-22f1-4d36-948d-07ef0b4fe684	d0c226c0-fb21-431e-a564-c55631c99203	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:51:53.078
5adf26c9-abfc-45ff-a1fc-fcd20347ceeb	27b7a9a1-111c-49b5-aa21-b054492451e4	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:51:58.372
6c937e54-cdfa-4a70-a22d-990255617210	33693abb-1974-42c0-9708-6cb4fe751cdb	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:52:12.068
885948ee-1f09-4c82-a220-0307ba3e38b3	bf638377-45e5-464c-acb7-75e23e7d2560	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:54:04.242
47749cb0-6d95-45f3-afc6-10b704923925	e50a6d84-7fd2-4814-9851-5ca5b349d892	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:55:05.644
43ceb0d1-e125-49fa-8331-f1ef6b4fcb2a	c0eacef4-6fc1-4d4c-afcf-9a7e99168c83	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 16:55:40.088
b0266a47-2d18-42f9-b434-01d70ff764e6	d305fec0-6c0e-4df3-9ed6-749bcbbcd961	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-24 17:19:14.453
8feb78bc-27b8-4805-8503-73259b72a01b	10105af9-3c13-4731-88ab-b492f34d4d92	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 01:18:13.21
2ba68069-9c82-4170-831e-e6ea934de9a3	7e340c5f-d827-441e-8e92-47a30a597d8b	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 01:21:18.132
26922f25-ea59-42d2-a195-43ed9e75d928	f4b1e49b-5f7d-4f48-94c9-6a570b93e902	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 05:29:58.124
c3f6ecd3-faf1-4894-a49d-11ce5a6237b7	816576c9-548c-4b6e-9d90-55e7a332154f	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 05:37:05.449
93872f35-3e23-4bdd-861d-eabe8979564a	27262233-51c6-4309-894c-8a6382bec70c	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 05:37:28.736
d622fc2f-c77f-4484-b41b-37a6dac14528	43881d93-47d2-4a45-b435-4e5ba3b0962d	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 06:16:14.241
f2415292-40f4-46a8-ae36-006e9bca4f60	fc7754b2-5c24-47fb-a0bd-c10883d6de3c	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:16:50.606
16ecdab6-7145-4ef6-afbf-3acb2a6fb66a	feca82e8-c5ed-4575-9b53-93cb4de7b640	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:32:36.417
76bc6481-ae16-4a2f-8183-ed459e5487e8	0a963761-8280-418c-ab8f-ba6b739e5cec	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:33:18.258
6ddf2716-4f15-47b1-8e92-33d941f54b43	f428c0a9-deb2-455b-9673-0602df401672	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:33:49.28
35863a2a-bacd-43bf-ab20-7cca4df2df7b	fd18faf3-fcf8-4f9b-9fe8-02924c39b26a	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:33:54.595
59c4e9ca-c972-4335-816c-10e200998d41	9186a495-44bb-41f2-8753-ac32589b9dc3	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:33:57.369
66bef526-a12d-469d-bd17-47276e1d8571	121c9a95-e644-4396-b489-b91817697880	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:34:06.184
c767b9f3-6af0-46f9-bbac-3a5780cd0df3	121c9a95-e644-4396-b489-b91817697880	In email marketing, you can now send campaigns not only to customers,	user	Speaker 1	1ddd4a22-a368-4aee-b167-b9467b87d023	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:34:24.501
ea4ae6ab-5859-47f2-a7eb-9c68fab782a9	121c9a95-e644-4396-b489-b91817697880	but also to employees and suppliers.	user	Speaker 1	1ddd4a22-a368-4aee-b167-b9467b87d023	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:34:32.349
fb0c0c2f-3ba4-4a3a-a60c-71e4e6be9d53	121c9a95-e644-4396-b489-b91817697880	Add your social media accounts anywhere in your email.	user	Speaker 1	1ddd4a22-a368-4aee-b167-b9467b87d023	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:34:33.351
7979a633-c26d-4fe1-8ac3-cf4f89b69bce	121c9a95-e644-4396-b489-b91817697880	And customize how they appear in your mailings.	user	Speaker 1	1ddd4a22-a368-4aee-b167-b9467b87d023	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:34:34.961
64faca59-6f62-41a0-b1b2-1bb1d7e7bfed	121c9a95-e644-4396-b489-b91817697880	Just like on the website builder, save your favorite email	user	Speaker 1	1ddd4a22-a368-4aee-b167-b9467b87d023	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:34:41.112
ec6206a1-d4cd-4ca2-8807-6170628aefb8	121c9a95-e644-4396-b489-b91817697880	blocks and reuse them across future campaigns.	user	Speaker 1	1ddd4a22-a368-4aee-b167-b9467b87d023	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:34:44.546
36280aa8-036b-450c-b878-5dc93314481b	121c9a95-e644-4396-b489-b91817697880	And display specific blocks only when certain conditions are met	user	Speaker 1	1ddd4a22-a368-4aee-b167-b9467b87d023	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:34:48.947
90c56379-7af6-4571-8846-7efe246bb238	691f790e-38ff-40c3-b09f-a6c755e301e9	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:36:56.024
44976afd-0f65-49eb-a12a-32d69f874c72	94ab7011-2f8e-48ab-ae45-feb3abaf0a80	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:37:02.71
03dbabc3-a78a-4897-9416-1c337e38a314	bf7a407c-9acd-4516-acf8-9dd3e96f9405	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:41:08.8
5e57e148-84b7-4f38-a000-824650531bfb	bf7a407c-9acd-4516-acf8-9dd3e96f9405	The right folder, so do insurance documents. And even better,	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:41:27.91
8d83545d-7eea-4e31-8a36-eea275a8f1ed	bf7a407c-9acd-4516-acf8-9dd3e96f9405	activities are automatically created for the right assignee.	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:41:33.465
e00f7b99-12ea-49f8-a4af-7aede9321cd0	bf7a407c-9acd-4516-acf8-9dd3e96f9405	And whenever the client send me an email with receipts or invoices directly in the email body,	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:41:38.012
a484b9a6-ebcd-4a61-9311-a6acf57b1256	bf7a407c-9acd-4516-acf8-9dd3e96f9405	Odoo converts them into PDFs automatically so I can preview,	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:41:44.487
e65763bb-c034-44a4-9b4e-f13882f2a07e	bf7a407c-9acd-4516-acf8-9dd3e96f9405	store, and search them easily in documents. Another great	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:41:47.349
b1bc643d-ff6b-4f21-b526-dc569b91b5c9	bf7a407c-9acd-4516-acf8-9dd3e96f9405	thing is that I can open and preview any types of files on documents,	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:41:50.567
19a330ab-1992-46c2-9f98-1e04937f48f6	bf7a407c-9acd-4516-acf8-9dd3e96f9405	such as HTML, PDF, TXT, XML,	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:41:54.219
2f821f03-37e7-4994-9aca-b778c9146e05	bf7a407c-9acd-4516-acf8-9dd3e96f9405	and a bunch of other file types. And I can easily add files from the documents	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:41:58.773
30755166-faef-4199-af54-ddd9dc650721	bf7a407c-9acd-4516-acf8-9dd3e96f9405	app anywhere on Odoo using the slash command.	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:42:03.752
0296f278-7341-46c3-8165-13d988ef41c0	bf7a407c-9acd-4516-acf8-9dd3e96f9405	Finally, these quick action buttons are really handy.	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:42:07.672
726f9526-79ed-41f9-ac9c-ec7fa3eb9c4e	bf7a407c-9acd-4516-acf8-9dd3e96f9405	I can share the document, download it, rename it, and see more info with 1 click.	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:42:10.849
791db35e-893a-48f9-9650-2f70c96e8771	bf7a407c-9acd-4516-acf8-9dd3e96f9405	I just named the report, specify the dates of the journal I want included,	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:42:28.817
04362c2f-c3df-4d59-94ab-d72f245e3ae2	bf7a407c-9acd-4516-acf8-9dd3e96f9405	and we're good to go. There's a whole list of pre made legal texts	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:42:33.833
13556275-5618-4309-8cef-9ade56be3754	bf7a407c-9acd-4516-acf8-9dd3e96f9405	I can choose to include, all based on dynamic texts.	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:42:37.952
ae27009f-4f0c-4da7-88eb-5522150a5238	bf7a407c-9acd-4516-acf8-9dd3e96f9405	My colleagues and I can then sign the report easily in different places	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:42:41.027
7a85dca0-04e4-4832-a73c-a2c85ba8fe55	bf7a407c-9acd-4516-acf8-9dd3e96f9405	and I can add extra sign fields wherever needed.	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:42:45.945
3114ac56-d1f5-49af-b5cc-c67cf6d5df00	bf7a407c-9acd-4516-acf8-9dd3e96f9405	All important accounting reports are included. And if I need to showcase specific results,	user	Speaker 1	e48fd9d3-8a07-43c9-bee0-c3f1d4c02b6f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:42:49.808
84764280-be56-4da5-a8fc-b92e18e40cf4	a92f566d-1be2-44b8-80e8-23dd796fd134	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:42:54.777
a71d82eb-88fc-494b-8290-2b809b39353a	4f70c9b7-0b61-4fc9-960a-a13fd55619fe	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:48:58.82
5b89e7c9-f39d-4581-b30f-a05e4a1cb108	914bb773-5575-4855-85f6-4d4dd59b5206	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:49:05.458
ed482ed6-d2a2-4033-a1c0-2213ef9e257b	ac774953-ff1d-4a2f-954f-ec8f804ad97e	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:50:05.159
caf12b06-56f4-4c88-bc82-1b75f21e5f00	ea1ad94f-2510-4d83-812c-1b77750eb020	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:50:41.871
cc2594d1-2fca-4dc0-b1ab-e5519ed94809	ea1ad94f-2510-4d83-812c-1b77750eb020	Example, lets me write off the amount to any account.	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:51:11.594
7cd03d6f-a827-4780-a815-68568e84a640	ea1ad94f-2510-4d83-812c-1b77750eb020	And as I'm not an accountant, these descriptions help me select the correct account.	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:51:15.158
aca8d597-3b2f-4a42-ac0e-3f9d13ec6322	ea1ad94f-2510-4d83-812c-1b77750eb020	I'd still like my accountant to take a look at this transaction, though.	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:51:19.948
234a15d4-f22b-49bf-a5fa-d24c2db4b6e3	ea1ad94f-2510-4d83-812c-1b77750eb020	So I'll ask her to review it. On her side, she can take a quick look with	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:51:24.048
2c667181-28fa-4404-a071-403dcbdeeaa5	ea1ad94f-2510-4d83-812c-1b77750eb020	the filters and mark it as reviewed once it's done.	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:51:28.034
b71bbd95-c3e9-4873-92fb-360ca6c92e70	ea1ad94f-2510-4d83-812c-1b77750eb020	If a bank statement processed through OCR has	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:51:31.773
9558c1bc-42a3-4f35-be1a-2a960a1dbe91	ea1ad94f-2510-4d83-812c-1b77750eb020	incorrect balances, I can manually correct the starting and ending balance by	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:51:36.588
e8c984af-55d0-428e-94de-c2fa504a6b7f	ea1ad94f-2510-4d83-812c-1b77750eb020	clicking on the fields and then on the appropriate number in the PDF.	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:51:41.04
f839e812-b52d-4a63-894f-3aa77e46d5e6	ea1ad94f-2510-4d83-812c-1b77750eb020	To simplify tax mapping, it has been moved from fiscal positions to the tax record itself. Simply choose which	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:51:49.593
50daefc1-eea0-4fa7-a1cb-3864486f8664	ea1ad94f-2510-4d83-812c-1b77750eb020	fiscal positions the change applies to and which taxes this 1 replaces.	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:51:53.699
71647652-fa1b-4c80-b885-46f1065b2d85	ea1ad94f-2510-4d83-812c-1b77750eb020	customers with outstanding balances even through WhatsApp.	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:52:13.375
275395a3-c9a2-4e3e-ac65-50bde1d1e454	ea1ad94f-2510-4d83-812c-1b77750eb020	It's easier to configure multiple signers directly within the document.	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:52:25.352
ae568955-c6a9-4308-819d-187a0bfb612d	a17d704a-784f-4ea2-89c2-f663b1e2642e	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:52:48.168
061983c3-55d3-4fbc-8e3d-02d4e17d5787	ea1ad94f-2510-4d83-812c-1b77750eb020	signing process. The interface has a sleek new design	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:52:20.372
36a71aa6-d622-4877-b47c-dd0c0cccdbc1	ea1ad94f-2510-4d83-812c-1b77750eb020	And we can just copy paste any field to save time and keep things consistent.	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:52:30.26
526d2795-83b7-4368-8d1f-8f9a9f946f87	ea1ad94f-2510-4d83-812c-1b77750eb020	When I need several documents signed by a client, I just upload them all at once.	user	Speaker 1	5918838e-d2c1-4145-8a45-5e414556a210	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:52:39.644
acda1dca-e274-47a1-a0a6-78f1e9573bf5	00d1e53c-2dfb-48ce-8226-9a48abb52f01	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:52:40.423
2ce33cad-61bb-4a5b-82e1-336932075b2f	ca3e60ef-da5d-4dd7-90cf-25753ef16cc9	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:53:03.998
98afb255-1532-423c-b4d7-6b2b3cb7bd44	21cdfa9b-b581-4e7b-b46b-753edeae5f6b	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:53:47.48
55571aeb-965f-42c5-8ae1-397ed78d3662	82ef5cc1-4820-4763-8e8b-cadb756ede9d	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:54:45.335
e41a4c2b-9682-4f54-babf-64f0946a03d7	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:55:39.654
ef6a6895-d04f-4b82-9361-8a4959ed3537	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	Here, I showcase the different types of wood available for this sofa.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:55:59.698
2ded312e-1e00-45d1-af9e-b66ab5faddcc	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	As pictures, making my product even clearer for my customers.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:56:03.724
053e8598-b4ca-4122-85ef-d449f2ee1195	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	Once my product page is published, it's displayed on Google.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:56:07.562
00ba385c-026f-44c7-83ce-1d8aea957002	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	The price, ratings, and reviews significantly improve my ads,	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:56:11.927
21896836-4282-453f-b0fc-cd359f53fef3	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	and attract people to my website.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:56:16.158
a52ce349-b5aa-41e7-9b26-cbbef7a457cd	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	I also link my catalog to social platforms and marketplaces like TikTok shop,	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:56:19.587
ec52b662-1d7d-4068-bd78-9411974f067e	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	Facebook, Instagram, Amazon, and more.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:56:23.565
cf8d4137-10f6-48a1-8292-a5c4185cbdbc	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	And I spare valuable time by letting AI generate a compelling	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:56:27.257
8191c29a-5a00-4ea2-8a9d-56c63599bd37	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	instantly.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:56:31.148
1bfc3c76-e698-434c-8062-15f6c7c2f0ec	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	No more manual translations.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:56:35.341
7596f9ee-dc15-4d41-9cdc-034d57a5be59	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	Of course, visitors can still contact us directly with the live chat.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:56:38.556
5029e3cd-7351-4507-9ae3-7f9187ddedb0	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	It's easier than ever as conversations are directly forwarded to an operator with the right	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:56:43.139
a341f310-4342-45c6-b908-d103778e0d81	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	expertise. And the concurrent chat limits feature limits the number of conversations a live	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:56:48.173
c3c81f07-16d2-45cb-b84e-88f15c83ab79	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	chat operator can handle at the same time, keeping my team from feeling overwhelmed.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:56:52.667
7c696e94-9da9-4681-a888-dceb0e10ead4	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	Making it easy for the client to revisit the exchange anytime.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:57:09.016
2cc57d93-cafd-4d46-8622-5ac20092579e	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	And keep all the information on hand. On my side, I can track	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:57:12.649
8491de72-0300-4e8a-afd4-89c5ec5927f7	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	all ongoing conversations with the new live chat dashboards.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:57:16.316
0773432b-8c9b-4f7a-9cc2-23c8985961f8	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	So in order to sell our products, we need to make sure our stock is kept up to date.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:57:21.157
cbe7a5f3-a8c9-4a39-901e-90148782def3	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	The new purchase dashboard gives me a pulse on the company.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:57:25.777
f769e2b0-57e2-4127-b3a3-f2bc2520535b	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	Pending RFQs, orders awaiting approval,	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:57:29.029
a40628a4-3290-4c92-a380-63aaa49f14f4	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	average on time delivery scores for each supplier, and even upcoming expected arrivals.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:57:32.933
b2cdc9c2-dfd0-41e8-81ca-7645ebe366c2	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	I can just drag and drop a sales order and it appears as a PO.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:57:37.877
a3556e46-5279-469e-876e-ef63008c2f44	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	Complete with lines, discounts, and sections.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:57:41.668
5296a132-c8e7-42f7-95ed-a6256c8fac53	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	The purchase catalog now suggests how many units I should order.	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:57:45.117
3e46f720-ad26-406f-9820-b79fdcaafc7e	5b725faa-c3e5-4aea-9fd9-96dfa5f05e99	I can turn this feature on or off, set the replenishment	user	Speaker 1	789bcfe3-7942-439a-b69c-3bb73b3494dc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:57:48.763
748ca773-3116-4b9c-b965-a4e96c09fae3	cd4ebce3-2a9f-4ea8-861b-6f143ca366ec	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:57:52.657
5ba0c02e-f7b2-4fed-a200-58f1d03bc4f8	a0069ef5-16c3-4779-b9d2-dfd4feef0302	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:58:05.306
a92b14e8-5dde-48ba-a3c5-55ac9c54c3fd	e6326623-36b1-4c40-a7d6-37043358e8f5	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:58:10.144
5b69f2a7-5a06-437a-bb0c-9f83edc1ff96	2e9c90b8-48bd-4570-9883-1e20cee4622f	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:58:13.388
89748b1e-fef9-4dd8-9fb1-b92b9046b2f3	a7706383-3826-40c2-b204-9869ac2e6b9a	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:58:32.318
102ac37a-3827-4438-a00b-39d2c094a599	1c58278f-d830-4810-b510-110be745aff3	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:59:05.297
f6af5f0f-e285-49ca-8089-f8e56f98aa8e	154a70e5-1be5-4397-b2f2-23adcbeb8b19	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 18:59:16.704
d98e701c-c690-4898-bce6-3469eae06814	db734d5f-94a3-4331-b0d2-1f22e04ee1cb	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:02:06.116
c28db2d4-5919-464b-9100-c2149ff19af6	e0939882-dad2-4bd4-8d73-d61cd109c341	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:02:26.884
f578a433-a25e-48c2-a973-2b6c46c307f0	cb8642f8-3c37-4e17-b697-68d12ab8845a	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:02:33.82
fc1d533a-2963-4b84-af7e-dcf55347c609	b7500bbe-15e4-4df0-9ccc-80c4c970b414	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:02:40.109
6b2516f0-a7d3-44f4-a329-8044d1769ecf	17054413-9cf2-4d63-8a17-6edf87264af4	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:02:45.048
110fb679-3552-44a2-8f61-ee33732f9d90	5383df42-fad8-45e2-a771-2a9398b02281	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:09:40.934
ce976ace-685e-47fc-9337-b4dcbfc5ba9c	e8e20ace-9190-4cae-b336-36253e1c9b62	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:10:11.132
5db27a63-0d06-4e11-8105-032a830beb1f	e8e20ace-9190-4cae-b336-36253e1c9b62	List, fiscal positions, preparation capacity,	user	Speaker 1	9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:10:27.54
74ab1bd4-2be2-4961-9386-3093f28a2fc6	e8e20ace-9190-4cae-b336-36253e1c9b62	identification requirements, schedule times, and much more.	user	Speaker 1	9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:10:32.067
2a1dad6e-516d-43b3-a9ec-37c03fccd897	e8e20ace-9190-4cae-b336-36253e1c9b62	Let's say someone calls to order takeout. I'll just take her order,	user	Speaker 1	9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:10:35.52
d2c87787-fa34-4a4b-997f-26ac01f1c092	e8e20ace-9190-4cae-b336-36253e1c9b62	choose the right preset, and add the day and time.	user	Speaker 1	9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:10:39.543
8b21ec0e-ab5e-4637-9673-5cb9678ec9c3	e8e20ace-9190-4cae-b336-36253e1c9b62	In the case of a delivery, I just select an existing customer	user	Speaker 1	9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:10:42.669
234b56e2-598a-4c5e-b8e5-51556e67bdea	e8e20ace-9190-4cae-b336-36253e1c9b62	or create a new 1 with their delivery address. Those presets make me	user	Speaker 1	9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:10:46.016
88ced280-6ca9-4e3a-ac26-3b6b1f759859	e8e20ace-9190-4cae-b336-36253e1c9b62	loads of time and I can create as many as I want.	user	Speaker 1	9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:10:49.874
ebee7501-c621-4633-8910-31db761912ba	e8e20ace-9190-4cae-b336-36253e1c9b62	And talking about delivery, Odoo supports almost every platform	user	Speaker 1	9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:10:54.362
18ef65d0-342e-4825-8a1a-8e53103b15d3	e8e20ace-9190-4cae-b336-36253e1c9b62	including Takeaway, Kareem, Grubhub, Deliveroo, and many more.	user	Speaker 1	9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:10:58.146
0c667244-c663-43de-a576-bb22f9bbe628	e8e20ace-9190-4cae-b336-36253e1c9b62	Let's go back to our waiter and his customers. The waiter selects	user	Speaker 1	9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:11:02.582
e170a051-0fb4-48a5-b664-9a9e0f6c522b	e8e20ace-9190-4cae-b336-36253e1c9b62	course 1 for the starter and course 2 for the main dish.	user	Speaker 1	9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:11:06.617
9d6e7f83-be9f-407d-9372-f72a7792a16f	e8e20ace-9190-4cae-b336-36253e1c9b62	Once confirmed, the kitchen prepares the appetizer first while the main course remains on hold.	user	Speaker 1	9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:11:15.746
ae5a4db0-5bf6-4786-bf11-2b419814ea71	e8e20ace-9190-4cae-b336-36253e1c9b62	They can't perform sensitive actions such as open POS sessions,	user	Speaker 1	9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:11:36.064
a8233f33-506e-413f-907e-8a6f5a76702d	e8e20ace-9190-4cae-b336-36253e1c9b62	perform cash in or cash out operations, apply discounts, and so on.	user	Speaker 1	9d0d73c6-763c-4cb3-ac59-4531ce1d7fea	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:11:39.965
50110258-cea5-479a-8e70-e5ff7004063a	8eef9221-1419-4d2f-8c24-45558da7c113	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:12:10.942
1728e837-f139-4b3e-9952-209fd4115e88	8eef9221-1419-4d2f-8c24-45558da7c113	You can specify how many items your client can choose in a specific combo	user	Speaker 1	24dfbbd7-4268-4239-bc2e-674cdc1d3ed3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:12:26.361
5b12d2f7-6181-4f53-af77-9133553f5c6c	8eef9221-1419-4d2f-8c24-45558da7c113	and if some of them are given for free. Now,	user	Speaker 1	24dfbbd7-4268-4239-bc2e-674cdc1d3ed3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:12:31.981
42409b20-1c3a-44d5-afcc-c1a468b275ff	8eef9221-1419-4d2f-8c24-45558da7c113	all the client has to do is pay online, choose their table,	user	Speaker 1	24dfbbd7-4268-4239-bc2e-674cdc1d3ed3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:12:35.089
bd577e1d-fc31-4b3b-9b9e-5df736c79220	8eef9221-1419-4d2f-8c24-45558da7c113	We'll just specify a name, date, time, and number of people.	user	Speaker 1	24dfbbd7-4268-4239-bc2e-674cdc1d3ed3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:12:46.147
7c0cbf99-b6d0-44a7-a051-e0ff509e91ff	8eef9221-1419-4d2f-8c24-45558da7c113	and the order is ready to be brought to her.	user	Speaker 1	24dfbbd7-4268-4239-bc2e-674cdc1d3ed3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:12:35.518
556f9cdd-f729-4b36-b87d-092a3481e537	8eef9221-1419-4d2f-8c24-45558da7c113	And they can even download her receipt if needed.	user	Speaker 1	24dfbbd7-4268-4239-bc2e-674cdc1d3ed3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:12:39.849
48e079cf-b018-4419-81dc-f8759ac56377	8eef9221-1419-4d2f-8c24-45558da7c113	Someone calls to book a table.	user	Speaker 1	24dfbbd7-4268-4239-bc2e-674cdc1d3ed3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:12:42.912
96a8b844-c332-427d-9654-56c6b960db95	4ca1d79c-56d6-4177-a59f-5e8cf6d3a462	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:12:52.785
23f7a39a-e6da-412c-b2c3-384f90425840	1676231b-ce00-4651-920a-470228903ead	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:14:58.36
008e74ef-ff94-4f9b-8840-b04292211828	1676231b-ce00-4651-920a-470228903ead	This is done for all of our purchases, so our carbon footprint is always up to date	user	Speaker 1	e82fb652-ada5-4480-b3eb-303cd72260a8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:15:21.829
2b53d359-7e81-436e-9440-9825916c213b	c7ab08ab-5539-4233-af8f-d2a8c02e0ee9	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:15:31.799
d4e2e9e9-56ec-40af-b805-1e2180242e74	c9427942-2710-4110-aca4-ff1f782efb17	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:15:37.823
773d8c86-397b-4d36-8212-c02d1bf9c908	dc540ffc-b7eb-43fb-a303-02d963a9d58a	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:15:46.175
035229a0-0126-42e6-93cd-4981dd40f486	08443cb5-af2b-46de-bdc7-0da15013e76d	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:15:54.165
40b0fac3-3cca-40f9-ade8-5067de8bb32a	36749878-ddf7-43e2-8149-e5115543b7b8	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:15:57.72
f51230e1-57eb-43cf-a900-6dfbe36951e5	85dbe640-0d40-431b-920e-f0603c4e0461	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:16:05.626
e664852f-37c4-49b9-8d2e-7974c3c71d60	2d130594-3f7d-4cad-81ef-993a7d0cfcfb	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:16:07.979
48befe45-267e-4523-94f5-2f2c98f4f145	3a3f09c6-bd15-408b-b9cd-54c791de8efd	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:16:14.55
3e216e04-4447-4b93-a67e-f3225781894b	8ad81539-275b-4224-8cbf-464e50a1f612	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:16:24.933
35fe067b-ca5f-42d1-b486-3ff361fe8ec8	ade60ab0-c63e-4fdc-b9aa-0535535acf12	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:16:31.678
9f1ee717-9ccd-4085-8546-5a7cd484291d	0dee2176-d7b8-4a0c-82a2-43001b4e89c5	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:16:37.998
46f35f57-5c99-4965-bd42-1924861f980f	46d6ded0-abad-47ef-a933-037fc29be1e0	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:17:48.755
5aae82c0-67a9-49e1-9e7c-eb9af0ee2bf1	46d6ded0-abad-47ef-a933-037fc29be1e0	As all data is synced in real time,	user	Speaker 1	77956531-22bd-4901-9af1-87bb54caea1c	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:18:05.184
51d40fd3-f98a-442d-af3d-41b2d540fe63	46d6ded0-abad-47ef-a933-037fc29be1e0	and we can export it in just 1 click.	user	Speaker 1	77956531-22bd-4901-9af1-87bb54caea1c	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:18:09.145
aa91de02-bf93-4422-a6d1-c5deec697868	46d6ded0-abad-47ef-a933-037fc29be1e0	Okay. Let's take a look at our team. I can now look back at any employee's	user	Speaker 1	77956531-22bd-4901-9af1-87bb54caea1c	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:18:13.005
b37a6940-b6cf-45ac-9a9d-6fdb8568b6a8	46d6ded0-abad-47ef-a933-037fc29be1e0	previous period and job position. Let's add a new period	user	Speaker 1	77956531-22bd-4901-9af1-87bb54caea1c	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:18:17.381
405220cb-72bf-46a0-8acb-68c0506041a9	46d6ded0-abad-47ef-a933-037fc29be1e0	starting on the October 1 so I can give her a well deserved raise	user	Speaker 1	77956531-22bd-4901-9af1-87bb54caea1c	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:18:20.974
bb7d99d6-921e-4cb3-8483-6a613a0fc037	21582840-54d9-46a1-8e2d-563412cf6ef1	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:18:27.039
00edc227-053c-40e3-b6b6-c90bb4aa41c0	0b14eb48-a6b4-4bb2-b40c-0c3585d781fe	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:18:31.503
4e0fde86-8d40-475c-88c6-bc16a32f6f74	0b14eb48-a6b4-4bb2-b40c-0c3585d781fe	For 100 customized databases, whatever your line of work,	user	Speaker 1	4d429306-aee2-4885-b2a3-e9ee4eded1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:18:57.822
7b336cd1-15a8-477e-9773-a8ae2e74c7ed	0b14eb48-a6b4-4bb2-b40c-0c3585d781fe	Odoo has a tailored solution for you.	user	Speaker 1	4d429306-aee2-4885-b2a3-e9ee4eded1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:19:01.682
3a741713-8004-4aaa-9275-4924996d9a03	0b14eb48-a6b4-4bb2-b40c-0c3585d781fe	Whether you're a beverage distributor managing inventory, a real estate agent agency connecting buyers and sellers, a law firm requesting documents from clients,	user	Speaker 1	4d429306-aee2-4885-b2a3-e9ee4eded1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:19:09.225
fdf870f0-f3f3-4f06-8fd7-ef1a55d9390e	0b14eb48-a6b4-4bb2-b40c-0c3585d781fe	a clothing store adding countless items to your database,	user	Speaker 1	4d429306-aee2-4885-b2a3-e9ee4eded1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:19:12.878
d8ea89af-e736-4330-ae89-3711ade56740	0b14eb48-a6b4-4bb2-b40c-0c3585d781fe	a bar keeping purchases simple, a brewery invoicing with excises.	user	Speaker 1	4d429306-aee2-4885-b2a3-e9ee4eded1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:19:16.571
0dcc6463-749e-4b53-b19b-74f58edd3882	0b14eb48-a6b4-4bb2-b40c-0c3585d781fe	Wellness center booking client appointments, a fitness club offering flexible subscriptions,	user	Speaker 1	4d429306-aee2-4885-b2a3-e9ee4eded1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:19:21.244
722b317b-4568-468a-9b6c-b9fc84611e9d	0b14eb48-a6b4-4bb2-b40c-0c3585d781fe	a construction firm preparing complex quotes, or anything else.	user	Speaker 1	4d429306-aee2-4885-b2a3-e9ee4eded1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:19:34.529
9a13b528-1e4e-4e74-9996-143a88214c30	0b14eb48-a6b4-4bb2-b40c-0c3585d781fe	a toy store building an online presence,	user	Speaker 1	4d429306-aee2-4885-b2a3-e9ee4eded1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:19:27.019
9a1f3149-3bdc-4cfd-9ca1-270c37a32cfd	0b14eb48-a6b4-4bb2-b40c-0c3585d781fe	Odoo's got something for you.	user	Speaker 1	4d429306-aee2-4885-b2a3-e9ee4eded1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:19:35.229
59f33648-629b-4560-a8dd-4f3d6c699a18	0b14eb48-a6b4-4bb2-b40c-0c3585d781fe	Go to odoo.com today and level up your business with Odoo 19.	user	Speaker 1	4d429306-aee2-4885-b2a3-e9ee4eded1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:19:40.899
be035a8b-3165-4387-aa5a-f29ecbf0b6a4	b4e40507-46f7-4e67-b768-fb1523e3fd15	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:20:26.552
de248fde-aa34-4b51-b49f-d8d3be6b822c	feba299f-4008-4146-a4cc-84f7ad8b90a8	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:20:37.826
f2fcf490-9acc-472d-817d-69e699e29b30	07a4ad53-e0c6-45a9-8d05-184c17411123	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:20:46.013
f27307c9-81b3-4a44-9f6d-7be1a92044c5	86285ce1-7050-4ec6-bc1a-eb5bc433d5e2	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:23:01.578
80e305e2-04a4-44f9-8992-f0a1d3612450	86285ce1-7050-4ec6-bc1a-eb5bc433d5e2	In the replenishment dashboard,	user	Speaker 1	a4bd7e28-5e77-4d93-9a88-cdb58ebb1031	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:24:12.321
120601ac-1da4-4729-ad1d-7610af02e5f1	86285ce1-7050-4ec6-bc1a-eb5bc433d5e2	the order and order to max buttons have been merged into a single button	user	Speaker 1	a4bd7e28-5e77-4d93-9a88-cdb58ebb1031	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:24:17.157
f8e6b520-c823-4297-8aec-aef3f9c55a96	86285ce1-7050-4ec6-bc1a-eb5bc433d5e2	By default, when you click order, Odoo uses the value shown in the	user	Speaker 1	a4bd7e28-5e77-4d93-9a88-cdb58ebb1031	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:24:21.081
dbba6417-207b-4d45-bec3-37408080bdb3	86285ce1-7050-4ec6-bc1a-eb5bc433d5e2	order column for the purchase order. And if you manually adjust that value,	user	Speaker 1	a4bd7e28-5e77-4d93-9a88-cdb58ebb1031	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:24:25.646
0d395055-7893-4991-b449-e0a715e4466c	86285ce1-7050-4ec6-bc1a-eb5bc433d5e2	Odoo uses the updated quantity when creating the PO.	user	Speaker 1	a4bd7e28-5e77-4d93-9a88-cdb58ebb1031	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:24:32.191
6bb0bcf4-d2b6-4f47-8ee4-6a36a69de9ea	86285ce1-7050-4ec6-bc1a-eb5bc433d5e2	In project,	user	Speaker 1	a4bd7e28-5e77-4d93-9a88-cdb58ebb1031	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:24:35.331
067df422-5719-4a8d-8ff9-f5597108ca6e	86285ce1-7050-4ec6-bc1a-eb5bc433d5e2	assign team members to specific project roles for clearer responsibilities across your project.	user	Speaker 1	a4bd7e28-5e77-4d93-9a88-cdb58ebb1031	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:24:38.302
7c3d0711-28a1-4b3d-94ad-468600d69602	de11b189-63a6-479b-83ef-6357766066f5	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:24:40.914
e6f78a49-7d3e-4fc9-8e00-7fc8e0599d6c	de11b189-63a6-479b-83ef-6357766066f5	The generate leads feature now suggests more ways to bring new opportunities into your pipeline.	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:25:12.792
6c16f890-134d-4309-b42c-6534284f9c50	de11b189-63a6-479b-83ef-6357766066f5	Apply conditional formatting rules based on dates	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:25:20.638
72e7e2c0-686a-4031-8b8c-9d9b6f6f20e4	de11b189-63a6-479b-83ef-6357766066f5	to instantly highlight important information.	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:25:23.811
0d810370-2946-42c6-8ee7-2138d3fc8e03	de11b189-63a6-479b-83ef-6357766066f5	And there's plenty more to explore, so be sure to	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:25:27.505
2a1074fe-4aac-4042-a86c-297fd211ac5c	de11b189-63a6-479b-83ef-6357766066f5	check out the full release notes for the complete list of improvements. Try it out today	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:25:30.737
7d87c047-c208-4660-b76b-7aea62746b77	de11b189-63a6-479b-83ef-6357766066f5	and let Odoo do the heavy lifting.	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:25:35.21
8bc5e51c-4547-4711-be52-bf9954e12ba2	de11b189-63a6-479b-83ef-6357766066f5	Mailings.	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:26:03.42
375fd2ca-4688-497f-aedb-09dfe68b845b	de11b189-63a6-479b-83ef-6357766066f5	Just like on the website builder, save your favorite email blocks,	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:26:08.431
61450f44-4010-4a45-b1ed-47ca267e9104	de11b189-63a6-479b-83ef-6357766066f5	and reuse them across future campaigns.	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:26:13.519
bd4af608-94f3-4477-bbfd-a34467fd4744	de11b189-63a6-479b-83ef-6357766066f5	And display specific blocks only when certain conditions are met.	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:26:17.17
b085560a-4e63-43dd-bcc9-20cb5044c796	de11b189-63a6-479b-83ef-6357766066f5	So you can tailor each mailing to individual recipients.	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:26:22.6
a0b02837-d344-45e7-aa06-2abfc9155e15	de11b189-63a6-479b-83ef-6357766066f5	Pin important messages in the chatter,	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:26:27.641
d54425ac-b09c-4c32-b208-3551c8f94b33	de11b189-63a6-479b-83ef-6357766066f5	so key information stays visible for everyone.	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:26:28.928
d0a2fab2-2a95-4c9a-8870-6442d108e6ff	de11b189-63a6-479b-83ef-6357766066f5	When totals are converted between currencies, the exchange rate date is now	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:26:35.71
3a400b95-47e3-4b20-be6a-d905a93ba526	de11b189-63a6-479b-83ef-6357766066f5	clearly displayed for better transparency. You can now import	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:26:39.334
70f27579-3efe-4116-9d26-ec3c7c7e5f6d	de11b189-63a6-479b-83ef-6357766066f5	product variants in bulk, including their attribute values, costs,	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:26:41.93
92098dd5-19bb-4c35-bf23-e7c5579aa29e	de11b189-63a6-479b-83ef-6357766066f5	quantities, and more.	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:26:45.935
cf5c5572-aa38-4be8-af86-4d4aaeecb2eb	de11b189-63a6-479b-83ef-6357766066f5	Create polls directly inside your conversations to collect feedback	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:26:51.563
0c12bffc-3a11-4bd5-8071-5f3248528be2	de11b189-63a6-479b-83ef-6357766066f5	or make quick decisions.	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:26:54.038
578563e5-6533-451f-9c20-8b4133f2d0dd	de11b189-63a6-479b-83ef-6357766066f5	Mark channels as favorites so your most important conversations are always easy to find.	user	Speaker 1	0a11a5b2-f86d-42ed-9f1d-f34bce68058f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:26:58.25
98b15eaa-e377-4e26-9960-fb2c0d774997	1e2890f9-f8a3-4da9-88c6-94471ff5d671	And delivery. These are handy	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:35:51.923
c1846456-42e0-4526-8c1d-e173b737d62b	1c968c58-b59c-42d8-86f8-dc7f84393849	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:27:05.037
3d5a68ee-5905-45fe-93ac-935f05431700	7d0a8c81-9de1-420b-a984-0b2a046dc2b5	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:27:32.936
d0160298-d1dd-4354-b2d7-db0aac8ca899	5eba7c94-d804-421b-814a-8662c35c5773	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:27:46.472
2b9d34e1-9be5-4f60-99dd-ce095e9525dc	ceb40c06-3c8c-45c6-a84a-712a55ad58d6	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:28:03.097
46c078b9-190b-4a13-8a41-433b90d1fdd1	2865a164-ee81-4524-9984-0450e4bb4213	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:29:27.539
b5702b7e-6ed1-4580-aed8-788f5f8188e0	9da3f838-3138-42d4-88c5-2868c6078c3a	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:29:51.773
53be3d01-a08c-4523-9050-c6c1256f211d	9da3f838-3138-42d4-88c5-2868c6078c3a	Single envelope where I can arrange the order and add the required fields.	user	Speaker 1	65c9b54a-97ee-48df-a430-e00b33ef0fbc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:30:08.77
3423c2c9-f858-4f1f-bc58-07283ea2dd8f	9da3f838-3138-42d4-88c5-2868c6078c3a	Then I click send.	user	Speaker 1	65c9b54a-97ee-48df-a430-e00b33ef0fbc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:30:15.633
71100ba9-84ad-4ffb-a1a2-31b44ae61bff	9da3f838-3138-42d4-88c5-2868c6078c3a	And my client receives 1 document to review and sign everything in 1 go.	user	Speaker 1	65c9b54a-97ee-48df-a430-e00b33ef0fbc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:30:16.665
3560cd72-fb06-46bf-8e7c-b458658b69a7	9da3f838-3138-42d4-88c5-2868c6078c3a	For this client, let's create a project. We'll just select 1 of the templates we made,	user	Speaker 1	65c9b54a-97ee-48df-a430-e00b33ef0fbc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:30:23.918
48db0924-c3e7-4070-8570-baa0f7b2b122	9da3f838-3138-42d4-88c5-2868c6078c3a	adapt the title, and just like that, the right tasks are added automatically.	user	Speaker 1	65c9b54a-97ee-48df-a430-e00b33ef0fbc	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:30:29.008
09c67e3f-f0f3-4e79-861c-e46ec5c2d5c0	2eedfc49-21a0-45b3-a703-45890436cf4d	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:31:09.384
c531414a-a03e-452f-bceb-cf9abd9e9e28	2eedfc49-21a0-45b3-a703-45890436cf4d	Templates, each designed by professional web designers to fit different styles and needs.	user	Speaker 1	85958507-14e9-4a62-8e21-8fbdf0215194	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:32:41.224
e2c3bbaa-c380-4f2b-a706-0b85ad19c178	2eedfc49-21a0-45b3-a703-45890436cf4d	Whether I'm showing off my full collection or just the best sellers,	user	Speaker 1	85958507-14e9-4a62-8e21-8fbdf0215194	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:32:45.636
c6e60268-9ec8-452e-992e-cf597d31e908	2eedfc49-21a0-45b3-a703-45890436cf4d	there's always a template ready to match my style.	user	Speaker 1	85958507-14e9-4a62-8e21-8fbdf0215194	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:32:50.242
f0786e3f-bc85-4230-a4e3-096efb416ede	67702751-a80c-4af1-b222-ba8bd4930ef3	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:33:22.588
e565f918-b492-4db2-af19-0a4b6aefbbe3	a25effeb-5ac4-4c1d-b1c0-8a72fa07df30	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:33:31.819
4f475043-645e-4de5-9708-ec3e64cbb2db	1e2890f9-f8a3-4da9-88c6-94471ff5d671	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:34:09.959
01441a74-7f3f-43e0-a6ab-8efe2121ec1f	1e2890f9-f8a3-4da9-88c6-94471ff5d671	In the side panel so they can prioritize and respond faster.	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:34:23.925
a69e07ca-01f2-47af-a679-8d039ab026a8	1e2890f9-f8a3-4da9-88c6-94471ff5d671	And then they'll send the visitor a copy of the conversation	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:34:27.112
bb81e1f5-dbeb-441c-969a-0ea31dcf5e4e	1e2890f9-f8a3-4da9-88c6-94471ff5d671	making it easy for the client to revisit the exchange anytime.	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:34:30.41
5a8a8111-94f2-4806-b348-f58d23f2d8cd	1e2890f9-f8a3-4da9-88c6-94471ff5d671	And keep all the information on hand.	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:34:33.925
ef586014-e43d-4669-8c4a-ff9453f3ae91	1e2890f9-f8a3-4da9-88c6-94471ff5d671	On my side, I can track all ongoing conversations with the new live chat dashboard.	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:34:37.293
d45b3026-a717-450e-afad-5a73ff0b6a7c	1e2890f9-f8a3-4da9-88c6-94471ff5d671	So in order to sell our products, we need to make sure our stock is kept up to date.	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:34:42.696
125d984f-47bf-46cc-ac78-c5611e97c594	1e2890f9-f8a3-4da9-88c6-94471ff5d671	The new purchase dashboard gives me a pulse on the company.	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:34:47.135
84af853a-be55-4bf3-9bfe-92a42ce188c4	1e2890f9-f8a3-4da9-88c6-94471ff5d671	Pending RFQs, orders awaiting approval,	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:34:50.967
ec45bde3-019a-465f-9b3f-fb3a19892ef0	1e2890f9-f8a3-4da9-88c6-94471ff5d671	average on time delivery scores for each supplier,	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:34:54.217
1d3d025f-9c0b-47df-ba6f-bcca0209eb69	1e2890f9-f8a3-4da9-88c6-94471ff5d671	and even upcoming expected arrivals. I can just drag and drop a sales order, and it appears as a PO, complete with lines, discounts,	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:35:00.916
6612c72d-f520-4671-a66c-c6c0a2330c92	1e2890f9-f8a3-4da9-88c6-94471ff5d671	and sections. The purchase catalog now suggests how many units I should order.	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:35:05.414
875df52a-4d61-4720-8cc3-dcccb1da891e	1e2890f9-f8a3-4da9-88c6-94471ff5d671	Let's go to our store's restaurant and see how the team is doing over	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:35:30.195
6267a7fb-f56c-4643-abb2-3b2466c140c9	1e2890f9-f8a3-4da9-88c6-94471ff5d671	there. Our restaurant has 2 floors and a patio.	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:35:35.178
6245f879-2bc7-426c-8172-30513f557278	1e2890f9-f8a3-4da9-88c6-94471ff5d671	as I can configure options such as price lists, fiscal positions,	user	Speaker 1	9c10b637-3f6e-4ce5-b1d2-a848a02b762f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-25 19:35:55.385
9e97c657-3923-48b8-8004-0808b9f93c42	ff8d8745-2dfd-4109-8b84-eec427ed15e0	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 02:59:55.395
bbf68c5f-7507-4623-a579-e2c58ae3971f	e6d0d140-922a-4319-af02-48953503b32d	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 03:00:09.225
c772dca6-a383-4bdd-8cc1-e95fde16a510	669a3c0c-785c-498e-a1ba-ce0c878d310f	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 03:01:05.226
7c4772c6-47b0-4de8-b8cf-860b14f27c2d	79d29370-7f02-4172-bce1-3375f2b5b47f	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:18:17.455
58068697-9bab-4138-baa8-9b59f5b902a2	79d29370-7f02-4172-bce1-3375f2b5b47f	Agents to stronger manufacturing controls and better collaboration tools	user	Speaker 1	9be9d15c-a919-4d86-8755-ee548891cdd0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:19:15.561
8b619f0f-0dd7-46ac-b716-8bb602ab8d53	79d29370-7f02-4172-bce1-3375f2b5b47f	this release is all about helping teams work more efficiently with less friction.	user	Speaker 1	9be9d15c-a919-4d86-8755-ee548891cdd0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:19:18.602
d08d12a1-273c-4e96-b849-904d00644d77	79d29370-7f02-4172-bce1-3375f2b5b47f	Let's dive straight into 19 point one's most important improvements. Let's start with AI. When building a view, you can now ask an AI agent for grouping by day, month,	user	Speaker 1	9be9d15c-a919-4d86-8755-ee548891cdd0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:19:25.952
9941c5e1-1141-4689-ad68-8f57d8bd877b	79d29370-7f02-4172-bce1-3375f2b5b47f	quarter, or year. And Odoo AI applies the correct date grouping automatically	user	Speaker 1	9be9d15c-a919-4d86-8755-ee548891cdd0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:19:26.925
c38afbd7-fabf-4af1-a279-933823965f4b	79d29370-7f02-4172-bce1-3375f2b5b47f	While previewing a document, simply ask the AI agent about its	user	Speaker 1	9be9d15c-a919-4d86-8755-ee548891cdd0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:19:32.349
3c68a89c-453e-409d-a343-50d4409199d0	199faedf-36fd-4f47-9a2f-2869bd0f06c4	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:19:38.761
8a715159-737a-41b3-9272-a0ff60c370e8	64603515-2ca4-4d7c-91f6-d443b8372d19	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:20:00.607
6ad4c099-7174-473b-845c-b275c231e145	cf336250-12d3-436b-90c0-a950da4ee474	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:20:27.751
daf8e99d-771b-40bd-9e55-d488cd73f8ee	cf336250-12d3-436b-90c0-a950da4ee474	Can reflect differences in size, color, or configuration.	user	Speaker 1	9b5a5993-1684-42e1-86ce-7325469b616c	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:20:53.531
3c4fca13-1e73-47fb-b190-a214952e93de	cf336250-12d3-436b-90c0-a950da4ee474	In email marketing, you can now send campaigns not only to customers,	user	Speaker 1	9b5a5993-1684-42e1-86ce-7325469b616c	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:21:00.913
e6a9308b-f535-4093-9691-59782b5676b0	7010965a-722f-4c4c-8683-701aab90852a	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:21:06.134
6d079295-5a34-4cf0-a5d6-474110dcf9af	d0bd2c67-a796-4c94-9b34-457dd56c9e3f	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:24:12.473
97f8cb4c-804c-4525-8df4-d74581889be4	b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:31:25.6
eb582325-7f85-4b04-a04c-2192fa051612	b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	Then ask any questions based on their content.	user	Speaker 1	9fb00fa0-9bea-400e-90cb-3d30c55d96e2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:31:48.585
66d354cb-a57c-4fb1-af80-e800cc48b0b1	b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	Finally, instead of a generic thinking message, AI agents now show what their	user	Speaker 1	9fb00fa0-9bea-400e-90cb-3d30c55d96e2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:31:54.505
2355e118-e541-4699-9559-2755b58b9066	b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	actually doing. This gives you clearer feedback while your request is being processed.	user	Speaker 1	9fb00fa0-9bea-400e-90cb-3d30c55d96e2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:31:58.164
8f7b36bd-4f7b-4ca1-b4de-8ad7f95a6ed2	b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	On point of sales, customers can now leave notes at checkout when self ordering.	user	Speaker 1	9fb00fa0-9bea-400e-90cb-3d30c55d96e2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:32:07.526
e6146a57-6a3e-4e88-87f8-8c998bc05ca0	b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	These notes are then clearly displayed on the kitchen screen.	user	Speaker 1	9fb00fa0-9bea-400e-90cb-3d30c55d96e2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:32:12.376
91c9ecae-c9df-42e0-9115-ea2229d348c0	b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	When selecting several items that can be combined into a combo,	user	Speaker 1	9fb00fa0-9bea-400e-90cb-3d30c55d96e2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:32:17.83
5bb22223-f5fd-4858-9446-5a99defef51c	b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	the point of sale now suggests creating a combo automatically.	user	Speaker 1	9fb00fa0-9bea-400e-90cb-3d30c55d96e2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:32:22.128
5c799d34-e7d2-4d9f-af8a-e14968328416	b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	Let's move to website. When translating a contact	user	Speaker 1	9fb00fa0-9bea-400e-90cb-3d30c55d96e2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:32:30.913
fcc0f15d-960f-4895-8d05-cde6f05deb9e	b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	form that includes a selection field, you can now translate all values at once.	user	Speaker 1	9fb00fa0-9bea-400e-90cb-3d30c55d96e2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:32:33.192
9abb6f6c-4f44-442f-94b8-a15e9118c673	b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	In a single click without leaving the page.	user	Speaker 1	9fb00fa0-9bea-400e-90cb-3d30c55d96e2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:32:38.436
2fb7dcb7-b506-4fba-9dad-7c9b6ec1af0e	b8f2e4ff-c5ac-49e9-839b-c7b141db4d08	Add videos in a vertical format for a better display	user	Speaker 1	9fb00fa0-9bea-400e-90cb-3d30c55d96e2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:32:41.485
3dc2df95-2858-4fac-919c-0761398b7f63	49f2c9ee-2011-416a-88f0-42cdaed39655	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:32:51.419
cb6379dd-9cad-4c50-9a0c-e6c3acb649b3	49f2c9ee-2011-416a-88f0-42cdaed39655	Just like on the website builder, save your favorite email blocks	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:33:25.415
20ff6ff4-ea69-4ae1-bfb2-5a2a14c77041	49f2c9ee-2011-416a-88f0-42cdaed39655	and reuse them across future campaigns.	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:33:34.756
5db2ce6a-bd1c-4e3a-9c97-2bf5e20daf13	49f2c9ee-2011-416a-88f0-42cdaed39655	And display specific blocks only when certain conditions are met	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:33:36.994
3f7638bb-7adb-4952-9542-501e0ada89de	49f2c9ee-2011-416a-88f0-42cdaed39655	so you can tailor each mailing to individual recipients.	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:33:46.147
be17f35b-5b6b-4628-a867-20ef2728850a	49f2c9ee-2011-416a-88f0-42cdaed39655	Pin important messages in the chatter,	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:33:46.875
bd9253d2-efdd-4187-af29-6c8b06b15978	49f2c9ee-2011-416a-88f0-42cdaed39655	so key information stays	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:33:49.707
cbeb874c-3fcb-4780-a1cf-201db13916d3	49f2c9ee-2011-416a-88f0-42cdaed39655	Totals are converted to c c c c c's. The exchange rate date	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:33:53.029
eb57a681-a152-4a42-ac06-f271900fd7d5	49f2c9ee-2011-416a-88f0-42cdaed39655	variants in bulk, including their attribute values,	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:34:01.986
337bad11-cfbf-4804-afdb-4b064622e41f	49f2c9ee-2011-416a-88f0-42cdaed39655	costs, quantities, and more.	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:34:06.296
f7a140ff-bc7d-4d95-82e2-57b9066f5384	49f2c9ee-2011-416a-88f0-42cdaed39655	Create polls directly inside your conversations to collect feedback,	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:34:07.317
95a4fc93-9d7c-46c3-9d11-32b0b32b8251	49f2c9ee-2011-416a-88f0-42cdaed39655	or make quick decisions.	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:34:19.461
53dfd4b2-ab6b-4f7c-936d-70fad4dd03ff	49f2c9ee-2011-416a-88f0-42cdaed39655	Mark channels as favorites so your most important conversation	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:34:19.569
4db7baf7-36d2-486e-adf8-f757bee05021	49f2c9ee-2011-416a-88f0-42cdaed39655	are always easy to find. In manufacturing,	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:34:22.406
ff0f97d2-8b00-4f08-b797-c9b414acc5ed	49f2c9ee-2011-416a-88f0-42cdaed39655	when you plan several manufacturing orders with different scheduled dates,	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:34:35.432
f4719684-42d9-4f1d-988e-5641a2c27594	49f2c9ee-2011-416a-88f0-42cdaed39655	Odoo now ignores those dates and plans them as soon as possible.	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:34:43.557
da6752f5-ba22-4cb8-94b8-295b19d80636	49f2c9ee-2011-416a-88f0-42cdaed39655	The order of the list determines which MOs are planned first,	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:34:47.806
a8257905-c898-4524-9512-6452e2e4c64e	49f2c9ee-2011-416a-88f0-42cdaed39655	When you reduce the quantity on an ongoing manufacturing order,	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:34:54.424
a46c352c-24df-441a-ab59-71d303249448	49f2c9ee-2011-416a-88f0-42cdaed39655	Odoo now lets you split the order if you plan to produce the remaining quantity later.	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:34:54.827
83b4d1eb-bec8-47ac-869f-e7aa8003bffb	49f2c9ee-2011-416a-88f0-42cdaed39655	The original order is updated, and a new manufacturing order is created for the remaining	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:35:07.171
2076bf77-2efa-4f84-83db-1e7efa75e6c0	49f2c9ee-2011-416a-88f0-42cdaed39655	or disrupting your planning. Let's go to inventory.	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:35:10.246
c12b88aa-fa51-4de7-bc60-586e3deeee2d	49f2c9ee-2011-416a-88f0-42cdaed39655	quantity so you can keep production moving without closing the order too early	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:35:11.015
f72cf338-0df7-414f-a130-56248f827421	49f2c9ee-2011-416a-88f0-42cdaed39655	In the replenishment dashboard, the order and order to max buttons have been merged into a single button. By default, when you click order,	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:35:19.903
9c655768-10eb-474e-9f0c-97182536d0d8	49f2c9ee-2011-416a-88f0-42cdaed39655	Odoo uses the value shown in the to order column for the purchase order.	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:35:23.394
5e271bda-ba1b-43d9-ba18-94fb409511ae	49f2c9ee-2011-416a-88f0-42cdaed39655	And if you manually adjust that value, Odoo uses the updated	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:35:24.693
b1b6cb5a-9a4d-4bd7-ba15-8ebb3f24f87f	49f2c9ee-2011-416a-88f0-42cdaed39655	In project, assign team members to specific project roles	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:35:30.716
86b51cfe-3c88-4b40-b130-9582c3d22ab9	49f2c9ee-2011-416a-88f0-42cdaed39655	for clearer responsibilities across your projects. And time sheets	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:35:31.227
96bae385-4e47-4f7f-9702-d8207949731e	49f2c9ee-2011-416a-88f0-42cdaed39655	is now integrated with activity watch. Just go to the time sheet assistant menu,	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:35:36.435
a5e503ce-2556-47bc-9562-2c7e41a1ed62	49f2c9ee-2011-416a-88f0-42cdaed39655	Apply conditional formatting rules based on dates	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:36:24.698
175c18c0-0ff1-4a37-9625-ae13162d9ce3	49f2c9ee-2011-416a-88f0-42cdaed39655	to instantly highlight important information.	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:36:24.819
bea420b8-89b7-43af-aad7-c51d985db624	49f2c9ee-2011-416a-88f0-42cdaed39655	And there's plenty more to explore, so be sure to check	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:36:25.212
0fdc60f1-b144-45cf-839c-d1a99c0b6a78	49f2c9ee-2011-416a-88f0-42cdaed39655	Try it out today and let Odoo do the heavy lifting.	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:36:27.085
f2ed9e77-fd24-4118-8a0d-732fe6e0ce7b	49f2c9ee-2011-416a-88f0-42cdaed39655	out the full release notes for the complete list of improvements.	user	Speaker 1	a5fd8fc8-9c99-4802-b1a4-41f6f05fc979	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:36:27.091
692b4234-e76e-4d55-b9db-6091f1f74bdd	46ce04d1-2343-4f4e-a55a-90ed76eab146	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:37:56.109
99da9fbb-2dac-49fd-ad85-0f152c41a1da	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:38:42.901
24a4ca06-8a7d-416f-a858-ad423175b27c	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	Thinking message, AI agents now show what they're actually doing.	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:39:02.666
f9490064-8930-4cab-b70d-14a1e07dc3a4	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	This gives you clearer feedback while your request is being processed.	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:39:10.965
b8f1282e-9fe7-4259-bada-f184d2ecca67	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	On point of sales,	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:39:14.812
f72f8ad0-c3ba-4446-9104-211b3832ae3f	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	customers can now leave notes at checkout when self ordering.	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:39:19.036
5890071a-2007-46cb-b755-89a8a3310c76	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	These notes are then clearly displayed on the kitchen screen.	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:39:24.86
dd72002d-ef15-465b-a819-15a73bb7ac69	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	When selecting several items that can be combined into a combo,	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:39:30.199
f00c9f69-37e0-4428-ab85-55f851898406	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	the point of sale now suggests creating a combo automatically.	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:39:32.098
3cf1c222-787f-469e-8a2b-9f9ab683fe06	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	Let's move to website. When translating a contact	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:39:34.515
63bc3fa0-dc35-4034-b5f0-df775f39abf6	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	form that includes a selection field, you can now translate all values at once.	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:39:37.656
178abcf6-b315-4d2b-9d1c-cc8865aefbbd	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	In a single click without leaving the page.	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:39:42.433
c4df0096-e321-43f9-866b-922954e75136	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	Add videos in a vertical format for a better display.	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:39:46.928
eafb14d1-5d9c-48d8-955d-0087dccb0775	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	And add anchors to cards for easier navigation.	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:39:50.549
6e6dd0b1-7f15-4838-bc63-dbfd41f6cae1	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	Especially on mobile devices.	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:39:55.362
0e023bbc-e52e-44ad-9905-4fa6dc4326d0	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	Edit the sales price directly on individual product variants	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:39:59.167
e12e6178-0378-4235-b9cd-b15971483636	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	so the price can reflect differences in size, color, or configuration.	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:40:06.351
516accaa-a2c9-408c-98b3-d4ce11190f80	93d3effc-2fe7-4e4b-82d5-ea24ef96b3f0	In email marketing, you can now send campaigns not only to customers,	user	Speaker 1	6423a2b0-6eb4-438c-b79a-5299c01eaa14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:40:12.598
df8c047e-91aa-4669-afa3-6357ed71a4a3	823fc94d-de98-4c6c-963a-cad2ae4e9eaa	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 16:40:18.706
16665d9d-fe05-4d24-a84f-8e99b94def27	36f8747f-af55-4639-90ad-04cbb549c9c0	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 19:52:39.134
b956ea10-3082-4304-b9e5-380706b08bb7	dd0052ad-b995-4f50-be0f-0b7b26a7bd8d	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 19:53:13.797
cf868e5a-55ac-47de-ad5a-a1759ca9d3a3	28d1e770-ce14-40cb-b578-a4e301a20215	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 19:58:54.123
3e6d103e-4fb7-4e89-8faa-7c6fe0368bb5	4966abcc-5656-475f-949a-336255dfc465	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 20:01:09.211
4e2ec67b-fbec-4db6-ad5f-b5ef1622031d	5f05f871-3e63-4c53-89af-7210a077d33b	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 20:01:49.793
92945009-6712-4cce-9c1b-5f8d6c953ffa	bdb12c64-2acb-4111-9ad2-0bd6bfafc424	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 20:06:00.704
9d58afa3-1551-4c7e-8fe8-bd4c2fab5102	0af7802f-cf6b-48fc-887d-b92acbe17e95	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 20:09:37.882
29bb2405-8990-4e4d-9725-99de2d5a996f	c1f492a5-3eca-47a9-bf25-1e0c2d0bcc1e	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 20:09:54.28
441aaca4-24be-4006-8327-0d124b3f28a1	71ba8aff-0514-4a7b-8edf-c7b18cb8c3e7	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 20:10:49.652
e0f6c46d-565e-4afa-ba3a-2ccb861d8f78	7421dd4d-3612-4db1-adf6-3019d68d2bae	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 20:13:40.366
cd2f20c2-188a-48bf-8b71-8e8c18421749	a47094ad-1994-4ce9-90d6-513bcb5e39d4	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 20:13:45.88
ae03aa52-281e-4127-b7f6-5e88702c440d	1430a0d3-0695-4981-a64f-3a0cf6b7d65c	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-26 20:14:45.818
\.


--
-- Data for Name: organization_addons; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.organization_addons (id, organization_id, type, status, start_date, end_date, auto_renew, purchase_amount, currency, gateway_transaction_id, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: organization_memberships; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.organization_memberships (id, organization_id, user_id, role, status, joined_at, left_at) FROM stdin;
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.organizations (id, company_name, billing_email, primary_manager_id, razorpay_customer_id, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: otps; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.otps (id, email, code, expires_at, attempts, is_used, created_at) FROM stdin;
4d2e6260-72ff-4671-9028-cefaad77b2b3	sanket@plasmax.tech	594888	2026-02-23 05:34:57.911	0	t	2026-02-23 05:24:57.923032
564088dd-fa20-4090-9578-a3a1944bf068	wymylufe@denipl.net	756491	2026-02-23 05:42:31.372	0	t	2026-02-23 05:32:31.384394
037a0da4-de9e-4dbc-8e28-b4e2a231d101	natiqo@forexzig.com	454710	2026-02-23 21:17:07.261	0	t	2026-02-23 21:07:07.27316
928a95c7-c240-4673-96c4-d4ef59dc868a	hello@kunalpatil.me	745369	2026-02-22 09:22:17.709	0	f	2026-02-22 09:12:17.457477
1b4b1485-07a5-427d-bf1e-bd9a0d7e13f1	bobyzehy@denipl.net	175307	2026-02-22 09:22:58.744	0	f	2026-02-22 09:12:58.491979
ccd707df-8249-4fdb-a58c-c9f537965f31	nilibilu@forexzig.com	928600	2026-02-22 09:28:30.037	0	f	2026-02-22 09:18:29.792747
1f048ada-9caf-4c1f-b6c6-4dd49149f32f	gogulosa@denipl.com	706541	2026-02-22 09:38:00.606	0	f	2026-02-22 09:28:00.367217
f3faf3b1-33cd-4d1f-a659-1c2f1fbf6be9	nalicefo@denipl.net	376868	2026-02-22 09:40:53.968	0	f	2026-02-22 09:30:53.724909
b5360b42-140e-47af-ae5f-940344a526c3	xigacypa@denipl.net	470144	2026-02-22 09:42:57.769	0	t	2026-02-22 09:32:57.523521
a9b71ad5-9779-48f7-9f1b-a8c9d9cb0319	rekasuro@fxzig.com	871078	2026-02-22 09:52:57.318	0	t	2026-02-22 09:42:57.075095
1c220979-3e7d-45f0-8d69-742e29010530	2022.kunal.patil@ves.ac.in	761990	2026-02-22 12:59:58.179	0	t	2026-02-22 12:49:58.968426
c602e873-a9ae-4db2-9f50-9a29a25c30be	zefybo@denipl.com	450559	2026-02-22 16:59:21.335	0	f	2026-02-22 16:49:21.337386
221db3e4-1126-4c39-a40f-4246da1ca6d2	cesego@forexzig.com	139299	2026-02-22 20:03:38.452	0	t	2026-02-22 19:53:38.453823
1ef85df8-01af-4a34-a838-ae09586497fa	natiqo@forexzig.com	993025	2026-02-22 20:04:29.741	0	f	2026-02-22 19:54:29.744573
d0364129-1979-40ef-96d9-00fcb7f6afd4	sanket@plasmax.tech	299428	2026-02-23 05:26:07.078	0	t	2026-02-23 05:16:07.079985
1ddc23c4-852f-4adb-848d-c06760185885	visoxecy@denipl.net	883737	2026-02-24 14:08:06.914	0	f	2026-02-24 13:58:07.464951
48057014-3f6f-42c0-989b-28b539f6c1d1	tabaresi@forexzig.com	292087	2026-02-24 14:10:29.362	0	f	2026-02-24 14:00:29.897401
d483f59c-8b31-4ee4-aa73-3cdd16e8462f	zulekyra@denipl.com	271754	2026-02-24 14:12:00.931	0	t	2026-02-24 14:02:01.490248
1bbc41de-b1a8-4a79-ab47-6ab8fd142700	pepocyjy@forexzig.com	140572	2026-02-24 14:28:44.482	0	t	2026-02-24 14:18:45.03314
5aa81d61-d4fc-45a1-87f0-171ecdf5042e	qereqevu@denipl.net	455112	2026-02-24 14:37:20.831	0	t	2026-02-24 14:27:21.377648
7f6f8708-9b48-42b1-81dc-1b9484e7b37b	puqykywy@fxzig.com	336956	2026-02-24 14:44:42.925	0	t	2026-02-24 14:34:43.47694
67930495-7dc6-4e3e-a4e2-3a76de03297c	hytekola@denipl.com	423386	2026-02-24 14:57:46.195	0	t	2026-02-24 14:47:46.759478
0d9c1ec2-99c8-40f7-80f6-f5d56ffc8771	vecowaja@denipl.com	811330	2026-02-24 15:07:04.368	0	t	2026-02-24 14:57:04.91997
dc55cf30-264f-45ed-a1a5-2833948cd8f5	nycezohe@fxzig.com	869280	2026-02-24 15:16:01.391	0	t	2026-02-24 15:06:01.942311
6d73637a-3e52-4a41-a973-490497b5e5e8	lixufelo@fxzig.com	630320	2026-02-24 15:27:17.954	0	t	2026-02-24 15:17:18.52486
b36325af-807e-42e3-ba26-8608282004c0	gixeje@denipl.net	703816	2026-02-24 15:42:30.33	0	f	2026-02-24 15:32:30.900566
b2df5946-1301-421c-9a73-2f9c33131281	lamumify@forexzig.com	480154	2026-02-24 15:43:27.149	0	t	2026-02-24 15:33:27.718238
2522f443-9796-46d2-8623-9a5886969568	rakumyvy@forexzig.com	376682	2026-02-24 15:57:01.884	0	t	2026-02-24 15:47:02.461864
85c7b98d-fa50-4c74-b6c9-ffcd1912378a	tetenime@denipl.net	860035	2026-02-24 16:14:39.615	0	t	2026-02-24 16:04:40.189551
45226a3c-ec96-4e14-983f-e72712452f35	viniqi@forexzig.com	884020	2026-02-24 16:24:11.63	0	t	2026-02-24 16:14:12.208762
e18f4478-7cce-4cdf-9e71-9af7e55b4e26	donipewe@fxzig.com	475100	2026-02-24 16:36:37.022	0	t	2026-02-24 16:26:37.604332
231ddf31-55dc-4985-aa77-03976bab64ed	hocepozy@denipl.com	631921	2026-02-24 16:47:22.977	0	t	2026-02-24 16:37:23.554186
fcf43cfb-3432-4b80-9a3c-5a149afbdf1a	gotize@denipl.com	291336	2026-02-24 16:54:25.539	0	t	2026-02-24 16:44:26.132923
24f97251-7a5f-443c-8af7-1a0058f22e86	posetaga@denipl.com	579579	2026-02-24 17:03:45.677	0	t	2026-02-24 16:53:46.267686
db8d83f4-7d68-4869-8650-9b27ff887997	wecolaqe@denipl.net	284939	2026-02-25 18:29:08.918	0	f	2026-02-25 18:19:08.929442
7ce559f0-f4bd-4f9d-b7e5-1ccef92240a7	lacopizi@denipl.net	592519	2026-02-25 18:42:16.62	0	t	2026-02-25 18:32:19.351091
81c5cf24-381f-435e-9b5e-a368accb1e91	facoxa@denipl.net	188780	2026-02-25 18:50:46.372	0	t	2026-02-25 18:40:49.106092
4a37a29d-fd28-4cb0-8bfd-ab9dc5388013	mazajaja@denipl.com	585325	2026-02-25 19:05:20.56	0	t	2026-02-25 18:55:23.286133
ff024f87-f2d1-4597-9a2c-8a4c585cd7ce	delape@denipl.net	947492	2026-02-25 19:16:12.418	0	t	2026-02-25 19:06:15.142571
62d09175-5c09-46c1-9ca4-a4e3e968e01a	theo712@attendness.com	457133	2026-02-26 03:19:37.985	0	f	2026-02-26 03:09:37.996792
4ad1080c-152e-4b21-9f94-d2564e398b15	newlicense@openmail.pro	249211	2026-02-26 03:21:22.305	0	f	2026-02-26 03:11:22.316997
adcf06fc-eb5f-4b02-bbbc-5cb57e6c7eba	18msb@dollicons.com	153079	2026-02-26 03:26:04.239	0	f	2026-02-26 03:16:04.251388
dbb5e26a-b261-481a-bf59-c9421977e9a7	pefobo7412@hutudns.com	648296	2026-02-26 03:33:11.899	0	f	2026-02-26 03:23:11.909958
a4cddd64-ead3-4c75-b8c9-b3d81ad9adf5	pefobo7412@hutudns.com	332756	2026-02-26 03:33:40.422	0	f	2026-02-26 03:23:40.433793
81491941-01fe-41e8-b3a3-c5e3ffffa55b	pefobo7412@hutudns.com	472599	2026-02-26 03:34:43.494	0	f	2026-02-26 03:24:43.507072
f8f6eced-a736-49bd-a5ce-b90e1c02eb20	18msb@dollicons.com	885419	2026-02-26 03:35:25.168	0	f	2026-02-26 03:25:25.180856
d6b9d02e-08c4-45e7-bbd1-ccf56e8b99bf	18msb@dollicons.com	432439	2026-02-26 03:35:43.107	0	f	2026-02-26 03:25:43.118858
659374e7-d866-4300-80c7-f44b677f4e00	qzof5hqoxg@mkzaso.com	351624	2026-02-26 03:40:59.115	0	f	2026-02-26 03:30:59.126502
f4b1df5a-d638-4d47-bf4c-cab2f314b2cf	2022.kunal.patil@ves.ac.in	887652	2026-02-26 04:20:46.821	0	f	2026-02-26 04:10:46.833113
3be55d85-10d3-4c63-96c8-023fa0fa1413	2022.kunal.patil@ves.ac.in	984132	2026-02-26 11:24:07.665	0	f	2026-02-26 11:14:07.677197
d93d67dd-6521-46bf-924e-de8e96f5b4ef	worldwide.mosquito.emgx@hidingmail.com	381066	2026-02-26 15:18:03.355	0	f	2026-02-26 15:08:03.36738
f1958c89-dd87-48d2-8ac4-f8ec2564d4d3	voteh90097@hutudns.com	924517	2026-02-26 17:57:57.312	0	f	2026-02-26 17:47:57.324297
4cbaf1d3-1e3d-4d70-8871-270072e7f489	voteh90097@hutudns.com	792229	2026-02-26 17:58:28.464	0	f	2026-02-26 17:48:28.477194
443e4b68-66ea-45f1-b541-d01dfd00c9ef	voteh90097@hutudns.com	254697	2026-02-26 17:59:03.655	0	f	2026-02-26 17:49:03.667882
0da49cc4-9c48-4704-8214-8233b423eb3c	voteh90097@hutudns.com	123136	2026-02-26 17:59:16.201	0	f	2026-02-26 17:49:16.213138
8e79b0a4-2d03-4946-8c44-9abb00254e44	voteh90097@hutudns.com	775902	2026-02-26 18:01:29.051	0	f	2026-02-26 17:51:29.062906
e331cb74-f797-4e2a-92a0-fa4e6cdbbe30	pociwil865@bultoc.com	203632	2026-02-26 19:56:21.294	0	f	2026-02-26 19:46:21.305541
5e8721be-b379-4ab4-9fb9-cecf3ca1e85b	heqyzu@denipl.net	572790	2026-02-26 20:08:31.401	0	t	2026-02-26 19:58:31.530264
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.password_reset_tokens (id, email, token, expires_at, is_used, created_at) FROM stdin;
2c8902fa-9e0e-4f08-bf6d-73446bbe753c	testuser@microsoft.com	742ee7d7511487b795acb43ceab691cb6b71a6fa7a25b75fe60cc02761b3975c	2026-02-22 18:48:53.985	f	2026-02-22 12:18:55.216658
e30d0c3a-5f62-4b96-a5cb-a8e6deec31c8	jyhazexy@denipl.net	072178fda9cd38ec9835e69273e5f3e0f82ebbcb59eaee90f692da328271c9a4	2026-02-23 12:12:41.687	t	2026-02-22 12:12:42.458073
66d644a8-a473-4e53-ac9c-7a40b653f7cd	legekewy@denipl.com	f020788fdfa89ec39f1fe38da69091648a2f5d3b636ffc71cb277aac212d7d58	2026-02-23 12:25:10.559	t	2026-02-22 12:25:11.341013
6324c9de-a1d2-4245-b7ac-8cc6e33eaa03	jyhazexy@denipl.net	2132b6751dc40d14a045236035208524a34cce6f079e2cfeb0e93a43e05243b4	2026-02-23 12:30:00.963	f	2026-02-22 12:30:01.750704
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.payments (id, user_id, subscription_id, organization_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency, status, payment_method, receipt_url, metadata, refunded_at, refund_amount, refund_reason, razorpay_refund_id, refunded_by, created_at) FROM stdin;
dec3a6b5-a95f-4bd0-b652-a4d0551ffe63	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	\N	order_SKULUmJsN2JQ9j	pay_SKUM6SdnnVQbhM	\N	17700	USD	succeeded	razorpay	\N	{"type": "cart_checkout", "items": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"totalUnits": 500, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "8", "packageSku": "16b59eb6-e3cb-4235-9a53-df3315c4ed24", "companyName": null, "packageName": "500 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "platform_access", "basePrice": "149", "packageSku": "61a2e346-c35f-4395-8996-b3c4cfe8fcd8", "companyName": null, "packageName": "3 Months Plan", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "orderId": "a3c12c57-5820-427e-a0c1-a71d2a09d31a", "originalAmount": 177, "gatewayProvider": "razorpay"}	\N	\N	\N	\N	\N	2026-02-25 19:09:12.999951
8479de29-d9ba-4172-8ec4-04be8d3ba7e7	76cacf03-9e99-4098-b633-7617082f077e	\N	\N	FREE-1772123169827	free_1772123170082	\N	0.00	USD	succeeded	promo_code_100%	\N	{"type": "cart_checkout", "orderId": "37cadd13-04c4-4d9f-878f-b8a0e781233d", "freePromo": true, "itemCount": 3, "gatewayProvider": "free_promo"}	\N	\N	\N	\N	\N	2026-02-26 16:26:11.710148
\.


--
-- Data for Name: pending_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pending_orders (id, user_id, package_sku, addon_type, amount, currency, gateway_order_id, gateway_provider, status, metadata, expires_at, completed_at, created_at) FROM stdin;
7a6fe963-4245-4d4f-a134-6d8dc543a44c	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	258106b4-6b02-4af3-8b1d-af77d7af29c1	train_me	20.00	USD	order_1771997884276_fba40448	cashfree	expired	{"packageName": "Train Me Add-on (Monthly)", "originalPrice": "20"}	2026-02-25 06:08:04.057	\N	2026-02-25 05:38:04.06929
a3c12c57-5820-427e-a0c1-a71d2a09d31a	9fa878f1-83a8-4afb-aae0-939a0942fa33	CART-MULTI-ITEM	cart_checkout	177.00	USD	order_SKULUmJsN2JQ9j	razorpay	completed	{"items": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"totalUnits": 500, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "8", "packageSku": "16b59eb6-e3cb-4235-9a53-df3315c4ed24", "companyName": null, "packageName": "500 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "platform_access", "basePrice": "149", "packageSku": "61a2e346-c35f-4395-8996-b3c4cfe8fcd8", "companyName": null, "packageName": "3 Months Plan", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "total": 177, "discount": 0, "subtotal": 177, "gstAmount": 0, "itemCount": 3, "finalAmount": 177, "finalCurrency": "USD", "roundoffAmount": 0, "originalCurrency": "USD", "perItemPromoCodes": [{"cartItemId": "1098b0f8-6361-43ec-a64f-79c8a0d94be3", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}, {"cartItemId": "1e8c70c8-8ccf-45d3-802b-97f39e159cfb", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}, {"cartItemId": "d1c0b581-e9f4-4ad0-bb32-68dd09ae0f5d", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}]}	2026-02-25 19:38:11.612	2026-02-25 19:09:13.975	2026-02-25 19:08:14.351144
37cadd13-04c4-4d9f-878f-b8a0e781233d	76cacf03-9e99-4098-b633-7617082f077e	CART-MULTI-ITEM	cart_checkout	0.00	USD	FREE-1772123169827	free_promo	completed	{"items": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "platform_access", "basePrice": "149", "packageSku": "61a2e346-c35f-4395-8996-b3c4cfe8fcd8", "companyName": null, "packageName": "3 Months Plan", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"totalUnits": 500, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "8", "packageSku": "16b59eb6-e3cb-4235-9a53-df3315c4ed24", "companyName": null, "packageName": "500 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "total": 0, "discount": 177, "subtotal": 177, "freePromo": true, "gstAmount": 0, "itemCount": 3, "finalAmount": 0, "finalCurrency": "USD", "roundoffAmount": 0, "originalCurrency": "USD", "perItemPromoCodes": [{"cartItemId": "cc9edac1-838a-4e36-9e59-6c2e5a756f8d", "promoCodeId": "d322a98b-17ca-4925-b33e-7b04390eddd2", "promoCodeCode": "SAVEC100", "appliedDiscountAmount": "20.00"}, {"cartItemId": "2d223719-fc92-4ee6-9b4a-e829d3f9aa10", "promoCodeId": "eb728eb5-ad22-40f3-bc31-094378a4040b", "promoCodeCode": "SAVE100", "appliedDiscountAmount": "149.00"}, {"cartItemId": "50065787-5e76-4d85-a444-96057dd34732", "promoCodeId": "b3587600-8147-4bbc-93f8-3fe7c555ee78", "promoCodeCode": "SAVE100MS", "appliedDiscountAmount": "8.00"}]}	2026-02-26 16:56:09.828	\N	2026-02-26 16:26:11.460417
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, code, name, category, description, key_features, use_cases, target_industries, pricing_model, typical_price, implementation_time, integrates_with, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: promo_codes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.promo_codes (id, code, category, allowed_plan_types, discount_type, discount_value, max_uses, uses_count, is_active, expires_at, created_at, updated_at) FROM stdin;
f60f83b7-122a-4e94-8a49-dc1a75036055	SAVE100DAI	dai	["dai_premium", "dai_basic"]	percentage	100	3	0	t	2026-02-28 00:00:00	2026-02-26 03:07:03.60361	2026-02-26 03:07:03.60361
d322a98b-17ca-4925-b33e-7b04390eddd2	SAVEC100	train_me	["train_me_30_days"]	percentage	100	100	3	t	2026-02-28 00:00:00	2026-02-22 10:24:55.050499	2026-02-26 16:26:10.576
eb728eb5-ad22-40f3-bc31-094378a4040b	SAVE100	platform_subscription	["yearly", "three_year", "six_month", "monthly"]	percentage	100	100	2	t	2026-02-28 00:00:00	2026-02-22 09:57:09.41832	2026-02-26 16:26:11.063
b3587600-8147-4bbc-93f8-3fe7c555ee78	SAVE100MS	session_minutes	["500"]	percentage	100	5	1	t	2026-02-28 00:00:00	2026-02-26 03:06:09.27925	2026-02-26 16:26:11.532
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.refresh_tokens (id, user_id, token, expires_at, created_at) FROM stdin;
9b56815c-960a-47db-af8c-f2fca4cd4088	667aa0de-c6cd-49ac-b091-fd6f2e390019	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjdhYTBkZS1jNmNkLTQ5YWMtYjA5MS1mZDZmMmUzOTAwMTkiLCJlbWFpbCI6InNhbmtldEBwbGFzbWF4LnRlY2giLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoic2Fua2V0ZGh1cmkiLCJzZXNzaW9uVmVyc2lvbiI6MSwiaWF0IjoxNzcxODI0MzE4LCJleHAiOjE3NzI0MjkxMTh9.eQvmE2TJIBdxozl6blZBvIWqFqQbN7jNgRkxtMO81zg	2026-03-02 05:25:18.923	2026-02-23 05:25:18.933865
95df6b02-7d66-4ca6-a6a3-aed09b74c733	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMzE3Yzg4Ny0wZDEwLTRmY2YtOGMxNy1mY2I2MWM4YWI3M2IiLCJlbWFpbCI6Ind5bXlsdWZlQGRlbmlwbC5uZXQiLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoic2F4bzEwMTAiLCJzZXNzaW9uVmVyc2lvbiI6MSwiaWF0IjoxNzcxODI0Nzc0LCJleHAiOjE3NzI0Mjk1NzR9.mcq_G2xoDWrjFnjZHVGcc591sT-JCLsUaUiOCZumktk	2026-03-02 05:32:54.684	2026-02-23 05:32:54.695018
acaed910-aae9-488a-9ec8-0e8a56088113	6786fa29-edbe-4087-97b5-ea4b77bdb286	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Nzg2ZmEyOS1lZGJlLTQwODctOTdiNS1lYTRiNzdiZGIyODYiLCJlbWFpbCI6InBlcG9jeWp5QGZvcmV4emlnLmNvbSIsInJvbGUiOiJ1c2VyIiwidXNlcm5hbWUiOiJwZXBvY3lqeUBmb3JleHppZyIsInNlc3Npb25WZXJzaW9uIjoyLCJpYXQiOjE3NzE5NDMwMjYsImV4cCI6MTc3MjU0NzgyNn0.JOC0g8sMu0RATWXUwI-M47gK7Q524AV69oqJw7PuNdg	2026-03-03 14:23:46.286	2026-02-24 14:23:46.833564
9cc3fc0e-a1c9-403c-8601-17a5be08ab2d	87f0700a-53a9-4909-845a-f79e438f153f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4N2YwNzAwYS01M2E5LTQ5MDktODQ1YS1mNzllNDM4ZjE1M2YiLCJlbWFpbCI6InFlcmVxZXZ1QGRlbmlwbC5uZXQiLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoicWVyZXFldnVAZGVuaXBsLm5ldCIsInNlc3Npb25WZXJzaW9uIjoxLCJpYXQiOjE3NzE5NDMyNjYsImV4cCI6MTc3MjU0ODA2Nn0.E9iNN29fIpj5TG0816pKzDibqomPvj7YisCzpnGN3l0	2026-03-03 14:27:46.673	2026-02-24 14:27:47.243923
6280585b-4a8e-4141-9469-a06090a1fbd1	cb64b05a-101b-4055-ae05-00ec49f58fd8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYjY0YjA1YS0xMDFiLTQwNTUtYWUwNS0wMGVjNDlmNThmZDgiLCJlbWFpbCI6InB1cXlreXd5QGZ4emlnLmNvbSIsInJvbGUiOiJ1c2VyIiwidXNlcm5hbWUiOiIyMDIyLmt1bmFsLnBhdGlsMzM3OSIsInNlc3Npb25WZXJzaW9uIjozLCJpYXQiOjE3NzE5NDQwMjcsImV4cCI6MTc3MjU0ODgyN30.Rwdm4BZ19aCgRQTb4OQlb4uYmDvLTbEZULbEbldM2Y4	2026-03-03 14:40:27.081	2026-02-24 14:40:27.638954
44f4bc28-0b9c-4fdd-8c24-9b994924be47	782bfd26-63f3-4eb9-a91a-380ffafd0bca	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3ODJiZmQyNi02M2YzLTRlYjktYTkxYS0zODBmZmFmZDBiY2EiLCJlbWFpbCI6Imh5dGVrb2xhQGRlbmlwbC5jb20iLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoiaHl0ZWtvbGFAZGVuaXBsLmNvbSIsInNlc3Npb25WZXJzaW9uIjozLCJpYXQiOjE3NzE5NDQ4MTksImV4cCI6MTc3MjU0OTYxOX0.aN4rtVGvLQgiu962Ir5AizSk_6EINgeTnmRm4cXluA8	2026-03-03 14:53:39.254	2026-02-24 14:53:39.819196
ce3768fa-c321-4322-a513-6e3110cb4941	827ed084-6bfa-41e7-8956-b336bc88cf7b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MjdlZDA4NC02YmZhLTQxZTctODk1Ni1iMzM2YmM4OGNmN2IiLCJlbWFpbCI6InZlY293YWphQGRlbmlwbC5jb20iLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoidmVjb3dhamFAZGVuaXBsLmNvbSIsInNlc3Npb25WZXJzaW9uIjoxLCJpYXQiOjE3NzE5NDUwNDIsImV4cCI6MTc3MjU0OTg0Mn0.sGDT6tnGGuZUdMPDrXGRKgxzBFKxRQbQtQPEJA7-xrI	2026-03-03 14:57:22.347	2026-02-24 14:57:22.915243
2c783d4a-f532-4035-9f33-508113d611ee	e68e2d03-b390-4c81-8f11-57e1dbac38b0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNjhlMmQwMy1iMzkwLTRjODEtOGYxMS01N2UxZGJhYzM4YjAiLCJlbWFpbCI6Im55Y2V6b2hlQGZ4emlnLmNvbSIsInJvbGUiOiJ1c2VyIiwidXNlcm5hbWUiOiJhZmtsc2ZqZmxramZzZmpmIiwic2Vzc2lvblZlcnNpb24iOjEsImlhdCI6MTc3MTk0NTU4MywiZXhwIjoxNzcyNTUwMzgzfQ.zDkgjM_8ePcfJrcqyQQIvWxehgc2Rx-veKDytv_Xgis	2026-03-03 15:06:23.663	2026-02-24 15:06:24.227254
2bfab0a0-6070-49eb-a2ce-ea25cd0a25e4	11d8a2a5-5819-4c1f-a465-c106977bc7fe	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMWQ4YTJhNS01ODE5LTRjMWYtYTQ2NS1jMTA2OTc3YmM3ZmUiLCJlbWFpbCI6ImxhbXVtaWZ5QGZvcmV4emlnLmNvbSIsInJvbGUiOiJ1c2VyIiwidXNlcm5hbWUiOiJsYW11bWlmeUBmb3JleHppZy5jb20iLCJzZXNzaW9uVmVyc2lvbiI6MSwiaWF0IjoxNzcxOTQ3MjI1LCJleHAiOjE3NzI1NTIwMjV9.FD-TZQiTRTufxr-NLxjtfacW_hNxUKt5F1WfPIzB4Bw	2026-03-03 15:33:45.924	2026-02-24 15:33:46.492125
55888b1d-a29b-422f-8e8c-5910faf8fb89	0bbf93eb-18b0-473d-8716-ff861b523068	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwYmJmOTNlYi0xOGIwLTQ3M2QtODcxNi1mZjg2MWI1MjMwNjgiLCJlbWFpbCI6InJha3VteXZ5QGZvcmV4emlnLmNvbSIsInJvbGUiOiJ1c2VyIiwidXNlcm5hbWUiOiJyYWt1bXl2eUBmb3JleHppZy5jb20iLCJzZXNzaW9uVmVyc2lvbiI6MSwiaWF0IjoxNzcxOTQ4MDM4LCJleHAiOjE3NzI1NTI4Mzh9.vVW-T88CcaNAilpx1iJ7FF1u-UEvxbcLviNqvITfBHo	2026-03-03 15:47:18.045	2026-02-24 15:47:18.61295
009e9103-5c87-48f4-8816-efe03ee00b78	8528cd51-bf28-464b-9676-cafe71ab87e4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NTI4Y2Q1MS1iZjI4LTQ2NGItOTY3Ni1jYWZlNzFhYjg3ZTQiLCJlbWFpbCI6ImxpeHVmZWxvQGZ4emlnLmNvbSIsInJvbGUiOiJ1c2VyIiwidXNlcm5hbWUiOiJsaXh1ZmVsb0BmeHppZyIsInNlc3Npb25WZXJzaW9uIjozLCJpYXQiOjE3NzE5NDkyNjUsImV4cCI6MTc3MjU1NDA2NX0.4klPS8px4e9U5vEnYR9H9MXQGsvgRQcUdeIXv2-3dJM	2026-03-03 16:07:45.013	2026-02-24 16:07:45.60704
16f8407b-c3eb-4479-af05-60ec298ecb73	c82bdfb4-7184-455b-b48b-c03bdc9b904d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjODJiZGZiNC03MTg0LTQ1NWItYjQ4Yi1jMDNiZGM5YjkwNGQiLCJlbWFpbCI6InRldGVuaW1lQGRlbmlwbC5uZXQiLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoidGV0ZW5pbWVAZGVuaXBsLm5ldCIsInNlc3Npb25WZXJzaW9uIjoyLCJpYXQiOjE3NzE5NDkzMDAsImV4cCI6MTc3MjU1NDEwMH0.Rq52QI0rFFf_6qk0mcAeyFmrswxTeloGXmlA4bV3RNc	2026-03-03 16:08:20.211	2026-02-24 16:08:20.797001
7c429344-8df0-4b59-bed4-7a7a7316f1ba	4d6a0432-1e08-4c01-ad9c-42e035f71a87	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZDZhMDQzMi0xZTA4LTRjMDEtYWQ5Yy00MmUwMzVmNzFhODciLCJlbWFpbCI6InZpbmlxaUBmb3JleHppZy5jb20iLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoidmluaXFpQGZvcmV4emlnLmNvbSIsInNlc3Npb25WZXJzaW9uIjoyLCJpYXQiOjE3NzE5NTAxMzcsImV4cCI6MTc3MjU1NDkzN30.E49wTRk-cTI7sdZ5Sm1o_TigXQZNyK_sO6H1d5KpPgY	2026-03-03 16:22:17.047	2026-02-24 16:22:17.626146
b8014897-c2f0-4da8-af71-b2afaa2dff4d	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxYTI5YjczYi03NDI4LTQ1ZWItODRjOC04MzYzZjJkNmIxYTYiLCJlbWFpbCI6ImRvbmlwZXdlQGZ4emlnLmNvbSIsInJvbGUiOiJ1c2VyIiwidXNlcm5hbWUiOiJkb25pcGV3ZUBmeHppZy5jb20iLCJzZXNzaW9uVmVyc2lvbiI6MSwiaWF0IjoxNzcxOTUwNDE0LCJleHAiOjE3NzI1NTUyMTR9.CuxmzPT53mvLobytllBh5IiqAbPvHPH-QLGgI36YZd0	2026-03-03 16:26:54.197	2026-02-24 16:26:54.773286
39968f24-5f5f-4286-8f3d-ca5590d50d76	acfaf022-ca19-4d8d-a1a0-c30160a675cc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhY2ZhZjAyMi1jYTE5LTRkOGQtYTFhMC1jMzAxNjBhNjc1Y2MiLCJlbWFpbCI6ImhvY2Vwb3p5QGRlbmlwbC5jb20iLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoiaG9jZXBvenlAZGVuaXBsLmNvbSIsInNlc3Npb25WZXJzaW9uIjoxLCJpYXQiOjE3NzE5NTEwNjYsImV4cCI6MTc3MjU1NTg2Nn0.zFRDTLQVwCJez2xTPaAuDwxy7A9buTQ7-Qa-6p4Xr5g	2026-03-03 16:37:46.562	2026-02-24 16:37:47.442193
d9495199-868f-4984-a74f-e3d7a43a16d0	07911237-2594-463c-bb5d-65ac53b9a9a7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNzkxMTIzNy0yNTk0LTQ2M2MtYmI1ZC02NWFjNTNiOWE5YTciLCJlbWFpbCI6ImdvdGl6ZUBkZW5pcGwuY29tIiwicm9sZSI6InVzZXIiLCJ1c2VybmFtZSI6ImdvdGl6ZUBkZW5pcGwuY29tIiwic2Vzc2lvblZlcnNpb24iOjEsImlhdCI6MTc3MTk1MTQ4MiwiZXhwIjoxNzcyNTU2MjgyfQ.3z3YG9YSFEwhGWvn2siAbqCAz9a0fFIOmMXSMkx-agI	2026-03-03 16:44:42.698	2026-02-24 16:44:43.30114
77fda6e5-0be2-480a-8717-16e73b284976	dd3482f7-9478-4fcc-b162-940fb9ecadba	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZDM0ODJmNy05NDc4LTRmY2MtYjE2Mi05NDBmYjllY2FkYmEiLCJlbWFpbCI6ImxhY29waXppQGRlbmlwbC5uZXQiLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoibGFjb3BpemlAZGVuaXBsLm5ldCIsInNlc3Npb25WZXJzaW9uIjoxLCJpYXQiOjE3NzIwNDQzNTUsImV4cCI6MTc3MjY0OTE1NX0.F08T38yl8lSYDnWEq0O2ebGYhrLwfpCz_O5BsvdknZs	2026-03-04 18:32:35.114	2026-02-25 18:32:37.837855
8ebe66e6-6ee5-4b1d-b18f-146b9ebfc3a4	87fd5820-718b-4c0d-9e22-bf284e65fcb6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4N2ZkNTgyMC03MThiLTRjMGQtOWUyMi1iZjI4NGU2NWZjYjYiLCJlbWFpbCI6InBvc2V0YWdhQGRlbmlwbC5jb20iLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoicG9zZXRhZ2FAZGVuaXBsLmNvbSIsInNlc3Npb25WZXJzaW9uIjo0LCJpYXQiOjE3NzIwNDQ4MDAsImV4cCI6MTc3MjY0OTYwMH0.BoJtDGx3JkOlecDPdODaJ61jauEztV09gdBM-3H5iQM	2026-03-04 18:40:00.223	2026-02-25 18:40:02.950196
09759b1d-1d0d-4171-9d9e-428bfa688fd0	c2ee8f98-90ad-497f-9f52-6f2637cad230	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjMmVlOGY5OC05MGFkLTQ5N2YtOWY1Mi02ZjI2MzdjYWQyMzAiLCJlbWFpbCI6ImZhY294YUBkZW5pcGwubmV0Iiwicm9sZSI6InVzZXIiLCJ1c2VybmFtZSI6ImZhY294YUBkZW5pcGwubmV0Iiwic2Vzc2lvblZlcnNpb24iOjEsImlhdCI6MTc3MjA0NDg2NiwiZXhwIjoxNzcyNjQ5NjY2fQ.I75o2gMQd2S04fEmrL5FYrFduKzlOFVTCNv56-9oKx4	2026-03-04 18:41:06.511	2026-02-25 18:41:09.2403
35a06922-4288-4d9c-a57b-c92b6eb6c5c1	1c6eb844-e1ca-440f-b68c-66071162b92f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxYzZlYjg0NC1lMWNhLTQ0MGYtYjY4Yy02NjA3MTE2MmI5MmYiLCJlbWFpbCI6Im1hemFqYWphQGRlbmlwbC5jb20iLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoibWF6YWphamFAZGVuaXBsLmNvbSIsInNlc3Npb25WZXJzaW9uIjoyLCJpYXQiOjE3NzIwNDYyMTksImV4cCI6MTc3MjY1MTAxOX0.Jj8wj8jim-aA3wgDAMT6FnSN0wfc_s8oV8Kk58828fk	2026-03-04 19:03:39.262	2026-02-25 19:03:41.982571
ebcac8c4-0e41-45a6-b17d-87c2d07d86ea	9fa878f1-83a8-4afb-aae0-939a0942fa33	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5ZmE4NzhmMS04M2E4LTRhZmItYWFlMC05MzlhMDk0MmZhMzMiLCJlbWFpbCI6ImRlbGFwZUBkZW5pcGwubmV0Iiwicm9sZSI6InVzZXIiLCJ1c2VybmFtZSI6ImRlbGFwZUBkZW5pcGwubmV0Iiwic2Vzc2lvblZlcnNpb24iOjEsImlhdCI6MTc3MjA0NjM5MCwiZXhwIjoxNzcyNjUxMTkwfQ.-0EEhxncsf6NOO_Mshet-r0_9WkN0ntR3DxBtUCAnJ8	2026-03-04 19:06:30.463	2026-02-25 19:06:33.184569
a0eb7ac7-7fd2-4501-b00d-c60ea08bd093	262a89e3-6dde-4b37-a65f-e800fd316105	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNjJhODllMy02ZGRlLTRiMzctYTY1Zi1lODAwZmQzMTYxMDUiLCJlbWFpbCI6Im5hdGlxb0Bmb3JleHppZy5jb20iLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoiaGVsbG9AMzc5Iiwic2Vzc2lvblZlcnNpb24iOjQsImlhdCI6MTc3MjEzNTI5MywiZXhwIjoxNzcyNzQwMDkzfQ.7cTGr9jM-0sT1v4EWT1boLnhlnCbp4ROrcdPC27RJhI	2026-03-05 19:48:13.999	2026-02-26 19:48:14.009638
30bf1121-4a20-4cc0-b804-2e723815ec01	4749b239-bcef-433c-a4b2-f984ec3a47e9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NzQ5YjIzOS1iY2VmLTQzM2MtYTRiMi1mOTg0ZWMzYTQ3ZTkiLCJlbWFpbCI6ImhlcXl6dUBkZW5pcGwubmV0Iiwicm9sZSI6InVzZXIiLCJ1c2VybmFtZSI6ImhlcXl6dUBkZW5pcGwubmV0Iiwic2Vzc2lvblZlcnNpb24iOjEsImlhdCI6MTc3MjEzNTkzMiwiZXhwIjoxNzcyNzQwNzMyfQ.3cqFrl1WyPPF-cvUTnOU7z390gRRSi_xPl0gqmqp9R0	2026-03-05 19:58:52.16	2026-02-26 19:58:52.304811
117195b7-80d9-4cdd-bcdf-607c9ac49e02	76cacf03-9e99-4098-b633-7617082f077e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NmNhY2YwMy05ZTk5LTQwOTgtYjYzMy03NjE3MDgyZjA3N2UiLCJlbWFpbCI6Inp1bGVreXJhQGRlbmlwbC5jb20iLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoienVsZWt5cmFAZGVuaXBsIiwic2Vzc2lvblZlcnNpb24iOjUsImlhdCI6MTc3MjEzNjg4MiwiZXhwIjoxNzcyNzQxNjgyfQ.4D3OSoViKdF-Pnr9j9gn5hukZ5_m-UgSmDsdI0xayr0	2026-03-05 20:14:42.941	2026-02-26 20:14:43.084617
\.


--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.refunds (id, payment_id, user_id, amount, currency, reason, status, razorpay_refund_id, processed_by, processed_at, created_at) FROM stdin;
\.


--
-- Data for Name: sales_intelligence_exports; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sales_intelligence_exports (id, export_name, export_type, date_range_start, date_range_end, intent_filter, industry_filter, record_count, export_data, exported_by, purpose, notes, created_at) FROM stdin;
\.


--
-- Data for Name: sales_intelligence_knowledge; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sales_intelligence_knowledge (id, intent_type, industry, persona, sales_stage, trigger_keywords, trigger_patterns, suggested_response, follow_up_prompt, usage_count, acceptance_count, rejection_count, performance_score, is_validated, validated_by, validated_at, source, notes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sales_intelligence_learning_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sales_intelligence_learning_logs (id, suggestion_id, conversation_id, user_id, customer_question, detected_intent, suggested_response, rep_used_suggestion, rep_modified_response, outcome_signals, industry, persona, sales_stage, product_discussed, is_anonymized, can_use_for_marketing, can_use_for_training, processing_status, promoted_to_knowledge, promoted_knowledge_id, created_at, processed_at) FROM stdin;
\.


--
-- Data for Name: sales_intelligence_suggestions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sales_intelligence_suggestions (id, conversation_id, user_id, knowledge_id, detected_intent, intent_confidence, customer_question, assembled_context, suggested_response, follow_up_prompt, retrieval_confidence, was_displayed, was_used, response_latency_ms, created_at) FROM stdin;
\.


--
-- Data for Name: session_minutes_purchases; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session_minutes_purchases (id, user_id, organization_id, minutes_purchased, minutes_used, minutes_remaining, purchase_date, expiry_date, status, razorpay_order_id, razorpay_payment_id, amount_paid, currency, refunded_at, refund_amount, refund_reason, razorpay_refund_id, refunded_by, created_at) FROM stdin;
\.


--
-- Data for Name: session_minutes_usage; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session_minutes_usage (id, user_id, purchase_id, conversation_id, minutes_consumed, feature_used, consumed_at) FROM stdin;
\.


--
-- Data for Name: session_usage; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session_usage (id, user_id, session_id, start_time, end_time, duration_seconds, status, created_at, last_resume_time, accumulated_duration_ms, is_paused) FROM stdin;
424803ff-d8e9-4eb2-9ff8-d6670d6e10af	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	usage_1771825579329_h0ej7xkid	2026-02-23 05:46:19.329	2026-02-23 05:52:40.837	381	ended	2026-02-23 05:46:19.33	\N	0	f
eaf709b9-20ad-41b9-a994-ebeeab36113c	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	usage_1771825979014_ois86fjnf	2026-02-23 05:52:59.014	2026-02-23 06:03:31.776	632	ended	2026-02-23 05:52:59.014	\N	0	f
739c583b-48fd-495a-bfd3-455296b2f36f	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	usage_1771827029673_bp5yt8xh3	2026-02-23 06:10:29.673	2026-02-23 06:10:52.423	22	ended	2026-02-23 06:10:29.673	\N	0	f
6fe14c1b-a5ca-4919-9285-44deade1feef	667aa0de-c6cd-49ac-b091-fd6f2e390019	usage_1771824352873_w21d2zxh7	2026-02-23 05:25:52.873	2026-02-23 09:25:52.873	14400	ended	2026-02-23 05:25:52.873	\N	0	f
3c9ea2bb-3b7f-47b8-8dc6-5d6c31e839c2	262a89e3-6dde-4b37-a65f-e800fd316105	usage_1771880911323_o7qaux23f	2026-02-23 21:08:31.323	2026-02-23 21:09:15.671	44	ended	2026-02-23 21:08:31.324	\N	0	f
01a19b17-8f96-43ec-b8e1-9325c858fe29	262a89e3-6dde-4b37-a65f-e800fd316105	usage_1771880961167_d9hyan34m	2026-02-23 21:09:21.167	2026-02-24 01:09:21.167	14400	ended	2026-02-23 21:09:21.167	\N	0	f
fc9aeed9-8469-4a43-b105-d832cb20c7cb	76cacf03-9e99-4098-b633-7617082f077e	usage_1771941776430_kvkh2yqkg	2026-02-24 14:02:56.43	2026-02-24 14:04:50.361	113	ended	2026-02-24 14:02:56.432	\N	0	f
f9554ec7-3858-4396-8a85-9bafebd21bde	76cacf03-9e99-4098-b633-7617082f077e	usage_1771942626710_7ojg8rfej	2026-02-24 14:17:06.71	2026-02-24 14:17:56.004	49	ended	2026-02-24 14:17:06.711	\N	0	f
739b92e9-720d-4861-9a11-c53bbfa196d2	6786fa29-edbe-4087-97b5-ea4b77bdb286	usage_1771942756258_9u1esz6xn	2026-02-24 14:19:16.258	2026-02-24 14:25:01.597	345	ended	2026-02-24 14:19:16.259	\N	0	f
2c355e6d-448f-4163-9d8d-bb5efe0572ba	6786fa29-edbe-4087-97b5-ea4b77bdb286	usage_1771943105539_rgdbpnn5f	2026-02-24 14:25:05.539	2026-02-24 14:25:37.748	32	ended	2026-02-24 14:25:05.54	\N	0	f
046e2c16-5f0b-40fc-9e95-58b7020b2bab	87f0700a-53a9-4909-845a-f79e438f153f	usage_1771943284626_rzknolutk	2026-02-24 14:28:04.626	2026-02-24 14:30:11.498	126	ended	2026-02-24 14:28:04.626	\N	0	f
d9e2c04a-a879-4369-b39f-eff19a5f47ba	87f0700a-53a9-4909-845a-f79e438f153f	usage_1771943481725_l473vfip1	2026-02-24 14:31:21.725	2026-02-24 14:31:34.991	13	ended	2026-02-24 14:31:21.726	\N	0	f
494e113d-dc4f-4217-94a5-1d6507dde7e0	87f0700a-53a9-4909-845a-f79e438f153f	usage_1771943580987_kaqvk9stz	2026-02-24 14:33:00.987	2026-02-24 14:33:33.927	32	ended	2026-02-24 14:33:00.988	\N	0	f
4731cae7-5804-4657-b8f8-3b9ff34b53b8	cb64b05a-101b-4055-ae05-00ec49f58fd8	usage_1771944036910_zxzop4zm5	2026-02-24 14:40:36.91	2026-02-24 14:44:55.262	258	ended	2026-02-24 14:40:36.913	\N	0	f
49a0ef49-6dbd-4a57-8df7-4e54c9dc00bf	782bfd26-63f3-4eb9-a91a-380ffafd0bca	usage_1771944533677_mwjvkscac	2026-02-24 14:48:53.677	2026-02-24 14:50:10.168	76	ended	2026-02-24 14:48:53.678	\N	0	f
d8e59442-8682-4a57-aa0d-4552c425687c	cb64b05a-101b-4055-ae05-00ec49f58fd8	usage_1771943880916_0xzv2zob1	2026-02-24 14:38:00.916	2026-02-24 14:52:55.486	894	ended	2026-02-24 14:38:00.918	\N	0	f
99a04809-2615-4ada-8ec1-a0bec2a8a8bd	cb64b05a-101b-4055-ae05-00ec49f58fd8	usage_1771943719521_amf044d6x	2026-02-24 14:35:19.521	2026-02-24 14:52:55.486	1055	ended	2026-02-24 14:35:19.522	\N	0	f
dde59aa2-3770-49c9-b925-8260b5bacb10	76cacf03-9e99-4098-b633-7617082f077e	usage_1771941896160_blf8a34eg	2026-02-24 14:04:56.16	2026-02-24 14:52:55.486	2879	ended	2026-02-24 14:04:56.161	\N	0	f
9ad0034f-bf51-43f0-b419-a3a37bee9961	782bfd26-63f3-4eb9-a91a-380ffafd0bca	usage_1771944708272_a1ioomyq8	2026-02-24 14:51:48.272	2026-02-24 14:54:33.552	165	ended	2026-02-24 14:51:48.272	\N	0	f
e2846b26-3b19-40ee-85f3-28d38a176054	782bfd26-63f3-4eb9-a91a-380ffafd0bca	usage_1771944876822_jpbgpjw8s	2026-02-24 14:54:36.822	2026-02-24 14:54:46.12	9	ended	2026-02-24 14:54:36.823	\N	0	f
1fa58725-6a54-4bda-a306-351ee3c7cc37	827ed084-6bfa-41e7-8956-b336bc88cf7b	usage_1771945065272_bfw72k658	2026-02-24 14:57:45.273	2026-02-24 14:58:07.152	21	ended	2026-02-24 14:57:45.274	\N	0	f
c7cff850-bcd1-4e24-acbf-96802c695023	827ed084-6bfa-41e7-8956-b336bc88cf7b	usage_1771945140571_d4vtnrjlh	2026-02-24 14:59:00.571	2026-02-24 15:01:59.039	178	ended	2026-02-24 14:59:00.572	\N	0	f
1aa75c39-9195-48e2-b74a-ce1dd310aad8	827ed084-6bfa-41e7-8956-b336bc88cf7b	usage_1771945452762_v45wg4ymm	2026-02-24 15:04:12.762	2026-02-24 15:04:21.446	8	ended	2026-02-24 15:04:12.763	\N	0	f
dcfd41d1-7e34-4532-9d46-bc934b3a5706	e68e2d03-b390-4c81-8f11-57e1dbac38b0	usage_1771945654200_77mygueld	2026-02-24 15:07:34.2	2026-02-24 15:08:51.278	77	ended	2026-02-24 15:07:34.201	\N	0	f
2fe0e66b-9b07-4e67-a67c-e1da001dec87	e68e2d03-b390-4c81-8f11-57e1dbac38b0	usage_1771945948417_k5qqujt06	2026-02-24 15:12:28.417	2026-02-24 15:12:53.306	24	ended	2026-02-24 15:12:28.42	\N	0	f
a8234fd8-21af-4d1b-a98f-28880b9b2c64	e68e2d03-b390-4c81-8f11-57e1dbac38b0	usage_1771945994638_tcnpwsdxx	2026-02-24 15:13:14.638	2026-02-24 15:13:30.362	15	ended	2026-02-24 15:13:14.639	\N	0	f
d5aa2b61-a38c-476a-a26f-38c41085cfac	8528cd51-bf28-464b-9676-cafe71ab87e4	usage_1771946269887_dz7tv2s1x	2026-02-24 15:17:49.887	2026-02-24 15:19:54.797	124	ended	2026-02-24 15:17:49.888	\N	0	f
ff02606c-bc22-4bda-8a82-409e3918de23	8528cd51-bf28-464b-9676-cafe71ab87e4	usage_1771946591162_ybaak43yo	2026-02-24 15:23:11.162	2026-02-24 15:24:18.32	67	ended	2026-02-24 15:23:11.164	\N	0	f
df7a0392-d1f9-4887-bd40-05eab52b4c92	8528cd51-bf28-464b-9676-cafe71ab87e4	usage_1771946963519_kb36gaofd	2026-02-24 15:29:23.519	2026-02-24 15:29:54.673	31	ended	2026-02-24 15:29:23.521	\N	0	f
e5b50750-1a53-4fb2-a9d8-1d8191a6f8ee	11d8a2a5-5819-4c1f-a465-c106977bc7fe	usage_1771947245162_dzi1x5x5m	2026-02-24 15:34:05.162	2026-02-24 15:34:23.977	18	ended	2026-02-24 15:34:05.163	\N	0	f
6a23b6e2-a29a-48b2-879c-07bb5809bb5d	11d8a2a5-5819-4c1f-a465-c106977bc7fe	usage_1771947329647_ikhr1esn0	2026-02-24 15:35:29.647	2026-02-24 15:40:17.195	287	ended	2026-02-24 15:35:29.647	\N	0	f
c5f3d671-6601-4b59-ac91-c93045880bcb	11d8a2a5-5819-4c1f-a465-c106977bc7fe	usage_1771947646924_wr7sueget	2026-02-24 15:40:46.924	2026-02-24 15:40:52.962	6	ended	2026-02-24 15:40:46.931	\N	0	f
25c719b4-0a89-4e24-962f-e09b4c2b18f7	0bbf93eb-18b0-473d-8716-ff861b523068	usage_1771948052484_m4axwt4oe	2026-02-24 15:47:32.484	2026-02-24 15:48:26.693	54	ended	2026-02-24 15:47:32.485	\N	0	f
6f351891-a879-4c9f-b219-91581a270191	0bbf93eb-18b0-473d-8716-ff861b523068	usage_1771948124685_e9z44r8ds	2026-02-24 15:48:44.685	2026-02-24 15:50:20.341	95	ended	2026-02-24 15:48:44.686	\N	0	f
8b00c5f6-c856-488e-8753-ba4bbeef34fc	0bbf93eb-18b0-473d-8716-ff861b523068	usage_1771949013381_9cfg2i8da	2026-02-24 16:03:33.381	2026-02-24 16:03:50.79	17	ended	2026-02-24 16:03:33.389	2026-02-24 16:03:33.381	17409	f
16946aff-1776-4f5a-8481-ff64c9d2ae1a	c82bdfb4-7184-455b-b48b-c03bdc9b904d	usage_1771949114551_a9lvuc9hj	2026-02-24 16:05:14.551	2026-02-24 16:05:37.632	23	ended	2026-02-24 16:05:14.558	2026-02-24 16:05:14.551	23081	f
9f97a9a4-209e-4ee6-b96e-ee2289b07209	c82bdfb4-7184-455b-b48b-c03bdc9b904d	usage_1771949312044_cqvnmq97c	2026-02-24 16:08:32.044	2026-02-24 16:09:23.17	51	ended	2026-02-24 16:08:32.046	2026-02-24 16:08:32.044	51126	f
e54abd20-84c7-4502-a67c-298200c60bd8	c82bdfb4-7184-455b-b48b-c03bdc9b904d	usage_1771949426287_5uifcextg	2026-02-24 16:10:26.287	2026-02-24 16:11:37.194	70	ended	2026-02-24 16:10:26.287	2026-02-24 16:10:26.287	70907	f
cbf68759-5958-43f6-8696-1620f4bb0068	4d6a0432-1e08-4c01-ad9c-42e035f71a87	usage_1771949682050_6rv6fxm49	2026-02-24 16:14:42.05	2026-02-24 16:16:47.573	125	ended	2026-02-24 16:14:42.053	2026-02-24 16:14:42.05	125523	f
a17d9849-3134-4a39-a06c-8881075f2ace	4d6a0432-1e08-4c01-ad9c-42e035f71a87	usage_1771949946288_765xlssj2	2026-02-24 16:19:06.288	2026-02-24 16:19:13.71	7	ended	2026-02-24 16:19:06.289	2026-02-24 16:19:06.288	7422	f
e7b18796-4c4c-4e88-9986-d89ed5b2c27a	4d6a0432-1e08-4c01-ad9c-42e035f71a87	usage_1771950147938_97dqba9j5	2026-02-24 16:22:27.938	2026-02-24 16:23:41.36	73	ended	2026-02-24 16:22:27.94	2026-02-24 16:22:27.938	73422	f
015192d6-314d-4de1-b5ed-d28b3ca5cbf5	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	usage_1771950427138_8olcw91hf	2026-02-24 16:27:07.138	2026-02-24 16:28:12.569	65	ended	2026-02-24 16:27:07.141	2026-02-24 16:27:07.138	65431	f
3c7b3830-7c7f-46bb-a2ab-d11f5079de11	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	usage_1771950532494_9i2y0pjrq	2026-02-24 16:28:52.494	2026-02-24 16:29:51.339	58	ended	2026-02-24 16:28:52.494	2026-02-24 16:28:52.494	58845	f
853b4ec0-38bd-4611-b2ce-060aaa65898c	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	usage_1771950802183_dd40sc9vr	2026-02-24 16:33:22.183	2026-02-24 16:33:39.589	17	ended	2026-02-24 16:33:22.185	2026-02-24 16:33:22.183	17406	t
464ea42b-ef96-4f96-b279-e7a5f3d33e44	262a89e3-6dde-4b37-a65f-e800fd316105	usage_1772043436988_og96ct2ty	2026-02-25 18:17:16.988	2026-02-25 22:17:16.988	14400	ended	2026-02-25 18:17:16.989	2026-02-25 18:17:16.988	0	f
a8d2e324-0077-46a1-a157-9e685062960f	acfaf022-ca19-4d8d-a1a0-c30160a675cc	usage_1771951116740_jqodsnn40	2026-02-24 16:38:36.74	2026-02-24 16:40:15.143	66	ended	2026-02-24 16:38:36.741	2026-02-24 16:38:36.74	66488	t
3790dcbf-2cd6-464f-ad66-60ce23d1ddcc	dd3482f7-9478-4fcc-b162-940fb9ecadba	usage_1772044411368_c7xqtjsz7	2026-02-25 18:33:31.368	2026-02-25 22:33:31.368	14400	ended	2026-02-25 18:33:31.37	2026-02-25 18:33:31.368	0	f
a7de2d23-1975-4a4f-98b0-34856e65f29d	9fa878f1-83a8-4afb-aae0-939a0942fa33	usage_1772046620674_zim0x1e2x	2026-02-25 19:10:20.674	2026-02-25 19:11:41.701	72	ended	2026-02-25 19:10:20.678	2026-02-25 19:11:27.212	72801	f
bafbdb2b-4cbd-48de-8bf2-d6b8d624d059	9fa878f1-83a8-4afb-aae0-939a0942fa33	usage_1772046740585_u6k5hmvqf	2026-02-25 19:12:20.585	2026-02-25 19:12:48.131	27	ended	2026-02-25 19:12:20.585	2026-02-25 19:12:20.585	27546	f
f1735151-e1b6-46d2-8a30-2398794a71f3	07911237-2594-463c-bb5d-65ac53b9a9a7	usage_1771951663415_zjz0y67ue	2026-02-24 16:47:43.415	2026-02-24 16:49:56.63	123	ended	2026-02-24 16:47:43.418	2026-02-24 16:48:56.579	123251	f
6111c01b-2409-4896-beac-b586d69b11bf	07911237-2594-463c-bb5d-65ac53b9a9a7	usage_1771951879778_0e72av2h2	2026-02-24 16:51:19.779	2026-02-24 16:51:26.801	7	ended	2026-02-24 16:51:19.779	2026-02-24 16:51:19.779	7022	f
85c219d3-f4db-4090-b75f-25b4046f397a	87fd5820-718b-4c0d-9e22-bf284e65fcb6	usage_1771952114866_upqxa4miy	2026-02-24 16:55:14.866	2026-02-24 16:55:33.075	18	ended	2026-02-24 16:55:14.87	2026-02-24 16:55:14.866	18209	f
2b079830-3a18-4e46-b2ff-52cb9640fabe	87fd5820-718b-4c0d-9e22-bf284e65fcb6	usage_1771952070047_1s7bcssy0	2026-02-24 16:54:30.047	2026-02-24 17:19:35.07	10	ended	2026-02-24 16:54:30.049	2026-02-24 16:54:30.047	10136	t
9f9134de-446c-4f92-ad49-b930b76d0c8f	acfaf022-ca19-4d8d-a1a0-c30160a675cc	usage_1771951083354_77fj7utr4	2026-02-24 16:38:03.354	2026-02-24 20:38:03.354	14400	ended	2026-02-24 16:38:03.356	2026-02-24 16:38:35.744	18968	f
a6b10a17-886b-4d14-a6e5-efa43f024332	acfaf022-ca19-4d8d-a1a0-c30160a675cc	usage_1771951213691_9o51vsm6j	2026-02-24 16:40:13.691	2026-02-24 20:40:13.691	14400	ended	2026-02-24 16:40:13.692	2026-02-24 16:40:13.691	0	f
b6470e15-2f53-4004-8ceb-313cd8264cf3	07911237-2594-463c-bb5d-65ac53b9a9a7	usage_1771951501237_vctt0in5s	2026-02-24 16:45:01.237	2026-02-24 20:45:01.237	14400	ended	2026-02-24 16:45:01.239	2026-02-24 16:45:01.237	0	f
911570f9-f2e0-4b32-aa74-4f859680007e	87fd5820-718b-4c0d-9e22-bf284e65fcb6	usage_1771952055418_g91nlavhd	2026-02-24 16:54:15.418	2026-02-24 20:54:15.418	14400	ended	2026-02-24 16:54:15.421	2026-02-24 16:54:15.418	0	f
2ee9eb4b-8080-493b-a2b3-68a6db14d16b	dd3482f7-9478-4fcc-b162-940fb9ecadba	usage_1772044455246_brx0qekgx	2026-02-25 18:34:15.246	2026-02-25 18:34:51.76	36	ended	2026-02-25 18:34:15.246	2026-02-25 18:34:15.246	36514	f
5be5d729-c310-458a-a28c-44792de89b15	9fa878f1-83a8-4afb-aae0-939a0942fa33	usage_1772046914347_czrclnyg8	2026-02-25 19:15:14.347	2026-02-25 23:15:14.347	14400	ended	2026-02-25 19:15:14.348	2026-02-25 19:15:14.347	0	f
48797849-8635-45be-9d3f-12993c546011	9fa878f1-83a8-4afb-aae0-939a0942fa33	usage_1772047131741_fwa5z0lr6	2026-02-25 19:18:51.741	2026-02-25 19:20:19.445	87	ended	2026-02-25 19:18:51.742	2026-02-25 19:18:51.741	87704	f
5a6baecb-7a2e-40f0-990e-fbe1269c71b2	9fa878f1-83a8-4afb-aae0-939a0942fa33	usage_1772048058206_sumg3citb	2026-02-25 19:34:18.206	2026-02-25 19:35:07.027	48	ended	2026-02-25 19:34:18.206	2026-02-25 19:34:18.206	48821	f
479fd04d-062a-4dc8-9955-684bef9e651c	c2ee8f98-90ad-497f-9f52-6f2637cad230	usage_1772044881587_g70z5qxbo	2026-02-25 18:41:21.587	2026-02-25 22:41:21.587	14400	ended	2026-02-25 18:41:21.59	2026-02-25 18:41:21.587	0	f
46910aa9-28de-4b56-af31-e993a445aead	c2ee8f98-90ad-497f-9f52-6f2637cad230	usage_1772045464463_sg7joryhi	2026-02-25 18:51:04.463	2026-02-25 22:51:04.463	14400	ended	2026-02-25 18:51:04.466	2026-02-25 18:51:59.827	51409	f
acdb188a-1062-47a0-a41d-7593fd4e82e7	9fa878f1-83a8-4afb-aae0-939a0942fa33	usage_1772048125902_7ku6jt5qr	2026-02-25 19:35:25.902	2026-02-25 19:35:56.676	25	ended	2026-02-25 19:35:25.902	2026-02-25 19:35:42.34	25588	f
a6ffb931-32fb-4de1-963e-f6d9c88b361b	c2ee8f98-90ad-497f-9f52-6f2637cad230	usage_1772045635918_rl98ue9qp	2026-02-25 18:53:55.918	2026-02-25 22:53:55.918	14400	ended	2026-02-25 18:53:55.929	2026-02-25 18:53:55.918	0	f
0886c991-ea22-4955-a56e-2b0fd4371fc3	1c6eb844-e1ca-440f-b68c-66071162b92f	usage_1772045926095_qrmjxehv8	2026-02-25 18:58:46.095	2026-02-25 22:58:46.095	14400	ended	2026-02-25 18:58:46.095	2026-02-25 18:58:46.095	0	f
225d7b2a-553a-442c-9711-32118da68f99	1c6eb844-e1ca-440f-b68c-66071162b92f	usage_1772045753608_vsh95jjr2	2026-02-25 18:55:53.608	2026-02-25 22:55:53.608	14400	ended	2026-02-25 18:55:53.609	2026-02-25 18:55:53.608	0	f
c5d0b8ea-3e0a-40e8-9fb6-6df0d658ebb6	1c6eb844-e1ca-440f-b68c-66071162b92f	usage_1772045879315_6o5lmqd4o	2026-02-25 18:57:59.315	2026-02-25 22:57:59.315	14400	ended	2026-02-25 18:57:59.316	2026-02-25 18:57:59.315	0	f
70954f48-d699-4cf8-89d6-9e48f6f5cd4c	9fa878f1-83a8-4afb-aae0-939a0942fa33	usage_1772047079254_uu6lu8h0d	2026-02-25 19:17:59.254	2026-02-25 23:17:59.254	14400	ended	2026-02-25 19:17:59.259	2026-02-25 19:17:59.254	0	f
630e3a8e-6b79-43e4-9eb1-9a1586e9eb09	9fa878f1-83a8-4afb-aae0-939a0942fa33	usage_1772047445421_yiqyeinb6	2026-02-25 19:24:05.421	2026-02-25 23:24:05.421	14400	ended	2026-02-25 19:24:05.423	2026-02-25 19:24:05.421	0	f
89a7617a-1ac9-4906-a507-cb4cc2e58319	9fa878f1-83a8-4afb-aae0-939a0942fa33	usage_1772047503774_3b869j7io	2026-02-25 19:25:03.774	2026-02-25 23:25:03.774	14400	ended	2026-02-25 19:25:03.775	2026-02-25 19:25:03.774	0	f
074f88c5-2b84-4148-935d-dba5e060030e	9fa878f1-83a8-4afb-aae0-939a0942fa33	usage_1772047800637_aghy84bhr	2026-02-25 19:30:00.637	2026-02-25 23:30:00.637	14400	ended	2026-02-25 19:30:00.639	2026-02-25 19:30:00.637	0	f
aa3c9695-7efe-44b7-8fbf-fcbf56ad3d8c	9fa878f1-83a8-4afb-aae0-939a0942fa33	usage_1772047955227_a9x8g6equ	2026-02-25 19:32:35.227	2026-02-25 23:32:35.227	14400	ended	2026-02-25 19:32:35.229	2026-02-25 19:32:35.227	0	f
a12cf94e-f12f-4f6b-83ff-9693a4e6a8f7	9fa878f1-83a8-4afb-aae0-939a0942fa33	usage_1772122737422_na3g2sj27	2026-02-26 16:18:57.422	\N	\N	active	2026-02-26 16:18:57.425	2026-02-26 16:18:57.422	0	f
69374242-5e16-4669-8a2a-3e3b0e0b7a1c	9fa878f1-83a8-4afb-aae0-939a0942fa33	usage_1772122793290_4ugw2bu8a	2026-02-26 16:19:53.29	\N	\N	active	2026-02-26 16:19:53.29	2026-02-26 16:19:53.29	0	f
e1fccb20-5ff9-490c-bd2d-e4125742f134	9fa878f1-83a8-4afb-aae0-939a0942fa33	usage_1772122848294_3x96flpa8	2026-02-26 16:20:48.294	\N	\N	active	2026-02-26 16:20:48.299	2026-02-26 16:20:48.294	0	f
fa3413ee-3cf9-4d32-8b54-83af45f03393	76cacf03-9e99-4098-b633-7617082f077e	usage_1772123499934_5gn1m68vr	2026-02-26 16:31:39.934	\N	\N	paused	2026-02-26 16:31:39.936	2026-02-26 16:31:39.934	66563	t
08be2932-c665-4b0e-a624-a667cced4393	76cacf03-9e99-4098-b633-7617082f077e	usage_1772123579752_hf9rhkb1e	2026-02-26 16:32:59.752	2026-02-26 16:33:10.196	10	ended	2026-02-26 16:32:59.752	2026-02-26 16:32:59.752	10444	f
7cc30356-972e-4314-b248-5c2d6f38dc29	76cacf03-9e99-4098-b633-7617082f077e	usage_1772123599356_vniiotj7v	2026-02-26 16:33:19.356	\N	\N	paused	2026-02-26 16:33:19.356	2026-02-26 16:33:19.356	147092	t
befd1bfd-123c-490f-a30a-fd51c621c98f	76cacf03-9e99-4098-b633-7617082f077e	usage_1772123760879_10ij9dheh	2026-02-26 16:36:00.88	\N	\N	paused	2026-02-26 16:36:00.88	2026-02-26 16:36:00.88	61153	t
03b3a108-ea95-4cdc-9a82-e83502899d13	4749b239-bcef-433c-a4b2-f984ec3a47e9	usage_1772135948470_rkumu7wzy	2026-02-26 19:59:08.47	2026-02-26 20:09:55.045	646	ended	2026-02-26 19:59:08.473	2026-02-26 19:59:08.47	646575	f
0c7608fe-fd0c-4181-8eea-8ed8ffa73b8d	4749b239-bcef-433c-a4b2-f984ec3a47e9	usage_1772136629679_ouw3ayr03	2026-02-26 20:10:29.679	\N	\N	paused	2026-02-26 20:10:29.68	2026-02-26 20:10:29.679	14838	t
d899394b-5ebe-4113-aa43-34a75d18e963	76cacf03-9e99-4098-b633-7617082f077e	usage_1772123931521_bpbqub066	2026-02-26 16:38:51.521	2026-02-26 20:14:46.953	12955	ended	2026-02-26 16:38:51.526	2026-02-26 16:38:51.521	12955432	f
131b2d59-e1bc-494f-b736-6e47d211ee47	4749b239-bcef-433c-a4b2-f984ec3a47e9	usage_1772136656821_skubkhdym	2026-02-26 20:10:56.821	\N	\N	paused	2026-02-26 20:10:56.822	2026-02-26 20:10:56.821	71900	t
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.subscription_plans (id, name, price, listed_price, currency, billing_interval, features, is_active, published_on_website, available_until, required_addons, razorpay_plan_id, created_at, updated_at) FROM stdin;
d4ea952f-20f8-4cfc-bcef-ef04d6faad3b	6 Months Plan	220	\N	USD	6-months	["Unlimited sessions", "Unlimited time", "Free upgrades", "24x5 support", "Bring your own AI key", "Hello"]	t	t	\N	[]	plan_6month_200	2026-02-22 07:19:41.621385	2026-02-22 07:19:41.621385
61a2e346-c35f-4395-8996-b3c4cfe8fcd8	3 Months Plan	149	199	USD	one_time	["Unlimited sessions", "Unlimited time", "Free upgrades", "24x5 support", "Bring your own AI key", "90 days access", "All AI features included", "Priority support", "Save $50"]	t	t	\N	[]	\N	2026-02-22 07:19:42.562417	2026-02-22 07:19:42.562417
e62f2310-d1dd-4f43-ba48-c63ae592d0f9	12 Months Plan	399	799	USD	1-year	["Unlimited sessions", "Unlimited time", "Free upgrades", "24x5 support", "Bring your own AI key"]	t	t	\N	[]	plan_yearly_399	2026-02-22 07:19:42.765009	2026-02-22 07:19:42.765009
689ee4f4-7ee7-4e5a-8fe7-edff014b30cd	36 Months Plan	499	999	USD	3-years	["Unlimited sessions", "Unlimited time", "Free upgrades", "24x5 support", "Bring your own AI key"]	t	t	\N	[]	plan_3year_499	2026-02-22 07:19:42.972271	2026-02-22 07:19:42.972271
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.subscriptions (id, user_id, plan_id, plan_type, status, sessions_used, sessions_limit, minutes_used, minutes_limit, session_history, current_period_start, current_period_end, canceled_at, cancellation_reason, razorpay_subscription_id, razorpay_customer_id, created_at, updated_at) FROM stdin;
88f622ba-f9c9-43e2-9104-4e692d06a08a	667aa0de-c6cd-49ac-b091-fd6f2e390019	\N	free_trial	trial	1	3	0	180	[]	\N	\N	\N	\N	\N	\N	2026-02-23 05:25:17.984281	2026-02-23 05:25:52.903
df1e9ce3-f025-4b90-9d64-4a699d860906	8528cd51-bf28-464b-9676-cafe71ab87e4	\N	free_trial	trial	3	3	4	180	[{"endTime": "2026-02-24T15:19:54.797Z", "sessionId": "usage_1771946269887_dz7tv2s1x", "startTime": "2026-02-24T15:17:49.887Z", "durationMinutes": 2, "durationSeconds": 124}, {"endTime": "2026-02-24T15:24:18.320Z", "sessionId": "usage_1771946591162_ybaak43yo", "startTime": "2026-02-24T15:23:11.162Z", "durationMinutes": 1, "durationSeconds": 67}, {"endTime": "2026-02-24T15:29:54.673Z", "sessionId": "usage_1771946963519_kb36gaofd", "startTime": "2026-02-24T15:29:23.519Z", "durationMinutes": 1, "durationSeconds": 31}]	\N	\N	\N	\N	\N	\N	2026-02-24 15:17:32.372465	2026-02-24 15:29:55.413
91caec6b-99cb-4e67-bf69-c470040a0ea9	d317c887-0d10-4fcf-8c17-fcb61c8ab73b	\N	free_trial	trial	3	3	16	180	[{"endTime": "2026-02-23T05:52:40.837Z", "sessionId": "usage_1771825579329_h0ej7xkid", "startTime": "2026-02-23T05:46:19.329Z", "durationMinutes": 6}, {"endTime": "2026-02-23T06:03:31.776Z", "sessionId": "usage_1771825979014_ois86fjnf", "startTime": "2026-02-23T05:52:59.014Z", "durationMinutes": 10}, {"endTime": "2026-02-23T06:10:52.423Z", "sessionId": "usage_1771827029673_bp5yt8xh3", "startTime": "2026-02-23T06:10:29.673Z", "durationMinutes": 0}]	\N	\N	\N	\N	\N	\N	2026-02-23 05:32:53.816078	2026-02-23 06:10:52.493
662a567f-17de-4c2a-a8d1-59e15457ba23	cb64b05a-101b-4055-ae05-00ec49f58fd8	\N	free_trial	trial	3	3	4	180	[{"endTime": "2026-02-24T14:44:55.262Z", "sessionId": "usage_1771944036910_zxzop4zm5", "startTime": "2026-02-24T14:40:36.910Z", "durationMinutes": 4, "durationSeconds": 258}]	\N	\N	\N	\N	\N	\N	2026-02-24 14:34:59.601454	2026-02-24 14:44:55.957
4502b2f6-dd32-44d3-835a-1c437a9469f0	76cacf03-9e99-4098-b633-7617082f077e	\N	platform_access	active	1	\N	215	\N	[{"endTime": "2026-02-26T16:33:10.196Z", "sessionId": "usage_1772123579752_hf9rhkb1e", "startTime": "2026-02-26T16:32:59.752Z", "durationMinutes": 0}, {"endTime": "2026-02-26T20:14:46.953Z", "sessionId": "usage_1772123931521_bpbqub066", "startTime": "2026-02-26T16:38:51.521Z", "durationMinutes": 215}]	2026-02-26 16:26:14.718	2026-03-28 16:26:14.718	\N	\N	\N	\N	2026-02-24 14:02:16.337279	2026-02-26 20:14:47.657
e4d702af-e7ef-4647-8906-008b8fadb684	e68e2d03-b390-4c81-8f11-57e1dbac38b0	\N	free_trial	trial	3	3	1	180	[{"endTime": "2026-02-24T15:08:51.278Z", "sessionId": "usage_1771945654200_77mygueld", "startTime": "2026-02-24T15:07:34.200Z", "durationMinutes": 1, "durationSeconds": 77}, {"endTime": "2026-02-24T15:12:53.306Z", "sessionId": "usage_1771945948417_k5qqujt06", "startTime": "2026-02-24T15:12:28.417Z", "durationMinutes": 0, "durationSeconds": 24}, {"endTime": "2026-02-24T15:13:30.362Z", "sessionId": "usage_1771945994638_tcnpwsdxx", "startTime": "2026-02-24T15:13:14.638Z", "durationMinutes": 0, "durationSeconds": 15}]	\N	\N	\N	\N	\N	\N	2026-02-24 15:06:21.124622	2026-02-24 15:13:31.058
0b3f0516-9df4-4fef-9465-5428d10e3825	6786fa29-edbe-4087-97b5-ea4b77bdb286	\N	free_trial	trial	2	3	7	180	[{"endTime": "2026-02-24T14:25:01.597Z", "sessionId": "usage_1771942756258_9u1esz6xn", "startTime": "2026-02-24T14:19:16.258Z", "durationMinutes": 6, "durationSeconds": 345}, {"endTime": "2026-02-24T14:25:37.748Z", "sessionId": "usage_1771943105539_rgdbpnn5f", "startTime": "2026-02-24T14:25:05.539Z", "durationMinutes": 1, "durationSeconds": 32}]	\N	\N	\N	\N	\N	\N	2026-02-24 14:18:58.205898	2026-02-24 14:25:38.557
db4cb17c-76d1-4b8b-9dff-90355fa93a66	827ed084-6bfa-41e7-8956-b336bc88cf7b	\N	free_trial	trial	3	3	3	180	[{"endTime": "2026-02-24T14:58:07.152Z", "sessionId": "usage_1771945065272_bfw72k658", "startTime": "2026-02-24T14:57:45.273Z", "durationMinutes": 0, "durationSeconds": 21}, {"endTime": "2026-02-24T15:01:59.039Z", "sessionId": "usage_1771945140571_d4vtnrjlh", "startTime": "2026-02-24T14:59:00.571Z", "durationMinutes": 3, "durationSeconds": 178}, {"endTime": "2026-02-24T15:04:21.446Z", "sessionId": "usage_1771945452762_v45wg4ymm", "startTime": "2026-02-24T15:04:12.762Z", "durationMinutes": 0, "durationSeconds": 8}]	\N	\N	\N	\N	\N	\N	2026-02-24 14:57:19.602899	2026-02-24 15:04:22.12
f57927a1-46e7-41aa-a258-df6463064a7a	11d8a2a5-5819-4c1f-a465-c106977bc7fe	\N	free_trial	trial	3	3	5	180	[{"endTime": "2026-02-24T15:34:23.977Z", "sessionId": "usage_1771947245162_dzi1x5x5m", "startTime": "2026-02-24T15:34:05.162Z", "durationMinutes": 0, "durationSeconds": 18}, {"endTime": "2026-02-24T15:40:17.195Z", "sessionId": "usage_1771947329647_ikhr1esn0", "startTime": "2026-02-24T15:35:29.647Z", "durationMinutes": 5, "durationSeconds": 287}, {"endTime": "2026-02-24T15:40:52.962Z", "sessionId": "usage_1771947646924_wr7sueget", "startTime": "2026-02-24T15:40:46.924Z", "durationMinutes": 0, "durationSeconds": 6}]	\N	\N	\N	\N	\N	\N	2026-02-24 15:33:43.304812	2026-02-24 15:40:53.675
c98c7d54-9caf-4dc6-9b45-90664966a0af	782bfd26-63f3-4eb9-a91a-380ffafd0bca	\N	free_trial	trial	3	3	4	180	[{"endTime": "2026-02-24T14:50:10.168Z", "sessionId": "usage_1771944533677_mwjvkscac", "startTime": "2026-02-24T14:48:53.677Z", "durationMinutes": 1, "durationSeconds": 76}, {"endTime": "2026-02-24T14:54:33.552Z", "sessionId": "usage_1771944708272_a1ioomyq8", "startTime": "2026-02-24T14:51:48.272Z", "durationMinutes": 3, "durationSeconds": 165}, {"endTime": "2026-02-24T14:54:46.120Z", "sessionId": "usage_1771944876822_jpbgpjw8s", "startTime": "2026-02-24T14:54:36.822Z", "durationMinutes": 0, "durationSeconds": 9}]	\N	\N	\N	\N	\N	\N	2026-02-24 14:48:32.652745	2026-02-24 14:54:46.832
5f8a77f0-efa6-4d7a-abba-a8e6c4102831	87f0700a-53a9-4909-845a-f79e438f153f	\N	free_trial	trial	3	3	3	180	[{"endTime": "2026-02-24T14:30:11.498Z", "sessionId": "usage_1771943284626_rzknolutk", "startTime": "2026-02-24T14:28:04.626Z", "durationMinutes": 2, "durationSeconds": 126}, {"endTime": "2026-02-24T14:31:34.991Z", "sessionId": "usage_1771943481725_l473vfip1", "startTime": "2026-02-24T14:31:21.725Z", "durationMinutes": 0, "durationSeconds": 13}, {"endTime": "2026-02-24T14:33:33.927Z", "sessionId": "usage_1771943580987_kaqvk9stz", "startTime": "2026-02-24T14:33:00.987Z", "durationMinutes": 1, "durationSeconds": 32}]	\N	\N	\N	\N	\N	\N	2026-02-24 14:27:44.200428	2026-02-24 14:33:34.617
431dcc9a-dca6-43ca-93c1-4d7f58978621	262a89e3-6dde-4b37-a65f-e800fd316105	\N	free_trial	trial	3	3	0	180	[{"endTime": "2026-02-23T21:09:15.671Z", "sessionId": "usage_1771880911323_o7qaux23f", "startTime": "2026-02-23T21:08:31.323Z", "durationMinutes": 0}]	\N	\N	\N	\N	\N	\N	2026-02-23 21:07:18.808064	2026-02-25 18:17:17.018
3a10d06c-29e2-4106-88f6-e50b7a43c76d	0bbf93eb-18b0-473d-8716-ff861b523068	\N	free_trial	trial	3	3	3	180	[{"endTime": "2026-02-24T15:48:26.693Z", "sessionId": "usage_1771948052484_m4axwt4oe", "startTime": "2026-02-24T15:47:32.484Z", "durationMinutes": 1, "durationSeconds": 54}, {"endTime": "2026-02-24T15:50:20.341Z", "sessionId": "usage_1771948124685_e9z44r8ds", "startTime": "2026-02-24T15:48:44.685Z", "durationMinutes": 2, "durationSeconds": 95}, {"endTime": "2026-02-24T16:03:50.790Z", "sessionId": "usage_1771949013381_9cfg2i8da", "startTime": "2026-02-24T16:03:33.381Z", "durationMinutes": 0}]	\N	\N	\N	\N	\N	\N	2026-02-24 15:47:15.617426	2026-02-24 16:03:51.553
8121df23-b6a3-4dbb-b95a-bdc5b24e4241	1a29b73b-7428-45eb-84c8-8363f2d6b1a6	\N	free_trial	trial	3	3	1	180	[{"endTime": "2026-02-24T16:28:12.569Z", "sessionId": "usage_1771950427138_8olcw91hf", "startTime": "2026-02-24T16:27:07.138Z", "durationMinutes": 1}, {"endTime": "2026-02-24T16:29:51.339Z", "sessionId": "usage_1771950532494_9i2y0pjrq", "startTime": "2026-02-24T16:28:52.494Z", "durationMinutes": 0}, {"endTime": "2026-02-24T16:33:39.589Z", "sessionId": "usage_1771950802183_dd40sc9vr", "startTime": "2026-02-24T16:33:22.183Z", "durationMinutes": 0}]	\N	\N	\N	\N	\N	\N	2026-02-24 16:26:51.524596	2026-02-24 16:33:40.33
e253db64-0445-4684-8b0b-089bc04b3821	c82bdfb4-7184-455b-b48b-c03bdc9b904d	\N	free_trial	trial	3	3	1	180	[{"endTime": "2026-02-24T16:05:37.632Z", "sessionId": "usage_1771949114551_a9lvuc9hj", "startTime": "2026-02-24T16:05:14.551Z", "durationMinutes": 0}, {"endTime": "2026-02-24T16:09:23.170Z", "sessionId": "usage_1771949312044_cqvnmq97c", "startTime": "2026-02-24T16:08:32.044Z", "durationMinutes": 0}, {"endTime": "2026-02-24T16:11:37.194Z", "sessionId": "usage_1771949426287_5uifcextg", "startTime": "2026-02-24T16:10:26.287Z", "durationMinutes": 1}]	\N	\N	\N	\N	\N	\N	2026-02-24 16:04:56.964328	2026-02-24 16:11:37.902
59156d6d-9ca4-43b6-9c1b-971ec3599588	87fd5820-718b-4c0d-9e22-bf284e65fcb6	\N	free_trial	trial	3	3	0	180	[{"endTime": "2026-02-24T16:55:33.075Z", "sessionId": "usage_1771952114866_upqxa4miy", "startTime": "2026-02-24T16:55:14.866Z", "durationMinutes": 0}, {"endTime": "2026-02-24T17:19:35.070Z", "sessionId": "usage_1771952070047_1s7bcssy0", "startTime": "2026-02-24T16:54:30.047Z", "durationMinutes": 0}]	\N	\N	\N	\N	\N	\N	2026-02-24 16:53:59.377954	2026-02-24 17:19:35.781
574bb251-0207-49a1-98db-a0d55fc505d7	acfaf022-ca19-4d8d-a1a0-c30160a675cc	\N	free_trial	trial	3	3	1	180	[{"endTime": "2026-02-24T16:40:15.143Z", "sessionId": "usage_1771951116740_jqodsnn40", "startTime": "2026-02-24T16:38:36.740Z", "durationMinutes": 1}]	\N	\N	\N	\N	\N	\N	2026-02-24 16:37:44.038993	2026-02-24 16:40:15.852
94e67e7c-13f0-4fb4-99eb-ab4a08201c81	4d6a0432-1e08-4c01-ad9c-42e035f71a87	\N	free_trial	trial	3	3	3	180	[{"endTime": "2026-02-24T16:16:47.573Z", "sessionId": "usage_1771949682050_6rv6fxm49", "startTime": "2026-02-24T16:14:42.050Z", "durationMinutes": 2}, {"endTime": "2026-02-24T16:19:13.710Z", "sessionId": "usage_1771949946288_765xlssj2", "startTime": "2026-02-24T16:19:06.288Z", "durationMinutes": 0}, {"endTime": "2026-02-24T16:23:41.360Z", "sessionId": "usage_1771950147938_97dqba9j5", "startTime": "2026-02-24T16:22:27.938Z", "durationMinutes": 1}]	\N	\N	\N	\N	\N	\N	2026-02-24 16:14:24.288546	2026-02-24 16:23:42.061
20954fcb-1603-4f53-a1c3-61be70da578a	dd3482f7-9478-4fcc-b162-940fb9ecadba	\N	free_trial	trial	2	3	0	180	[{"endTime": "2026-02-25T18:34:51.760Z", "sessionId": "usage_1772044455246_brx0qekgx", "startTime": "2026-02-25T18:34:15.246Z", "durationMinutes": 0}]	\N	\N	\N	\N	\N	\N	2026-02-25 18:32:34.145241	2026-02-25 18:34:52.454
63deace3-de13-4ddf-800d-eddb05cb063f	07911237-2594-463c-bb5d-65ac53b9a9a7	\N	free_trial	trial	3	3	2	180	[{"endTime": "2026-02-24T16:49:56.630Z", "sessionId": "usage_1771951663415_zjz0y67ue", "startTime": "2026-02-24T16:47:43.415Z", "durationMinutes": 2}, {"endTime": "2026-02-24T16:51:26.801Z", "sessionId": "usage_1771951879778_0e72av2h2", "startTime": "2026-02-24T16:51:19.779Z", "durationMinutes": 0}]	\N	\N	\N	\N	\N	\N	2026-02-24 16:44:40.244713	2026-02-24 16:51:27.505
70be2ba6-a248-4ce1-aad0-349d2a4a5b99	c2ee8f98-90ad-497f-9f52-6f2637cad230	\N	free_trial	trial	3	3	0	180	[]	\N	\N	\N	\N	\N	\N	2026-02-25 18:41:06.224004	2026-02-25 18:53:56.198
4b02fa48-61ee-43b1-923a-889e6cb6e4af	1c6eb844-e1ca-440f-b68c-66071162b92f	\N	free_trial	trial	3	3	0	180	[]	\N	\N	\N	\N	\N	\N	2026-02-25 18:55:37.393675	2026-02-25 18:58:46.326
5f07a66c-1f9b-407f-af58-563d3aa09fcb	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	platform_access	active	5	\N	2	\N	[{"endTime": "2026-02-25T19:11:41.701Z", "sessionId": "usage_1772046620674_zim0x1e2x", "startTime": "2026-02-25T19:10:20.674Z", "durationMinutes": 1}, {"endTime": "2026-02-25T19:12:48.131Z", "sessionId": "usage_1772046740585_u6k5hmvqf", "startTime": "2026-02-25T19:12:20.585Z", "durationMinutes": 0}, {"endTime": "2026-02-25T19:20:19.445Z", "sessionId": "usage_1772047131741_fwa5z0lr6", "startTime": "2026-02-25T19:18:51.741Z", "durationMinutes": 1}, {"endTime": "2026-02-25T19:35:07.027Z", "sessionId": "usage_1772048058206_sumg3citb", "startTime": "2026-02-25T19:34:18.206Z", "durationMinutes": 0}, {"endTime": "2026-02-25T19:35:56.676Z", "sessionId": "usage_1772048125902_7ku6jt5qr", "startTime": "2026-02-25T19:35:25.902Z", "durationMinutes": 0}]	2026-02-25 19:09:13.526	2026-03-27 19:09:13.526	\N	\N	\N	\N	2026-02-25 19:06:30.204417	2026-02-26 18:00:08.052
44895651-af16-466c-a709-50f1d29373e6	4749b239-bcef-433c-a4b2-f984ec3a47e9	\N	free_trial	trial	3	3	10	180	[{"endTime": "2026-02-26T20:09:55.045Z", "sessionId": "usage_1772135948470_rkumu7wzy", "startTime": "2026-02-26T19:59:08.470Z", "durationMinutes": 10}]	\N	\N	\N	\N	\N	\N	2026-02-26 19:58:49.260019	2026-02-26 20:10:57.049
\.


--
-- Data for Name: super_user_overrides; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.super_user_overrides (id, email, reason, granted_by, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.support_tickets (id, user_id, subject, description, status, priority, assigned_to, resolved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_config; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.system_config (id, key, value, section, description, updated_by, created_at, updated_at) FROM stdin;
76092efd-87c5-4a41-8209-d1ef4abd1a8f	smtpHost	smtp.gmail.com	email	SMTP server host	\N	2026-02-22 07:41:22.410687	2026-02-22 07:41:22.410687
1afda4ca-b7d4-4d21-bd37-77fe9f04dc93	smtpPort	587	email	SMTP server port	\N	2026-02-22 07:41:22.687882	2026-02-22 07:41:22.687882
213d2433-655f-48cd-b318-7e03a93ddb74	fromName	Rev Winner	email	Email sender name	\N	2026-02-22 07:41:22.919147	2026-02-22 07:41:22.919147
85f6b675-689e-4a45-89be-a4cd4b41d4ee	enableEmailNotifications	true	email	Enable email notifications	\N	2026-02-22 07:41:23.135289	2026-02-22 07:41:23.135289
b440cd2e-96d0-4794-94d4-3c6a5b4c4f26	defaultGateway	razorpay	payment	Default payment gateway	\N	2026-02-22 07:41:23.332234	2026-02-22 07:41:23.332234
a849be3b-bb45-498e-b243-faa9a7875e89	enableTestMode	true	payment	Enable test mode for payments	\N	2026-02-22 07:41:23.54588	2026-02-22 07:41:23.54588
d6094cad-16d9-487c-a0db-c624547c0e97	defaultProvider	openai	ai	Default AI provider	\N	2026-02-22 07:41:23.744498	2026-02-22 07:41:23.744498
4f4e1a0d-733a-41c6-9c61-2f4a946eb5ee	defaultModel	gpt-4	ai	Default AI model	\N	2026-02-22 07:41:24.055917	2026-02-22 07:41:24.055917
e7b7ceae-38e8-4319-9b34-12fc48027f4f	maxTokens	2000	ai	Maximum tokens per request	\N	2026-02-22 07:41:24.351244	2026-02-22 07:41:24.351244
36053485-a903-4f05-a121-bdc43e22cbbc	temperature	0.7	ai	AI temperature setting	\N	2026-02-22 07:41:24.668431	2026-02-22 07:41:24.668431
8140ee71-a8e5-4720-810f-263b6731dd47	enableAiFeatures	true	ai	Enable AI features	\N	2026-02-22 07:41:24.966709	2026-02-22 07:41:24.966709
81b879a8-be8d-44c7-a7b2-70d344563701	siteName	Rev Winner	system	Application name	\N	2026-02-22 07:41:25.178726	2026-02-22 07:41:25.178726
cf0bbed5-250d-47b0-90a2-37d82bc98c43	siteUrl	https://revwinner.com	system	Application URL	\N	2026-02-22 07:41:25.375653	2026-02-22 07:41:25.375653
05798b5d-e775-48ce-a3c1-e1685a8b588e	supportEmail	support@revwinner.com	system	Support email address	\N	2026-02-22 07:41:25.586966	2026-02-22 07:41:25.586966
481480d2-34bb-4a76-912d-ae062ec4ed49	maintenanceMode	false	system	Maintenance mode status	\N	2026-02-22 07:41:25.782664	2026-02-22 07:41:25.782664
a8b12323-3ab7-4168-ac76-f3418a65b6cf	allowRegistration	true	system	Allow new user registration	\N	2026-02-22 07:41:25.993762	2026-02-22 07:41:25.993762
17c382f2-9d97-45b3-99fc-3e9918499c1e	requireEmailVerification	false	system	Require email verification	\N	2026-02-22 07:41:26.30019	2026-02-22 07:41:26.30019
fbdfa926-5533-458e-a1e3-253caf2b2785	sessionTimeout	3600	system	Session timeout in seconds	\N	2026-02-22 07:41:26.615877	2026-02-22 07:41:26.615877
07e3c120-7df1-4ee9-8343-eb3c8267358c	maxUploadSize	10	system	Maximum upload size in MB	\N	2026-02-22 07:41:26.913523	2026-02-22 07:41:26.913523
\.


--
-- Data for Name: system_metrics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.system_metrics (id, metric_type, value, metadata, "timestamp") FROM stdin;
\.


--
-- Data for Name: terms_and_conditions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.terms_and_conditions (id, title, content, version, is_active, last_modified_by, created_at, updated_at) FROM stdin;
3c47f0ff-05cc-4076-845d-ddfe83b0e121	Rev Winner Terms & Conditions	\n# Rev Winner Terms & Conditions\n\n**Effective Date:** November 2025  \n**Product of:** Healthcaa Technologies India Private Limited\n\n## 1. Acceptance of Terms\n\nBy accessing and using Rev Winner, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.\n\n## 2. Service Description\n\nRev Winner is a sales enablement platform that provides:\n- Real-time conversation intelligence\n- AI-powered sales coaching\n- Call transcription and analysis\n- Sales performance analytics\n\n## 3. User Accounts\n\n### 3.1 Registration\n- You must provide accurate and complete information\n- You are responsible for maintaining account security\n- You must be at least 18 years old to use this service\n\n### 3.2 Account Security\n- Keep your password confidential\n- Notify us immediately of any unauthorized access\n- You are responsible for all activities under your account\n\n## 4. Acceptable Use\n\nYou agree NOT to:\n- Use the service for any illegal purposes\n- Attempt to gain unauthorized access to our systems\n- Interfere with or disrupt the service\n- Upload malicious code or viruses\n- Violate any applicable laws or regulations\n\n## 5. Privacy and Data Protection\n\n- We collect and process data as described in our Privacy Policy\n- You retain ownership of your data\n- We implement industry-standard security measures\n- We comply with applicable data protection laws\n\n## 6. Subscription and Payments\n\n### 6.1 Subscription Plans\n- Various subscription tiers are available\n- Prices are subject to change with notice\n- Subscriptions auto-renew unless cancelled\n\n### 6.2 Refunds\n- Refund policy applies as per our Refund Policy\n- No refunds for partial months\n- Contact support for refund requests\n\n## 7. Intellectual Property\n\n- Rev Winner and its content are protected by copyright\n- You may not copy, modify, or distribute our content\n- Your data remains your property\n\n## 8. Limitation of Liability\n\nRev Winner is provided "as is" without warranties. We are not liable for:\n- Service interruptions or downtime\n- Data loss or corruption\n- Indirect or consequential damages\n- Third-party actions or content\n\n## 9. Termination\n\nWe may terminate or suspend your account if you:\n- Violate these terms\n- Engage in fraudulent activity\n- Fail to pay subscription fees\n\n## 10. Changes to Terms\n\n- We may update these terms at any time\n- Continued use constitutes acceptance of changes\n- We will notify users of significant changes\n\n## 11. Governing Law\n\nThese terms are governed by the laws of India.\n\n## 12. Contact Information\n\nFor questions about these terms:\n- Email: support@revwinner.com\n- Website: https://revwinner.com\n\n---\n\n**Last Updated:** November 2025\n	1.0	t	f0c1181f-9d2f-4152-a2e2-9041e2224315	2026-02-26 19:52:03.477234	2026-02-26 19:52:03.477234
\.


--
-- Data for Name: time_extensions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.time_extensions (id, user_id, extension_type, extension_value, reason, granted_by, status, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: traffic_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.traffic_logs (id, ip_address, country, state, city, device_type, browser, visited_page, visit_time) FROM stdin;
a4607501-9ecf-43d0-ae32-48c323fe774a	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/login	2026-02-23 05:24:16.44567
596400f1-ab21-48aa-8478-c34f494de3de	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/login	2026-02-23 05:24:16.983629
6ad09683-09f7-47e2-b1e7-7563cd3acd55	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/register	2026-02-23 05:24:30.961739
329096f9-6a2f-422b-abc1-17c8f2f95eca	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/sales-assistant	2026-02-23 05:25:19.886365
7f7a8395-0e06-48f5-b2f5-65bfb5422c59	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/	2026-02-23 05:27:29.406034
e2add40d-bc51-4c13-a0a8-2ab94c6fc81a	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/	2026-02-23 05:27:35.977513
15f74315-ea22-4e4f-acd3-a7ac679aae7a	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/login	2026-02-23 05:27:39.105642
6556cd77-7bac-4cfa-b660-4a6c0defecaa	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/register	2026-02-23 05:27:44.166564
cf3bfa8b-94d1-42d3-b780-b2fade1cb74a	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/	2026-02-23 05:29:40.301838
f154a63b-f24b-487b-b87a-2f72641b0640	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/login	2026-02-23 05:29:45.400835
50161bd1-a69b-4fa9-86e5-69a7d2804457	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/register	2026-02-23 05:31:52.981799
048ae742-a0f8-4d7f-87b2-7b7fed5226b0	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/sales-assistant	2026-02-23 05:32:55.649917
25776764-0e92-4e5e-b511-92f77f33f5ce	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/train-me	2026-02-23 06:10:15.125332
ae1c3fa1-2aa7-4e68-8533-3e006140529b	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/profile	2026-02-23 06:10:18.174482
d164067a-9560-4f3c-a243-d9ba24d8638b	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-23 06:10:22.929343
506227b1-67d2-4705-a7f3-86777f25f036	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/packages	2026-02-23 06:11:03.380379
36467fe4-230f-4232-9ded-fc821eb33c66	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/sales-challenge	2026-02-23 06:11:19.108417
189416a3-1db7-44d1-9416-4b5d5eabb3b0	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/packages	2026-02-23 06:11:21.198723
4b852e94-6e5c-44b4-bf1c-a4e397eb13fe	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/cart	2026-02-23 06:11:32.287942
fe41388a-6353-40eb-90f8-d64f15305117	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/packages	2026-02-23 06:11:33.065062
5cd21e5d-32e7-4e76-a864-c0d97212f568	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-23 06:12:07.307698
7ac5ff59-41b4-492b-95d4-3dd6c4f05368	122.50.1.85	Pakistan	Sindh	Karachi	Desktop	Chrome	/	2026-02-23 06:43:25.26689
55fabf8a-c8ec-4577-853e-f1a8514703aa	42.106.237.220	India	Maharashtra	Mumbai	Mobile	Chrome	/	2026-02-23 07:36:32.647907
09bfcc66-37ca-4c04-a6d6-c791307c9a98	59.145.189.196	India	Himachal Pradesh	Baddi	Desktop	Chrome	/	2026-02-23 09:01:24.755095
6a7967ea-fe42-415b-b6f2-37ac169fac03	59.145.189.196	India	Himachal Pradesh	Baddi	Desktop	Chrome	/	2026-02-23 11:03:26.572937
f0a97ff6-378a-440a-93b4-ba33cf149dc2	59.145.189.196	India	Himachal Pradesh	Baddi	Desktop	Chrome	/	2026-02-23 11:04:17.56111
5d9cdfbe-3eb0-4b5f-a626-59243588f50d	74.125.150.35	United States	California	Mountain View	Desktop	Chrome	/	2026-02-23 12:35:42.309826
f7d5dbad-6a3d-4a9d-aaf8-12181b901c0b	154.6.129.93	United States	New York	New York City	Desktop	Chrome	/	2026-02-23 14:09:08.111048
c8c20b6e-568f-4a39-89df-b7a14894af2f	74.125.150.36	United States	California	Mountain View	Desktop	Unknown	/apple-app-site-association	2026-02-23 14:11:07.98372
3610de71-a6c4-441a-973f-944b8770d935	172.56.22.214	United States	Texas	Fort Worth	Desktop	Chrome	/	2026-02-23 16:44:31.710588
c1678f8b-c996-44a0-918c-208af2b13ba5	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/	2026-02-23 19:47:12.258588
63c58e83-4523-4957-bbc3-882f37294ead	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/login	2026-02-23 19:47:14.143356
43724e3c-615a-4856-96dd-2dcf26f543ab	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/	2026-02-23 19:47:22.496015
464901cc-2d89-4050-a412-79653f93c16f	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/admin/traffic	2026-02-23 19:47:31.94746
a2f41256-3bf5-4042-bf6b-69676a570737	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/admin/login	2026-02-23 19:47:32.301439
d8b695c4-0882-477c-84b4-85d812478f91	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-23 21:06:36.110034
f78086ba-6174-42cc-833b-fa114d51156a	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/login	2026-02-23 21:06:39.081405
c9201bf2-836f-4d6e-ac9b-5e9b7774b348	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/register	2026-02-23 21:06:43.958352
5036c21c-661c-48a7-b369-12e97e3ce570	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/sales-assistant	2026-02-23 21:07:20.518152
0a3e4474-b619-4453-8ca2-ab7b8bd990ab	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/profile	2026-02-23 21:07:27.788488
bea73b41-d51b-46c1-b9e3-849f681c0f6e	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/packages	2026-02-23 21:07:30.255442
ec2baf4f-e755-46d2-a5e6-4b4859ce298a	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/profile	2026-02-23 21:07:57.489883
7e2d5296-cf69-46e3-9c82-565a5e7bd4cc	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/ai-sales-assistant	2026-02-23 21:08:04.985987
3963f7e1-d100-4bf6-8b85-0b5a7fd19af9	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-23 21:19:26.156201
d10d1d98-a631-499d-854b-8f11a4b008c7	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/profile	2026-02-23 21:19:30.067498
dd6b1006-6d03-4ab9-9657-dc5e481f862d	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/admin	2026-02-23 21:19:35.883026
05b733d0-d7e1-479a-8b13-895bd963d456	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/admin/login	2026-02-23 21:19:36.256127
4858c21a-16ca-415c-9852-907c342bb7af	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-22 06:41:58.854222
068dd730-e3b6-493d-bc93-82ab8a26fb43	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-22 06:42:01.054786
532369b8-0cfa-4b0a-9b44-4ef69e49c56d	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-22 06:45:18.731133
312895db-70e9-42bc-9db2-c15cc72e8770	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-22 07:09:41.593158
2255d45a-ff05-4cc3-b876-7efb842a58ac	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-22 07:17:35.680412
6649c75c-1be6-4255-9b59-9c2499981abb	::1	Local	Development	Localhost	Desktop	Chrome	/admin/login	2026-02-22 07:17:36.480892
eaccad4c-622f-4f16-b29b-7ffb90ce66cb	::1	Local	Development	Localhost	Desktop	Chrome	/admin/login	2026-02-22 07:20:36.007268
783d7695-bef2-4a9c-a3ce-e7cf6c5207ce	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-22 07:22:59.252055
c800d85e-a87f-4ec5-a1ac-3aac85fc2589	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-22 07:51:04.982912
2f8e66fa-f050-4822-8b7e-61f2eef8797f	::1	Local	Development	Localhost	Desktop	Chrome	/admin/login	2026-02-22 07:51:05.445235
4b5f77c5-b7af-45b2-983f-35fb80638dce	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-22 07:51:06.868507
bdad7ddd-de1d-4d7d-ad87-2a9ded04551e	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-22 07:51:16.658288
37d656e2-62b9-455e-814a-cb53df25fab6	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 08:47:36.094325
bdbb1abb-b378-42e2-afcb-7cf3e746fa95	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 09:11:29.300755
a2d445df-a9c6-4fae-bef6-178db2e7a1e5	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-22 09:11:38.159259
39ab9ff0-ca24-44ac-9b96-b1bbbdeee033	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-22 09:11:53.808252
71c6cddb-0c3e-4dba-9ec0-49fcb09ab07b	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-22 09:17:59.500445
8282704a-0bb0-4dbb-a2b7-7fa3e224e1df	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-22 09:18:11.924318
e2551043-e60f-4a95-a171-1136d12e88a0	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-22 09:27:19.111165
7847837b-eadd-487b-89c9-2dca5e31173b	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-22 09:30:32.431733
3521e06a-272b-478e-a17a-3378762311fa	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-22 09:32:42.649959
5f3f131d-21fe-4fe1-909a-fa4370661e7b	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-22 09:33:20.889594
98005c49-2c3f-441a-96eb-cc1df251a995	::1	Local	Development	Localhost	Mobile	Chrome	/login	2026-02-22 09:38:05.343447
4ff936eb-f5c7-4785-9223-5a2b2341f7f1	::1	Local	Development	Localhost	Mobile	Chrome	/ai-sales-assistant	2026-02-22 09:38:15.991732
aa8758ce-e2b4-48fd-85d0-c5989c165d01	::1	Local	Development	Localhost	Mobile	Chrome	/ai-sales-assistant	2026-02-22 09:41:34.685891
8f3b6e83-1d5c-4034-b978-e9f4df32d397	::1	Local	Development	Localhost	Mobile	Chrome	/ai-sales-assistant	2026-02-22 09:41:47.44694
0c57cf5f-5ce3-4311-a670-8bccabb17e4f	::1	Local	Development	Localhost	Mobile	Chrome	/profile	2026-02-22 09:41:54.530397
1dfc737d-02b6-4e05-8260-6b2279b16a87	::1	Local	Development	Localhost	Mobile	Chrome	/login	2026-02-22 09:42:02.412282
9553d99d-16a2-4244-9703-2ce1e04f28df	::1	Local	Development	Localhost	Mobile	Chrome	/app	2026-02-22 09:42:12.161439
c82b09a1-06eb-4b7e-90c3-c67fe7e70d30	::1	Local	Development	Localhost	Mobile	Chrome	/login	2026-02-22 09:42:19.022213
c75be5c8-a3a0-4c47-a78b-ff145b330b35	::1	Local	Development	Localhost	Mobile	Chrome	/register	2026-02-22 09:42:20.465924
67d9e63e-5c17-4158-bc10-25e531f93f24	::1	Local	Development	Localhost	Mobile	Chrome	/sales-assistant	2026-02-22 09:43:16.803157
a4589487-52ab-49f3-bdff-ebfb4646bd39	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-22 09:51:25.440036
d19ebd7d-fecd-47d4-8bf3-35c550f3b6ee	::1	Local	Development	Localhost	Mobile	Chrome	/profile	2026-02-22 09:53:59.822332
3e1773ea-d395-4c7d-9ec4-35ac87add3c8	::1	Local	Development	Localhost	Mobile	Chrome	/profile	2026-02-22 09:54:12.51772
e451624d-cd3a-45b8-b835-30e368816375	::1	Local	Development	Localhost	Desktop	Chrome	/train-me	2026-02-22 09:54:57.131976
dd1d6a00-3353-45ec-a57a-66ed3bd197f7	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 09:54:58.050131
4303d6a7-49b5-4e68-aba5-891f4278d289	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-22 09:55:00.640593
ea5a7925-1655-4917-b53e-08a9db2619cb	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 09:55:20.287055
5e8c3cce-977e-40e4-86de-ca1063bc0f6e	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-22 09:55:40.382416
65090ae2-3254-4b8f-ace2-da19a9006f66	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-22 09:55:42.277291
b0e0d2f1-f38a-422c-8a26-ae396f72a7de	::1	Local	Development	Localhost	Desktop	Chrome	/admin/login	2026-02-22 09:55:42.690432
a56be144-bb7a-4b21-85e0-f625531490c7	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-22 09:55:50.921592
e25199fd-617d-4d9b-b295-3117dedbdb0a	::1	Local	Development	Localhost	Desktop	Chrome	/checkout	2026-02-22 09:57:18.768556
8ac2ee5b-134b-468b-b89b-17e37c2fa8d6	::1	Local	Development	Localhost	Desktop	Chrome	/checkout	2026-02-22 10:01:23.933034
44777b33-07f8-4be0-98b5-a35733325bb7	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 10:01:25.210075
c7e802fd-ad1f-4264-b05f-ce16af412249	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-22 10:01:27.448195
354d6eb3-0ba2-409b-bafe-1303f88b58fc	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 10:01:32.97218
267ffc09-251d-41ab-8949-07169dd570a5	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-22 10:01:35.775618
4d9f1ee9-e1b7-41ab-acca-d22131836b2e	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 10:01:39.623361
b4e38e5f-63ad-4987-82d6-53a591070bc6	::1	Local	Development	Localhost	Desktop	Chrome	/invoice	2026-02-22 10:01:45.446457
1e28ec7a-cdd6-4902-b846-55e8b3a4e097	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-22 10:01:53.335162
73f36114-304f-4aec-ac0a-87679c491ad2	::1	Local	Development	Localhost	Desktop	Chrome	/train-me	2026-02-22 10:03:40.092156
a5c47d50-8ce4-4281-9eff-b0568758f8e9	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 10:03:41.303751
9867bf3b-494d-4fba-b460-7e8ec105eb50	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-22 10:03:42.884308
f10d24a9-a363-4a49-9049-bffa206c2485	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 10:03:51.256235
63379914-890e-4c7a-8251-9f0033586286	::1	Local	Development	Localhost	Desktop	Chrome	/checkout	2026-02-22 10:03:54.674709
5638af6c-122d-4ead-ac53-7bb00134ee2b	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 10:04:56.96427
9d24cf79-1981-4ea2-8771-293c13bf51c6	::1	Local	Development	Localhost	Desktop	Chrome	/train-me	2026-02-22 10:04:59.622967
d1c72a1b-5a5a-47a0-a3f4-527ebe8ef140	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-22 10:06:28.198772
0a1c39f1-438a-4833-a592-6de1b28917ce	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-22 10:06:30.175749
8910add3-77a3-4e22-9c2f-f5b6a0046417	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 10:13:51.386609
878c1498-7258-44ed-b450-b0e65998afa1	::1	Local	Development	Localhost	Desktop	Chrome	/train-me	2026-02-22 10:13:54.550193
57d381ff-92bf-4aa0-a6b2-bd7bca6503f1	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-22 10:13:54.772059
9b276f6f-9efd-478a-9778-44aa8471ab1c	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-22 10:13:56.563524
8458fdae-47f7-4792-a9db-aa3b8c73b50d	::1	Local	Development	Localhost	Mobile	Chrome	/cart	2026-02-22 10:16:18.26632
782b4f81-1739-4e4c-90c1-450af2a50d98	::1	Local	Development	Localhost	Mobile	Chrome	/packages	2026-02-22 10:16:20.220595
64454b41-1396-4589-a823-5d8823907a25	::1	Local	Development	Localhost	Mobile	Chrome	/packages	2026-02-22 10:16:28.053243
5f1d209b-3ae4-42d5-ad90-f67a362ddeef	::1	Local	Development	Localhost	Desktop	Chrome	/admin/login	2026-02-22 10:19:17.060072
fc355b0a-eab8-43bb-bec4-0f1fae258213	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-22 10:19:21.423838
b7c057f1-4859-4bd7-a2fd-801daeb553f1	::1	Local	Development	Localhost	Mobile	Chrome	/packages	2026-02-22 10:23:38.294825
8712301c-6b09-47c4-9e01-1d42df1d87f4	::1	Local	Development	Localhost	Mobile	Chrome	/cart	2026-02-22 10:24:07.910782
f567e80e-2af1-495a-8fd1-b1ba7f2c0f70	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-22 10:24:17.84632
ae7ce69e-d338-4a37-b991-c2c59ae54a11	::1	Local	Development	Localhost	Mobile	Chrome	/checkout	2026-02-22 10:25:07.259758
01cd2e1f-7d15-4788-953f-449d8efcda9a	::1	Local	Development	Localhost	Mobile	Chrome	/cart	2026-02-22 10:27:24.837553
1d9da95d-ec3b-4bb2-990d-71210b46b04a	::1	Local	Development	Localhost	Mobile	Chrome	/checkout	2026-02-22 10:27:25.059666
b6a31fa4-916e-4233-942a-b9f6d08b0f69	::1	Local	Development	Localhost	Mobile	Chrome	/packages	2026-02-22 10:27:26.14114
1cf72138-f25b-4393-87f0-f154c986b510	::1	Local	Development	Localhost	Mobile	Chrome	/cart	2026-02-22 10:27:33.06236
6cb47927-67b6-46bb-9ffb-d347fc4537bb	::1	Local	Development	Localhost	Mobile	Chrome	/checkout	2026-02-22 10:27:42.05009
e860c161-d08c-4214-85b8-f6ad743a3ec2	::1	Local	Development	Localhost	Mobile	Chrome	/invoice	2026-02-22 10:27:49.009311
379635f3-b3c3-4cfd-b8bc-ad2e934d7090	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 10:28:11.15992
24cae7dd-c495-42a0-af36-5d86ef3c4264	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-22 10:28:21.099718
9e0a0adc-743f-4b47-a5b2-50b9cbce83c2	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 10:28:26.304063
214837dc-6310-4ba8-b2a6-7bea21ced5e1	::1	Local	Development	Localhost	Desktop	Chrome	/checkout	2026-02-22 10:28:30.162461
09d345c9-5814-461c-babb-40ab7c0c5402	::1	Local	Development	Localhost	Desktop	Chrome	/invoice	2026-02-22 10:29:14.803069
5eabc34b-e7c2-4a9a-8818-fbd8d1c2acbb	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 10:30:02.066521
b7be974a-fe82-4a03-8860-6a8a6a0b883b	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 10:30:05.022378
2fa16b78-1d14-428b-a081-1332f7db1a76	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-22 10:30:06.767154
2a4a6dbb-ed1b-4f20-b8aa-51dc423c1fdb	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 10:30:14.419643
01e9d9e2-e4c9-422a-9949-329822a463c6	::1	Local	Development	Localhost	Desktop	Chrome	/checkout	2026-02-22 10:30:16.025974
1572dbeb-2e00-4fe4-a7d0-8f80d1ac6aae	::1	Local	Development	Localhost	Desktop	Chrome	/invoice	2026-02-22 10:31:16.707692
55eafa2f-7b03-45eb-83b8-e69eb9f2d186	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 10:31:57.325932
b0cacb16-2590-450b-81c0-6bf59b0fb642	::1	Local	Development	Localhost	Desktop	Chrome	/invoice	2026-02-22 10:32:06.483373
5e8775f1-743d-4ce9-a92b-591df997451a	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 10:32:11.454614
8c01020a-92f6-46a0-87f3-cc1a16bd332f	::1	Local	Development	Localhost	Desktop	Chrome	/train-me	2026-02-22 10:32:17.234365
28fc403d-1536-48cf-a91c-32a1c3794c18	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-22 10:34:42.011402
e021091d-caf8-44cc-8639-fd42ce2c3052	::1	Local	Development	Localhost	Mobile	Chrome	/cart	2026-02-22 10:16:38.655062
878c3fea-95fb-44a9-a447-8acd992e170c	::1	Local	Development	Localhost	Mobile	Chrome	/checkout	2026-02-22 10:16:42.636965
cad90a52-43d8-4b7d-b685-0ec6bbd5da3d	::1	Local	Development	Localhost	Mobile	Chrome	/checkout	2026-02-22 10:18:33.244482
4317b932-b1e8-4f5d-8f40-ff4f273064b3	::1	Local	Development	Localhost	Mobile	Chrome	/cart	2026-02-22 10:18:34.22694
23e494ec-9d53-4655-89ec-7b3a3a516ecc	::1	Local	Development	Localhost	Mobile	Chrome	/packages	2026-02-22 10:18:52.11406
a5064da1-b42d-450f-89e3-481dd6b7da5f	::1	Local	Development	Localhost	Desktop	Chrome	/enterprise-purchase	2026-02-22 10:40:31.96967
be2b7fec-e954-4474-a330-8e69bb9fb451	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-22 11:46:48.812231
7ecf1048-50ab-44af-9d68-eb2eb3e47d12	::1	Local	Development	Localhost	Desktop	Chrome	/license-manager	2026-02-22 11:46:52.59037
4cf21d25-2019-4e5d-b917-fd6587310f34	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-22 11:47:40.281095
8651ce94-28fb-4878-bb10-d338f2b163bd	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-22 11:49:19.760951
998f02e6-c49c-4e52-b64a-72d4e4acad41	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-22 11:49:31.925344
be883155-101d-431d-9238-a320824611be	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 11:49:45.208771
33deaa70-2881-4cd4-bd8d-9f4e35c2f3bc	::1	Local	Development	Localhost	Desktop	Chrome	/license-manager	2026-02-22 11:59:52.332445
d9d15a0f-b09c-43c7-aaf4-02c3ae5f9af2	::1	Local	Development	Localhost	Desktop	Chrome	/license-manager	2026-02-22 12:05:31.461805
92fc0379-ae08-4ef1-bed6-b53c76d654a3	::1	Local	Development	Localhost	Desktop	Chrome	/license-manager	2026-02-22 12:10:52.693269
ebac4342-0e2c-40fd-9725-4bb73fbd2e01	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-22 12:13:50.165903
bf4dae49-2e48-42b5-816a-52ccbfa82b07	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 12:14:03.021009
6239ccb8-29f3-4d32-90dd-11fd58390579	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-22 12:14:10.263193
78472720-fe47-4cbd-9360-da026111d717	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 12:14:24.529251
2322d616-107e-43fa-b86c-a0e3ad43d254	::1	Local	Development	Localhost	Desktop	Chrome	/checkout	2026-02-22 12:14:33.648252
0905fbd6-4021-4271-90e8-299a15673953	::1	Local	Development	Localhost	Desktop	Chrome	/license-manager	2026-02-22 12:20:07.527191
2a32ddae-c968-42fe-9b51-e053db854bb3	::1	Local	Development	Localhost	Desktop	Chrome	/checkout	2026-02-22 12:20:08.059177
fb05f849-0d8d-473a-9423-3628efac19ef	::1	Local	Development	Localhost	Desktop	Chrome	/reset-password	2026-02-22 12:20:45.313986
49741bfd-6621-4d5b-8e09-aa6c3c76298e	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-22 12:20:51.535325
304d351f-20ca-4944-9555-6d216d09d287	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-22 12:21:07.989416
2f2d39e7-29af-4373-9809-591f089cd715	::1	Local	Development	Localhost	Desktop	Chrome	/checkout	2026-02-22 12:21:35.296502
e550cf34-a35e-411f-9e06-a7f5c744a581	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 12:21:35.695708
db56efa0-3245-4a6c-b5e2-9ba228a7f43f	::1	Local	Development	Localhost	Desktop	Chrome	/license-manager	2026-02-22 12:22:44.835142
ccfbc8ca-c607-46ac-b573-9fc69c251ef2	::1	Local	Development	Localhost	Desktop	Chrome	/enterprise-purchase	2026-02-22 12:22:58.710114
0a16df70-2ef1-4961-9d4e-c430199bb012	::1	Local	Development	Localhost	Desktop	Chrome	/license-manager	2026-02-22 12:23:57.756314
93f9beb8-368d-43b5-adfd-f798887c7365	::1	Local	Development	Localhost	Desktop	Chrome	/license-manager	2026-02-22 12:24:47.374882
31d30dc6-5729-4ba7-b492-ec04af728f03	::1	Local	Development	Localhost	Desktop	Chrome	/reset-password	2026-02-22 12:26:19.216911
2b43ae8d-0619-4d87-9ed4-2e61f6bca8d3	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-22 12:26:27.828048
394f9e23-41e0-428c-82f0-07d05208c6f0	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-22 12:26:49.068982
15cfb244-fd84-4a34-8c02-5182e7532313	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-22 12:27:40.513116
f74c28f0-5fe0-4fd0-a86b-cd753f8b09ed	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 12:27:50.254716
340f678a-d803-4ed2-a065-4f789d543f46	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 12:27:54.678444
774b60d3-2c70-4565-b152-a2eef6d9a138	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 12:28:18.16745
00911d5c-96ad-4738-86a5-462a0e1bb9cd	::1	Local	Development	Localhost	Desktop	Chrome	/checkout	2026-02-22 12:28:24.993239
c8174f68-0896-456d-ad27-10fbbe1f2e32	::1	Local	Development	Localhost	Desktop	Chrome	/invoice	2026-02-22 12:30:06.760495
351c808a-191d-44bc-8ae5-52567617d2f5	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 12:31:44.700061
7e776674-6b36-4e64-b5d6-5f4d50b0435b	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 12:31:52.919247
3fdd22f9-b63b-402b-9fe1-8401be98971a	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-22 12:32:27.962995
61cb21a3-e005-4996-a08d-2da6401ea707	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 12:32:31.768144
66680122-fb9e-4bd9-93aa-6210810b8153	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 12:32:46.919281
4b030d1d-2624-46b1-8c0a-5e433b634cd9	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-22 12:45:49.29441
9de15c40-4dd1-46b1-8ee1-a85ffbc9364b	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-22 12:45:49.598565
f5f57304-e92e-4f35-90cd-40c4c6c2ef79	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-22 12:45:57.867853
c85e4d6b-9d2b-4d6f-9e97-db4e105c4275	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 12:46:01.873278
90ee8040-acc9-4cc7-9dcf-41b838f4da2a	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-22 12:46:03.045884
40a55e53-4181-4419-bbe8-b124f4af3a14	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 12:46:07.60601
8bece37b-6b35-429b-ac49-02369e3fc5f9	::1	Local	Development	Localhost	Desktop	Chrome	/checkout	2026-02-22 12:46:10.351247
c51f0393-0286-4f70-8ab2-68b0b34f0cf1	::1	Local	Development	Localhost	Desktop	Chrome	/invoice	2026-02-22 12:46:49.600941
e729e4f5-5b61-46d1-b368-6ecee6ec140a	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 12:47:01.634834
749ca0f9-2dfc-415a-92a6-555a8ba59963	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-22 12:47:02.446116
ae430be6-7479-4f7e-9519-3a9126909654	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 12:47:16.52366
7c4c1890-54f9-4d93-9de2-343d13eda27a	::1	Local	Development	Localhost	Desktop	Chrome	/checkout	2026-02-22 12:47:17.985697
53de3772-206e-432f-8cd9-c7e65be59513	::1	Local	Development	Localhost	Desktop	Chrome	/invoice	2026-02-22 12:47:58.060781
2c6b32d0-db8b-43b7-b1a0-84d1487c4af3	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-22 12:48:17.701367
d18f6ebd-98df-46a5-8627-83f14a404aa3	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 12:48:21.797633
fa9c3888-2ca9-425b-8dc8-fbe4e17247bd	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 12:48:27.108556
db02e2bd-11c8-4de9-a39f-7501485c8a73	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 12:48:35.485331
bf90463d-5092-4963-a866-5a2d66b953ce	::1	Local	Development	Localhost	Desktop	Chrome	/invoice	2026-02-22 12:48:41.774103
6a6c1f76-5ec3-4c42-9548-aababfe102be	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-22 12:48:49.67725
ec34f377-dd38-4796-8565-63f41faa3dca	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 12:48:56.817248
2150a482-b039-4b1d-8913-7af74aa7cc6f	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-22 12:49:31.945239
c3405da2-d8d9-4f28-999a-1afc6fff203f	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-22 12:49:41.988766
f36e9e39-7cbf-4504-9cfe-33324641cf8a	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-22 12:50:30.891609
b0968103-413a-448e-b33f-654aa3d7b4cd	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-22 12:50:41.242618
3ad6a3d8-d80d-4eec-b188-f43864b09b02	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 12:55:34.009064
acc646f8-e809-4abf-b7e2-257bbfa548f6	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/login	2026-02-22 12:58:28.317222
f1daa606-c016-467e-be1a-0edd9cd6923a	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/app	2026-02-22 12:58:34.7326
c0bcf558-fc4f-4bf0-85f9-b35deb47b180	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 13:02:47.263709
3ad8ba8e-90d1-412d-878c-b85f87324818	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 13:09:37.53222
54793a2a-9676-4452-9544-3a7025a6415e	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/login	2026-02-22 13:09:43.063461
66c246b6-9bf8-4db9-bdb6-5cff6c0cfcbe	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/app	2026-02-22 13:09:49.190134
b1d72a52-b6b5-496f-9f3a-996a4e9ff134	103.74.199.184	India	Maharashtra	Pune	Desktop	Safari	/	2026-02-22 15:33:00.137684
a1e5dec8-77a3-41ee-8d12-5a53bf40f1a2	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 15:34:24.102276
4f7174d0-89c5-411d-b9d3-bc87f4b8ada2	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/admin/login	2026-02-22 15:34:52.846917
be020a19-204a-45d2-9a7b-5c26d49b1961	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/admin	2026-02-22 15:34:58.918766
3d8fb3f8-5b6b-4c46-8dbd-41a82a4d424b	103.74.199.184	India	Maharashtra	Pune	Desktop	Safari	/	2026-02-22 15:35:10.41328
917a1ee7-c82e-4aeb-820d-2b1a8ae26c05	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/login	2026-02-22 15:35:12.903962
b13f82f4-09b3-4a16-826f-6af4c6d4b4ae	103.74.199.184	India	Maharashtra	Pune	Desktop	Safari	/login	2026-02-22 15:35:19.500168
7e5a9692-c3df-4496-b344-561bedc47afd	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/app	2026-02-22 15:36:12.865038
b136b856-b32e-40bb-aa62-b603a60efcf9	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/admin	2026-02-22 15:36:25.52408
e34d42f1-575c-4979-83b9-9a8c67db498e	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/admin/login	2026-02-22 15:37:21.165715
cf1cd691-efdb-4159-b4ca-6f2412689a2d	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/admin	2026-02-22 15:37:25.809336
b00b0ddc-718d-4225-9bc5-521404e14573	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-22 15:37:43.195917
ab0d111c-f804-42ef-89a3-987c5dddd465	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/login	2026-02-22 15:37:43.306874
2efb584d-8c43-4212-a481-d790f4b36fd0	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/admin/login	2026-02-22 15:37:44.039166
3dd90018-ccc5-42d3-b047-f9cfaef6b2fa	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/admin	2026-02-22 15:38:28.363752
04cd2204-6eb6-470c-9ac1-3389fe22192a	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/admin/login	2026-02-22 15:38:41.397948
f7dc91da-a074-45d3-a643-febe7059e673	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/app	2026-02-22 15:38:55.621827
dc69c440-73c7-409f-8e37-ae887d34ad82	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/login	2026-02-22 15:38:55.877935
6711111b-5890-452e-b75a-b44132cd0f83	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/ai-sales-assistant	2026-02-22 15:39:01.841355
2d5dc083-5127-4fff-a294-c733606d7f08	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/profile	2026-02-22 15:39:06.419553
672ce822-66c1-4712-8381-e3a8a1aa9caa	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/manage-subscription	2026-02-22 15:39:12.285887
87eccca6-45e7-4b1a-82c1-57e410a66ecd	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-22 15:44:13.774124
2a155ff7-74c3-49c0-a5d0-a9acb6623ba6	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/login	2026-02-22 15:44:14.058767
93e51799-b178-4824-a9ac-ac3a63a3621f	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-22 15:46:35.797772
2e911761-0572-42d2-8963-6b82ca9d3ac0	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/login	2026-02-22 15:46:35.914579
af8f1275-d398-4076-a52e-c8484a649199	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 15:46:36.577963
67cd588b-c4bc-43d9-bf29-4fbc6e3dd367	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/login	2026-02-22 15:46:47.548551
3d91bf1f-1532-4c8e-9894-41b0171213a5	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/app	2026-02-22 15:46:53.45242
1e570741-f4ff-4dd9-9d0f-9bbbe7a8526b	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/profile	2026-02-22 15:46:58.595444
d6c032c3-f73e-43a3-9b82-522fc900baa1	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/packages	2026-02-22 15:46:59.702127
d61165d5-947d-4a1c-bf7a-2dca2f05937a	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/cart	2026-02-22 15:47:18.203836
ca717146-4bd1-4883-a70f-1f1e92ee955d	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/checkout	2026-02-22 15:47:20.494045
7fe05b71-65e6-4f9f-b09a-276840d0dd1a	103.74.199.184	India	Maharashtra	Pune	Desktop	Safari	/login	2026-02-22 15:47:20.776816
2b3ed646-b8a8-42bc-8108-52c6d97c4d30	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/cart	2026-02-22 15:47:32.689088
a260e8a8-7949-4864-a163-f3c666149890	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 15:50:25.660978
41a45419-d84a-42f8-a284-29acbb5be02c	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/	2026-02-22 15:55:08.934012
018aba7d-20aa-4f60-b3f3-299b0930c78e	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/	2026-02-22 15:55:09.725749
ec4ff705-0109-4953-b154-e8afdad58caf	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/	2026-02-22 15:56:18.117641
50d288fc-a012-42ec-a535-da4e70f53b34	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/	2026-02-22 15:56:19.592162
a1b82d2a-0b59-427c-b7ba-f17de86ef75b	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 15:58:57.363682
80f5e23b-d23a-4c75-adcd-b3d1e1414c15	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-22 16:00:50.440018
3944a8db-f323-40de-b305-53c6ac1baf0b	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/login	2026-02-22 16:00:50.549982
b25a6713-4a9e-4ef0-9632-a939961cc158	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/	2026-02-22 16:00:54.214686
8fd47504-c8e8-4819-8791-c766c5b03ce3	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/	2026-02-22 16:00:54.67769
1b589a49-3510-4e06-9529-c2a73897c2d2	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-22 16:02:21.70677
d2e23fc9-dc7a-4765-a9bc-9b11b2f4dd82	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/login	2026-02-22 16:02:22.006627
84551963-e0ac-4be5-83a3-f36534d08477	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-22 16:16:08.118254
2b891f62-35a4-42fe-8c98-895560f8b1a1	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/login	2026-02-22 16:16:08.392945
380497e0-7615-45e9-a6f6-7b017efab6c0	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-22 16:16:24.443784
a7acf6cb-0c2e-49ba-9356-f842eb5fd75d	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/login	2026-02-22 16:16:24.740975
b2db04a0-cbae-4e5f-98ef-ec89d65f68d4	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 16:28:21.241108
dce5de56-1d53-4285-82ec-299594bc8b71	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-22 16:43:07.484984
a9983b20-57b7-4ba9-b25d-18438d50daf1	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/login	2026-02-22 16:43:07.815761
b96d77dd-33f6-4630-add7-d69aafe2cc00	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-22 16:45:14.17535
a5afc84b-11da-443d-9f9c-45fc1e0fc6da	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/login	2026-02-22 16:45:14.471301
9bae05ac-d9f7-4156-bf47-d94283ce2b8f	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 16:46:34.180122
52ecc12b-9364-4d93-8903-b2cdfdfe6b3f	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/register	2026-02-22 16:47:35.056529
cdcbc2b1-2958-4966-a801-cfb32aa1c835	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/login	2026-02-22 16:52:21.828938
744d054a-462d-49eb-83ed-85e725f7f4d3	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/register	2026-02-22 16:52:22.683001
6bcc4f26-2bb1-47ee-95a9-89730ea2a2a9	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 17:07:28.819868
8d3ee937-9eec-45ae-a864-89db1bfa35df	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/register	2026-02-22 17:10:47.504856
b027aaf2-52f8-49ef-8998-e0997bf8d863	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 17:46:01.125656
733838a4-dac0-4175-932b-b5e2717e3f24	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 17:46:20.641137
53f297b2-decc-4f52-b4c4-68abfa1c63ae	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-22 19:50:17.232086
5718ac58-2640-4d91-8b5f-774f8062640a	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/login	2026-02-22 19:50:17.486477
2e8ee5bd-62a9-4bbe-8d0a-5a013ccfe4a9	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/register	2026-02-22 19:51:30.177542
bc4f2b7e-bfa9-45c4-a80a-48031533ec90	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 19:52:09.978134
dfe0d7f9-dd83-4388-b1eb-f601ace899c4	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/login	2026-02-22 19:52:37.865036
4a453fe5-6bfa-4d79-a36e-1d0963a713d8	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/login	2026-02-22 19:52:50.198055
8faa6778-0317-472b-8e7a-b6d15da35a38	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/register	2026-02-22 19:52:51.926093
12999b2b-ef5a-4883-b69f-bee04523cc7a	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/login	2026-02-22 19:53:35.468961
999a8836-b096-4123-9656-685b763dad65	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/register	2026-02-22 19:53:36.873634
59b143eb-d1b2-40c1-adb9-b8a8e22ee5d3	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/sales-assistant	2026-02-22 19:53:57.386052
30ae82e1-322a-42dc-b7ed-55dabf4e4f0d	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 19:57:14.501886
77e6304f-517c-4025-8c38-a963a167309f	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 20:00:57.393118
449a84f0-2ba3-4372-a664-392ee7d4c8da	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-22 20:03:55.743682
5777cd3b-c1a3-493f-b186-bd3978563ce3	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 20:06:40.498634
99fe893d-6562-4e9a-85eb-38261f27faa3	103.211.112.20	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-22 20:08:04.829917
d08ddd62-af64-43c8-b55a-6a1c1308946d	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/ai-sales-assistant	2026-02-23 05:04:34.972441
4ac43c61-b391-42ce-ac51-25ce3c90e989	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/login	2026-02-23 05:04:35.036082
0b4838ae-b8ef-4da3-aae4-9d961ee6903e	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/	2026-02-23 05:14:51.574526
bbecf86c-a87d-40dd-a8b1-02f865f9bde5	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/login	2026-02-23 05:14:56.070065
9f40062d-aa17-40b3-9b1e-2e00ddc30a14	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/register	2026-02-23 05:15:36.143704
71b5fbbc-2a3e-4c79-9946-8645f76ea910	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/sales-assistant	2026-02-23 05:16:28.400956
4bebe489-5887-4e17-9157-a0a4bca6e828	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-23 05:19:39.390797
db7bd6db-9d80-4d70-8205-ae7e97abcd86	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/	2026-02-23 05:19:42.805338
9ac99376-70ab-4bf7-a016-836a1abbadf9	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/	2026-02-23 05:23:58.060245
4404cfe3-121f-4982-8069-3d17d229d578	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/app	2026-02-23 21:23:05.387828
e7476bb3-ced1-431e-b288-4417d8d5ce44	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/login	2026-02-23 21:23:14.344413
1607604c-0f62-42d2-abb5-c2b30aa8285f	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/app	2026-02-23 21:23:24.211987
63e01d95-273f-4144-ac83-65bbd51991c2	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/profile	2026-02-23 21:23:28.692653
ae616556-9301-4558-960e-30578f36c95e	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/manage-subscription	2026-02-23 21:23:31.734587
cad2d8c1-f8b5-4cac-8bc5-6fd86edde3bd	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/ai-sales-assistant	2026-02-23 21:23:35.981916
e22a29a4-ff96-4202-ad8d-18928fa7d589	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/profile	2026-02-23 21:23:39.968152
0ed013e4-b496-4c74-b955-d1b880af6022	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/ai-sales-assistant	2026-02-23 21:23:44.771843
12b6f760-11e2-46c0-87af-bde08d405d57	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-23 21:23:47.347857
6543176f-17d0-4661-9278-b5b2795d10db	31.13.127.45	Ireland	Leinster	Clonee	Desktop	Unknown	/	2026-02-24 01:22:46.282985
8d01126f-b2a7-4918-abf6-b84dd2162ceb	161.115.235.14	United States	California	Los Angeles	Desktop	Firefox	/	2026-02-24 03:03:21.242342
894eefe8-218d-485a-b9d4-8493504f9bde	59.145.189.196	India	Himachal Pradesh	Baddi	Desktop	Chrome	/	2026-02-24 03:52:56.6498
75541eab-4fcb-4d23-861b-3f4373e3deb0	59.145.189.196	India	Himachal Pradesh	Baddi	Desktop	Chrome	/	2026-02-24 03:56:16.441705
dd99bfac-daeb-469b-840a-281c24bc3b53	91.199.84.62	Hong Kong	Unknown	Hong Kong	Desktop	Chrome	/	2026-02-24 10:31:57.291971
efad4a58-6771-443f-83e4-e69facedd9d9	223.185.36.163	India	Maharashtra	Nagpur	Desktop	Edge	/	2026-02-24 13:51:33.82917
7961c845-bb71-483f-8b17-3d887819fc65	223.185.36.163	India	Maharashtra	Nagpur	Desktop	Edge	/login	2026-02-24 13:51:35.400262
a603976f-c877-4680-ae28-3ea61301eb01	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 13:52:18.468292
d5b837e5-cf69-40d5-9891-b48c0d675ef6	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 13:52:37.691661
be5da61a-acb8-4be5-9b7f-5f8619e5f4bf	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 13:52:46.58927
4380d08b-32ad-44ba-8bfa-ec6573db7dd0	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-24 13:53:46.048063
749bcccc-7b70-45c4-89fa-b486e70efe4e	::1	Local	Development	Localhost	Desktop	Chrome	/admin/login	2026-02-24 13:53:46.923941
734a2581-5d3d-4e39-abab-ce143014612f	::1	Local	Development	Localhost	Desktop	Chrome	/admin/login	2026-02-24 13:55:54.296351
bb9ac5fb-db54-4e32-8d7b-cda3523c3c5e	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-24 13:56:48.030741
ac249162-1089-4313-a8a0-1187c05c7978	::1	Local	Development	Localhost	Desktop	Chrome	/admin/login	2026-02-24 13:57:31.623027
760c874b-f099-4dca-ba73-16b8f45a0cfb	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-24 13:57:35.211178
ef17769e-9023-41af-9db9-7b07e338abea	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 13:57:38.191468
b2c9b8a7-9c46-4fe6-a8f8-c51d813c3c89	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 13:57:50.44683
60f3181e-26d7-4a4b-a5dc-6b2075f1272a	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 14:00:09.956103
9046a225-0728-46cf-9ab3-e9b07ffd0557	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 14:01:47.320752
a08c67d0-872f-4953-9d80-ac0995189a8a	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 14:02:21.320989
8ca3c0df-f9f0-4b3c-9402-e31623c2d134	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-24 14:02:30.438572
d0da3764-0397-438f-a537-73f68c61bf74	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-24 14:02:31.283552
3e67f9d4-2684-4fb2-9fab-a986731a17c9	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-24 14:02:34.93328
63a1c95b-da98-4453-a52e-8ec9bed9067a	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 14:02:37.624981
2b9b6497-6d30-4d6b-ab4e-0a5f274ebae0	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 14:05:07.379951
a2cbd210-c36e-4be7-8565-33bce5423f97	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-24 14:16:54.530245
37701c5e-f83b-4b80-b295-bdb5d1f37ab8	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 14:16:57.046279
f615f29f-2fb9-4f4b-a9b8-5b3ce0e4925a	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 14:18:02.79397
d195391d-4625-4d04-bb15-a75c40df9daa	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 14:18:07.694332
ebace1ea-286d-44fe-91a3-0e39f4a289c2	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-24 14:18:26.322283
4ae0d665-95d7-4939-a52e-dbef6f1895f9	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 14:18:29.352292
4c5e29f8-847a-4ccc-a5e8-7e80f79d2bc4	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 14:18:31.535307
839aecf6-ab75-4202-83e7-de6fde621ee6	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 14:19:03.116868
9ef4e30f-7b74-47d1-ad82-497f13db08ff	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-24 14:20:45.294119
2168dd15-469c-4f7f-b714-49b088af6db9	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 14:20:47.688328
95deefeb-56aa-4bfb-8142-902b840f0b0c	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 14:20:58.436011
f25fcd48-4698-45ad-86e4-bb82ca38fc09	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 14:21:33.55247
637b9211-2c2c-4ecb-a059-dc37d8378d64	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 14:22:01.279475
6b1fd011-4f98-4471-a034-40560ae77f8b	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 14:23:39.627831
2d849ca9-5b79-47d7-97b9-0a72dd5cae4b	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 14:23:48.680836
74f4e4a4-c882-4671-9a0c-53a222875626	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 14:25:18.001494
390ae79c-e2ff-4c89-86bd-f013373f9679	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 14:25:41.552372
3e818b08-ad0c-4379-94a4-3288f68362b6	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-24 14:25:51.921495
542a6d64-763d-48fe-a147-0056136cc2d2	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 14:26:26.436396
e8fb9a68-fab9-4f1e-95f8-1c36221cb934	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 14:26:29.809334
84fc08a5-85af-4a90-84db-3b6fa1d76cc8	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 14:27:49.05992
45a39340-bfc7-478a-bb12-6ac2cc92466e	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 14:32:49.097016
fde67b2c-fe53-4e32-aa03-9a02bb68a660	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 14:33:44.056459
0e17e9c5-255a-4d1b-aa26-2ab5beb0b363	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 14:33:52.231148
4ec60259-960c-499a-8889-a2982a131a53	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 14:34:24.369886
1b807ed9-c60c-4d37-92eb-bbcef402302b	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 14:35:04.519724
6b907c36-c781-4e0a-85b8-35a646de3b69	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 14:37:40.923473
2d0e67bd-2074-4cbb-9307-04a344bc6971	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 14:37:51.938055
f7a2a059-2682-49d1-8c8a-8d72164260e7	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 14:39:40.594388
e8c1041e-9d45-4acc-9d15-07c203602ab0	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 14:40:29.473989
223d1b59-bf63-4ba1-a8c0-1e2332685971	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 14:47:23.327949
c1e3d1fb-0f65-45c9-bdad-7640494fdfaf	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 14:47:25.078878
1df7a620-0c30-4216-853d-eb01095e1f5a	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 14:48:37.715669
3daa28fc-6a0b-4ea7-8916-19a3c1bf6124	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 14:51:39.029066
a5cb713a-0960-44c1-abdc-dd29b28ae20c	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 14:52:24.605298
5f6c6bd3-9e34-4645-afaa-eeabeda33a4b	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 14:53:10.827121
1d6e1c3a-f87c-49b2-9dc1-6645f9da7d11	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 14:53:15.130671
c1ab825e-cf98-4b7c-ab7e-b351ca00bebe	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-24 14:53:19.346573
78106c3b-01c4-4773-8284-5d433100c225	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 14:53:21.576278
4c61b1f7-0329-4e66-b330-c48b6455e8bd	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 14:53:27.508692
2fe9856f-78d9-4e29-8750-d6536da2557b	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 14:53:29.270059
27b905f2-68f2-4927-9065-ecf5ddb160ff	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 14:53:32.043156
6f88269e-897f-4905-afed-e6a0322aff74	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 14:53:41.036217
8bd26c89-e124-400f-96bd-de5ef455a0eb	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 14:56:22.120082
67eaa22c-43cd-4297-bb98-f5b0a1ab0ce9	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-24 14:56:26.610016
9a98053e-2f8b-465a-be69-0adec9802c79	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 14:56:46.690109
6439e8ea-d6c4-4935-8592-c42842809450	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 14:56:51.507945
4de38060-aa4d-4add-b124-ca082da30bc0	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 14:57:24.768161
cda5de78-5376-44cc-a72f-c80a0a357031	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 14:58:50.511614
61033cdc-5793-48df-b0b0-dadb45562533	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-24 15:02:09.66304
1b3e4293-e585-46f7-9448-8903ea993d40	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-24 15:03:46.992996
a12f4e64-2523-4210-8127-9be0b59ef79c	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 15:03:49.817141
5c38927d-acf3-4f78-a7bf-1a9f79c5cd29	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-24 15:05:04.108526
ae22f543-018b-42f9-867e-60a61dc664b7	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 15:05:17.482985
24d482ef-6503-4fb8-bce6-4301e9240b47	45.80.184.162	Thailand	Bangkok	Bangkok	Desktop	Edge	/	2026-02-24 15:05:25.074961
b56050d4-9887-4f14-b496-90fd78a8e479	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 15:05:54.643748
d43dd663-007f-4fd8-b4e0-56a14745b4ea	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:06:27.227821
adba2cfd-b0d0-4f53-b720-4d531c67fe3e	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:10:25.734927
c9896ba0-29d7-42d7-9c52-f0865332b8ed	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:10:50.898967
56baf305-1ecb-4a44-9f5f-15e52b86c718	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:12:20.990902
7a273500-7ea5-4a73-8090-1ff9b584a1da	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:13:05.949842
ac2653f5-ed43-4ab1-a877-e4d54a4ce855	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:13:48.569247
2d4d70c8-5790-4ec5-8c63-4cbf480311a6	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:16:09.796909
9da42e68-7c34-482d-be4d-204fcaebfede	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 15:16:57.932666
1a33c160-69cd-421e-8392-1a9c0ba6b834	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 15:16:58.026633
9f895e1c-800f-4eab-b77f-53d26ad1d4cf	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:17:37.642183
d0f9b09f-ef5f-4bd3-b942-837f06d64ba5	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:20:36.070003
16a817f7-ffeb-4bf4-885e-9b77018c8443	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:22:49.958327
24ccba6e-b0eb-40c7-b90c-bddb408d909e	42.108.75.9	India	Maharashtra	Mumbai	Mobile	Chrome	/	2026-02-24 15:23:54.256841
75d8cd97-d16e-4a79-9eef-3012d0269734	42.108.75.9	India	Maharashtra	Mumbai	Mobile	Chrome	/login	2026-02-24 15:26:37.853193
b0241beb-fd6c-4986-9be7-535b23826950	42.108.75.9	India	Maharashtra	Mumbai	Mobile	Chrome	/	2026-02-24 15:26:39.480659
a7cb194a-0f15-449c-92e8-485e488c78e2	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:28:29.20334
dca12a4e-f109-4859-ac4b-b72ab91f10d6	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:29:01.847099
cf940202-8e3a-4d34-8d80-6aeb1dbaaa4e	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:30:22.126762
186cd9a1-3476-4a08-bf8b-b58d959d880a	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 15:31:05.989655
75843105-044d-45e4-a13b-bbe6aa6f48c9	::1	Local	Development	Localhost	Desktop	Chrome	/subscribe	2026-02-24 15:31:16.448251
01cf8218-781f-4a34-b1c5-f7289f23ddc8	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-24 15:31:19.52441
ee36db47-5f24-4b31-9647-d0e480e37548	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-24 15:31:24.537803
b2c0a17a-cf8a-4610-b92d-cf50a45fdfc4	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 15:31:43.459192
9587a5f0-16ec-497c-af21-a009c4985be6	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 15:32:14.512026
bf7af0d4-acd2-40d7-803f-b5a43e31303d	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 15:33:17.834716
44e1bdd5-9dd5-447b-867a-7cb5cc599773	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:33:48.283805
57668b75-79b5-4cdb-ba0a-8e7f5c6e5474	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:34:30.538601
4acaa724-6269-4bd8-9ce1-29edddb6f18e	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:34:34.593061
a438adda-bcb0-41f4-890a-f8ad9b982047	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:35:22.790779
afafffb7-e64a-46e4-87e1-42cd6578c93b	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:39:14.61615
2b609262-78fd-4817-beeb-21a7a3d8024f	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:40:39.503567
b01f03c6-0073-47d0-885f-3923b0072c88	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:42:22.852498
c86f4032-1cc8-4a80-8106-2d10214c8524	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-24 15:42:27.248417
5af52e07-d418-4b6b-b7d1-ae6e67ddc315	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 15:42:36.297445
345c7b2c-c094-4b94-89f0-9609e186c718	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 15:44:17.683391
708de9f7-5466-47b6-b177-30577c358ee9	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 15:45:06.048765
8bf996ec-a482-41f0-bd0a-ae916647c43f	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 15:45:07.99557
19ca3194-d656-4b9f-af31-5002055e56f6	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 15:46:43.463067
7f2ae3f0-5692-42cd-a86d-d165e3320918	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:47:20.41964
a2b81e35-4a13-49e0-ad09-0a4645ed8c4b	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:48:32.521729
1fd825f6-93c9-46f5-9fe9-b09672bb8379	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:49:53.722003
0040d13d-a75a-439e-8061-6c0d3d8137c0	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 15:50:29.458221
9b913adc-9d26-4148-ba82-f0573d0bc0d3	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-24 16:03:16.775826
0fc872d2-02a9-4828-b487-5c5fdc1daee4	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 16:03:21.047992
5148c12f-d449-4447-ab56-05732ca91ea0	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 16:03:24.586081
6359c982-db24-449e-8c14-a313a0f81bf5	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 16:04:10.641159
45c51bf2-ed8a-409c-9c1c-4c08eb16821a	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 16:04:11.698227
71a821d7-3049-4081-b1ef-d40ff1d328e8	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-24 16:04:24.001464
b3db47c0-dc34-4ed0-8965-163128e0e2d8	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 16:04:25.862001
4bc56c5c-64b0-4e5f-bd2a-1a7df987994a	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 16:04:26.907102
d97310df-8537-4f6d-bd39-e9a177b576a8	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:05:01.836965
c621a3bd-a770-4633-8acc-e7ef22b5fa32	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 16:07:35.546987
a63da2ca-6843-4c03-950f-e4495e759675	::1	Local	Development	Localhost	Desktop	Chrome	/subscribe	2026-02-24 16:07:48.980192
75018510-4713-4edb-839e-686fa6134804	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-24 16:07:56.873777
7439db2b-5806-4708-93f3-f49211220d7b	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 16:07:59.439147
af1784d7-3db8-46cf-bdf0-b5502df68ba1	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 16:08:22.688047
fa1fc04f-4f78-400d-a23b-0bcc50edd428	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 16:09:31.276391
914d2bf3-acbe-4978-b83c-69644ace39b7	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 16:10:19.291672
2c15358a-b59b-4c14-b552-1a53b5737a46	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 16:11:44.080249
8d04c8e8-a2c5-4617-a895-d20ca054d430	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 16:13:49.701607
cfc2ace8-c1e7-45ce-b1c4-b591ec9b175c	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 16:13:54.75868
caa3fa7e-8762-402c-b3aa-b0ff82893878	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 16:13:56.894984
f2817c42-f9a5-46c4-9040-07fb9614fd30	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:14:29.143084
817e725a-a821-46ea-979e-de9258e34cb4	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:16:56.68226
fad3656b-ac9f-410a-8ccf-6f8646937415	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:17:44.187727
804942f6-0bda-4673-b6a1-3922b0943c61	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 16:22:06.980135
77f735ea-a3f5-42f9-9fce-7ed27e4f8d57	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 16:22:19.421049
a19029e1-66f5-49e2-a6db-29775f6cba27	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 16:26:21.773352
9306f30e-b11f-4c56-9eae-a43b0debde72	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 16:26:27.503464
eee637e1-c2cc-486e-baa6-cf3614dce3bf	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 16:26:29.396937
e7844336-f720-4d59-8ad5-985e3575c6dc	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:26:56.808284
3495a424-ede9-49d1-8e7a-98969c473a56	::1	Local	Development	Localhost	Mobile	Chrome	/sales-assistant	2026-02-24 16:32:30.748335
8bb03642-ec73-4775-9cb2-163804896aa7	::1	Local	Development	Localhost	Mobile	Chrome	/sales-assistant	2026-02-24 16:33:06.666539
da9af47d-793e-4b79-99c5-8537b15bb812	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 16:37:13.670347
b64dbe50-07d1-435e-b400-6318979c9561	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:37:49.214821
23315c5f-366a-4554-991f-dc84d61dec9e	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:40:33.688121
89de3dfb-a5ab-42ce-8493-230d17d2c4d7	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:41:01.883992
74b82228-5e8f-4442-a16c-9e4aa7427e52	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:43:50.257762
c6a83915-3c79-4969-9070-246d55ed1d66	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 16:44:07.671977
2657aa80-b4d6-4f07-81ec-51aed6affe36	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 16:44:09.4832
761b288b-3e92-4436-bc66-dbd1b4d5b60c	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:44:46.309895
4d91ede5-75f0-43eb-98c0-dcddeea8dd51	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:47:29.530222
4747f1d2-f558-4094-87b5-59a65fbef2a5	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:51:10.822297
30fa5d58-1bab-4acd-b0d8-59f9b3fd6fc2	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:51:53.51678
87cdf76c-ceab-4b51-9836-6e639932fdef	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:51:58.81549
2c70e0db-4c79-4fa0-bea6-48eed873f10c	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 16:52:30.210814
f3d1bdef-b51b-4ffe-9169-03358501cd8d	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-24 16:53:05.28617
4123dacd-8a2f-4e78-88c8-e07e3ca0da45	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-24 16:54:04.985432
0d2ec138-e38a-454f-8caf-bdb67954938d	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-24 16:54:55.90792
b6b34aca-0465-4b29-a432-c09a456fd27a	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 16:55:06.025594
a946ec59-e01e-48b6-a140-4f357ddbcfde	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-24 16:55:41.217778
b57cb377-f6b2-4562-b07f-dfac0c727567	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-24 17:18:32.268857
7dc26fe5-4273-43cb-996c-de9d0694459a	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-24 17:19:11.682827
f006660a-d497-4974-9425-61f50d66ab70	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-24 17:19:14.873036
51fb896b-bdb0-4418-a3a3-b60ffe99935a	81.138.11.233	United Kingdom	England	Wigston Parva	Desktop	Chrome	/	2026-02-24 18:47:51.907667
9eaa66a2-cc5d-4b1a-8b72-ce86fc434813	157.131.120.108	United States	California	San Francisco	Desktop	Chrome	/	2026-02-24 20:25:06.862466
23a1afd6-26bc-4039-a8f4-7a13ea9e7c88	58.136.31.74	Thailand	Bangkok	Bangkok	Mobile	Safari	/	2026-02-24 20:42:43.929614
3fecd5dc-4f9e-4c67-970f-57c8016b0960	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/ai-sales-assistant	2026-02-25 01:18:13.159408
f138edbb-f40b-4370-8869-cca3c6737bec	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/login	2026-02-25 01:18:16.708562
fcdde1c5-9975-4c28-8321-0d978dfb8855	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/	2026-02-25 01:21:14.220167
d51bcfdf-af57-406c-a0b8-de5bf17d57ab	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/ai-sales-assistant	2026-02-25 01:21:18.207786
142a9031-eee8-49fd-b1e9-fcf42f9132cd	171.61.122.60	India	Telangana	Hyderabad	Mobile	Chrome	/login	2026-02-25 01:21:18.585097
0ae66a4c-725b-46ab-ad56-00f2cb6a2358	174.218.251.159	United States	Florida	Lochmoor Waterway Estates	Mobile	Safari	/	2026-02-25 03:10:58.561704
a5122102-9e33-4389-8c26-6a11b6361e7f	42.108.78.93	India	Maharashtra	Mumbai	Mobile	Chrome	/	2026-02-25 03:35:38.402403
e1cddffe-13c4-4577-8a45-022d297f6b89	42.108.78.105	India	Maharashtra	Mumbai	Mobile	Chrome	/	2026-02-25 04:37:17.216767
1bc0d6dc-246e-4ef1-86e2-bf153ba9511a	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/	2026-02-25 05:29:55.315204
fce2b164-c616-4ce3-8c1d-e3a6390611b8	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-25 05:29:58.212346
93e6796d-19fe-4191-8168-a4413246674d	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/packages	2026-02-25 05:30:10.812199
553c3c6c-91ad-4347-a948-5dc4713aff70	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/cart	2026-02-25 05:32:25.693288
7779c29e-bdca-454d-83e4-2eb8cae72cdd	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-25 05:37:05.984413
10a4950b-cb77-4578-a9b6-d7d20a7d2245	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/profile	2026-02-25 05:37:23.812078
4d92aa81-f74c-4bd1-b77c-f930f363fea0	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-25 05:37:28.934668
52ccb3d9-e97b-4140-8a1f-0be523ebebe7	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/packages	2026-02-25 05:37:47.781513
d6574c5b-8193-4773-a04a-3c212173b237	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/profile	2026-02-25 05:37:54.701689
602ad827-f984-4610-9a08-8659d5196870	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/payment/success	2026-02-25 05:38:20.978288
5b3a0e6c-0eaf-4100-9349-b11a367b5f09	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/manage-subscription	2026-02-25 05:38:24.910801
87827c14-5231-497e-bf98-d412d78d375b	157.48.21.189	India	Jammu and Kashmir	Jammu	Desktop	Chrome	/	2026-02-25 06:04:20.69989
657720ed-42da-4f45-92e9-b3fa50e3ef02	157.48.21.189	India	Jammu and Kashmir	Jammu	Desktop	Chrome	/login	2026-02-25 06:04:21.692525
6f1c259c-b982-4663-9c9d-143d17c96f3f	157.48.21.189	India	Jammu and Kashmir	Jammu	Desktop	Chrome	/	2026-02-25 06:04:36.097443
fa32704a-a92d-4a5f-a4a6-f6515109ba0c	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/	2026-02-25 06:06:53.80542
d7b61baf-4015-4c99-940f-d2c0b22d604c	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/	2026-02-25 06:15:08.76235
6b3f346e-8266-420b-a778-3361b194afda	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/packages	2026-02-25 06:16:09.668484
3f28307e-b238-471e-aa2b-7f4f0a06309a	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/	2026-02-25 06:16:12.810116
055ca6ef-557b-40dd-858b-3a3f7bb8fb02	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/ai-sales-assistant	2026-02-25 06:16:14.323582
156e282e-9243-4584-9929-e6da87510949	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/	2026-02-25 06:16:16.440103
55b81a17-762e-461d-9e7f-722c983a1ce7	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/blog	2026-02-25 06:16:18.197225
df728564-116b-4aae-865e-bd53036f9855	171.61.122.60	India	Telangana	Hyderabad	Desktop	Edge	/blog/what-is-rev-winner-complete-guide	2026-02-25 06:16:36.245616
fb080870-3fe2-4f41-9279-83032a0b4a90	171.61.122.60	India	Telangana	Hyderabad	Desktop	Chrome	/	2026-02-25 06:19:07.37623
8ca28c9a-3292-4a47-af14-9112dcec73d4	171.61.122.60	India	Telangana	Hyderabad	Desktop	Chrome	/login	2026-02-25 06:19:08.378986
861ce6ef-022f-4958-a284-7aaf05c81bf0	195.40.187.216	Türkiye	Istanbul	Istanbul	Desktop	Chrome	/	2026-02-25 07:36:48.565555
129cb8d1-8bed-4722-a522-6187ed407ca8	166.88.64.67	United States	California	San Francisco	Desktop	Chrome	/	2026-02-25 07:36:50.529769
942dc704-f5a7-41dd-a483-58e25b15bf64	67.80.107.226	United States	New York	Huntington	Desktop	Chrome	/	2026-02-25 09:25:06.286359
b0e7e2d6-e2a3-4789-89b7-38558cc07330	67.80.107.226	United States	New York	Huntington	Desktop	Chrome	/packages	2026-02-25 09:25:52.110836
0f15df1a-0c61-4800-932e-162effe73abe	67.80.107.226	United States	New York	Huntington	Desktop	Chrome	/login	2026-02-25 09:25:52.234542
8ce3e47e-0f7c-4ccb-9dae-4ea949234cd0	67.80.107.226	United States	New York	Huntington	Desktop	Chrome	/	2026-02-25 11:14:40.936967
15a14c0e-7a5e-4f62-80c7-db40763a89c4	67.80.107.226	United States	New York	Huntington	Desktop	Chrome	/subscribe	2026-02-25 11:15:36.488471
c14211a3-e4f2-4089-99a5-5db94324ea01	69.160.160.55	United States	Arizona	Tucson	Desktop	Chrome	/	2026-02-25 14:34:25.385088
dde93be0-2d42-46b9-9f05-8d577fbc5f1c	104.183.117.135	United States	Florida	Orlando	Desktop	Chrome	/	2026-02-25 15:03:55.892562
ea594b01-44ea-43ab-8564-8a995a3ec472	223.233.86.159	India	Maharashtra	Pune	Desktop	Chrome	/	2026-02-25 15:16:56.9076
43b70bcb-e1e7-40ad-8676-31db0e76d845	223.233.86.159	India	Maharashtra	Pune	Desktop	Chrome	/login	2026-02-25 15:20:45.237602
4c606426-85b0-48a7-bf77-d4721799d35f	223.233.86.159	India	Maharashtra	Pune	Desktop	Chrome	/packages	2026-02-25 15:20:47.978824
f614f399-64a1-4804-9fa3-ae4377e1a8f3	223.233.86.159	India	Maharashtra	Pune	Desktop	Chrome	/login	2026-02-25 15:20:48.393515
00db3e2d-9672-4b8f-812d-a64aec0e9766	223.233.86.159	India	Maharashtra	Pune	Desktop	Chrome	/packages	2026-02-25 15:20:45.236428
5fee29d3-a5e4-46f0-8de3-e78d495265bf	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-25 18:16:41.761701
e4d186fb-fa2f-41fd-8c89-8b5abc2b0d35	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/login	2026-02-25 18:16:44.006305
00c6857a-5c6b-4f9b-b634-41bbd73fc8c7	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/app	2026-02-25 18:16:51.517469
38d8d34b-3bad-47bc-9275-5b562d50828a	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/packages	2026-02-25 18:17:31.566673
a87c4b4f-d433-4c17-a356-e364e31c4b09	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/cart	2026-02-25 18:17:36.135841
71d7ee0a-52db-497c-ba4c-732e5e553ed9	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/packages	2026-02-25 18:17:38.361744
16bc0298-5a4a-4e6b-a263-b9312247db17	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/train-me	2026-02-25 18:18:09.679849
41e2960a-fa73-4601-b23f-e9a9b148d4a0	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-25 18:18:14.42792
4078f4c9-4e24-4f68-8bfd-35c812425954	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/blog	2026-02-25 18:18:16.765182
7723ffcc-cb34-4366-9c6c-40f776263d8d	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/profile	2026-02-25 18:18:19.806601
fb20cbb0-1ae7-4d47-a8e4-94337692f9be	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/login	2026-02-25 18:18:23.993249
64abf44f-cbf1-4398-baef-1ba581268ba3	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/register	2026-02-25 18:18:35.587797
1d980d94-d0cb-4845-9034-382174488916	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-25 18:26:43.376536
4219cee9-19ed-4125-811d-9a9aeab991c4	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-25 18:26:48.351607
53c1848e-1e27-4f79-b8a4-2175be45e4a8	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-25 18:26:55.559403
33b81e39-2327-42dd-bee3-729b895b5111	::1	Local	Development	Localhost	Desktop	Chrome	/subscribe	2026-02-25 18:27:10.513585
d72a695a-f2dc-4232-857f-c8d9fc974845	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-25 18:28:10.281873
7d101096-68bb-421f-b70f-9201f25b365e	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-25 18:28:19.963602
b728f08e-449a-4c3e-aa55-ac0c97fc9d67	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-25 18:28:31.913374
adf2343d-7978-4604-90bc-a9c7c4d65eef	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-25 18:32:06.88368
3f0c2e7d-257d-458e-8bb6-667d8a48e8ea	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:32:39.641901
3f60b14d-f71e-4f22-90eb-92cb76020a04	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:33:20.800871
35072eb0-1580-4ddc-96c1-4738e85f02d6	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:33:52.523025
f646b363-4eff-41ed-a679-757bc5cf4f62	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:33:57.601576
a22fb3a6-22d8-4933-be56-6caf17b69345	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:34:00.169179
44153c8b-1fab-4c2a-bf9a-7e4e978a4956	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:34:08.703592
46b71eb6-b313-4730-af49-28ab2407ba8f	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:36:59.130024
67c20ee9-8ef5-4b11-87c4-19444d6e7554	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:37:05.755793
1111a081-1f4d-49fa-9d58-3190e1f4e010	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-25 18:39:53.699903
081010cd-e237-4777-9e76-597a20c2ca61	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-25 18:39:53.892154
52c7601f-c2dc-4419-9978-b9a2238547b2	::1	Local	Development	Localhost	Desktop	Chrome	/subscribe	2026-02-25 18:40:06.047575
df425fd2-95d3-4d26-8eae-c7f73c5fa9ec	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-25 18:40:09.126019
bea3cab1-1cde-4544-920c-b384fe589193	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-25 18:40:20.418345
468e06a7-e1a0-4cd4-bbbe-8dc8dc1e9b3e	::1	Local	Development	Localhost	Desktop	Chrome	/subscribe	2026-02-25 18:40:20.804351
130fbc36-308a-439c-b164-5298da3ba1bf	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-25 18:40:22.677023
d758c618-ecd7-474e-a5c2-bc659c2aad13	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:41:11.483347
a5bcad97-d74f-46ea-8ae0-e70a90b52a99	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:42:56.572863
effe1b98-8a5f-420a-abf5-abca477851e7	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-25 18:45:56.244532
b3c8917b-aa76-4892-ae99-abd06fe48328	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-25 18:46:59.394061
e9af9ee0-0d44-47c2-ac00-2c130968fff7	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 18:49:01.314339
ba47b4fc-d9d5-420a-a8c6-8ac6ef26aeb6	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 18:49:08.227111
54434198-f4e2-4859-a5e2-52b6b46f4fa5	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 18:50:08.185153
5bcfc649-2a68-49c6-abde-998f3519548b	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 18:50:44.887361
3ef1477e-6788-4238-a40d-7b2f9917ea9d	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 18:52:43.10545
1fb43c9e-2c6f-41ff-b8aa-3f62aa732897	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 18:52:50.740361
6f5f4ad2-c950-427b-a04d-8461466a6865	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 18:53:06.492749
95d950f7-4507-45be-b311-576269986aea	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 18:53:50.592998
e92155d4-5799-4d64-8191-a26e312e0c96	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 18:54:48.155661
4a04704e-8e02-42af-b274-50797dc5c751	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-25 18:55:04.103136
891b4244-2067-4e3a-a3fe-a5cf186c70e7	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-25 18:55:12.597819
1abd3e17-429f-4f35-b415-126dd5a69d18	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:55:42.942637
b4440863-3aaa-4997-98a8-e8f9d1d7209b	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:57:55.358597
a8a66069-fc15-4e2f-b99f-337589a40a4e	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:58:07.924073
9d91c630-9b99-40a9-86bd-a37fcc752206	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:58:12.74045
1773b723-77f3-497d-954e-6981048e34e9	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-25 18:58:15.972766
82107791-5873-41ee-a811-4823c89da2e3	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-25 18:58:26.767853
527a1687-070a-4466-afaa-950d9d55c018	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 18:58:35.221754
e1859c20-1de0-448e-b1e1-bcdbd0ec8600	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 18:59:07.868871
97d660e9-ec6a-4565-9b2a-1cacfc557c0c	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 18:59:20.214706
feac6e71-ec32-4ce5-8fd4-fa9d4ecc32a7	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:02:08.770306
df33f158-a4e2-4a49-a6c1-00264b10311d	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:02:29.930556
c1627082-2cd3-4cb3-9d43-1ad53cc23cfa	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:02:36.256833
4389cd4a-8c6e-4919-b531-8a7d80a2f8f0	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:02:42.89816
7b47335a-1622-49ca-aab0-9a280d1bbf8f	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-25 19:03:35.06381
7ee3aa2f-1a03-4c2e-896a-a499d0ef3266	::1	Local	Development	Localhost	Desktop	Chrome	/subscribe	2026-02-25 19:03:44.636855
efde754d-b516-417b-bf2c-d0d117082d2e	::1	Local	Development	Localhost	Desktop	Chrome	/subscribe	2026-02-25 19:04:51.056096
c02fd3f4-1da5-45a6-bd9a-458192d99417	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-25 19:05:48.958413
9cd319b7-6fb4-4199-a618-39ea04cabdd8	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-25 19:05:50.666035
236ea6c0-90b8-4674-89c8-fa7be8673ab7	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-25 19:05:52.038383
fa254343-143b-41ac-83ae-7dc9acdc44cd	::1	Local	Development	Localhost	Desktop	Chrome	/subscribe	2026-02-25 19:06:34.967119
66b15b6d-d528-45ba-af25-2f2de67ada45	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-25 19:07:23.583625
3f563e52-fc64-4f48-89c0-ec1cb315886c	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-25 19:07:25.868782
7bfacf2c-3699-4246-9962-a78b9a5a8465	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-25 19:07:29.609238
4de5047d-eb9d-44fb-9ca5-029a35e7566e	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-25 19:07:33.583415
05edd1b6-9952-4a97-bb11-b045c662d783	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-25 19:07:36.330168
3b523429-0a31-485a-a187-008d544f62bb	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-25 19:07:43.770666
9a36248f-87c4-41f8-85e7-d24f08c439df	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-25 19:07:48.913159
f2c9a32e-9903-4c89-b888-ffd48cb717fb	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-25 19:08:10.780787
a00b04ef-e1c7-4de2-a5b6-e11729a0903e	::1	Local	Development	Localhost	Desktop	Chrome	/checkout	2026-02-25 19:08:11.832826
3f00ea20-6843-4d3e-8bfc-348258354544	::1	Local	Development	Localhost	Desktop	Chrome	/invoice	2026-02-25 19:09:20.552095
31efdcb7-bf1a-417b-8365-344829745328	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-25 19:09:33.8365
877bbbb8-6fec-4add-a5be-a1bc78271fba	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:09:43.540934
4be8a058-a5a6-46d4-aa3f-2a77cb6ac411	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:10:13.681067
f65b2c15-25cd-4394-9a6c-0b4570e3af87	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:12:13.420947
8796c86a-96d9-490c-b058-d1244f6862f0	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:12:55.215119
edb92250-f25c-406f-8b15-746d72e1b769	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:15:01.462406
a7c2bfe8-dd4e-45cb-b58c-b6d81faf9593	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:15:31.706841
826e46eb-8718-4d07-9c2d-7843bc1b388e	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:15:37.717623
5bdd4b57-c273-4624-8b1a-1f549c7c983d	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:15:46.344492
2a04a6a1-3134-4a25-9900-0dc7cdd85968	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:15:54.141297
b3010e1f-1ed4-463e-b9ca-9872d861eb90	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:15:57.702726
c8c5932d-e7ec-4d9e-ab3b-a89a158d68fa	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:16:07.933701
2b35edd5-74d5-4fb4-a820-e174f53a1d6a	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:16:16.466593
db88a07c-3650-4cea-a74d-0513ed5d25b0	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:16:25.693746
2ff7c4ac-2186-4665-9d95-d5025cc666aa	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:16:32.492939
ec0c1abc-1bb7-40a1-8113-8c2527c830ec	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:16:38.560775
32daffd5-60a7-4d65-941e-16cfc36b0b84	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:17:49.383054
47d65700-0d4e-431c-8347-8d887151a613	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:18:26.878887
04fc8d59-84a8-4e93-a727-1832cb213031	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:18:31.394985
85abe81f-3f0f-4bfd-a5e3-4d210a5186ce	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:20:27.167151
300315ff-85b8-4f8a-adde-406b32344868	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:20:38.514723
5aeb4f8d-1827-4b53-9cea-d97adcbd9be1	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:20:46.500461
b1457b40-5735-442d-a5e5-d0a6cad7a291	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-25 19:23:02.878327
f9e53a50-2079-4062-9d60-c684702a9a67	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:23:04.577755
278f2032-fdbe-4e3c-a99e-6141e7e34aee	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-25 19:24:40.4694
741a4938-9f3a-4caa-953b-409939bca8aa	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:24:41.976583
f11f3da9-ea60-4638-ad08-d0f8e4280809	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-25 19:27:04.475168
ab8d8c33-a8a9-44b0-8ba8-fca0ecd6f0e4	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:27:06.330246
5ee8a101-7ec1-4ce2-946d-4ac6b9eea347	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:27:33.149204
1b1f69eb-3d51-4e61-b187-1e229dc278a3	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:27:47.005027
5f2951ef-51c3-4d76-8a98-346609724b9c	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-25 19:27:47.145708
816079fd-f790-4e9e-b5f6-d2f34c87d079	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-25 19:28:03.16583
59676b20-febb-4d08-8d36-7c3d0bf2d070	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:28:03.409995
8b1626f6-3d86-48d5-ab7c-3b5690c9dbc3	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:29:28.516264
6aced0df-f584-4501-beee-3aa27409c422	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-25 19:29:32.690299
f1d62831-9a77-4763-9596-f6f20965c40c	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:29:51.742684
917c995c-2870-4250-80ab-6b1ed300fb5f	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-25 19:31:06.188961
9b131e07-12f8-445a-a989-72b0cd2bd1a9	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:31:10.003939
d4518d71-56f7-4b57-98ba-d19478c081ca	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:33:22.721457
31f3e25e-5f39-4874-8fa6-92d28cbd65d7	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:33:32.706408
cdf59562-d341-497e-b04b-39c4f53feefe	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-25 19:33:37.852853
4f3283cd-5885-4e31-912c-8158b8270b4c	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-25 19:34:09.892897
21f94b91-ea5d-47bf-a521-74c9fb3a875e	171.61.122.60	India	Bihar	Fatwa	Mobile	Chrome	/	2026-02-26 01:32:00.304546
01aad8e6-c450-48e8-97f4-7dc6705a8fc1	194.127.104.20	Australia	Victoria	Melbourne	Desktop	Chrome	/	2026-02-26 01:55:51.460854
3ab519f0-52d2-4335-85de-2ed0310a7bdc	194.127.104.20	Australia	Victoria	Melbourne	Desktop	Chrome	/register	2026-02-26 01:59:08.937782
d6957d00-abc1-4e39-97f0-260c0956e09c	194.127.104.20	Australia	Victoria	Melbourne	Desktop	Chrome	/	2026-02-26 01:59:22.842078
a96ca52e-00ad-40db-a8bb-b89ba10a1bf1	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/	2026-02-26 02:59:40.17858
84b344bb-c800-4b83-be85-013db2a0fc84	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/ai-sales-assistant	2026-02-26 02:59:55.461585
9add5fba-4b19-4c2b-9ac1-7942b4e9f52e	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/cart	2026-02-26 02:59:59.621163
42666993-b14c-4759-9d0f-df5112675f64	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/	2026-02-26 03:00:07.074491
39c977e6-c055-406b-b1ee-ed22262d919e	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/ai-sales-assistant	2026-02-26 03:00:09.319355
cda73679-26b6-4a95-9b22-e31a254df4f6	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/profile	2026-02-26 03:00:13.593392
a461bd38-26f5-4eba-b4c6-7b1b88a57374	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/	2026-02-26 03:00:25.271627
2b275085-b8a3-4c31-bb6c-da4e01a2858a	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/login	2026-02-26 03:00:28.074474
78fe3bad-393f-49b0-a036-3217c844e4c1	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/app	2026-02-26 03:01:05.237122
10355313-197d-4849-8e73-9e7067b180e0	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/profile	2026-02-26 03:01:14.541052
08c60d8b-a664-404e-a6bb-00a75405fad7	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/packages	2026-02-26 03:01:16.135867
20ed44d6-9ecc-4e82-a5bf-c28f1cf4acd5	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/admin/login	2026-02-26 03:01:27.162348
66645a3b-c853-4cf9-a170-40ae58d677c8	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/admin	2026-02-26 03:01:31.32087
988ea5e6-ad4d-4bef-8e98-6e140391f4c3	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/	2026-02-26 03:07:33.0951
f34422f1-3c57-4801-810e-83e17828d21f	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/login	2026-02-26 03:07:35.564424
70f9754f-7853-4536-8501-446f8b1cc734	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/register	2026-02-26 03:07:37.327229
44c65954-7896-4cce-8305-42e82ffc8060	171.61.122.60	India	Bihar	Fatwa	Desktop	Chrome	/	2026-02-26 03:13:50.355769
d4bef801-d002-43db-9f21-96409b083c11	171.61.122.60	India	Bihar	Fatwa	Desktop	Chrome	/login	2026-02-26 03:13:53.084443
3f8d0d93-02fb-45eb-862c-c5c2060e45c2	171.61.122.60	India	Bihar	Fatwa	Desktop	Chrome	/register	2026-02-26 03:13:54.442809
a5dadf83-4b95-45ac-aca9-6ff7c690ee69	171.61.122.60	India	Bihar	Fatwa	Desktop	Chrome	/login	2026-02-26 03:18:33.673038
6ea9b5e4-d207-4a98-a337-d0f3f553389b	171.61.122.60	India	Bihar	Fatwa	Desktop	Chrome	/	2026-02-26 03:18:34.158108
672b4d36-d969-4fb2-9ca3-bb57fa47017b	171.61.122.60	India	Bihar	Fatwa	Desktop	Chrome	/login	2026-02-26 03:19:12.634884
26387657-098a-4060-a133-a1b2261a9103	171.61.122.60	India	Bihar	Fatwa	Desktop	Chrome	/forgot-password	2026-02-26 03:19:18.28674
effd7c60-1249-4ee7-947d-879b4be3ef15	171.61.122.60	India	Bihar	Fatwa	Desktop	Chrome	/login	2026-02-26 03:19:36.264073
4a078921-ea71-4a82-baf8-7cb40c6a458b	171.61.122.60	India	Bihar	Fatwa	Desktop	Chrome	/register	2026-02-26 03:19:42.324869
fed3ade0-6336-4dca-b038-90b0ebdbc70a	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/	2026-02-26 03:21:58.74283
b44415f0-f64d-42af-9b4b-cdd0aba627d0	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/login	2026-02-26 03:22:44.741576
26c2047d-47f0-4a99-9dec-62377e377d90	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/register	2026-02-26 03:22:46.531921
40398ac2-cc8a-4f44-a935-50e46b1832dd	171.61.122.60	India	Bihar	Fatwa	Desktop	Chrome	/login	2026-02-26 03:25:57.90594
2c7c5bdf-36b6-4d28-879f-d55b04cc6573	171.61.122.60	India	Bihar	Fatwa	Desktop	Chrome	/register	2026-02-26 03:26:00.311669
b6082c59-d935-463c-964e-afe1ec49d8ad	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/	2026-02-26 03:54:22.504605
e2e1f5f0-79da-4735-8da9-f5f5567b6c92	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/login	2026-02-26 03:54:22.504493
1bf7d996-4181-48d7-81d2-3d1be13bb485	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/	2026-02-26 03:54:38.488715
a4959e0c-6cf3-4157-920c-5874c307a153	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/	2026-02-26 03:55:48.9238
7304b539-9c72-432c-961f-80f48b13e46c	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/sales-challenge	2026-02-26 03:55:54.075637
60a273e5-9e9c-4590-8bb1-6168bb5aa601	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/sales-challenge/knowledge	2026-02-26 03:55:56.090648
9cd3ba13-0831-430e-8fb9-633812e55add	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/sales-challenge	2026-02-26 03:56:28.508486
390824cb-1f82-485c-b750-5fc26f462e38	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/	2026-02-26 03:56:30.620683
6fc3aa6a-819f-4333-bb1f-dbf179bb4c39	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/terms	2026-02-26 03:56:33.788673
0cac5d50-f68f-4c64-bf2f-310f1d713562	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/register	2026-02-26 03:57:35.038918
da44e8ea-9ab6-43fe-9150-8830b738fcb6	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/terms	2026-02-26 03:57:36.495401
e429ee9e-7feb-4c61-aaab-25ca07661b87	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/packages	2026-02-26 03:57:37.701596
5a0a3955-5aab-4e72-8c83-05021174564c	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/login	2026-02-26 03:57:37.990102
10e24cc6-9222-4780-b2c1-78939d6e81d9	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/packages	2026-02-26 03:57:39.590246
1adfc90f-71de-4851-b454-abf1ce97995a	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/login	2026-02-26 03:57:39.886701
1f256204-6789-47b8-8756-e95cf9d951a1	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/	2026-02-26 03:57:52.265809
c00c86fd-a2a0-4120-9ea1-b90474357757	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/help	2026-02-26 03:58:06.982029
d119cdff-4616-4c44-80df-99c1ff734c79	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/	2026-02-26 03:58:23.826333
4b21bbf3-f7ae-410c-86ad-2dd19fab0e97	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/help	2026-02-26 03:58:27.432133
12fcf4bc-1f7a-4be0-aa0d-d2e9ae9804f7	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/help	2026-02-26 03:58:35.867913
36bb3a3d-0ffa-41c4-a0fc-fd2545310a2d	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/help	2026-02-26 03:59:44.574125
6ce42621-3164-4a80-9f26-f157900ae629	171.61.122.60	India	Bihar	Fatwa	Desktop	Edge	/	2026-02-26 04:03:37.044328
92253ee5-e4a2-46e8-8b4f-4a5cfeead7ee	42.106.216.149	India	Maharashtra	Mumbai	Mobile	Chrome	/	2026-02-26 04:10:11.778654
98bbbd54-89d3-4a04-b0d4-53aa96fb4053	42.106.216.149	India	Maharashtra	Mumbai	Mobile	Chrome	/login	2026-02-26 04:10:13.697175
9968fb1a-b78f-4751-a15c-0df9c5eadfea	42.106.216.149	India	Maharashtra	Mumbai	Mobile	Chrome	/register	2026-02-26 04:10:15.10672
fbd8b64b-9a51-44ee-9f04-054e0f52a5a4	42.106.216.149	India	Maharashtra	Mumbai	Mobile	Chrome	/login	2026-02-26 04:11:15.242483
26d73808-86e9-43ac-b787-59ffd115689a	171.61.122.60	India	Bihar	Fatwa	Mobile	Chrome	/	2026-02-26 06:18:40.07973
72f1fd4b-f587-46ff-94b2-09f0788e3d41	42.106.208.71	India	Maharashtra	Mumbai	Mobile	Chrome	/login	2026-02-26 06:53:31.691383
689161b7-fb08-4746-b6c0-2ea0969900de	103.148.43.103	India	Punjab	Fazilka	Mobile	Chrome	/	2026-02-26 07:45:52.744328
02369dad-d045-43d4-8c07-1e7dff9ca2ea	106.222.210.97	India	Maharashtra	Mumbai	Desktop	Chrome	/	2026-02-26 07:53:44.790828
fde8ec4a-59c3-489f-bc43-01796e89fef9	42.106.208.71	India	Maharashtra	Mumbai	Mobile	Chrome	/	2026-02-26 11:13:28.573243
46cff645-af0b-48ea-8710-cd063815cf71	42.106.208.71	India	Maharashtra	Mumbai	Mobile	Chrome	/login	2026-02-26 11:13:28.817136
2286506f-81c3-4fed-9d93-c100768a1493	42.106.208.71	India	Maharashtra	Mumbai	Mobile	Chrome	/register	2026-02-26 11:13:31.101271
6688555f-67de-4de4-a178-0625b2293abf	42.106.208.71	India	Maharashtra	Mumbai	Mobile	Chrome	/login	2026-02-26 11:14:37.782341
d2f7259e-c667-47f6-bb6e-ed99dc46c619	42.106.208.71	India	Maharashtra	Mumbai	Mobile	Chrome	/login	2026-02-26 11:17:58.520539
ec3c8fdf-086b-47d1-a4b5-82b992c13214	110.226.76.166	India	Gujarat	Ahmedabad	Mobile	Chrome	/	2026-02-26 15:06:26.796902
50f90200-c8c3-42ec-a3ea-088870dabfc2	110.226.76.166	India	Gujarat	Ahmedabad	Mobile	Chrome	/login	2026-02-26 15:06:29.229402
4437cd95-4fbd-4752-b639-5bafec1b783f	110.226.76.166	India	Gujarat	Ahmedabad	Mobile	Chrome	/register	2026-02-26 15:06:40.656716
ce5f619b-086c-4016-8689-66fcd0aa95e0	110.226.76.166	India	Gujarat	Ahmedabad	Mobile	Chrome	/admin/login	2026-02-26 15:15:48.231349
f72062e2-4193-49c4-ad10-f3dd75c761a3	110.226.76.166	India	Gujarat	Ahmedabad	Mobile	Chrome	/admin	2026-02-26 15:17:07.197572
540928c9-286f-4b52-9be5-dca18a80dc03	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-26 16:09:07.018576
6d44db25-8bea-4937-af48-18004d83e12a	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/login	2026-02-26 16:09:08.032864
3e3b53a2-190b-4601-ac62-f1dc6dff4c4e	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-26 16:18:08.863936
611cdd54-c76f-4696-aca9-f196e5152ef0	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-26 16:18:14.470794
6fbaa54d-d955-4123-a9c5-c68488d8e004	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 16:18:18.909071
e45249c0-42df-40d6-b7b5-cb8a51dc2516	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 16:19:40.065826
fe785f59-7e42-4830-9c00-1bd8090c116e	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 16:20:02.432537
bc7d9907-8768-4b68-adb2-356cb6055bcb	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 16:20:30.33037
6522afda-a329-43a6-a1f4-629229899d65	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 16:21:08.171009
70280cdd-f5a3-4d15-bbbe-988b27e0a452	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-26 16:21:25.153023
02a17d1c-f2a4-4143-a73a-fddf28126bf6	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-26 16:21:30.786184
1e70be11-a22c-4d5c-a64f-fc4444b7c87e	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-26 16:22:38.115533
549f11e0-3061-4d68-b0d2-99220147a661	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-26 16:22:49.81721
d1238205-55e6-45a6-b0e3-6b139b71bcba	::1	Local	Development	Localhost	Desktop	Chrome	/admin/login	2026-02-26 16:22:56.634663
f489366a-b4f0-4f75-a59e-a4c912a6229f	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-26 16:23:15.860782
7ee72475-360e-467f-937d-c8dd1d16e4fc	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-26 16:23:33.879107
91372858-8cc5-4597-ae1f-8e38d6c23525	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-26 16:23:41.278303
88f3967b-21de-479d-810d-06b9c8736e32	110.226.76.166	India	Gujarat	Ahmedabad	Mobile	Chrome	/admin	2026-02-26 16:24:04.322781
9ba0a3cc-c9bf-4577-9036-c52580df7faf	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-26 16:24:07.993799
0f066857-e91a-4c94-a6ea-db8450cd5a83	110.226.76.166	India	Gujarat	Ahmedabad	Mobile	Chrome	/login	2026-02-26 16:24:08.433863
dde5c68c-1ade-4fd5-b2f1-9ac148d463bd	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-26 16:24:10.197479
2d48031c-aaa0-4ce4-94e1-7e0b17c9e0b4	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 16:24:13.917192
3692d916-dbcc-4f8b-96b7-bfadaeb2ab3c	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-26 16:24:22.190618
b0702a78-c9d0-4879-8cd3-8202b213c8a3	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-26 16:24:24.838422
bf0e72c5-21e9-4c17-9933-fffbf5946987	::1	Local	Development	Localhost	Desktop	Chrome	/admin	2026-02-26 16:24:33.039766
dbac9deb-1250-44c9-aa47-627fbea61585	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-26 16:24:36.411366
38dd105e-6429-4c0f-bb76-79c21afd43f4	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-26 16:24:45.645711
1099be84-f087-4664-b0fa-0e80d60ec6fb	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-26 16:24:53.135756
fbc93cac-558e-45d5-913f-367d6ea6c98f	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-26 16:25:08.54627
476286be-c723-4fa1-afce-b5652f5939b5	::1	Local	Development	Localhost	Desktop	Chrome	/cart	2026-02-26 16:25:30.514008
08b78c2f-6c18-4aa5-8ec9-c96185365cd5	::1	Local	Development	Localhost	Desktop	Chrome	/checkout	2026-02-26 16:26:09.491666
acbf4e2e-554e-43c2-9da8-cfd16178a625	::1	Local	Development	Localhost	Desktop	Chrome	/invoice	2026-02-26 16:26:24.924789
7f72d48d-971f-41db-a66f-67589f455888	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-26 16:26:36.697301
7afd1060-da63-4544-9cb9-c8023ae58258	::1	Local	Development	Localhost	Desktop	Chrome	/invoice	2026-02-26 16:26:39.195455
ae02d2ec-4809-4825-9acf-46fce44c74f4	::1	Local	Development	Localhost	Desktop	Chrome	/invoice	2026-02-26 16:31:17.16735
99a54653-899c-4e67-b6ac-4055c8a91763	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 16:31:25.340558
0afaf4c7-c581-4fae-981d-8c3d0dc2a756	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 16:32:53.568565
8dffdfb6-ecf0-420b-b756-5df6597b7900	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 16:37:58.175554
d6a2f80d-0694-4189-9d0e-c3bca8377b75	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 16:38:44.020833
d626bb61-de17-414f-9157-4e20795aef51	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 16:40:21.15659
d3d35081-b2f4-4771-86c0-ec8242ce8916	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/	2026-02-26 17:32:18.793653
b282b3b9-03d5-4389-9762-874c97db06f0	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/register	2026-02-26 17:32:40.866999
35d6ed59-c667-4866-ba35-500cda683743	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/	2026-02-26 17:47:29.389326
547af7f3-b028-479b-aa05-9b1f752d7886	103.74.199.184	India	Maharashtra	Pune	Desktop	Chrome	/register	2026-02-26 17:47:31.15726
1f5d4e1b-8edb-4722-a409-a1b478e28a4c	71.183.234.82	United States	New York	Dobbs Ferry	Desktop	Chrome	/	2026-02-26 19:11:46.797218
ab6cb1cb-7e45-40fc-9c04-d7c9327e3c87	110.226.76.166	India	Gujarat	Ahmedabad	Mobile	Chrome	/	2026-02-26 19:15:46.436261
b8da8315-f6f8-4f4a-a390-647dc6bb8d2a	110.226.76.166	India	Gujarat	Ahmedabad	Mobile	Chrome	/login	2026-02-26 19:15:49.047652
fc316ba7-2d55-457e-99ca-7e04bfb80188	103.211.112.222	India	Maharashtra	Thane	Desktop	Edge	/	2026-02-26 19:45:43.789503
34393b8e-d47c-4f7a-b21d-59ec20b8b1cc	103.211.112.222	India	Maharashtra	Thane	Desktop	Edge	/login	2026-02-26 19:45:48.916532
43530618-fc3b-45da-91d6-f165b1588642	103.211.112.222	India	Maharashtra	Thane	Desktop	Edge	/register	2026-02-26 19:45:50.480697
80ffe925-6d5f-42ba-aa9a-a8596cfbe8b4	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/	2026-02-26 19:47:58.339616
8f787633-fdee-44af-b5ac-994383c97dd9	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/login	2026-02-26 19:48:01.437646
7ccd148e-d450-451c-a5c2-52f43523e651	103.211.112.222	India	Maharashtra	Thane	Desktop	Chrome	/packages	2026-02-26 19:48:16.557851
3752a2ea-2002-4bc7-afdd-bd7b57f3a981	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-26 19:51:19.822862
04d03ed7-bbfb-464a-8b60-c12b344d73d6	::1	Local	Development	Localhost	Desktop	Edge	/	2026-02-26 19:52:14.661773
d269d460-07e4-417a-bae8-2506aba1862d	::1	Local	Development	Localhost	Desktop	Edge	/login	2026-02-26 19:52:16.316382
52f9b444-beed-4e70-a932-95ff84d7fd0d	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 19:52:39.023313
7197fe30-c991-4656-a48f-d88d5a83f018	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-26 19:52:52.225832
32df2394-b729-4c5c-a41c-979e74724ea3	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-26 19:52:54.396015
2f124bb5-5454-45bb-ab44-b002e5e61879	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-26 19:53:14.45558
8e6d59fd-16ff-4458-8c63-94c268c1d6e1	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-26 19:53:44.042491
6b6b6730-6f2c-4dff-b2c0-22795fcc4db1	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-26 19:58:06.03037
2741e2b9-a049-456d-9f00-91a8d98806c2	::1	Local	Development	Localhost	Desktop	Chrome	/register	2026-02-26 19:58:06.247568
0573aecb-77ff-4a83-a9bd-03844768888c	::1	Local	Development	Localhost	Desktop	Chrome	/sales-assistant	2026-02-26 19:58:54.093708
94066f8a-6fc5-43db-9a74-b971f05b2b57	::1	Local	Development	Localhost	Desktop	Chrome	/	2026-02-26 19:59:49.298999
2566e525-fe13-4840-98cd-838fd76b02ca	::1	Local	Development	Localhost	Desktop	Chrome	/terms	2026-02-26 19:59:53.97322
99b3a170-0698-40df-ba54-d0c8480a8486	::1	Local	Development	Localhost	Desktop	Chrome	/packages	2026-02-26 20:01:04.757485
90c8f78f-3a8e-4a16-8ced-bf4ebc9a2519	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 20:01:09.225362
b2b66383-111b-4cea-9038-b4e47fc54226	::1	Local	Development	Localhost	Desktop	Chrome	/terms	2026-02-26 20:01:48.909201
6a3efc07-deb2-4eb6-8b8b-88c1cb66e8a7	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 20:01:50.171855
f3bcc96c-08d5-428c-a817-4f58bdce3871	::1	Local	Development	Localhost	Desktop	Chrome	/terms	2026-02-26 20:02:09.393079
c2ff6282-a358-48d8-8c13-89a4733b12d3	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 20:05:59.099054
23607a12-01e6-4474-9b45-d18cbdebcb00	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 20:09:38.556356
a8f0e941-e897-4fe7-8dff-bf0d9af3a34b	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 20:09:54.867175
9acf00f4-39bb-4471-ad0f-654c6f9f2c99	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 20:10:49.715227
96f1260b-4d10-4fda-8d31-9045627c9780	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 20:13:40.328975
8c2b040c-5fba-4874-b1a7-dc30ab362d09	::1	Local	Development	Localhost	Desktop	Chrome	/ai-sales-assistant	2026-02-26 20:13:46.066684
d6b64982-f7b2-4381-9202-5598c7565bff	::1	Local	Development	Localhost	Desktop	Chrome	/profile	2026-02-26 20:14:22.493651
a01bd6ec-846b-4290-ac1e-2e92015e923a	::1	Local	Development	Localhost	Desktop	Chrome	/login	2026-02-26 20:14:25.673445
7b50f115-b099-4854-8c84-7ad05e8b459b	::1	Local	Development	Localhost	Desktop	Chrome	/app	2026-02-26 20:14:46.996796
\.


--
-- Data for Name: training_documents; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.training_documents (id, domain_expertise_id, user_id, file_name, file_type, file_url, content, content_source, audio_duration, summary, summary_status, summary_error, last_summarized_at, metadata, processing_status, processing_error, knowledge_extracted_at, content_hash, uploaded_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_entitlements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_entitlements (id, user_id, organization_id, has_platform_access, platform_access_expires_at, session_minutes_balance, session_minutes_expires_at, has_train_me, train_me_expires_at, has_dai, dai_tokens_balance, dai_expires_at, is_enterprise_user, enterprise_train_me_enabled, enterprise_dai_enabled, last_calculated_at, updated_at) FROM stdin;
29e8d875-b169-4250-836b-675c518df088	9fa878f1-83a8-4afb-aae0-939a0942fa33	\N	t	2026-03-27 19:09:12.823	500	2026-03-27 19:09:12.358	t	2026-03-27 19:09:11.43	f	0	\N	f	f	f	2026-02-25 19:09:19.018351	2026-02-25 19:09:19.018351
71af0bca-9e4b-4044-926e-b6d24c4d5048	76cacf03-9e99-4098-b633-7617082f077e	\N	t	2026-03-28 16:26:13.012	500	2026-03-28 16:26:13.986	t	2026-03-28 16:26:12.511	f	0	\N	f	f	f	2026-02-26 16:26:19.549195	2026-02-26 16:26:19.549195
\.


--
-- Data for Name: user_feedback; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_feedback (id, user_id, conversation_id, rating, feedback, category, status, created_at) FROM stdin;
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_profiles (id, user_id, preferred_methodology, conversation_style, primary_industries, product_expertise, avg_deal_size, avg_sales_cycle, successful_patterns, common_objections, coaching_intensity, focus_areas, total_conversations, avg_conversion_rate, strongest_framework, improvement_areas, learnings, custom_preferences, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, first_name, last_name, profile_image_url, created_at, updated_at) FROM stdin;
e54b3244-f02d-4d65-b88d-dbbb170acd6b	testuser@microsoft.com	Test	Microsoft	\N	2026-02-22 07:15:56.033145	2026-02-22 07:15:56.033145
8cf9774f-ca94-4abf-af6d-79071fadf09e	testuser@salesforce.com	Test	Salesforce	\N	2026-02-22 07:15:58.089401	2026-02-22 07:15:58.089401
7c71baa0-3994-4ff7-b9d2-292662df0b6c	testuser@jpmorgan.com	Test	JP Morgan	\N	2026-02-22 07:15:59.63012	2026-02-22 07:15:59.63012
841f854b-ab63-4062-86bf-9f04f616e9d8	testuser@pfizer.com	Test	Pfizer	\N	2026-02-22 07:16:00.958995	2026-02-22 07:16:00.958995
ca2f3603-5a5e-4960-a503-ab7ee6b16ed2	testuser@amazon.com	Test	Amazon	\N	2026-02-22 07:16:02.393057	2026-02-22 07:16:02.393057
5b826f27-316e-4a6e-baa2-22312da0a4ae	testuser@uber.com	Test	Uber	\N	2026-02-22 07:16:03.715297	2026-02-22 07:16:03.715297
1a21da18-4a6b-4b92-acf5-ff84e88d1e87	testuser@delltechnologies.com	Test	Dell Technologies	\N	2026-02-22 07:16:05.236989	2026-02-22 07:16:05.236989
d89b0aa4-5c00-4d67-9297-69c2ba467fc9	testuser@ibm.com	Test	IBM	\N	2026-02-22 07:16:06.470179	2026-02-22 07:16:06.470179
c8b0f59f-dca5-42c0-9511-69676359d076	testuser@oracle.com	Test	Oracle	\N	2026-02-22 07:16:07.816945	2026-02-22 07:16:07.816945
4fd1425e-48c9-41bd-afaa-2c0d1d90f0c7	testuser@accenture.com	Test	Accenture	\N	2026-02-22 07:16:09.44523	2026-02-22 07:16:09.44523
7742d483-f1d2-4efb-899d-c0bf96a5df35	testuser@meta.com	Test	Meta	\N	2026-02-22 07:16:10.803116	2026-02-22 07:16:10.803116
\.


--
-- Name: replit_database_migrations_v1_id_seq; Type: SEQUENCE SET; Schema: _system; Owner: neondb_owner
--

SELECT pg_catalog.setval('_system.replit_database_migrations_v1_id_seq', 6, true);


--
-- Name: replit_database_migrations_v1 replit_database_migrations_v1_pkey; Type: CONSTRAINT; Schema: _system; Owner: neondb_owner
--

ALTER TABLE ONLY _system.replit_database_migrations_v1
    ADD CONSTRAINT replit_database_migrations_v1_pkey PRIMARY KEY (id);


--
-- Name: addon_purchases addon_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.addon_purchases
    ADD CONSTRAINT addon_purchases_pkey PRIMARY KEY (id);


--
-- Name: addons addons_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.addons
    ADD CONSTRAINT addons_pkey PRIMARY KEY (id);


--
-- Name: addons addons_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.addons
    ADD CONSTRAINT addons_slug_key UNIQUE (slug);


--
-- Name: ai_token_usage ai_token_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_token_usage
    ADD CONSTRAINT ai_token_usage_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: api_key_usage_logs api_key_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_key_usage_logs
    ADD CONSTRAINT api_key_usage_logs_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: audio_sources audio_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audio_sources
    ADD CONSTRAINT audio_sources_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_users auth_users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_email_key UNIQUE (email);


--
-- Name: auth_users auth_users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_pkey PRIMARY KEY (id);


--
-- Name: auth_users auth_users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_username_key UNIQUE (username);


--
-- Name: billing_adjustments billing_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_adjustments
    ADD CONSTRAINT billing_adjustments_pkey PRIMARY KEY (id);


--
-- Name: call_meeting_minutes call_meeting_minutes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.call_meeting_minutes
    ADD CONSTRAINT call_meeting_minutes_pkey PRIMARY KEY (id);


--
-- Name: call_recordings call_recordings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.call_recordings
    ADD CONSTRAINT call_recordings_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: case_studies case_studies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.case_studies
    ADD CONSTRAINT case_studies_pkey PRIMARY KEY (id);


--
-- Name: conversation_memories conversation_memories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conversation_memories
    ADD CONSTRAINT conversation_memories_pkey PRIMARY KEY (id);


--
-- Name: conversation_minutes_backup conversation_minutes_backup_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conversation_minutes_backup
    ADD CONSTRAINT conversation_minutes_backup_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: domain_expertise domain_expertise_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.domain_expertise
    ADD CONSTRAINT domain_expertise_pkey PRIMARY KEY (id);


--
-- Name: enterprise_user_assignments enterprise_user_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.enterprise_user_assignments
    ADD CONSTRAINT enterprise_user_assignments_pkey PRIMARY KEY (id);


--
-- Name: enterprise_user_assignments enterprise_user_assignments_user_id_license_package_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.enterprise_user_assignments
    ADD CONSTRAINT enterprise_user_assignments_user_id_license_package_id_key UNIQUE (user_id, license_package_id);


--
-- Name: gateway_providers gateway_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gateway_providers
    ADD CONSTRAINT gateway_providers_pkey PRIMARY KEY (id);


--
-- Name: gateway_providers gateway_providers_provider_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gateway_providers
    ADD CONSTRAINT gateway_providers_provider_name_key UNIQUE (provider_name);


--
-- Name: gateway_transactions gateway_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gateway_transactions
    ADD CONSTRAINT gateway_transactions_pkey PRIMARY KEY (id);


--
-- Name: gateway_webhooks gateway_webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gateway_webhooks
    ADD CONSTRAINT gateway_webhooks_pkey PRIMARY KEY (id);


--
-- Name: knowledge_entries knowledge_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.knowledge_entries
    ADD CONSTRAINT knowledge_entries_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: license_assignments license_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_assignments
    ADD CONSTRAINT license_assignments_pkey PRIMARY KEY (id);


--
-- Name: license_packages license_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_packages
    ADD CONSTRAINT license_packages_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: organization_addons organization_addons_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.organization_addons
    ADD CONSTRAINT organization_addons_pkey PRIMARY KEY (id);


--
-- Name: organization_memberships organization_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: otps otps_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pending_orders pending_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pending_orders
    ADD CONSTRAINT pending_orders_pkey PRIMARY KEY (id);


--
-- Name: products products_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_code_key UNIQUE (code);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: promo_codes promo_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_code_key UNIQUE (code);


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- Name: sales_intelligence_exports sales_intelligence_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_intelligence_exports
    ADD CONSTRAINT sales_intelligence_exports_pkey PRIMARY KEY (id);


--
-- Name: sales_intelligence_knowledge sales_intelligence_knowledge_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_intelligence_knowledge
    ADD CONSTRAINT sales_intelligence_knowledge_pkey PRIMARY KEY (id);


--
-- Name: sales_intelligence_learning_logs sales_intelligence_learning_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_intelligence_learning_logs
    ADD CONSTRAINT sales_intelligence_learning_logs_pkey PRIMARY KEY (id);


--
-- Name: sales_intelligence_suggestions sales_intelligence_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_intelligence_suggestions
    ADD CONSTRAINT sales_intelligence_suggestions_pkey PRIMARY KEY (id);


--
-- Name: session_minutes_purchases session_minutes_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_minutes_purchases
    ADD CONSTRAINT session_minutes_purchases_pkey PRIMARY KEY (id);


--
-- Name: session_minutes_usage session_minutes_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_minutes_usage
    ADD CONSTRAINT session_minutes_usage_pkey PRIMARY KEY (id);


--
-- Name: session_usage session_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_usage
    ADD CONSTRAINT session_usage_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: super_user_overrides super_user_overrides_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.super_user_overrides
    ADD CONSTRAINT super_user_overrides_email_key UNIQUE (email);


--
-- Name: super_user_overrides super_user_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.super_user_overrides
    ADD CONSTRAINT super_user_overrides_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: system_config system_config_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_key_key UNIQUE (key);


--
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (id);


--
-- Name: system_metrics system_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_metrics
    ADD CONSTRAINT system_metrics_pkey PRIMARY KEY (id);


--
-- Name: terms_and_conditions terms_and_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.terms_and_conditions
    ADD CONSTRAINT terms_and_conditions_pkey PRIMARY KEY (id);


--
-- Name: time_extensions time_extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.time_extensions
    ADD CONSTRAINT time_extensions_pkey PRIMARY KEY (id);


--
-- Name: traffic_logs traffic_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.traffic_logs
    ADD CONSTRAINT traffic_logs_pkey PRIMARY KEY (id);


--
-- Name: training_documents training_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.training_documents
    ADD CONSTRAINT training_documents_pkey PRIMARY KEY (id);


--
-- Name: user_entitlements user_entitlements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_entitlements
    ADD CONSTRAINT user_entitlements_pkey PRIMARY KEY (id);


--
-- Name: user_entitlements user_entitlements_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_entitlements
    ADD CONSTRAINT user_entitlements_user_id_key UNIQUE (user_id);


--
-- Name: user_feedback user_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_feedback
    ADD CONSTRAINT user_feedback_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_replit_database_migrations_v1_build_id; Type: INDEX; Schema: _system; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_replit_database_migrations_v1_build_id ON _system.replit_database_migrations_v1 USING btree (build_id);


--
-- Name: idx_addon_purchases_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_addon_purchases_user ON public.addon_purchases USING btree (user_id);


--
-- Name: idx_ai_token_usage_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_ai_token_usage_user ON public.ai_token_usage USING btree (user_id);


--
-- Name: idx_api_key_usage_logs_api_key_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_api_key_usage_logs_api_key_id ON public.api_key_usage_logs USING btree (api_key_id);


--
-- Name: idx_api_key_usage_logs_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_api_key_usage_logs_created_at ON public.api_key_usage_logs USING btree (created_at);


--
-- Name: idx_api_keys_created_by; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_api_keys_created_by ON public.api_keys USING btree (created_by);


--
-- Name: idx_api_keys_organization_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_api_keys_organization_id ON public.api_keys USING btree (organization_id);


--
-- Name: idx_api_keys_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_api_keys_status ON public.api_keys USING btree (status);


--
-- Name: idx_audio_sources_conversation; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audio_sources_conversation ON public.audio_sources USING btree (conversation_id);


--
-- Name: idx_audit_logs_actor; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_audit_logs_actor ON public.audit_logs USING btree (actor_id);


--
-- Name: idx_billing_adjustments_org; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_billing_adjustments_org ON public.billing_adjustments USING btree (organization_id);


--
-- Name: idx_billing_adjustments_package; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_billing_adjustments_package ON public.billing_adjustments USING btree (license_package_id);


--
-- Name: idx_billing_adjustments_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_billing_adjustments_status ON public.billing_adjustments USING btree (status);


--
-- Name: idx_cart_items_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_cart_items_user ON public.cart_items USING btree (user_id);


--
-- Name: idx_case_studies_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_case_studies_active ON public.case_studies USING btree (is_active);


--
-- Name: idx_case_studies_industry; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_case_studies_industry ON public.case_studies USING btree (industry);


--
-- Name: idx_conversation_minutes_backup_conversation; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_conversation_minutes_backup_conversation ON public.conversation_minutes_backup USING btree (conversation_id);


--
-- Name: idx_conversation_minutes_backup_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_conversation_minutes_backup_user ON public.conversation_minutes_backup USING btree (user_id);


--
-- Name: idx_conversations_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_conversations_user ON public.conversations USING btree (user_id);


--
-- Name: idx_domain_expertise_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_domain_expertise_user ON public.domain_expertise USING btree (user_id);


--
-- Name: idx_enterprise_assignments_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_enterprise_assignments_email ON public.enterprise_user_assignments USING btree (user_email);


--
-- Name: idx_enterprise_assignments_license; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_enterprise_assignments_license ON public.enterprise_user_assignments USING btree (license_package_id);


--
-- Name: idx_enterprise_assignments_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_enterprise_assignments_status ON public.enterprise_user_assignments USING btree (status);


--
-- Name: idx_enterprise_assignments_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_enterprise_assignments_user ON public.enterprise_user_assignments USING btree (user_id);


--
-- Name: idx_gateway_transactions_org; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_gateway_transactions_org ON public.gateway_transactions USING btree (organization_id);


--
-- Name: idx_gateway_transactions_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_gateway_transactions_user ON public.gateway_transactions USING btree (user_id);


--
-- Name: idx_gateway_webhooks_provider; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_gateway_webhooks_provider ON public.gateway_webhooks USING btree (provider_id);


--
-- Name: idx_knowledge_entries_domain; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_knowledge_entries_domain ON public.knowledge_entries USING btree (domain_expertise_id);


--
-- Name: idx_license_assignments_package; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_license_assignments_package ON public.license_assignments USING btree (license_package_id);


--
-- Name: idx_license_packages_org; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_license_packages_org ON public.license_packages USING btree (organization_id);


--
-- Name: idx_memories_conversation; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_memories_conversation ON public.conversation_memories USING btree (conversation_id);


--
-- Name: idx_memories_stage; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_memories_stage ON public.conversation_memories USING btree (buyer_stage);


--
-- Name: idx_memories_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_memories_user ON public.conversation_memories USING btree (user_id);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id);


--
-- Name: idx_minutes_expires; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_minutes_expires ON public.call_meeting_minutes USING btree (expires_at);


--
-- Name: idx_minutes_recording; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_minutes_recording ON public.call_meeting_minutes USING btree (recording_id);


--
-- Name: idx_minutes_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_minutes_status ON public.call_meeting_minutes USING btree (status);


--
-- Name: idx_minutes_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_minutes_user ON public.call_meeting_minutes USING btree (user_id);


--
-- Name: idx_org_addons_org; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_org_addons_org ON public.organization_addons USING btree (organization_id);


--
-- Name: idx_org_addons_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_org_addons_status ON public.organization_addons USING btree (status);


--
-- Name: idx_org_addons_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_org_addons_type ON public.organization_addons USING btree (type);


--
-- Name: idx_organization_memberships_org; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_organization_memberships_org ON public.organization_memberships USING btree (organization_id);


--
-- Name: idx_otps_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_otps_email ON public.otps USING btree (email);


--
-- Name: idx_password_reset_tokens_email; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens USING btree (email);


--
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_payments_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_payments_user ON public.payments USING btree (user_id);


--
-- Name: idx_pending_orders_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_pending_orders_user ON public.pending_orders USING btree (user_id);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_products_active ON public.products USING btree (is_active);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_products_category ON public.products USING btree (category);


--
-- Name: idx_products_code; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_products_code ON public.products USING btree (code);


--
-- Name: idx_profiles_methodology; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_profiles_methodology ON public.user_profiles USING btree (preferred_methodology);


--
-- Name: idx_profiles_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_profiles_user ON public.user_profiles USING btree (user_id);


--
-- Name: idx_recordings_expires; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recordings_expires ON public.call_recordings USING btree (expires_at);


--
-- Name: idx_recordings_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recordings_status ON public.call_recordings USING btree (status);


--
-- Name: idx_recordings_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_recordings_user ON public.call_recordings USING btree (user_id);


--
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_session_expire ON public.sessions USING btree (expire);


--
-- Name: idx_session_minutes_consumed_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_session_minutes_consumed_at ON public.session_minutes_usage USING btree (consumed_at);


--
-- Name: idx_session_minutes_purchase; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_session_minutes_purchase ON public.session_minutes_usage USING btree (purchase_id);


--
-- Name: idx_session_minutes_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_session_minutes_user ON public.session_minutes_usage USING btree (user_id);


--
-- Name: idx_session_usage_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_session_usage_user ON public.session_usage USING btree (user_id);


--
-- Name: idx_subscriptions_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_subscriptions_user ON public.subscriptions USING btree (user_id);


--
-- Name: idx_system_config_key; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_system_config_key ON public.system_config USING btree (key);


--
-- Name: idx_system_config_section; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_system_config_section ON public.system_config USING btree (section);


--
-- Name: idx_terms_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_terms_active ON public.terms_and_conditions USING btree (is_active);


--
-- Name: idx_terms_version; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_terms_version ON public.terms_and_conditions USING btree (version);


--
-- Name: idx_training_documents_domain; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_training_documents_domain ON public.training_documents USING btree (domain_expertise_id);


--
-- Name: idx_user_entitlements_org; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_entitlements_org ON public.user_entitlements USING btree (organization_id);


--
-- Name: idx_user_entitlements_user; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_entitlements_user ON public.user_entitlements USING btree (user_id);


--
-- Name: addon_purchases addon_purchases_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.addon_purchases
    ADD CONSTRAINT addon_purchases_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: addon_purchases addon_purchases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.addon_purchases
    ADD CONSTRAINT addon_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: ai_token_usage ai_token_usage_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_token_usage
    ADD CONSTRAINT ai_token_usage_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: ai_token_usage ai_token_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.ai_token_usage
    ADD CONSTRAINT ai_token_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.auth_users(id);


--
-- Name: api_key_usage_logs api_key_usage_logs_api_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_key_usage_logs
    ADD CONSTRAINT api_key_usage_logs_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES public.api_keys(id) ON DELETE CASCADE;


--
-- Name: api_keys api_keys_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: api_keys api_keys_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: api_keys api_keys_revoked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: audio_sources audio_sources_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audio_sources
    ADD CONSTRAINT audio_sources_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.auth_users(id);


--
-- Name: billing_adjustments billing_adjustments_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_adjustments
    ADD CONSTRAINT billing_adjustments_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.auth_users(id);


--
-- Name: billing_adjustments billing_adjustments_license_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_adjustments
    ADD CONSTRAINT billing_adjustments_license_package_id_fkey FOREIGN KEY (license_package_id) REFERENCES public.license_packages(id);


--
-- Name: billing_adjustments billing_adjustments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_adjustments
    ADD CONSTRAINT billing_adjustments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: call_meeting_minutes call_meeting_minutes_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.call_meeting_minutes
    ADD CONSTRAINT call_meeting_minutes_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: call_meeting_minutes call_meeting_minutes_recording_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.call_meeting_minutes
    ADD CONSTRAINT call_meeting_minutes_recording_id_fkey FOREIGN KEY (recording_id) REFERENCES public.call_recordings(id) ON DELETE SET NULL;


--
-- Name: call_meeting_minutes call_meeting_minutes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.call_meeting_minutes
    ADD CONSTRAINT call_meeting_minutes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: call_recordings call_recordings_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.call_recordings
    ADD CONSTRAINT call_recordings_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: call_recordings call_recordings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.call_recordings
    ADD CONSTRAINT call_recordings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: conversation_minutes_backup conversation_minutes_backup_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conversation_minutes_backup
    ADD CONSTRAINT conversation_minutes_backup_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_minutes_backup conversation_minutes_backup_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conversation_minutes_backup
    ADD CONSTRAINT conversation_minutes_backup_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: domain_expertise domain_expertise_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.domain_expertise
    ADD CONSTRAINT domain_expertise_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: enterprise_user_assignments enterprise_user_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.enterprise_user_assignments
    ADD CONSTRAINT enterprise_user_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.auth_users(id);


--
-- Name: enterprise_user_assignments enterprise_user_assignments_license_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.enterprise_user_assignments
    ADD CONSTRAINT enterprise_user_assignments_license_package_id_fkey FOREIGN KEY (license_package_id) REFERENCES public.license_packages(id) ON DELETE CASCADE;


--
-- Name: enterprise_user_assignments enterprise_user_assignments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.enterprise_user_assignments
    ADD CONSTRAINT enterprise_user_assignments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: enterprise_user_assignments enterprise_user_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.enterprise_user_assignments
    ADD CONSTRAINT enterprise_user_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: gateway_transactions gateway_transactions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gateway_transactions
    ADD CONSTRAINT gateway_transactions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: gateway_transactions gateway_transactions_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gateway_transactions
    ADD CONSTRAINT gateway_transactions_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.gateway_providers(id);


--
-- Name: gateway_transactions gateway_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gateway_transactions
    ADD CONSTRAINT gateway_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: gateway_webhooks gateway_webhooks_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.gateway_webhooks
    ADD CONSTRAINT gateway_webhooks_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.gateway_providers(id);


--
-- Name: knowledge_entries knowledge_entries_domain_expertise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.knowledge_entries
    ADD CONSTRAINT knowledge_entries_domain_expertise_id_fkey FOREIGN KEY (domain_expertise_id) REFERENCES public.domain_expertise(id);


--
-- Name: knowledge_entries knowledge_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.knowledge_entries
    ADD CONSTRAINT knowledge_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: license_assignments license_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_assignments
    ADD CONSTRAINT license_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.auth_users(id);


--
-- Name: license_assignments license_assignments_license_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_assignments
    ADD CONSTRAINT license_assignments_license_package_id_fkey FOREIGN KEY (license_package_id) REFERENCES public.license_packages(id);


--
-- Name: license_assignments license_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_assignments
    ADD CONSTRAINT license_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: license_packages license_packages_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.license_packages
    ADD CONSTRAINT license_packages_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: organization_addons organization_addons_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.organization_addons
    ADD CONSTRAINT organization_addons_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_memberships organization_memberships_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_memberships organization_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: organizations organizations_primary_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_primary_manager_id_fkey FOREIGN KEY (primary_manager_id) REFERENCES public.auth_users(id);


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: pending_orders pending_orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pending_orders
    ADD CONSTRAINT pending_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: refunds refunds_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- Name: refunds refunds_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.auth_users(id);


--
-- Name: refunds refunds_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: sales_intelligence_exports sales_intelligence_exports_exported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_intelligence_exports
    ADD CONSTRAINT sales_intelligence_exports_exported_by_fkey FOREIGN KEY (exported_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: sales_intelligence_knowledge sales_intelligence_knowledge_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_intelligence_knowledge
    ADD CONSTRAINT sales_intelligence_knowledge_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: sales_intelligence_learning_logs sales_intelligence_learning_logs_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_intelligence_learning_logs
    ADD CONSTRAINT sales_intelligence_learning_logs_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: sales_intelligence_learning_logs sales_intelligence_learning_logs_promoted_knowledge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_intelligence_learning_logs
    ADD CONSTRAINT sales_intelligence_learning_logs_promoted_knowledge_id_fkey FOREIGN KEY (promoted_knowledge_id) REFERENCES public.sales_intelligence_knowledge(id) ON DELETE SET NULL;


--
-- Name: sales_intelligence_learning_logs sales_intelligence_learning_logs_suggestion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_intelligence_learning_logs
    ADD CONSTRAINT sales_intelligence_learning_logs_suggestion_id_fkey FOREIGN KEY (suggestion_id) REFERENCES public.sales_intelligence_suggestions(id) ON DELETE CASCADE;


--
-- Name: sales_intelligence_learning_logs sales_intelligence_learning_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_intelligence_learning_logs
    ADD CONSTRAINT sales_intelligence_learning_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: sales_intelligence_suggestions sales_intelligence_suggestions_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_intelligence_suggestions
    ADD CONSTRAINT sales_intelligence_suggestions_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: sales_intelligence_suggestions sales_intelligence_suggestions_knowledge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_intelligence_suggestions
    ADD CONSTRAINT sales_intelligence_suggestions_knowledge_id_fkey FOREIGN KEY (knowledge_id) REFERENCES public.sales_intelligence_knowledge(id) ON DELETE SET NULL;


--
-- Name: sales_intelligence_suggestions sales_intelligence_suggestions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales_intelligence_suggestions
    ADD CONSTRAINT sales_intelligence_suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: session_minutes_purchases session_minutes_purchases_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_minutes_purchases
    ADD CONSTRAINT session_minutes_purchases_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: session_minutes_purchases session_minutes_purchases_refunded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_minutes_purchases
    ADD CONSTRAINT session_minutes_purchases_refunded_by_fkey FOREIGN KEY (refunded_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: session_minutes_purchases session_minutes_purchases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_minutes_purchases
    ADD CONSTRAINT session_minutes_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: session_minutes_usage session_minutes_usage_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_minutes_usage
    ADD CONSTRAINT session_minutes_usage_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: session_minutes_usage session_minutes_usage_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_minutes_usage
    ADD CONSTRAINT session_minutes_usage_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.addon_purchases(id) ON DELETE CASCADE;


--
-- Name: session_minutes_usage session_minutes_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_minutes_usage
    ADD CONSTRAINT session_minutes_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: session_usage session_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session_usage
    ADD CONSTRAINT session_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.auth_users(id);


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: system_config system_config_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: terms_and_conditions terms_and_conditions_last_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.terms_and_conditions
    ADD CONSTRAINT terms_and_conditions_last_modified_by_fkey FOREIGN KEY (last_modified_by) REFERENCES public.auth_users(id);


--
-- Name: time_extensions time_extensions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.time_extensions
    ADD CONSTRAINT time_extensions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.auth_users(id);


--
-- Name: time_extensions time_extensions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.time_extensions
    ADD CONSTRAINT time_extensions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: training_documents training_documents_domain_expertise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.training_documents
    ADD CONSTRAINT training_documents_domain_expertise_id_fkey FOREIGN KEY (domain_expertise_id) REFERENCES public.domain_expertise(id);


--
-- Name: training_documents training_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.training_documents
    ADD CONSTRAINT training_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: user_entitlements user_entitlements_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_entitlements
    ADD CONSTRAINT user_entitlements_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: user_entitlements user_entitlements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_entitlements
    ADD CONSTRAINT user_entitlements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: user_feedback user_feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_feedback
    ADD CONSTRAINT user_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict L7ePFfz1wbnx65ulWLstJb3d0aOdvLhI9kXfNFegtZevYh1Z2kShaQhebpLAs0t

