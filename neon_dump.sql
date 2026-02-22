--
-- PostgreSQL database dump
--

\restrict nh7AYbn3GhhzWki1wfMN4zyy1i7xkobwlscFHLn4PVWVgsU5QtdF8cdv1QPb8cQ

-- Dumped from database version 17.8 (6108b59)
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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addon_purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addon_purchases (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: addons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addons (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: ai_token_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_token_usage (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    target_audience character varying(50) DEFAULT 'all'::character varying NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    published_at timestamp without time zone,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: api_key_usage_logs; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: audio_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audio_sources (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    conversation_id character varying NOT NULL,
    source_type character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    source_id text,
    teams_meeting_id character varying,
    status text DEFAULT 'active'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    connected_at timestamp without time zone DEFAULT now(),
    disconnected_at timestamp without time zone,
    CONSTRAINT audio_sources_source_type_check CHECK (((source_type)::text = ANY ((ARRAY['device-microphone'::character varying, 'teams-meeting'::character varying, 'teams-recording'::character varying])::text[]))),
    CONSTRAINT audio_sources_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'disconnected'::text])))
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    actor_id character varying(255),
    action character varying(100) NOT NULL,
    target_type character varying(50),
    target_id character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address character varying(50),
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: auth_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_users (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: billing_adjustments; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: call_meeting_minutes; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: call_recordings; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: case_studies; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: conversation_minutes_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_minutes_backup (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: domain_expertise; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.domain_expertise (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying(255) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    company_domain character varying(255),
    is_shared boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: enterprise_user_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enterprise_user_assignments (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
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
    CONSTRAINT enterprise_user_assignments_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'revoked'::character varying])::text[])))
);


--
-- Name: gateway_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gateway_providers (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    provider_name character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    configuration jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: gateway_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gateway_transactions (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: gateway_webhooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gateway_webhooks (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: knowledge_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knowledge_entries (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: license_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.license_assignments (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    license_package_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    assigned_at timestamp without time zone DEFAULT now(),
    unassigned_at timestamp without time zone,
    assigned_by character varying(255),
    notes text
);


--
-- Name: license_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.license_packages (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: organization_addons; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: organization_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organization_memberships (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    organization_id character varying(255) NOT NULL,
    user_id character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    joined_at timestamp without time zone DEFAULT now(),
    left_at timestamp without time zone
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    company_name character varying(255) NOT NULL,
    billing_email character varying(255) NOT NULL,
    primary_manager_id character varying(255),
    razorpay_customer_id character varying(255),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: otps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otps (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    email character varying(255) NOT NULL,
    code character varying(10) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    attempts character varying(10) DEFAULT '0'::character varying NOT NULL,
    is_used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    is_used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: pending_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pending_orders (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: promo_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promo_codes (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying(255) NOT NULL,
    token character varying(500) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: refunds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refunds (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: sales_intelligence_exports; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sales_intelligence_knowledge; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sales_intelligence_learning_logs; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: sales_intelligence_suggestions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: session_minutes_purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_minutes_purchases (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: session_minutes_usage; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: session_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_usage (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying(255) NOT NULL,
    session_id character varying(255) NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    duration_seconds character varying(20),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying(255) NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: super_user_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.super_user_overrides (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    email character varying(255) NOT NULL,
    reason text NOT NULL,
    granted_by character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: system_config; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: system_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_metrics (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    metric_type character varying(50) NOT NULL,
    value character varying(100) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    "timestamp" timestamp without time zone DEFAULT now()
);


--
-- Name: terms_and_conditions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: time_extensions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_extensions (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying(255) NOT NULL,
    extension_type character varying(20) NOT NULL,
    extension_value character varying(20) NOT NULL,
    reason text NOT NULL,
    granted_by character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: traffic_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.traffic_logs (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    ip_address character varying(255),
    country character varying(255),
    state character varying(255),
    city character varying(255),
    device_type character varying(255),
    browser character varying(255),
    visited_page text,
    visit_time timestamp without time zone DEFAULT now()
);


--
-- Name: training_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_documents (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
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


--
-- Name: user_entitlements; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: user_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_feedback (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying(255) NOT NULL,
    conversation_id character varying(255),
    rating integer NOT NULL,
    feedback text,
    category character varying(50),
    status character varying(20) DEFAULT 'new'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    email character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    profile_image_url character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Data for Name: addon_purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.addon_purchases (id, user_id, organization_id, addon_type, package_sku, billing_type, status, purchase_amount, currency, gateway_transaction_id, start_date, end_date, auto_renew, total_units, used_units, metadata, parent_purchase_id, renewal_scheduled_at, refunded_at, refund_amount, refund_reason, gateway_refund_id, refunded_by, created_at, updated_at) FROM stdin;
56ae778d-9127-41c0-9ea6-cdd00a525d9b	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	dai	f4fdc254-fe49-4de7-890a-0a703418609d	one_time	active	10.00	USD	c9dd69f7-bf67-475f-b518-a77e2480ed86	2026-02-22 09:59:40.216	2026-03-24 09:59:40.216	f	0	0	{"quantity": 1, "basePrice": "10", "paymentId": "pay_SJ9OD4KQboFtlU", "itemNumber": 1, "totalItems": 1, "cartOrderId": "66f15a24-40f2-4e37-a37a-551660b0405a", "packageName": "DAI Lite (Monthly)", "actualCurrency": "USD", "gatewayProvider": "razorpay", "actualPaidAmount": "10.00", "purchasedViaCart": true, "originalAddonType": "service"}	\N	\N	\N	\N	\N	\N	\N	2026-02-22 09:59:39.993495	2026-02-22 09:59:39.993495
f3185b9c-9c22-43aa-9ced-1ba79d7dbd44	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	platform_access	61a2e346-c35f-4395-8996-b3c4cfe8fcd8	one_time	active	149.00	USD	c9dd69f7-bf67-475f-b518-a77e2480ed86	2026-02-22 09:59:41.728	2026-03-24 09:59:41.728	f	0	0	{"quantity": 1, "basePrice": "149", "paymentId": "pay_SJ9OD4KQboFtlU", "itemNumber": 1, "totalItems": 1, "cartOrderId": "66f15a24-40f2-4e37-a37a-551660b0405a", "packageName": "3 Months Plan", "actualCurrency": "USD", "gatewayProvider": "razorpay", "actualPaidAmount": "149.00", "purchasedViaCart": true, "originalAddonType": "platform_access"}	\N	\N	\N	\N	\N	\N	\N	2026-02-22 09:59:41.488495	2026-02-22 09:59:41.488495
8fc0dee3-a1ff-4728-ac36-e80ffc9d3a9d	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	train_me	258106b4-6b02-4af3-8b1d-af77d7af29c1	one_time	active	20.00	USD	2f85c001-4c04-48f5-8606-d170aa008939	2026-02-22 10:04:34.289	2026-03-24 10:04:34.289	f	0	0	{"quantity": 1, "basePrice": "20", "paymentId": "pay_SJ9TRn7A4SMhqq", "itemNumber": 1, "totalItems": 1, "cartOrderId": "264d5544-3d31-4141-80ca-33327fcacdf0", "packageName": "Train Me Add-on (Monthly)", "actualCurrency": "USD", "gatewayProvider": "razorpay", "actualPaidAmount": "20.00", "purchasedViaCart": true, "originalAddonType": "service"}	\N	\N	\N	\N	\N	\N	\N	2026-02-22 10:04:34.064047	2026-02-22 10:04:34.064047
2c4971a4-0a90-4343-92bb-52db1eecac26	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	train_me	258106b4-6b02-4af3-8b1d-af77d7af29c1	one_time	active	20.00	USD	669f62da-3e96-415f-84e1-67154b2c03cf	2026-02-22 10:17:27.509	2026-03-24 10:17:27.509	f	0	0	{"quantity": 1, "basePrice": "20", "paymentId": "pay_SJ9gyxxk1H1Yry", "itemNumber": 1, "totalItems": 1, "cartOrderId": "1dc460f0-46b5-439d-ad9d-3743775976a4", "packageName": "Train Me Add-on (Monthly)", "actualCurrency": "USD", "gatewayProvider": "razorpay", "actualPaidAmount": "20.00", "purchasedViaCart": true, "originalAddonType": "service"}	\N	\N	\N	\N	\N	\N	\N	2026-02-22 10:17:27.279444	2026-02-22 10:17:27.279444
1b32c8b1-6f8b-4458-a684-1eab74e4f69a	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	train_me	258106b4-6b02-4af3-8b1d-af77d7af29c1	one_time	active	0.00	USD	\N	2026-02-22 10:25:10.782	2026-03-24 10:25:10.782	f	0	0	{"quantity": 1, "basePrice": "20", "paymentId": "free_1771755909704", "itemNumber": 1, "totalItems": 1, "cartOrderId": "3d877631-915c-427a-bd88-f193930f630e", "packageName": "Train Me Add-on (Monthly)", "actualCurrency": "USD", "gatewayProvider": "free_promo", "actualPaidAmount": "0.00", "purchasedViaCart": true, "originalAddonType": "service"}	\N	\N	\N	\N	\N	\N	\N	2026-02-22 10:25:10.565058	2026-02-22 10:25:10.565058
37e44698-b049-42b0-84ad-b3bc3e02e695	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	train_me	258106b4-6b02-4af3-8b1d-af77d7af29c1	one_time	active	0.00	USD	\N	2026-02-22 10:27:46.249	2026-03-24 10:27:46.249	f	0	0	{"quantity": 1, "basePrice": "20", "paymentId": "free_1771756065180", "itemNumber": 1, "totalItems": 1, "cartOrderId": "89ea4487-7e7a-41e0-b394-f7710f21cb84", "packageName": "Train Me Add-on (Monthly)", "actualCurrency": "USD", "gatewayProvider": "free_promo", "actualPaidAmount": "0.00", "purchasedViaCart": true, "originalAddonType": "service"}	\N	\N	\N	\N	\N	\N	\N	2026-02-22 10:27:46.028089	2026-02-22 10:27:46.028089
13d5d015-7c96-42b7-b233-33f94f08808a	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	session_minutes	ac84f933-15d3-4ff2-9a27-8b60c0f1858b	one_time	active	80.00	USD	c9dd69f7-bf67-475f-b518-a77e2480ed86	2026-02-22 09:59:41.297	2026-03-24 10:31:12.951	f	6500	0	{"quantity": 1, "basePrice": "80", "paymentId": "pay_SJ9OD4KQboFtlU", "cartOrderId": "66f15a24-40f2-4e37-a37a-551660b0405a", "packageName": "5000 Minutes Package", "actualCurrency": "USD", "gatewayProvider": "razorpay", "purchaseHistory": [{"amount": "80.00", "orderId": "66f15a24-40f2-4e37-a37a-551660b0405a", "currency": "USD", "quantity": 1, "paymentId": "pay_SJ9OD4KQboFtlU", "packageSku": "ac84f933-15d3-4ff2-9a27-8b60c0f1858b", "packageName": "5000 Minutes Package", "purchasedAt": "2026-02-22T09:59:41.297Z", "minutesAdded": 5000, "gatewayProvider": "razorpay", "purchasedViaCart": true}, {"amount": "16.00", "orderId": "f922f1e7-3913-4f7e-894a-ea0689e88336", "currency": "USD", "quantity": 1, "paymentId": "pay_SJ9tQbrJkFwOCp", "packageSku": "f19e48b0-2bbc-4a75-9d0e-73afa53b09d3", "packageName": "1000 Minutes Package", "purchasedAt": "2026-02-22T10:29:11.116Z", "minutesAdded": 1000, "gatewayProvider": "razorpay", "purchasedViaCart": true}, {"amount": "8.00", "orderId": "27413e0f-6cdf-4fb1-b649-bb6c71018807", "currency": "USD", "quantity": 1, "paymentId": "pay_SJ9vEViA98UaKU", "packageSku": "16b59eb6-e3cb-4235-9a53-df3315c4ed24", "packageName": "500 Minutes Package", "purchasedAt": "2026-02-22T10:31:12.951Z", "minutesAdded": 500, "gatewayProvider": "razorpay", "purchasedViaCart": true}], "actualPaidAmount": "80.00", "lastPurchaseDate": "2026-02-22T10:31:12.951Z", "purchasedViaCart": true, "originalAddonType": "usage_bundle", "lastPurchaseOrderId": "27413e0f-6cdf-4fb1-b649-bb6c71018807"}	\N	\N	\N	\N	\N	\N	\N	2026-02-22 09:59:41.075569	2026-02-22 10:31:12.951
9c0d9d85-d60c-4387-9170-7788d8918a93	8eaabe7e-246a-4e3c-8d5a-205011ccc478	baf39d94-3d9d-416e-827a-145993ff9934	train_me	258106b4-6b02-4af3-8b1d-af77d7af29c1	one_time	active	59.00	USD	\N	2026-02-22 12:29:59.657	2026-03-24 12:29:59.657	f	0	0	{"cartOrderId": "b2ccf1ef-8ebd-4438-bbd1-efa4813fa4c2", "packageName": "Train Me Add-on (Monthly)", "teamPurchase": true}	\N	\N	\N	\N	\N	\N	\N	2026-02-22 12:30:00.45992	2026-02-22 12:30:00.45992
4f4910e6-7f46-4e6a-a91b-3bc384814412	8eaabe7e-246a-4e3c-8d5a-205011ccc478	baf39d94-3d9d-416e-827a-145993ff9934	session_minutes	16b59eb6-e3cb-4235-9a53-df3315c4ed24	one_time	active	59.00	USD	\N	2026-02-22 12:30:00.643	2026-03-24 12:47:52.607	f	7000	0	{"cartOrderId": "b2ccf1ef-8ebd-4438-bbd1-efa4813fa4c2", "packageName": "500 Minutes Package", "teamPurchase": true, "purchaseHistory": [{"amount": "80.00", "orderId": "407b7ec0-12d8-4540-931c-9f428638899e", "currency": "USD", "quantity": 1, "paymentId": "pay_SJCEnFqcNyjUxn", "packageSku": "ac84f933-15d3-4ff2-9a27-8b60c0f1858b", "packageName": "5000 Minutes Package", "purchasedAt": "2026-02-22T12:46:45.232Z", "minutesAdded": 5000, "gatewayProvider": "razorpay", "purchasedViaCart": true}, {"amount": "24.00", "orderId": "0f95d78e-5d8d-44df-81cd-7ed79ed0d713", "currency": "USD", "quantity": 1, "paymentId": "pay_SJCFzAYjELt0BD", "packageSku": "0297d197-2c45-410e-ad94-4ec73e77c79b", "packageName": "1500 Minutes Package", "purchasedAt": "2026-02-22T12:47:52.607Z", "minutesAdded": 1500, "gatewayProvider": "razorpay", "purchasedViaCart": true}], "lastPurchaseDate": "2026-02-22T12:47:52.607Z", "lastPurchaseOrderId": "0f95d78e-5d8d-44df-81cd-7ed79ed0d713"}	\N	\N	\N	\N	\N	\N	\N	2026-02-22 12:30:01.430173	2026-02-22 12:47:52.607
a02ee23c-7f52-40d4-89b1-2a99339daa86	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	dai	f92de33c-cf9b-45ff-951b-9b576a2aed41	one_time	active	200.00	USD	0c0b308c-07b2-4eb9-a8c5-1062843fe8c8	2026-02-22 12:47:53.226	2026-03-24 12:47:53.226	f	0	0	{"quantity": 1, "basePrice": "200", "paymentId": "pay_SJCFzAYjELt0BD", "itemNumber": 1, "totalItems": 1, "cartOrderId": "0f95d78e-5d8d-44df-81cd-7ed79ed0d713", "packageName": "DAI Enterprise (Monthly)", "actualCurrency": "USD", "gatewayProvider": "razorpay", "actualPaidAmount": "200.00", "purchasedViaCart": true, "originalAddonType": "service"}	\N	\N	\N	\N	\N	\N	\N	2026-02-22 12:47:54.004598	2026-02-22 12:47:54.004598
1a13f58d-09f1-47fc-abdd-c0c1e4c6f5c7	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	train_me	258106b4-6b02-4af3-8b1d-af77d7af29c1	one_time	active	20.00	USD	0c0b308c-07b2-4eb9-a8c5-1062843fe8c8	2026-02-22 12:47:53.885	2026-03-24 12:47:53.885	f	0	0	{"quantity": 1, "basePrice": "20", "paymentId": "pay_SJCFzAYjELt0BD", "itemNumber": 1, "totalItems": 1, "cartOrderId": "0f95d78e-5d8d-44df-81cd-7ed79ed0d713", "packageName": "Train Me Add-on (Monthly)", "actualCurrency": "USD", "gatewayProvider": "razorpay", "actualPaidAmount": "20.00", "purchasedViaCart": true, "originalAddonType": "service"}	\N	\N	\N	\N	\N	\N	\N	2026-02-22 12:47:54.663729	2026-02-22 12:47:54.663729
\.


--
-- Data for Name: addons; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: ai_token_usage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_token_usage (id, user_id, organization_id, provider, prompt_tokens, completion_tokens, total_tokens, request_id, feature, metadata, occurred_at, created_at) FROM stdin;
d3fa505d-2c8c-47d0-a796-4270a8736eb9	c2af625b-64b0-43be-b9c0-a233115deba5	\N	deepseek	1952	417	2369	\N	shift_gears	{"recordedAt": "2026-02-22T07:53:06.608Z"}	2026-02-22 07:53:06.608	2026-02-22 07:53:06.946906
45ab266b-e7ad-46ce-b71d-3743a4bf2ae0	c2af625b-64b0-43be-b9c0-a233115deba5	\N	deepseek	1952	445	2397	\N	shift_gears	{"recordedAt": "2026-02-22T07:53:08.209Z"}	2026-02-22 07:53:08.209	2026-02-22 07:53:08.540869
8b0101b8-1906-4876-99a4-c5ba00743f5c	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	deepseek	1949	412	2361	\N	shift_gears	{"recordedAt": "2026-02-22T09:51:53.366Z"}	2026-02-22 09:51:53.366	2026-02-22 09:51:53.150325
14294be4-b7f2-43c6-b2d8-463745e7141f	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	deepseek	1949	432	2381	\N	shift_gears	{"recordedAt": "2026-02-22T09:51:53.998Z"}	2026-02-22 09:51:53.998	2026-02-22 09:51:53.884315
ebcedfe9-92e3-4edc-974c-95dba80281bc	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	deepseek	653	2101	2754	\N	mind_map	{"recordedAt": "2026-02-22T09:52:50.819Z"}	2026-02-22 09:52:50.819	2026-02-22 09:52:51.224494
341b978e-b6ba-4dfb-b35a-37f1ba06f8fa	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	deepseek	1953	386	2339	\N	shift_gears	{"recordedAt": "2026-02-22T10:02:20.301Z"}	2026-02-22 10:02:20.301	2026-02-22 10:02:20.057607
fd22447b-e274-40fa-936f-a1b0a3897af7	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	deepseek	1953	398	2351	\N	shift_gears	{"recordedAt": "2026-02-22T10:02:22.354Z"}	2026-02-22 10:02:22.354	2026-02-22 10:02:22.120532
9ec7d261-3b3c-4c76-be72-11d2891a17c8	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	deepseek	738	328	1066	\N	present_to_win_case_study	{"recordedAt": "2026-02-22T10:03:00.669Z"}	2026-02-22 10:03:00.669	2026-02-22 10:03:01.088355
bfefa45c-ff6f-4415-ad64-3b067c859ef3	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	deepseek	685	1859	2544	\N	mind_map	{"recordedAt": "2026-02-22T10:03:30.674Z"}	2026-02-22 10:03:30.674	2026-02-22 10:03:30.449269
ff23d155-760e-4e21-bd31-a012d3633eed	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	deepseek	1951	411	2362	\N	shift_gears	{"recordedAt": "2026-02-22T10:35:11.819Z"}	2026-02-22 10:35:11.819	2026-02-22 10:35:11.585285
8dc872c4-b3e3-4724-9f75-501e75d714b4	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	deepseek	1951	435	2386	\N	shift_gears	{"recordedAt": "2026-02-22T10:35:12.334Z"}	2026-02-22 10:35:12.334	2026-02-22 10:35:12.09676
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.announcements (id, title, content, target_audience, status, published_at, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: api_key_usage_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.api_key_usage_logs (id, api_key_id, endpoint, method, status_code, response_time, ip_address, user_agent, request_body, created_at) FROM stdin;
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.api_keys (id, name, key_prefix, key_hash, created_by, organization_id, scopes, rate_limit, rate_limit_window, status, last_used_at, usage_count, expires_at, ip_whitelist, metadata, created_at, revoked_at, revoked_by) FROM stdin;
\.


--
-- Data for Name: audio_sources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audio_sources (id, conversation_id, source_type, created_at, source_id, teams_meeting_id, status, metadata, connected_at, disconnected_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, actor_id, action, target_type, target_id, metadata, ip_address, user_agent, created_at) FROM stdin;
a43e1723-14c3-4215-9066-45fc833a5100	c2af625b-64b0-43be-b9c0-a233115deba5	admin.login	user	c2af625b-64b0-43be-b9c0-a233115deba5	{"email": "admin@revwinner.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 07:22:57.702189
a10d7032-eecf-4093-8be7-6bf555352831	c2af625b-64b0-43be-b9c0-a233115deba5	promo_code.created	promo_code	a851e084-ec8d-4059-998f-7b18ab4b071c	{"code": "SAVE100", "adminId": "c2af625b-64b0-43be-b9c0-a233115deba5", "category": "platform_subscription", "discountType": "percentage", "discountValue": "20", "allowedPlanTypes": ["yearly", "monthly", "three_year", "six_month"]}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 07:30:19.366284
4c9725ab-0465-4f9b-b567-5fac943ee8b9	c2af625b-64b0-43be-b9c0-a233115deba5	admin.created	user	d637844e-1170-4291-b786-d9ad4242e34e	{"email": "kunaldp379@gmail.com", "createdBy": "c2af625b-64b0-43be-b9c0-a233115deba5"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 07:33:43.668427
6b7901eb-4490-4c84-8332-b4b3353851fb	c2af625b-64b0-43be-b9c0-a233115deba5	user.logged_in	user	c2af625b-64b0-43be-b9c0-a233115deba5	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 07:51:15.111385
c13ae041-e5bb-4400-aad6-28dfb05f50f2	c2af625b-64b0-43be-b9c0-a233115deba5	user.ai_engine_updated	user	c2af625b-64b0-43be-b9c0-a233115deba5	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 07:52:07.5635
3972fa2f-4a37-465e-8da2-0c1a34ea2af0	c2af625b-64b0-43be-b9c0-a233115deba5	super_user_unlimited_session_access	user	c2af625b-64b0-43be-b9c0-a233115deba5	{"email": "admin@revwinner.com", "route": "/api/session-usage/start", "ipAddress": "::1", "timestamp": "2026-02-22T07:52:35.365Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36", "accessMethod": "super_admin_role", "superUserBypass": true}	\N	\N	2026-02-22 07:52:35.699991
beef6d7d-c123-4aa7-9b56-a1078f026a17	c2de364b-6881-47ac-9264-458916351a12	user.registered	user	c2de364b-6881-47ac-9264-458916351a12	{"email": "hello@kunalpatil.me", "username": "kunaldp3379"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 09:12:19.321906
35564e95-e552-4df9-8462-781aa76db261	a9c4d1b7-4312-41d7-bc9a-c9cb122e58e6	user.registered	user	a9c4d1b7-4312-41d7-bc9a-c9cb122e58e6	{"email": "bobyzehy@denipl.net", "username": "kunaldp33379"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 09:12:59.865713
8e747160-d46d-4eeb-a7da-151b56b164ee	5fd9e414-de11-41f6-a4af-49e5a7e7d29f	user.registered	user	5fd9e414-de11-41f6-a4af-49e5a7e7d29f	{"email": "nilibilu@forexzig.com", "username": "afadadasa"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 09:18:31.437509
6d6bfd3a-37b7-41d9-8a0d-6c039e9d630c	8a1aba82-6c97-4ce4-b274-b20e95e340e9	user.registered	user	8a1aba82-6c97-4ce4-b274-b20e95e340e9	{"email": "gogulosa@denipl.com", "username": "nilibilu@forexzig"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 09:28:01.93077
d33f743d-b013-4ab6-af0b-5bfa0d42ccd0	d5c54d33-02bd-4a7f-9a8a-eab3b7c50bc0	user.registered	user	d5c54d33-02bd-4a7f-9a8a-eab3b7c50bc0	{"email": "nalicefo@denipl.net", "username": "nalicefo@denipl"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 09:30:55.277167
ed810449-58a9-4f82-b352-dfa651afa8f3	2cddba37-2b80-46f8-893f-a6622cce384c	user.registered	user	2cddba37-2b80-46f8-893f-a6622cce384c	{"email": "xigacypa@denipl.net", "username": "xigacypa@denipl"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 09:33:00.698697
dd0ff54b-d319-42d0-92de-42752d857467	2cddba37-2b80-46f8-893f-a6622cce384c	user.verified	user	2cddba37-2b80-46f8-893f-a6622cce384c	{"note": "New user registration verified - fresh session created", "email": "xigacypa@denipl.net", "username": "xigacypa@denipl"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 09:33:18.426024
30450b87-b7d0-4c97-909d-f1d74e89d5b0	2cddba37-2b80-46f8-893f-a6622cce384c	user.ai_engine_updated	user	2cddba37-2b80-46f8-893f-a6622cce384c	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 09:33:29.906652
1b8b4e33-f9c5-4607-b919-82683266c84b	2cddba37-2b80-46f8-893f-a6622cce384c	user.logged_in	user	2cddba37-2b80-46f8-893f-a6622cce384c	{}	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-02-22 09:38:14.267414
32f6a06b-1ed7-4d2f-830f-01b3dac57919	2cddba37-2b80-46f8-893f-a6622cce384c	user.logged_in	user	2cddba37-2b80-46f8-893f-a6622cce384c	{}	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-02-22 09:42:11.204899
cfbfb25a-c9bb-4318-add9-a1987e5f2b64	82cb8c83-fc1b-4fa3-b87d-990418225797	user.registered	user	82cb8c83-fc1b-4fa3-b87d-990418225797	{"email": "rekasuro@fxzig.com", "username": "rekasuro@fxzig"}	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-02-22 09:43:00.252595
6b728367-105e-4f99-996f-e5aebeda0dc8	82cb8c83-fc1b-4fa3-b87d-990418225797	user.verified	user	82cb8c83-fc1b-4fa3-b87d-990418225797	{"note": "New user registration verified - fresh session created", "email": "rekasuro@fxzig.com", "username": "rekasuro@fxzig"}	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-02-22 09:43:15.300703
fe911e50-a90e-41e9-8059-61d24d70a0aa	82cb8c83-fc1b-4fa3-b87d-990418225797	user.ai_engine_updated	user	82cb8c83-fc1b-4fa3-b87d-990418225797	{"aiEngine": "default"}	::1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36	2026-02-22 09:43:23.404289
7a8608aa-28b8-463b-b9c2-0249a6f2ed89	c2af625b-64b0-43be-b9c0-a233115deba5	admin.login	user	c2af625b-64b0-43be-b9c0-a233115deba5	{"email": "admin@revwinner.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 09:55:49.590588
a5348854-d51e-414a-adad-00e07600295d	c2af625b-64b0-43be-b9c0-a233115deba5	promo_code.deleted	promo_code	a851e084-ec8d-4059-998f-7b18ab4b071c	{"adminId": "c2af625b-64b0-43be-b9c0-a233115deba5"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 09:56:50.240149
0e6fe147-c9fd-4cb9-965d-882397c203b6	86401085-206e-405e-87eb-e2a77b146d27	user.password_reset_completed	user	86401085-206e-405e-87eb-e2a77b146d27	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 12:26:24.949675
012093e9-9d49-4763-a1a2-a027634020d0	c2af625b-64b0-43be-b9c0-a233115deba5	promo_code.created	promo_code	eb728eb5-ad22-40f3-bc31-094378a4040b	{"code": "SAVE100", "adminId": "c2af625b-64b0-43be-b9c0-a233115deba5", "category": "platform_subscription", "discountType": "percentage", "discountValue": "100", "allowedPlanTypes": ["yearly", "three_year", "six_month", "monthly"]}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 09:57:09.625196
ed2b35a4-f330-416e-8ce9-6ce3ebf97904	82cb8c83-fc1b-4fa3-b87d-990418225797	subscription.activated	subscription	e8aec5fa-fecc-417c-b188-a6da36665044	{"source": "cart_checkout", "orderId": "66f15a24-40f2-4e37-a37a-551660b0405a", "packageSku": "61a2e346-c35f-4395-8996-b3c4cfe8fcd8", "billingType": "monthly"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 09:59:42.329254
7dd1cb30-e663-4362-9e2b-9ff49b486e01	c2af625b-64b0-43be-b9c0-a233115deba5	subscription.trial_extended	user	82cb8c83-fc1b-4fa3-b87d-990418225797	{"days": 7000, "adminId": "c2af625b-64b0-43be-b9c0-a233115deba5"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 10:07:18.342354
5733eaac-30eb-433d-bf1a-7b92017ec96d	c2af625b-64b0-43be-b9c0-a233115deba5	admin.login	user	c2af625b-64b0-43be-b9c0-a233115deba5	{"email": "admin@revwinner.com"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 10:19:20.184912
15a86df9-d681-471d-81a8-df3da4de203b	c2af625b-64b0-43be-b9c0-a233115deba5	promo_code.created	promo_code	d322a98b-17ca-4925-b33e-7b04390eddd2	{"code": "SAVEC100", "adminId": "c2af625b-64b0-43be-b9c0-a233115deba5", "category": "train_me", "discountType": "percentage", "discountValue": "100", "allowedPlanTypes": ["train_me_30_days"]}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 10:24:55.254834
0aafde25-dbf1-4476-a7fc-4e6b23a3620f	82cb8c83-fc1b-4fa3-b87d-990418225797	LICENSE_ASSIGNED	license_assignment	67daeb9f-1640-4ac3-ac63-ed6d8f1758d8	{"targetUserId": "d637844e-1170-4291-b786-d9ad4242e34e", "organizationId": "4c8b1a0e-bfbc-4662-acf8-10eabac32621", "targetUserEmail": "kunaldp379@gmail.com"}	\N	\N	2026-02-22 11:47:11.907667
874fdafa-1dd4-4214-a8f0-4c0c661684c0	d637844e-1170-4291-b786-d9ad4242e34e	user.logged_in	user	d637844e-1170-4291-b786-d9ad4242e34e	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 11:49:29.254453
ab19a60e-e680-43bc-8477-09c2a35a8292	d637844e-1170-4291-b786-d9ad4242e34e	user.ai_engine_updated	user	d637844e-1170-4291-b786-d9ad4242e34e	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 11:49:39.17828
ba19c06d-df85-4fe3-856f-3983b2433322	82cb8c83-fc1b-4fa3-b87d-990418225797	LICENSE_EMAIL_RESENT	license_assignment	67daeb9f-1640-4ac3-ac63-ed6d8f1758d8	{"emailType": "access_notification", "organizationId": "4c8b1a0e-bfbc-4662-acf8-10eabac32621", "targetUserEmail": "kunaldp379@gmail.com"}	\N	\N	2026-02-22 12:01:04.517297
d3cc839a-6f49-4342-ad67-2fd03789fa9c	82cb8c83-fc1b-4fa3-b87d-990418225797	LICENSE_EMAIL_RESENT	license_assignment	67daeb9f-1640-4ac3-ac63-ed6d8f1758d8	{"emailType": "access_notification", "organizationId": "4c8b1a0e-bfbc-4662-acf8-10eabac32621", "targetUserEmail": "kunaldp379@gmail.com"}	\N	\N	2026-02-22 12:06:09.955821
28c57547-89e4-40ba-8771-e79502123a3b	82cb8c83-fc1b-4fa3-b87d-990418225797	LICENSE_EMAIL_RESENT	license_assignment	67daeb9f-1640-4ac3-ac63-ed6d8f1758d8	{"emailType": "access_notification", "organizationId": "4c8b1a0e-bfbc-4662-acf8-10eabac32621", "targetUserEmail": "kunaldp379@gmail.com"}	\N	\N	2026-02-22 12:11:02.941458
965ffb03-a1c6-4803-b697-5c1f5ce36a87	82cb8c83-fc1b-4fa3-b87d-990418225797	LICENSE_EMAIL_RESENT	license_assignment	67daeb9f-1640-4ac3-ac63-ed6d8f1758d8	{"emailType": "access_notification", "organizationId": "4c8b1a0e-bfbc-4662-acf8-10eabac32621", "targetUserEmail": "kunaldp379@gmail.com"}	\N	\N	2026-02-22 12:12:04.684517
91a09080-b29e-402e-ac88-7e8ffc981593	82cb8c83-fc1b-4fa3-b87d-990418225797	USER_CREATED_VIA_LICENSE	user	8eaabe7e-246a-4e3c-8d5a-205011ccc478	{"email": "jyhazexy@denipl.net", "organizationId": "4c8b1a0e-bfbc-4662-acf8-10eabac32621", "passwordResetTokenSent": true, "createdByLicenseManager": true}	\N	\N	2026-02-22 12:12:42.673552
6201b464-b691-42e1-85c9-810da8d240f0	82cb8c83-fc1b-4fa3-b87d-990418225797	LICENSE_ASSIGNED	license_assignment	8c2fb427-65de-4589-844d-a1cac3570ae6	{"targetUserId": "8eaabe7e-246a-4e3c-8d5a-205011ccc478", "organizationId": "4c8b1a0e-bfbc-4662-acf8-10eabac32621", "targetUserEmail": "jyhazexy@denipl.net"}	\N	\N	2026-02-22 12:12:44.500899
83cab863-5297-4fdd-ae1a-6dccb2df7d21	82cb8c83-fc1b-4fa3-b87d-990418225797	LICENSE_EMAIL_RESENT	license_assignment	8c2fb427-65de-4589-844d-a1cac3570ae6	{"emailType": "access_notification", "organizationId": "4c8b1a0e-bfbc-4662-acf8-10eabac32621", "targetUserEmail": "jyhazexy@denipl.net"}	\N	\N	2026-02-22 12:20:21.958823
0720547e-1202-4bc1-bee5-43e195725a0c	8eaabe7e-246a-4e3c-8d5a-205011ccc478	user.password_reset_completed	user	8eaabe7e-246a-4e3c-8d5a-205011ccc478	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 12:20:50.113612
958c1669-c237-4bce-a54d-9005bcba2d01	8eaabe7e-246a-4e3c-8d5a-205011ccc478	user.logged_in	user	8eaabe7e-246a-4e3c-8d5a-205011ccc478	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 12:21:06.296952
78aecae3-25d6-4134-a98c-8133b7b05e1a	8eaabe7e-246a-4e3c-8d5a-205011ccc478	user.ai_engine_updated	user	8eaabe7e-246a-4e3c-8d5a-205011ccc478	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 12:21:14.362263
c9126db9-34ce-4996-80e1-0feae3bd32f4	8eaabe7e-246a-4e3c-8d5a-205011ccc478	ENTERPRISE_LICENSE_PURCHASED	organization	baf39d94-3d9d-416e-827a-145993ff9934	{"amount": "30", "orderId": "order_SJBqHtzWfQmC5y", "totalSeats": 5, "licensePackageId": "6d416874-0d4b-43a7-88ac-8d223e7bd4fc"}	\N	\N	2026-02-22 12:23:54.328028
3db2c610-50e3-4760-b726-8046b9c7849a	8eaabe7e-246a-4e3c-8d5a-205011ccc478	USER_CREATED_VIA_LICENSE	user	86401085-206e-405e-87eb-e2a77b146d27	{"email": "legekewy@denipl.com", "organizationId": "baf39d94-3d9d-416e-827a-145993ff9934", "passwordResetTokenSent": true, "createdByLicenseManager": true}	\N	\N	2026-02-22 12:25:11.547264
129e2517-e3e9-43ce-be40-0c25dbd5a475	8eaabe7e-246a-4e3c-8d5a-205011ccc478	LICENSE_ASSIGNED	license_assignment	1898dfaa-5a18-4d16-9240-d0a93823ae11	{"targetUserId": "86401085-206e-405e-87eb-e2a77b146d27", "organizationId": "baf39d94-3d9d-416e-827a-145993ff9934", "targetUserEmail": "legekewy@denipl.com"}	\N	\N	2026-02-22 12:25:13.467394
e41a4897-7ef8-41c6-b1ed-ccc1981137bc	8eaabe7e-246a-4e3c-8d5a-205011ccc478	LICENSE_EMAIL_RESENT	license_assignment	1898dfaa-5a18-4d16-9240-d0a93823ae11	{"emailType": "access_notification", "organizationId": "baf39d94-3d9d-416e-827a-145993ff9934", "targetUserEmail": "legekewy@denipl.com"}	\N	\N	2026-02-22 12:25:35.162183
a4dadb24-0757-4c25-a469-5e2b151dbe3e	86401085-206e-405e-87eb-e2a77b146d27	user.logged_in	user	86401085-206e-405e-87eb-e2a77b146d27	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 12:26:44.303916
a4459f02-a931-4584-9454-9996705c2da6	8eaabe7e-246a-4e3c-8d5a-205011ccc478	SEATS_ADDED	license_package	6d416874-0d4b-43a7-88ac-8d223e7bd4fc	{"amount": "30", "orderId": "order_SJBuBB0uYb71oy", "newTotalSeats": 10, "additionalSeats": 5}	\N	\N	2026-02-22 12:27:31.781394
967a8826-0f39-4ec9-8ebd-ee15fd1b711a	8eaabe7e-246a-4e3c-8d5a-205011ccc478	team_purchase.completed	license_manager	8eaabe7e-246a-4e3c-8d5a-205011ccc478	{"orderId": "b2ccf1ef-8ebd-4438-bbd1-efa4813fa4c2", "purchaseDetails": {"daiCount": 0, "buyerName": "kunal patil", "totalAmount": "177.00", "trainMeCount": 0, "organizationId": "baf39d94-3d9d-416e-827a-145993ff9934", "licensePackageId": "07af9458-d43c-4f89-8e0f-477dc6d5cd6a", "platformAccessCount": 1, "sessionMinutesCount": 1}, "licenseManagerName": "kunal deepak patil", "licenseManagerEmail": "jyhazexy@denipl.net"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 12:30:04.769595
b371a182-19b6-46cc-b4a8-de61117e2553	86401085-206e-405e-87eb-e2a77b146d27	user.ai_engine_updated	user	86401085-206e-405e-87eb-e2a77b146d27	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 12:32:20.371731
77a301b3-6c35-4a0c-9599-bbfac15c8cd2	8eaabe7e-246a-4e3c-8d5a-205011ccc478	user.logged_in	user	8eaabe7e-246a-4e3c-8d5a-205011ccc478	{}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 12:45:56.335101
9f1c8edf-b302-4622-a4e7-a6a0c2e89653	3d28d643-6a20-449a-be67-091421899890	user.registered	user	3d28d643-6a20-449a-be67-091421899890	{"email": "2022.kunal.patil@ves.ac.in", "username": "2022.kunal.patil"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 12:50:01.71
48176cb1-101f-4c3c-8838-f31196d902fa	3d28d643-6a20-449a-be67-091421899890	user.verified	user	3d28d643-6a20-449a-be67-091421899890	{"note": "New user registration verified - fresh session created", "email": "2022.kunal.patil@ves.ac.in", "username": "2022.kunal.patil"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 12:50:29.411829
46a138cf-31fd-4e8a-86c1-3f6019644050	3d28d643-6a20-449a-be67-091421899890	user.ai_engine_updated	user	3d28d643-6a20-449a-be67-091421899890	{"aiEngine": "default"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-22 12:50:38.381585
\.


--
-- Data for Name: auth_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auth_users (id, email, mobile, first_name, last_name, organization, username, hashed_password, role, status, trial_start_date, trial_end_date, train_me_subscription_date, email_verified, stripe_customer_id, ai_engine, encrypted_api_key, ai_engine_setup_completed, terms_accepted, terms_accepted_at, session_version, call_recording_enabled, created_at, updated_at) FROM stdin;
d637844e-1170-4291-b786-d9ad4242e34e	kunaldp379@gmail.com	\N	kunal	patil	System Administrator	kunaldp379	$2b$12$i0cMjKVbjMIQR.hwIhlmmu778f1lmP/H5DLmKrJ6IkZlNyNjVaXOO	admin	active	\N	\N	\N	t	\N	default	P31bm4sPrzIYOIEi7bGNmu9jj0XIHNM/Fdbs5njJqECXgXi15a1LVhWmSKHrFwKG1qrPL21KHPS2ndKuAnhVBPPaOaqiY/1OBEMR+cAgFMdUq5b71zOUHnZsiOYjNyU7ioOCORYo0g==	t	f	\N	1	f	2026-02-22 07:33:43.06779	2026-02-22 11:49:38.178
0563a78b-2777-4083-ab62-6c6f4ea666a1	testuser@microsoft.com	\N	Test	Microsoft	\N	test_microsoft	$2b$10$UVdDxmPqvL60xjad/LZ/NOQAuLfz6z8SdaIO7O45AfRvW8unm2vLu	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-22 07:50:12.653742	2026-02-22 07:50:12.653742
fce3d9ab-b9a7-4dbb-be1f-6eb8d5c026bb	testuser@salesforce.com	\N	Test	Salesforce	\N	test_salesforce	$2b$10$CFVYEz8fihNzCKd5yVDSXORHcpF18Aux8pxX0qQYI2VN9oXxmu4Mm	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-22 07:50:14.586815	2026-02-22 07:50:14.586815
18a2d6a8-decd-4e0e-8b3c-de5c97a967d6	testuser@jpmorgan.com	\N	Test	JP Morgan	\N	test_jpmorgan	$2b$10$WOZl3V0BklYOTQy0zlox1udPZLwRXcVfTMr4q/ixheyor1zyJWJLW	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-22 07:50:15.919126	2026-02-22 07:50:15.919126
3596e399-223d-419a-b9e3-58aa9ea6b063	testuser@pfizer.com	\N	Test	Pfizer	\N	test_pfizer	$2b$10$8zDpcndgVqbKCwCZtHSUeuJqmbJaBArPsMgcshVCX5bOa9S10zUBa	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-22 07:50:17.160126	2026-02-22 07:50:17.160126
2725115a-1587-4a77-9a82-c8017e13971c	testuser@amazon.com	\N	Test	Amazon	\N	test_amazon	$2b$10$d4BUwM2oPYOLqtqKQs/lMOsX1sJYEPSCTO3znF6jSuLh7BTH93nx.	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-22 07:50:18.369303	2026-02-22 07:50:18.369303
41c6749d-0385-4445-b3bc-e36f76c4191e	testuser@uber.com	\N	Test	Uber	\N	test_uber	$2b$10$DAf64qKI5uVUulAOH9oh6O8N6MQ.ERRgLYWwS2.hSPpbOXaHYiCWK	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-22 07:50:19.703139	2026-02-22 07:50:19.703139
6224f73c-f462-48a1-8ea8-d1ea739b6412	testuser@delltechnologies.com	\N	Test	Dell Technologies	\N	test_delltechnologies	$2b$10$X.kBPZWgynWFgYHiZGts2./XR9Yxroe68K5rPwz4FGB4MjeC2zha2	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-22 07:50:20.643561	2026-02-22 07:50:20.643561
b9c6ae69-a181-40fa-989f-6161953cc419	testuser@ibm.com	\N	Test	IBM	\N	test_ibm	$2b$10$JLY42/uUcrejAXS2xGny/usrBe.LcqwWLqr6WCvhlzpq7MB2sjpDK	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-22 07:50:21.749202	2026-02-22 07:50:21.749202
f6ab6d54-87da-4f60-89ca-a9840d81894f	testuser@oracle.com	\N	Test	Oracle	\N	test_oracle	$2b$10$uP0woW7Ez./d2TlrjbUmM.6.t.sIY9pLYW3ajtNnACYQN/c4bw.em	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-22 07:50:23.070834	2026-02-22 07:50:23.070834
3d89fd8c-8914-4b74-9fa1-f0780b0f25cc	testuser@accenture.com	\N	Test	Accenture	\N	test_accenture	$2b$10$qBdcAKtflOlMxa8bCZF1NOsTacPmrbaE69X637a7w4UxhQYZSorDC	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-22 07:50:24.20787	2026-02-22 07:50:24.20787
34819d7a-3880-4674-875d-2f6c0e9c3d06	testuser@meta.com	\N	Test	Meta	\N	test_meta	$2b$10$7zTUVYM8hzwCifHp/sFJqOoqVDFwng6wbYXzppnPIIElwj6qHYBB6	user	active	\N	\N	\N	f	\N	\N	\N	f	f	\N	0	f	2026-02-22 07:50:25.324284	2026-02-22 07:50:25.324284
c2de364b-6881-47ac-9264-458916351a12	hello@kunalpatil.me	+919892885090	kunal	patil	Student	kunaldp3379	$2b$12$RedkbMGxSzGVM1Gm1.pjE.uj5vJjAV/0GRwlf3guxO86QYFuPOduS	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-22 09:12:17.481	0	f	2026-02-22 09:12:17.230081	2026-02-22 09:12:17.230081
a9c4d1b7-4312-41d7-bc9a-c9cb122e58e6	bobyzehy@denipl.net	+919892885090	kunal	patil	Student	kunaldp33379	$2b$12$EEFDwSKdLYEMjUq2LI6KvObXiJmCccCM3b31Tf2j9zhJTRwTcFRyq	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-22 09:12:58.51	0	f	2026-02-22 09:12:58.263809	2026-02-22 09:12:58.263809
5fd9e414-de11-41f6-a4af-49e5a7e7d29f	nilibilu@forexzig.com	+919892885090	kunal	patil	Student	afadadasa	$2b$12$cZpRPdWUSICZtIoxN1B72eAtmLrD6F.Kn88h6XQ.lxRSiFximFdHG	user	active	\N	\N	\N	t	\N	\N	\N	f	t	2026-02-22 09:18:29.718	0	f	2026-02-22 09:18:29.486656	2026-02-22 09:25:13.971018
8a1aba82-6c97-4ce4-b274-b20e95e340e9	gogulosa@denipl.com	+919892885090	kunal	patil	Student	nilibilu@forexzig	$2b$12$zMtOBWxGxCgjdUe6JlVP1.ZMp2pU249U8YAasktiI8M6BXTfKbKAC	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-22 09:28:00.342	0	f	2026-02-22 09:28:00.106963	2026-02-22 09:28:00.106963
d5c54d33-02bd-4a7f-9a8a-eab3b7c50bc0	nalicefo@denipl.net	+919892885090	kunal	patil	Student	nalicefo@denipl	$2b$12$bIv5OXaSBhThBPcieimUt.p6dboGzRA9niDBVc3vrxnp3aaKbSKT.	user	pending	\N	\N	\N	f	\N	\N	\N	f	t	2026-02-22 09:30:53.715	0	f	2026-02-22 09:30:53.474953	2026-02-22 09:30:53.474953
c2af625b-64b0-43be-b9c0-a233115deba5	admin@revwinner.com	\N	Super	Admin	Rev Winner	admin	$2b$10$veObOkI6AK5FV8TiziCG3u1B9g3wA/1ITGITz.aPGXJZXLAifEKs.	super_admin	active	\N	\N	\N	t	\N	default	DdC1PMz5PZsgxKFpJ++kPdOWmTpzLMfryrahGPAghx3SMt1l7gD1G1CygeY7s2j6XQe4eRRyd/I3/9mD9t9SgJ6yde4AJW0wE0j/hBf4YV9VoNE0SOcLxd+5re+h3js5n2DviZ9FLw==	t	t	\N	4	f	2026-02-22 07:14:40.909654	2026-02-22 10:19:20.182
2cddba37-2b80-46f8-893f-a6622cce384c	xigacypa@denipl.net	+919892885090	kunal	patil	Student	xigacypa@denipl	$2b$12$Oxh3g9xFHnaBVJ2P1XSXeuSrm.ztK7Cv7IxLG7i5/nAz3cl8lDiKG	user	active	\N	\N	\N	t	\N	default	vc2We1c0qCY+PkK6jNVPGZtgOmseXRPh7N1lvkjNxmmhB8TyGNZRP7/7lRoDvqVr86QqgM474kxQt/4o4ZNpiaj3m2HtrqCbTSTTj0So7uwEQCkSNlnfTR6Ay2/t6XXaUUm7CDN7aw==	t	t	2026-02-22 09:32:57.519	3	f	2026-02-22 09:32:57.274335	2026-02-22 09:42:10.828
82cb8c83-fc1b-4fa3-b87d-990418225797	rekasuro@fxzig.com	+919892885090	kunal	patil	Student	rekasuro@fxzig	$2b$12$eBd6Hjf90PTGwRqIOSmEae30tgwvZDThMTAq7k4bEtLaiQi35urtq	license_manager	active	\N	\N	\N	t	\N	default	bHA+uAzDZePmBKdxPKw5KbiKhF+flJJIWoBBV83tIGser2IZKn7cP6fZ2MKLPm6J9Ff9tq9NnYalYj/AgymQK0jw44CpJAo8ex1z8+NUpUNkOPBcUWqzL459s7ISiD6P5B661krLtg==	t	t	2026-02-22 09:42:57.008	1	f	2026-02-22 09:42:56.77856	2026-02-22 10:41:46.688
86401085-206e-405e-87eb-e2a77b146d27	legekewy@denipl.com	09892885090	kunal	patil	dolat capital	legekewyc3z6	$2b$12$vOgxJ7GImU2kCEvmT2Dn6Oy1b347FCu.DZYZVVFviogP.saZ5clVG	user	active	\N	\N	\N	t	\N	default	fvIjD5KKIsF5TpGRZT0TgcD7wmxTnq8+d7lGzplcuFd1U4Cm4iQmO75dR+n/kVSWcqhchpv4zhB8loXtI6xxD7g7JcTa445Eq18ANkZGX2g5iC+c4Ls9QJ58V2kKaPFHgwKBzPT9Rw==	t	f	\N	1	f	2026-02-22 12:25:10.933554	2026-02-22 12:32:19.361
3d28d643-6a20-449a-be67-091421899890	2022.kunal.patil@ves.ac.in	+919892885090	kunal	patil	Student	2022.kunal.patil	$2b$12$y/qWu5KzCYFjR9.sS7lfYOfX2TWtUmtVPEB8NZ6Vt0KQabnuS.f4G	user	active	\N	\N	\N	t	\N	default	0xiVR6cRhqAbZJ4izA6M5flOz0IJFkzSoFXiv4dMzAHdgZNUv5ZFV/VzCZI1XCv9Y3gZvf/UyPP8QNlpRTeYTcmV8r5yfMrK4VNrr4D1RyaKeGYBBX5qL0rbDGOiduVWTMHWNUUNOA==	t	t	2026-02-22 12:49:57.967	1	f	2026-02-22 12:49:58.750335	2026-02-22 12:50:37.403
8eaabe7e-246a-4e3c-8d5a-205011ccc478	jyhazexy@denipl.net	09892885090	kunal	patil	dolat capital	jyhazexyqbw0	$2b$12$NZNcdZJ18FDlDtTCRwHQa.kRCOVqZnxZU4MHd0GT2yDKKgKRm4NUW	license_manager	active	\N	\N	\N	t	\N	default	s/I/d19r1GosXtgtibhM11sj9f+35IYaL8+6FrFjUltgR3684v/MUEx8ZZCq65oWbuBw2gtO+QmXTcmEfjUKFFp1OsBMI5lhW2hgFhu8iXErxslyXv/lgCx8a0vfwCstv0uIBO4I9w==	t	f	\N	2	f	2026-02-22 12:12:41.967896	2026-02-22 12:45:55.155
\.


--
-- Data for Name: billing_adjustments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_adjustments (id, organization_id, license_package_id, adjustment_type, delta_seats, razorpay_order_id, razorpay_payment_id, amount, currency, status, processed_at, added_by, created_at) FROM stdin;
3118d6bb-698e-4703-a9b4-22f557569b48	baf39d94-3d9d-416e-827a-145993ff9934	6d416874-0d4b-43a7-88ac-8d223e7bd4fc	initial_purchase	5	order_SJBqHtzWfQmC5y	pay_SJBqZ6CeG0TsXJ	30	USD	completed	\N	8eaabe7e-246a-4e3c-8d5a-205011ccc478	2026-02-22 12:23:54.012494
9d1e48e6-2949-424a-af09-ac7e53472a26	baf39d94-3d9d-416e-827a-145993ff9934	6d416874-0d4b-43a7-88ac-8d223e7bd4fc	seat_addition	5	order_SJBuBB0uYb71oy	pay_SJBuSzacEx4d79	30	USD	completed	\N	8eaabe7e-246a-4e3c-8d5a-205011ccc478	2026-02-22 12:27:31.569828
\.


--
-- Data for Name: call_meeting_minutes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.call_meeting_minutes (id, user_id, conversation_id, recording_id, title, summary, key_points, action_items, participants, pain_points, recommendations, next_steps, full_transcript, structured_minutes, status, expires_at, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: call_recordings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.call_recordings (id, user_id, conversation_id, file_name, file_size, duration, recording_url, status, expires_at, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cart_items (id, user_id, package_sku, addon_type, package_name, base_price, currency, quantity, metadata, purchase_mode, team_manager_name, team_manager_email, company_name, promo_code_id, promo_code_code, applied_discount_amount, added_at) FROM stdin;
d61e8018-1a56-4620-8cc3-7d7d81b0253f	82cb8c83-fc1b-4fa3-b87d-990418225797	e62f2310-d1dd-4f43-ba48-c63ae592d0f9	platform_access	12 Months Plan	399	USD	1	{"validityDays": 365}	team	kunal deepak patil	rekasuro@fxzig.com	Student	\N	\N	\N	2026-02-22 12:14:24.861367
5728fafc-3e52-4232-ba72-ed3d2bbd5110	82cb8c83-fc1b-4fa3-b87d-990418225797	4783537e-de2a-4a2a-a8e9-1194887d1f1e	usage_bundle	3000 Minutes Package	48	USD	1	{"totalUnits": 3000, "validityDays": 30}	team	kunal deepak patil	rekasuro@fxzig.com	Student	\N	\N	\N	2026-02-22 12:14:27.441776
f7cada42-e49c-457a-ab69-3c97767a6d1a	82cb8c83-fc1b-4fa3-b87d-990418225797	f92de33c-cf9b-45ff-951b-9b576a2aed41	service	DAI Enterprise (Monthly)	200	USD	1	{"validityDays": 30}	team	kunal deepak patil	rekasuro@fxzig.com	Student	\N	\N	\N	2026-02-22 12:14:29.510012
bdf6bb73-96b2-407e-95e3-be2cc210e123	82cb8c83-fc1b-4fa3-b87d-990418225797	258106b4-6b02-4af3-8b1d-af77d7af29c1	service	Train Me Add-on (Monthly)	20	USD	1	{"validityDays": 30}	team	kunal deepak patil	rekasuro@fxzig.com	Student	\N	\N	\N	2026-02-22 12:14:31.545551
\.


--
-- Data for Name: case_studies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.case_studies (id, title, industry, product_codes, problem_statement, solution, implementation, outcomes, customer_size, time_to_value, tags, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: conversation_minutes_backup; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversation_minutes_backup (id, conversation_id, user_id, client_name, company_name, industry, meeting_date, meeting_duration_minutes, executive_summary, key_topics_discussed, client_pain_points, client_requirements, solutions_proposed, competitors_discussed, objections, action_items, next_steps, full_transcript, message_count, key_quotes, marketing_hooks, best_practices, challenges_identified, success_indicators, raw_minutes_data, discovery_insights, backup_status, backup_source, created_at, updated_at) FROM stdin;
58d3a3a1-d2bb-4a3b-a8d3-08815ad3dc50	e529b5a6-69dc-4e06-aea9-577925d869a9	0563a78b-2777-4083-ab62-6c6f4ea666a1	Sarah Chen	Microsoft	Technology	2025-12-10 10:00:00	45	Productive discovery call with Microsoft's enterprise procurement team. Strong interest in AI-powered sales intelligence for their global sales organization of 15,000+ reps. Key concern around data security and integration with existing CRM.	["Global sales enablement challenges", "Integration with Dynamics 365", "AI accuracy and training requirements", "Data privacy and sovereignty", "Multi-language support"]	["Sales reps spend 40% of time on administrative tasks instead of selling", "Inconsistent messaging across global teams", "Delayed insights from quarterly reviews vs real-time feedback", "High onboarding time for new sales hires (6+ months to productivity)", "Lack of visibility into conversation quality metrics"]	["SOC 2 Type II compliance required", "Integration with Dynamics 365 CRM", "Support for 12+ languages", "GDPR compliance for EU operations", "On-premise deployment option for sensitive data"]	["Rev Winner Enterprise with dedicated infrastructure", "Custom Dynamics 365 connector", "Multi-language AI model training", "Private cloud deployment option"]	["Gong", "Chorus.ai", "Clari"]	[{"outcome": "Client expressed interest in a proof of concept to validate claims", "response": "Our AI achieves 94% accuracy on sales intent detection, and unlike competitors, we offer domain-specific training that improves accuracy by 15-20% for enterprise customers.", "objection": "How does your AI accuracy compare to Gong's established platform?"}, {"outcome": "Requested detailed pricing proposal", "response": "Our enterprise pricing includes dedicated implementation support, training, and ongoing success management. Most customers see positive ROI within 4 months.", "objection": "What's the total cost of ownership including implementation?"}]	["Send SOC 2 Type II certification documents", "Prepare Dynamics 365 integration demo", "Schedule technical deep-dive with IT security team", "Provide customer references in enterprise software"]	["Technical security review scheduled for next week", "Follow-up call with procurement in 10 days", "Prepare pilot proposal for 500-user deployment"]	Sarah: Thank you for taking the time today. We've been evaluating several sales intelligence platforms for our global sales team.\n\nSales Rep: Absolutely, Sarah. I'm excited to learn more about Microsoft's needs. Can you tell me about the current challenges your sales organization is facing?\n\nSarah: Our biggest issue is that our 15,000+ sales reps spend about 40% of their time on administrative tasks instead of actually selling. Things like updating CRM, writing call summaries, and preparing for meetings.\n\nSales Rep: That's a significant time drain. What impact does that have on your revenue targets?\n\nSarah: It's substantial. We estimate we're leaving about $200 million on the table annually just from lost selling time. Plus, our new hires take 6+ months to become productive because there's so much tribal knowledge they need to absorb.\n\nSales Rep: Rev Winner can help with both of those challenges. Our AI automatically generates meeting summaries, updates your CRM, and provides real-time coaching to new reps. How important is integration with your existing tools?\n\nSarah: Critical. We're heavily invested in Dynamics 365, so any solution needs to work seamlessly with that. And security is non-negotiable - we need SOC 2 Type II compliance at minimum.\n\nSales Rep: We have SOC 2 Type II certification and can provide custom Dynamics 365 integration. Can you tell me about your current tools and what's not working?\n\nSarah: We've evaluated Gong and Chorus.ai. Gong has good transcription but their coaching features are limited. We need something that can actually improve sales performance, not just record conversations.\n\nSales Rep: That's exactly our differentiator. Our domain expertise training means the AI understands your specific industry context, improving accuracy by 15-20% compared to generic solutions.\n\nSarah: That's impressive. What's the implementation timeline look like?\n\nSales Rep: For an enterprise deployment of your scale, we typically see 90 days to full rollout with dedicated implementation support. We'd start with a 500-user pilot.\n\nSarah: I'd like to see a technical deep-dive with our IT security team. Can you set that up?\n\nSales Rep: Absolutely. I'll send over our security documentation and we'll schedule that review for next week.	127	["Our sales reps are drowning in admin work - if we could get even 10% of that time back, it would be transformational", "The real-time coaching aspect is what sets this apart from our current tools", "I'm impressed by the domain expertise training - that's something our current vendor can't do"]	["Transform 40% admin time into active selling time", "Real-time coaching for 15,000+ global sales reps", "Enterprise-grade security with SOC 2 Type II compliance"]	["Lead with security certifications for enterprise prospects", "Demonstrate ROI calculations early in the conversation", "Emphasize domain-specific training advantages over competitors"]	["Sales reps spend 40% of time on administrative tasks instead of selling", "Inconsistent messaging across global teams", "Delayed insights from quarterly reviews vs real-time feedback", "High onboarding time for new sales hires (6+ months to productivity)", "Lack of visibility into conversation quality metrics"]	[]	{}	{}	completed	manual	2026-02-22 07:50:12.917	2026-02-22 07:50:13.246917
a2cd41b7-5b5d-4666-9ae8-88edf7cbf155	42a23871-6e5a-46eb-b718-d40492b3a18f	0563a78b-2777-4083-ab62-6c6f4ea666a1	James Rodriguez	Microsoft	Technology	2025-12-12 14:00:00	60	Deep-dive technical session with Microsoft Azure team exploring cloud infrastructure requirements. Strong alignment on scalability needs and API architecture.	["Azure integration requirements", "API rate limits and scalability", "Data residency requirements", "SSO integration with Azure AD", "Performance benchmarks"]	["Current tools don't scale well beyond 10,000 concurrent users", "API limitations causing bottlenecks during peak usage", "Complex authentication requirements for enterprise SSO", "Need for regional data processing to meet compliance"]	["Azure AD SSO integration required", "Support for 50,000+ concurrent users", "API SLA of 99.95% uptime", "Data processing in specific Azure regions"]	["Dedicated Azure infrastructure deployment", "High-availability API cluster with auto-scaling", "Azure AD native integration", "Multi-region deployment architecture"]	["Gong", "SalesLoft", "Outreach"]	[{"outcome": "Agreed to run a load testing pilot", "response": "We currently process 2M+ conversations daily for enterprise clients. Our Azure-native architecture auto-scales to handle peak loads.", "objection": "Can your infrastructure really handle our scale?"}]	["Provide Azure architecture documentation", "Schedule load testing session", "Share API performance benchmarks"]	["Technical architecture review with Azure team", "Load testing pilot in Q1"]	James: Let's dive into the technical requirements we discussed. I'm from the Azure infrastructure team and I need to understand your scalability story.\n\nSales Rep: Absolutely, James. What's your current scale and where do you need to be?\n\nJames: We have 50,000 sales reps globally. During peak periods like quarter-end, we can have 10,000+ concurrent users. Our current tools start degrading at around 5,000.\n\nSales Rep: That's a common challenge. Rev Winner's architecture is built on Azure-native services with auto-scaling. We currently process over 2 million conversations daily for our enterprise clients.\n\nJames: What's your uptime SLA? We require 99.95% minimum for business-critical systems.\n\nSales Rep: We guarantee 99.95% uptime with our enterprise tier. We also offer multi-region deployment so data stays within specific Azure regions for compliance.\n\nJames: That's important - we have strict data residency requirements for EMEA. How does your SSO integration work with Azure AD?\n\nSales Rep: We have native Azure AD integration. Your users authenticate through your existing Azure AD tenant - no separate credentials needed. We support SAML 2.0 and OIDC.\n\nJames: I'd want to run a load test before we commit. Can you support that?\n\nSales Rep: Definitely. We typically do a 2-week pilot where we simulate your peak loads. We'll provide detailed performance metrics and can run the test in an isolated environment.\n\nJames: The Azure-native approach is exactly what we need for our hybrid cloud strategy. Let me schedule a follow-up with our Azure architecture team.\n\nSales Rep: Perfect. I'll send over our architecture documentation and API specs. We can also arrange a session with our solutions architects.	189	["If you can prove the scalability, we're very interested in moving forward", "The Azure-native approach is exactly what we need for our hybrid cloud strategy"]	["Enterprise-scale: 50,000+ concurrent users supported", "Azure-native architecture for seamless integration", "99.95% API uptime SLA"]	["Lead technical conversations with architecture diagrams", "Prepare benchmark data for scalability discussions", "Offer load testing as proof point"]	["Current tools don't scale well beyond 10,000 concurrent users", "API limitations causing bottlenecks during peak usage", "Complex authentication requirements for enterprise SSO", "Need for regional data processing to meet compliance"]	[]	{}	{}	completed	manual	2026-02-22 07:50:13.532	2026-02-22 07:50:13.861718
eba8d75d-1bf9-4d19-a0d4-03521d3f989d	4d01f80b-2a8a-42e8-adf9-955019f54ee4	fce3d9ab-b9a7-4dbb-be1f-6eb8d5c026bb	Maria Santos	Salesforce	Technology	2025-12-08 09:00:00	50	Strategic discussion with Salesforce's revenue operations team about enhancing their sales coaching program. Strong interest in AI-driven insights but concerns about internal buy-in.	["Sales coaching methodology integration", "Salesforce CRM native integration", "Change management for 8,000 reps", "Measuring coaching effectiveness", "Executive dashboard requirements"]	["Current coaching is inconsistent across regions", "No objective metrics for coaching quality", "Managers spend too much time on call reviews", "New hire ramp time is 9+ months", "Top performer behaviors not systematically captured"]	["Native Salesforce integration", "Executive-level reporting dashboards", "Coaching playbook customization", "Integration with existing LMS"]	["Rev Winner Sales Coaching module", "Native Salesforce AppExchange integration", "Custom coaching scorecards", "AI-powered ramp time acceleration"]	["Gong", "Mindtickle", "Lessonly"]	[{"outcome": "Interest in change management workshop", "response": "We position AI as a coaching assistant, not replacement. Our platform surfaces insights while managers retain full control of coaching decisions.", "objection": "Our managers are resistant to AI-based coaching recommendations"}, {"outcome": "Agreed to integration assessment", "response": "Rev Winner complements existing investments - we integrate with your LMS and coaching workflows rather than replacing them.", "objection": "We've invested heavily in our internal coaching tools"}]	["Demo native Salesforce integration", "Prepare change management playbook", "Share case study from similar enterprise deployment"]	["Change management workshop next month", "Technical integration assessment", "Pilot proposal for APAC region"]	Maria: Thanks for accommodating our schedule. We're really looking for a solution that works with our existing Salesforce investment...	156	["Reducing ramp time from 9 months to 6 would save us millions in lost productivity", "The native Salesforce integration is a must-have for us", "We need to prove this to our leadership team with hard metrics"]	["Reduce sales ramp time by 33%", "Native Salesforce AppExchange integration", "AI-assisted coaching that empowers managers"]	["Address change management concerns proactively", "Position AI as assistant to human managers", "Emphasize integration over replacement"]	["Current coaching is inconsistent across regions", "No objective metrics for coaching quality", "Managers spend too much time on call reviews", "New hire ramp time is 9+ months", "Top performer behaviors not systematically captured"]	[]	{}	{}	completed	manual	2026-02-22 07:50:14.864	2026-02-22 07:50:15.20089
02625f24-379c-4507-bc8b-61fb7ce2e216	f55a2f56-1c0c-44d2-b3bf-1bc89b4b853c	18a2d6a8-decd-4e0e-8b3c-de5c97a967d6	Robert Kim	JP Morgan	Financial Services	2025-12-05 11:00:00	55	Initial discovery with JP Morgan's wealth management division. Stringent security requirements but strong interest in AI-powered client engagement insights.	["Client engagement optimization", "Regulatory compliance (SEC, FINRA)", "Data security and encryption", "Wealth advisor productivity", "Client sentiment analysis"]	["Wealth advisors missing cross-sell opportunities", "Inconsistent client experience across advisors", "Manual compliance review of client communications", "Limited visibility into client satisfaction", "High-value client churn increasing"]	["SEC and FINRA compliance", "End-to-end encryption for all data", "Audit trail for all interactions", "Integration with existing CRM and compliance systems", "Air-gapped deployment option"]	["Rev Winner Financial Services edition", "Compliance-ready conversation intelligence", "Secure private cloud deployment", "Real-time sentiment analysis"]	["Gong", "Relativity", "Verint"]	[{"outcome": "Requested compliance documentation review", "response": "Our platform is built with financial services compliance in mind. We have dedicated compliance modules for SEC, FINRA, and MiFID II requirements, with automatic redaction and archiving.", "objection": "How do you handle the regulatory complexity of financial services?"}, {"outcome": "Scheduled security architecture review", "response": "We offer fully air-gapped deployment options with all processing done within your infrastructure. Our enterprise security team can work with your IT to design the right architecture.", "objection": "Our data can never leave our infrastructure"}]	["Provide SEC/FINRA compliance documentation", "Schedule security architecture review", "Share financial services customer references"]	["Compliance team review in two weeks", "Security architecture workshop", "Reference calls with similar financial institutions"]	Robert: Thank you for coming to our offices. Security and compliance are our top priorities...	134	["If we can prove this reduces compliance review time, the ROI case writes itself", "Our wealth advisors need to focus on clients, not paperwork", "We've lost several high-value clients because we weren't proactive enough"]	["SEC and FINRA compliant from day one", "Air-gapped deployment for maximum security", "Reduce compliance review time by 60%"]	["Lead with compliance and security for financial services", "Offer on-premise/air-gapped options upfront", "Reference similar regulated industry deployments"]	["Wealth advisors missing cross-sell opportunities", "Inconsistent client experience across advisors", "Manual compliance review of client communications", "Limited visibility into client satisfaction", "High-value client churn increasing"]	[]	{}	{}	completed	manual	2026-02-22 07:50:16.092	2026-02-22 07:50:16.435019
2262e0b7-0707-44b1-bbb9-b7d1f69bc096	7d463f2a-ec0b-47eb-bd1a-a0095dd14725	3596e399-223d-419a-b9e3-58aa9ea6b063	Dr. Amanda Collins	Pfizer	Healthcare & Pharmaceuticals	2025-12-03 15:00:00	40	Discussion with Pfizer's commercial operations team about improving HCP (Healthcare Professional) engagement. Focus on compliance with pharma regulations while improving rep effectiveness.	["HCP engagement optimization", "FDA compliance for promotional content", "Medical legal regulatory review", "Rep training and coaching", "Omnichannel engagement tracking"]	["HCPs have limited time for sales interactions", "Compliance review slows content updates", "Reps struggle with complex scientific messaging", "Limited insights into HCP preferences", "Inconsistent messaging across channels"]	["FDA promotional guideline compliance", "Medical legal regulatory (MLR) workflow integration", "HIPAA compliance", "Integration with Veeva CRM", "Scientific accuracy validation"]	["Rev Winner Pharma edition", "Pre-approved messaging templates", "AI-powered scientific accuracy checks", "Veeva CRM integration"]	["Veeva Engage", "IQVIA", "Aktana"]	[{"outcome": "Interest in seeing the MLR integration demo", "response": "Our pharma-specific AI is trained on approved messaging only. All suggestions go through your MLR workflow before deployment.", "objection": "How do you ensure scientific accuracy in AI recommendations?"}]	["Demo Veeva CRM integration", "Provide FDA compliance documentation", "Share pharma customer case studies"]	["MLR team demonstration next week", "Compliance documentation review", "Pilot proposal for oncology business unit"]	Dr. Collins: Our field reps are highly trained, but we're looking for ways to help them be more effective in their limited HCP interactions...	98	["Every minute with an HCP is precious - we need to maximize the impact of each interaction", "If you can integrate with our MLR workflow, that would be a game-changer", "The scientific accuracy aspect is critical - we can't have any off-label messaging"]	["FDA-compliant conversation intelligence for pharma", "Seamless Veeva CRM integration", "Maximize HCP engagement with AI-powered insights"]	["Emphasize compliance and scientific accuracy for pharma", "Lead with Veeva integration capabilities", "Offer MLR workflow integration as differentiator"]	["HCPs have limited time for sales interactions", "Compliance review slows content updates", "Reps struggle with complex scientific messaging", "Limited insights into HCP preferences", "Inconsistent messaging across channels"]	[]	{}	{}	completed	manual	2026-02-22 07:50:17.403	2026-02-22 07:50:17.731715
83d06e29-e19f-46c2-91f2-6e19fbd83115	2f307d95-0a14-4a82-9eb2-010120fcf304	2725115a-1587-4a77-9a82-c8017e13971c	Jennifer Wright	Amazon	E-commerce & Cloud	2025-12-15 16:00:00	65	Strategic discussion with Amazon AWS enterprise sales leadership about deploying conversation intelligence across their B2B sales teams. High interest in scale and AWS integration.	["AWS integration opportunities", "Global sales team deployment", "Real-time coaching at scale", "Data sovereignty across regions", "Competitive win/loss analysis"]	["Sales cycles becoming longer and more complex", "Difficulty tracking competitive dynamics in real-time", "Inconsistent discovery processes across teams", "Limited visibility into deal progression signals", "New product launch messaging inconsistency"]	["Native AWS infrastructure deployment", "Support for 25,000+ sales reps globally", "Real-time competitive intelligence", "Integration with internal tools and Salesforce", "Multi-region data processing"]	["Rev Winner Enterprise on AWS", "Global multi-region deployment", "Real-time competitive intelligence module", "Custom Salesforce and internal tool integrations"]	["Gong", "Clari", "People.ai"]	[{"outcome": "Interested in integration architecture session", "response": "Rev Winner is designed to complement, not replace. We've successfully integrated with custom internal tools at other hyperscalers.", "objection": "We already have significant investments in internal tools"}, {"outcome": "Requested case study from similar scale deployment", "response": "We've architected for hyperscale from day one. Our largest customer processes 3M+ conversations monthly without performance degradation.", "objection": "How do you handle our scale of 25,000+ reps?"}]	["Prepare AWS-native architecture proposal", "Share hyperscale customer case study", "Schedule integration architecture workshop"]	["Technical architecture workshop next month", "Pilot proposal for AWS enterprise sales team", "Executive sponsor meeting"]	Jennifer: Thanks for making time. We're looking at how to better enable our sales teams as we continue to scale...	203	["Scale is non-negotiable - if you can't handle 25,000 reps, we can't consider you", "Real-time competitive intelligence is increasingly critical for our enterprise deals", "We need something that works with our existing investments, not replaces them"]	["Hyperscale-ready: 25,000+ reps supported", "AWS-native deployment for maximum performance", "Real-time competitive intelligence for enterprise deals"]	["Lead with scale capabilities for large enterprises", "Emphasize complementary rather than replacement approach", "Prepare detailed architecture for hyperscale requirements"]	["Sales cycles becoming longer and more complex", "Difficulty tracking competitive dynamics in real-time", "Inconsistent discovery processes across teams", "Limited visibility into deal progression signals", "New product launch messaging inconsistency"]	[]	{}	{}	completed	manual	2026-02-22 07:50:18.65	2026-02-22 07:50:18.995905
c52fcf84-3182-4fce-ad27-ffdef346e82c	37fdc00d-a51f-4594-8578-7e9a5790ff92	41c6749d-0385-4445-b3bc-e36f76c4191e	Michael Thompson	Uber	Transportation & Technology	2025-12-18 13:00:00	45	Discovery call with Uber's B2B sales team focused on Uber for Business and Uber Freight sales optimization. Interest in reducing sales cycle time and improving win rates.	["B2B sales cycle optimization", "Freight sales enablement", "Enterprise deal tracking", "Competitive positioning against Lyft Business", "Multi-product sales coordination"]	["Long enterprise sales cycles (6-9 months)", "Complex multi-product deals hard to track", "Inconsistent messaging across Uber for Business and Freight", "Limited visibility into deal health", "Competitive pressure from Lyft Business"]	["Integration with Salesforce", "Multi-product deal tracking", "Competitive intelligence dashboard", "Mobile-first experience for field reps", "Real-time deal health scoring"]	["Rev Winner Pro with competitive intelligence", "Custom multi-product deal tracking", "Mobile-optimized coaching", "Real-time deal health analytics"]	["Gong", "Chorus.ai", "SalesLoft"]	[{"outcome": "Requested mobile app demo", "response": "Our mobile experience is designed for field sales. Reps can access coaching, competitive intel, and deal insights right from their phones.", "objection": "Our field reps are always on the go - desktop solutions don't work for us"}]	["Schedule mobile app demonstration", "Prepare multi-product deal tracking demo", "Share transportation industry case studies"]	["Mobile app demo next week", "Pilot proposal for Uber Freight team", "Competitive intelligence workshop"]	Michael: Our B2B sales teams are growing fast and we need better tools to help them win more deals...	112	["Shortening our sales cycle from 9 months to 6 would be a massive win", "Mobile-first is essential - our reps are never at their desks", "The multi-product tracking is really interesting for our complex deals"]	["Reduce enterprise sales cycles by 30%", "Mobile-first sales enablement for field teams", "Multi-product deal intelligence"]	["Lead with mobile capabilities for field sales teams", "Emphasize sales cycle reduction ROI", "Demonstrate multi-product deal tracking"]	["Long enterprise sales cycles (6-9 months)", "Complex multi-product deals hard to track", "Inconsistent messaging across Uber for Business and Freight", "Limited visibility into deal health", "Competitive pressure from Lyft Business"]	[]	{}	{}	completed	manual	2026-02-22 07:50:19.777	2026-02-22 07:50:20.108735
3617c712-c5ba-47fc-899d-602ae18f2240	12f76f98-4d14-484d-a148-43f98383ea63	6224f73c-f462-48a1-8ea8-d1ea739b6412	Patricia Lee	Dell Technologies	Technology Hardware	2025-12-01 10:00:00	50	Strategic conversation with Dell's channel sales leadership about improving partner sales enablement. Focus on empowering 50,000+ channel partners with AI-driven insights.	["Channel partner enablement", "Partner training and certification", "Deal registration tracking", "Competitive positioning against HP and Lenovo", "Partner performance analytics"]	["50,000+ channel partners with inconsistent training", "Partner messaging often off-brand", "Limited visibility into partner sales conversations", "Competitive losses to HP on similar deals", "Partner certification tracking is manual"]	["Partner portal integration", "White-label capabilities", "Certification tracking and automation", "Competitive battle cards for partners", "Partner performance dashboards"]	["Rev Winner Channel Partner Edition", "White-label partner coaching platform", "Integrated certification tracking", "AI-powered competitive battle cards"]	["Impartner", "Zift Solutions", "Salesforce PRM"]	[{"outcome": "Interest in portal integration demo", "response": "We integrate directly into your existing partner portal. Partners access coaching and insights where they already work.", "objection": "Our partners won't adopt another tool"}]	["Demo partner portal integration", "Prepare white-label proposal", "Share channel partner case studies"]	["Partner portal integration review", "Pilot with top 100 partners", "White-label branding workshop"]	Patricia: Our channel business is critical, but we struggle to ensure our partners are as effective as our direct sales team...	145	["If we could bring our top partners to the level of our direct team, it would be transformational", "Integration with our existing portal is critical - partners won't log into another system", "The competitive battle cards would be huge for our partners"]	["Enable 50,000+ channel partners with AI coaching", "White-label platform for your brand", "Embedded in your existing partner portal"]	["Emphasize integration over standalone tools for channel", "Offer white-label to preserve brand experience", "Lead with partner adoption strategies"]	["50,000+ channel partners with inconsistent training", "Partner messaging often off-brand", "Limited visibility into partner sales conversations", "Competitive losses to HP on similar deals", "Partner certification tracking is manual"]	[]	{}	{}	completed	manual	2026-02-22 07:50:20.802	2026-02-22 07:50:21.142342
2d3686e5-e772-4a85-834b-e5397d7b1f02	ca854738-c55d-4647-911e-d6a539ab1b51	b9c6ae69-a181-40fa-989f-6161953cc419	David Chen	IBM	Technology & Consulting	2025-11-28 14:00:00	55	Deep-dive with IBM's consulting sales leadership on complex solution selling challenges. Interest in AI-powered proposal assistance and deal strategy insights.	["Complex solution sales methodology", "Multi-stakeholder deal management", "Proposal automation and assistance", "Consulting engagement optimization", "Cross-sell/upsell identification"]	["Complex deals with 10+ stakeholders", "Proposal creation takes weeks", "Inconsistent solution positioning", "Missed cross-sell opportunities in existing accounts", "Long sales cycles (12-18 months)"]	["Stakeholder mapping and tracking", "AI-powered proposal assistance", "Solution configurator integration", "Account planning capabilities", "Integration with existing CRM"]	["Rev Winner Enterprise with Deal Strategy module", "AI proposal assistant", "Stakeholder influence mapping", "Cross-sell recommendation engine"]	["Gong", "Clari", "Conga"]	[{"outcome": "Interested in customization capabilities", "response": "We train our AI on your solution portfolio and methodology. The system learns your specific language and positioning.", "objection": "Our solutions are too complex for AI to understand"}, {"outcome": "Requested deal strategy demo", "response": "For long cycles, our deal strategy module provides ongoing deal health monitoring and stakeholder engagement tracking throughout the process.", "objection": "18-month sales cycles are our reality - how can you help?"}]	["Demo deal strategy and stakeholder mapping", "Prepare proposal assistant demo", "Share enterprise consulting case studies"]	["Deal strategy module demonstration", "Proposal assistant pilot proposal", "Account planning workshop"]	David: Our sales cycles are incredibly complex - we're talking about deals that can take 18 months with dozens of stakeholders...	178	["If we could cut proposal time from weeks to days, it would free our teams to focus on selling", "Stakeholder mapping is where deals often get lost - we need better visibility", "Cross-sell identification is leaving money on the table with our existing accounts"]	["Navigate complex deals with AI-powered stakeholder mapping", "Reduce proposal time from weeks to days", "Identify cross-sell opportunities in existing accounts"]	["Address solution complexity with customization options", "Emphasize long-cycle deal management capabilities", "Lead with stakeholder visibility benefits"]	["Complex deals with 10+ stakeholders", "Proposal creation takes weeks", "Inconsistent solution positioning", "Missed cross-sell opportunities in existing accounts", "Long sales cycles (12-18 months)"]	[]	{}	{}	completed	manual	2026-02-22 07:50:22.029	2026-02-22 07:50:22.361295
6f7a5a2f-1ad3-46a7-80dd-af83c464bc20	6727df01-4c56-49cf-a511-4fb730640f44	f6ab6d54-87da-4f60-89ca-a9840d81894f	Lisa Park	Oracle	Enterprise Software	2025-11-25 11:00:00	45	Initial discovery with Oracle's cloud sales organization. Focus on accelerating cloud adoption messaging and competitive positioning against AWS and Azure.	["Cloud adoption sales enablement", "Competitive messaging against AWS/Azure", "Database to cloud migration positioning", "Enterprise license optimization", "Sales rep productivity"]	["Cloud messaging is inconsistent across teams", "Reps struggle with AWS/Azure competitive objections", "Legacy database customers need cloud migration messaging", "Complex pricing/licensing requires expert positioning", "New cloud products launching faster than training can keep up"]	["Competitive intelligence for AWS and Azure", "Product launch enablement workflows", "Integration with Oracle systems", "Multi-language support for global teams", "Just-in-time learning capabilities"]	["Rev Winner with competitive intelligence module", "Rapid product launch enablement", "Just-in-time coaching for new products", "Oracle systems integration"]	["Gong", "Highspot", "Seismic"]	[{"outcome": "Requested integration roadmap", "response": "We're building native Oracle Cloud integration and can work with your systems. Our API-first architecture allows flexible integration.", "objection": "We need solutions that work with our Oracle systems"}]	["Provide Oracle integration roadmap", "Demo competitive intelligence module", "Share cloud sales case studies"]	["Integration architecture discussion", "Competitive intelligence pilot proposal", "Product launch enablement workshop"]	Lisa: Our cloud business is growing fast, but our sales teams need better support to compete with AWS and Azure...	123	["Our reps need instant access to competitive responses - they can't wait for training updates", "Product launches are outpacing our ability to train the field", "Integration with our Oracle systems is essential"]	["Win against AWS and Azure with real-time competitive intelligence", "Just-in-time coaching for rapid product launches", "Native Oracle Cloud integration"]	["Lead with competitive intelligence for cloud sellers", "Emphasize just-in-time learning for fast-paced environments", "Address integration requirements upfront"]	["Cloud messaging is inconsistent across teams", "Reps struggle with AWS/Azure competitive objections", "Legacy database customers need cloud migration messaging", "Complex pricing/licensing requires expert positioning", "New cloud products launching faster than training can keep up"]	[]	{}	{}	completed	manual	2026-02-22 07:50:23.257	2026-02-22 07:50:23.597489
f2782bf8-1e86-4c41-b8fd-fc718c31bffe	54e47860-4096-4f43-8cd2-cb02e98b085d	3d89fd8c-8914-4b74-9fa1-f0780b0f25cc	Rachel Green	Accenture	Consulting	2025-11-20 09:00:00	60	Strategic discussion with Accenture's managed services sales team. Interest in improving managed services deal management and long-term relationship selling.	["Managed services sales optimization", "Long-term contract relationship management", "Value realization tracking", "Renewal optimization", "Executive relationship mapping"]	["Multi-year deals require ongoing relationship management", "Value realization communication is inconsistent", "Renewal conversations start too late", "Executive sponsor changes derail deals", "Cross-practice coordination is challenging"]	["Relationship health monitoring", "Value realization tracking and communication", "Early renewal warning system", "Executive sponsor change alerts", "Cross-practice collaboration tools"]	["Rev Winner Relationship Intelligence module", "Value realization dashboard", "Proactive renewal management", "Executive sponsor tracking"]	["Gainsight", "ChurnZero", "Gong"]	[{"outcome": "Interest in integration architecture", "response": "Rev Winner complements customer success tools by focusing on the sales conversation intelligence that feeds into relationship health. We integrate with Gainsight and similar platforms.", "objection": "We have a customer success platform already"}]	["Demo relationship intelligence module", "Prepare Gainsight integration overview", "Share consulting customer case studies"]	["Relationship intelligence demo", "Customer success integration workshop", "Pilot proposal for managed services team"]	Rachel: Our managed services business relies on long-term relationships, but we struggle to systematically track relationship health...	167	["Renewals shouldn't be a last-minute panic - we need ongoing relationship monitoring", "When executive sponsors change, we often lose the institutional knowledge of the relationship", "Cross-practice coordination is where we lose opportunities"]	["Proactive relationship health monitoring for managed services", "Never miss a renewal with early warning system", "Track executive sponsor changes in real-time"]	["Emphasize relationship management for managed services", "Position as complement to customer success tools", "Lead with renewal optimization benefits"]	["Multi-year deals require ongoing relationship management", "Value realization communication is inconsistent", "Renewal conversations start too late", "Executive sponsor changes derail deals", "Cross-practice coordination is challenging"]	[]	{}	{}	completed	manual	2026-02-22 07:50:24.388	2026-02-22 07:50:24.717167
6d3ccc9a-85c3-4a28-b62b-f9e64dfc944f	0747e1a9-6617-4fd3-82dd-24a6b92088b9	34819d7a-3880-4674-875d-2f6c0e9c3d06	Kevin Zhang	Meta	Technology & Advertising	2025-11-18 15:00:00	40	Discovery with Meta's advertising sales team focused on improving large advertiser relationship management and campaign optimization selling.	["Large advertiser relationship management", "Campaign performance conversation quality", "Upsell and expansion opportunities", "Competitive positioning against Google Ads", "Creative strategy selling"]	["Large advertisers need more strategic conversations", "Campaign performance discussions are reactive", "Missing expansion opportunities in existing accounts", "Competition from Google Ads intensifying", "Creative strategy recommendations inconsistent"]	["Strategic conversation frameworks", "Performance-based coaching prompts", "Expansion opportunity identification", "Competitive messaging for Google Ads", "Creative strategy templates"]	["Rev Winner for Advertising Sales", "Performance conversation intelligence", "Account expansion radar", "Competitive messaging library"]	["Gong", "SalesLoft", "Outreach"]	[{"outcome": "Interest in advertising-specific customization", "response": "We've worked with advertising sales teams and understand the campaign-centric selling model. Our system can be customized for performance-based conversations.", "objection": "Our sales model is unique to advertising - how do you handle that?"}]	["Prepare advertising sales customization proposal", "Demo account expansion features", "Share advertising customer references"]	["Customization workshop for advertising sales", "Pilot proposal for large advertiser team", "Competitive messaging development"]	Kevin: Our large advertiser relationships require a different kind of selling - it's very performance and ROI focused...	98	["Every conversation should be about how we're driving their business results", "We're leaving expansion dollars on the table because we don't identify opportunities early enough", "Google Ads competition is real - we need better competitive messaging"]	["Transform advertising sales with performance-focused AI coaching", "Identify expansion opportunities in every conversation", "Win against Google Ads with real-time competitive intelligence"]	["Customize for advertising-specific sales models", "Emphasize ROI and performance focus", "Lead with expansion opportunity identification"]	["Large advertisers need more strategic conversations", "Campaign performance discussions are reactive", "Missing expansion opportunities in existing accounts", "Competition from Google Ads intensifying", "Creative strategy recommendations inconsistent"]	[]	{}	{}	completed	manual	2026-02-22 07:50:25.51	2026-02-22 07:50:25.838472
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conversations (id, session_id, user_id, client_name, status, discovery_insights, call_summary, created_at, transcription_started_at, ended_at) FROM stdin;
e529b5a6-69dc-4e06-aea9-577925d869a9	marketing-test-8f57f6f8-e492-489e-8606-123e46b6ed8c	0563a78b-2777-4083-ab62-6c6f4ea666a1	Sarah Chen	ended	{}	\N	2026-02-22 07:50:12.612	\N	\N
42a23871-6e5a-46eb-b718-d40492b3a18f	marketing-test-6c4c1729-989c-44c6-a44f-2865f8bdab98	0563a78b-2777-4083-ab62-6c6f4ea666a1	James Rodriguez	ended	{}	\N	2026-02-22 07:50:13.223	\N	\N
4d01f80b-2a8a-42e8-adf9-955019f54ee4	marketing-test-2ca37c60-9c92-4049-b717-0909edbc9247	fce3d9ab-b9a7-4dbb-be1f-6eb8d5c026bb	Maria Santos	ended	{}	\N	2026-02-22 07:50:14.557	\N	\N
f55a2f56-1c0c-44d2-b3bf-1bc89b4b853c	marketing-test-28d777b3-81e4-49c7-9055-05163dea8b0f	18a2d6a8-decd-4e0e-8b3c-de5c97a967d6	Robert Kim	ended	{}	\N	2026-02-22 07:50:15.789	\N	\N
7d463f2a-ec0b-47eb-bd1a-a0095dd14725	marketing-test-5c7f067e-5e3c-4bcb-9f32-fcb357114821	3596e399-223d-419a-b9e3-58aa9ea6b063	Dr. Amanda Collins	ended	{}	\N	2026-02-22 07:50:17.117	\N	\N
2f307d95-0a14-4a82-9eb2-010120fcf304	marketing-test-7b2557fe-52d9-47c5-bf73-0d2d71f008b5	2725115a-1587-4a77-9a82-c8017e13971c	Jennifer Wright	ended	{}	\N	2026-02-22 07:50:18.345	\N	\N
37fdc00d-a51f-4594-8578-7e9a5790ff92	marketing-test-99078095-96c0-49ff-b554-06dd5ad64d6a	41c6749d-0385-4445-b3bc-e36f76c4191e	Michael Thompson	ended	{}	\N	2026-02-22 07:50:19.572	\N	\N
12f76f98-4d14-484d-a148-43f98383ea63	marketing-test-b8155aa6-e7c7-4f9a-8001-c5072ac0dcf0	6224f73c-f462-48a1-8ea8-d1ea739b6412	Patricia Lee	ended	{}	\N	2026-02-22 07:50:20.514	\N	\N
ca854738-c55d-4647-911e-d6a539ab1b51	marketing-test-07192dcb-a32d-4241-9eb3-f82bf74c61e6	b9c6ae69-a181-40fa-989f-6161953cc419	David Chen	ended	{}	\N	2026-02-22 07:50:21.723	\N	\N
6727df01-4c56-49cf-a511-4fb730640f44	marketing-test-f4c61eec-b6de-4ef1-8034-d76bbd1b10a1	f6ab6d54-87da-4f60-89ca-a9840d81894f	Lisa Park	ended	{}	\N	2026-02-22 07:50:22.951	\N	\N
54e47860-4096-4f43-8cd2-cb02e98b085d	marketing-test-13f215a9-227f-4eda-948a-4ae05423c4ed	3d89fd8c-8914-4b74-9fa1-f0780b0f25cc	Rachel Green	ended	{}	\N	2026-02-22 07:50:24.179	\N	\N
0747e1a9-6617-4fd3-82dd-24a6b92088b9	marketing-test-162eafc3-0583-456a-91cd-85f337ae0989	34819d7a-3880-4674-875d-2f6c0e9c3d06	Kevin Zhang	ended	{}	\N	2026-02-22 07:50:25.203	\N	\N
2130eb6c-b369-47b0-bb1a-161c9aa577f8	session_1771746675552_qlqurfxla	c2af625b-64b0-43be-b9c0-a233115deba5	\N	active	{}	\N	2026-02-22 07:51:15.577	2026-02-22 07:52:45.557	\N
798ce7ce-1775-42c4-bd5c-695bdca83d4b	session_1771752800226_tx027vgki	2cddba37-2b80-46f8-893f-a6622cce384c	\N	active	{}	\N	2026-02-22 09:33:20.248	2026-02-22 09:33:46.206	\N
94843b28-6851-4022-bd18-ee51103f5446	session_1771753095366_bjpwjhxub	2cddba37-2b80-46f8-893f-a6622cce384c	\N	active	{}	\N	2026-02-22 09:38:15.372	\N	\N
998acd3d-29db-4e46-b32b-bcf4b9e767e6	session_1771753294269_7np0eie26	2cddba37-2b80-46f8-893f-a6622cce384c	\N	active	{}	\N	2026-02-22 09:41:34.273	\N	\N
7832fd92-1463-4439-bbb3-1f3b556c4da8	session_1771753306945_lc97dxhr7	2cddba37-2b80-46f8-893f-a6622cce384c	\N	active	{}	\N	2026-02-22 09:41:46.958	\N	\N
32871725-48ce-493e-b12b-d0ec5491bd8d	session_1771753332312_qtz8tncng	2cddba37-2b80-46f8-893f-a6622cce384c	\N	active	{}	\N	2026-02-22 09:42:12.316	\N	\N
d81baaf0-8794-4dba-9f81-be371ca3c37d	session_1771753396295_c8xwdjsv0	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	active	{}	\N	2026-02-22 09:43:16.298	\N	\N
98cdf599-00e1-4078-8a9b-7e8b4f144996	session_1771753884916_swjgm27l9	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	active	{}	\N	2026-02-22 09:51:24.937	2026-02-22 09:51:41.344	\N
b11cb84e-8167-4319-a449-0aa678536b1c	session_1771754512854_e465ksf45	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	active	{}	\N	2026-02-22 10:01:52.86	2026-02-22 10:02:09.402	\N
28e57870-4f50-47f6-baaf-d4b8a82f83b4	session_1771756481546_iutapl0kw	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	active	{}	\N	2026-02-22 10:34:41.553	2026-02-22 10:34:58.499	\N
073a3365-cd19-4aa3-9218-a59dd0d203ad	session_1771760969926_718krsdbu	d637844e-1170-4291-b786-d9ad4242e34e	\N	active	{}	\N	2026-02-22 11:49:29.932	\N	\N
49c6dc38-351e-42f7-81ac-5d8fc629b705	session_1771762866428_awgn251j6	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	active	{}	\N	2026-02-22 12:21:06.433	\N	\N
f2e92b96-c414-4128-b527-383abb275b4e	session_1771763205175_v9vqopd3o	86401085-206e-405e-87eb-e2a77b146d27	\N	active	{}	\N	2026-02-22 12:26:45.187	\N	\N
741c789d-1a28-4e96-aad1-9c618d5a7f71	session_1771763546419_rhvqblz84	86401085-206e-405e-87eb-e2a77b146d27	\N	active	{}	\N	2026-02-22 12:32:26.431	\N	\N
c7670aa2-392d-43c9-8b7f-32b0aa369538	session_1771764347711_ox98wjq5p	\N	\N	active	{}	\N	2026-02-22 12:45:47.719	\N	\N
8e993bbe-8674-4112-8cad-320de9c89a0e	session_1771764356365_r3jh2gzkg	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	active	{}	\N	2026-02-22 12:45:56.416	\N	\N
06cf4ffe-d6b0-4cb7-bc06-9f50630f6489	session_1771764629398_092i5kydk	3d28d643-6a20-449a-be67-091421899890	\N	active	{}	\N	2026-02-22 12:50:29.402	\N	\N
\.


--
-- Data for Name: domain_expertise; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.domain_expertise (id, user_id, name, description, company_domain, is_shared, is_active, created_at, updated_at) FROM stdin;
0688e5b5-1dbc-4b89-86ce-47f10d69be21	82cb8c83-fc1b-4fa3-b87d-990418225797	xyz	\N	\N	f	t	2026-02-22 10:14:01.202273	2026-02-22 10:14:01.202273
\.


--
-- Data for Name: enterprise_user_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enterprise_user_assignments (id, user_id, license_package_id, assigned_by, assigned_at, status, train_me_enabled, dai_enabled, notes, created_at, updated_at, organization_id, user_email, activation_token, activation_token_expires_at, activated_at, revoked_by, revoked_at) FROM stdin;
\.


--
-- Data for Name: gateway_providers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gateway_providers (id, provider_name, is_active, is_default, configuration, created_at, updated_at) FROM stdin;
b8cc4d1c-633d-4441-bc61-ec356427825a	razorpay	t	t	{"mode": "test"}	2026-02-22 06:45:57.672928	2026-02-22 07:38:16.693174
\.


--
-- Data for Name: gateway_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gateway_transactions (id, provider_id, provider_transaction_id, transaction_type, status, amount, currency, user_id, organization_id, related_entity, related_entity_id, payload, metadata, created_at) FROM stdin;
c00830b1-c5cf-4e31-8fee-f3f541b3e84b	b8cc4d1c-633d-4441-bc61-ec356427825a	order_SJ9MDDYMpezh7W	order	created	90.00	USD	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	\N	\N	{}	{"itemCount": 3, "checkoutType": "cart", "roundoffAmount": 0, "originalCurrency": "USD"}	2026-02-22 09:57:22.134724
c9dd69f7-bf67-475f-b518-a77e2480ed86	b8cc4d1c-633d-4441-bc61-ec356427825a	pay_SJ9OD4KQboFtlU	payment	completed	90.00	USD	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	cart_checkout	\N	{"orderId": "66f15a24-40f2-4e37-a37a-551660b0405a", "cartItems": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "10", "packageSku": "f4fdc254-fe49-4de7-890a-0a703418609d", "companyName": null, "packageName": "DAI Lite (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"totalUnits": 5000, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "80", "packageSku": "ac84f933-15d3-4ff2-9a27-8b60c0f1858b", "companyName": null, "packageName": "5000 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "platform_access", "basePrice": "149", "packageSku": "61a2e346-c35f-4395-8996-b3c4cfe8fcd8", "companyName": null, "packageName": "3 Months Plan", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "gatewayProvider": "razorpay"}	{"orderId": "66f15a24-40f2-4e37-a37a-551660b0405a", "itemCount": 3, "cartCheckout": true}	2026-02-22 09:59:38.703834
8b7417b7-908c-4c37-a344-c0b1bee2da12	b8cc4d1c-633d-4441-bc61-ec356427825a	order_SJ9TBFWvTal8Ej	order	created	20.00	USD	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	\N	\N	{}	{"itemCount": 1, "checkoutType": "cart", "roundoffAmount": 0, "originalCurrency": "USD"}	2026-02-22 10:03:57.915434
2f85c001-4c04-48f5-8606-d170aa008939	b8cc4d1c-633d-4441-bc61-ec356427825a	pay_SJ9TRn7A4SMhqq	payment	completed	20.00	USD	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	cart_checkout	\N	{"orderId": "264d5544-3d31-4141-80ca-33327fcacdf0", "cartItems": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "gatewayProvider": "razorpay"}	{"orderId": "264d5544-3d31-4141-80ca-33327fcacdf0", "itemCount": 1, "cartCheckout": true}	2026-02-22 10:04:33.185282
5d2de2b2-d5cb-4bb8-a8f4-58b067d1bd3b	b8cc4d1c-633d-4441-bc61-ec356427825a	order_SJ9ghHyCRDidu2	order	created	20.00	USD	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	\N	\N	{}	{"itemCount": 1, "checkoutType": "cart", "roundoffAmount": 0, "originalCurrency": "USD"}	2026-02-22 10:16:45.648532
669f62da-3e96-415f-84e1-67154b2c03cf	b8cc4d1c-633d-4441-bc61-ec356427825a	pay_SJ9gyxxk1H1Yry	payment	completed	20.00	USD	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	cart_checkout	\N	{"orderId": "1dc460f0-46b5-439d-ad9d-3743775976a4", "cartItems": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "gatewayProvider": "razorpay"}	{"orderId": "1dc460f0-46b5-439d-ad9d-3743775976a4", "itemCount": 1, "cartCheckout": true}	2026-02-22 10:17:26.65425
34a276c0-fd05-4dd2-a800-66ea56642c91	b8cc4d1c-633d-4441-bc61-ec356427825a	order_SJ9t93NTkYkykR	order	created	16.00	USD	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	\N	\N	{}	{"itemCount": 1, "checkoutType": "cart", "roundoffAmount": 0, "originalCurrency": "USD"}	2026-02-22 10:28:32.681819
dead44b4-7942-4691-bb53-c200bf22134a	b8cc4d1c-633d-4441-bc61-ec356427825a	pay_SJ9tQbrJkFwOCp	payment	completed	16.00	USD	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	cart_checkout	\N	{"orderId": "f922f1e7-3913-4f7e-894a-ea0689e88336", "cartItems": [{"currency": "USD", "metadata": {"totalUnits": 1000, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "16", "packageSku": "f19e48b0-2bbc-4a75-9d0e-73afa53b09d3", "companyName": null, "packageName": "1000 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "gatewayProvider": "razorpay"}	{"orderId": "f922f1e7-3913-4f7e-894a-ea0689e88336", "itemCount": 1, "cartCheckout": true}	2026-02-22 10:29:10.032828
ade26f82-1c16-4b6b-920c-e1598cce9c9d	b8cc4d1c-633d-4441-bc61-ec356427825a	order_SJ9v0YK1sBWzfM	order	created	8.00	USD	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	\N	\N	{}	{"itemCount": 1, "checkoutType": "cart", "roundoffAmount": 0, "originalCurrency": "USD"}	2026-02-22 10:30:18.465377
4be78e64-50cb-41a9-9303-4591b708b387	b8cc4d1c-633d-4441-bc61-ec356427825a	pay_SJ9vEViA98UaKU	payment	completed	8.00	USD	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	cart_checkout	\N	{"orderId": "27413e0f-6cdf-4fb1-b649-bb6c71018807", "cartItems": [{"currency": "USD", "metadata": {"totalUnits": 500, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "8", "packageSku": "16b59eb6-e3cb-4235-9a53-df3315c4ed24", "companyName": null, "packageName": "500 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "gatewayProvider": "razorpay"}	{"orderId": "27413e0f-6cdf-4fb1-b649-bb6c71018807", "itemCount": 1, "cartCheckout": true}	2026-02-22 10:31:11.655154
9535f35a-68bf-4cbb-a79f-eb83abdc6805	b8cc4d1c-633d-4441-bc61-ec356427825a	order_SJBhDIEatdWRK9	order	created	667.00	USD	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	\N	\N	{}	{"itemCount": 4, "checkoutType": "cart", "roundoffAmount": 0, "originalCurrency": "USD"}	2026-02-22 12:14:38.234977
697a3a1f-81e1-4f2b-8b05-f7b9fb2e222a	b8cc4d1c-633d-4441-bc61-ec356427825a	order_SJBvpXQec5zWUz	order	created	177.00	USD	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	\N	\N	{}	{"itemCount": 3, "checkoutType": "cart", "roundoffAmount": 0, "originalCurrency": "USD"}	2026-02-22 12:28:28.444315
22107c36-6460-46d2-944f-fc78f3f5c3c6	b8cc4d1c-633d-4441-bc61-ec356427825a	pay_SJBw2LZIepfbFI	payment	completed	177.00	USD	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	cart_checkout	\N	{"orderId": "b2ccf1ef-8ebd-4438-bbd1-efa4813fa4c2", "cartItems": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": "Student", "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "team", "teamManagerName": "kunal deepak patil", "teamManagerEmail": "jyhazexy@denipl.net"}, {"currency": "USD", "metadata": {"totalUnits": 500, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "8", "packageSku": "16b59eb6-e3cb-4235-9a53-df3315c4ed24", "companyName": "Student", "packageName": "500 Minutes Package", "purchaseMode": "team", "teamManagerName": "kunal deepak patil", "teamManagerEmail": "jyhazexy@denipl.net"}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "platform_access", "basePrice": "149", "packageSku": "61a2e346-c35f-4395-8996-b3c4cfe8fcd8", "companyName": "Student", "packageName": "3 Months Plan", "purchaseMode": "team", "teamManagerName": "kunal deepak patil", "teamManagerEmail": "jyhazexy@denipl.net"}], "gatewayProvider": "razorpay"}	{"orderId": "b2ccf1ef-8ebd-4438-bbd1-efa4813fa4c2", "itemCount": 3, "cartCheckout": true}	2026-02-22 12:29:54.391841
e607082a-32b8-41c3-b79e-c33e9afb59cd	b8cc4d1c-633d-4441-bc61-ec356427825a	order_SJCEaCTvlTzkGs	order	created	80.00	USD	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	\N	\N	{}	{"itemCount": 1, "checkoutType": "cart", "roundoffAmount": 0, "originalCurrency": "USD"}	2026-02-22 12:46:13.567301
87b66d5c-4a7c-412b-a687-970f5bae7e64	b8cc4d1c-633d-4441-bc61-ec356427825a	pay_SJCEnFqcNyjUxn	payment	completed	80.00	USD	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	cart_checkout	\N	{"orderId": "407b7ec0-12d8-4540-931c-9f428638899e", "cartItems": [{"currency": "USD", "metadata": {"totalUnits": 5000, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "80", "packageSku": "ac84f933-15d3-4ff2-9a27-8b60c0f1858b", "companyName": null, "packageName": "5000 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "gatewayProvider": "razorpay"}	{"orderId": "407b7ec0-12d8-4540-931c-9f428638899e", "itemCount": 1, "cartCheckout": true}	2026-02-22 12:46:45.138681
12a90866-3d51-491b-a074-5a30247820df	b8cc4d1c-633d-4441-bc61-ec356427825a	order_SJCFmCnKUTbyI3	order	created	244.00	USD	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	\N	\N	{}	{"itemCount": 3, "checkoutType": "cart", "roundoffAmount": 0, "originalCurrency": "USD"}	2026-02-22 12:47:21.385985
0c0b308c-07b2-4eb9-a8c5-1062843fe8c8	b8cc4d1c-633d-4441-bc61-ec356427825a	pay_SJCFzAYjELt0BD	payment	completed	244.00	USD	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	cart_checkout	\N	{"orderId": "0f95d78e-5d8d-44df-81cd-7ed79ed0d713", "cartItems": [{"currency": "USD", "metadata": {"totalUnits": 1500, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "24", "packageSku": "0297d197-2c45-410e-ad94-4ec73e77c79b", "companyName": null, "packageName": "1500 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "200", "packageSku": "f92de33c-cf9b-45ff-951b-9b576a2aed41", "companyName": null, "packageName": "DAI Enterprise (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "gatewayProvider": "razorpay"}	{"orderId": "0f95d78e-5d8d-44df-81cd-7ed79ed0d713", "itemCount": 3, "cartCheckout": true}	2026-02-22 12:47:52.553676
\.


--
-- Data for Name: gateway_webhooks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gateway_webhooks (id, provider_id, event_type, payload, signature, verified, processed, processed_at, error_message, created_at) FROM stdin;
\.


--
-- Data for Name: knowledge_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.knowledge_entries (id, domain_expertise_id, user_id, category, title, content, details, keywords, source_document_ids, content_hash, embedding, confidence, is_verified, usage_count, created_at, updated_at) FROM stdin;
061913f2-66cf-4e95-b30f-181577abfa85	0688e5b5-1dbc-4b89-86ce-47f10d69be21	82cb8c83-fc1b-4fa3-b87d-990418225797	process	Contractor Application Submission Process	The contractor, Mr. Prajwal Atmaram Bhide, has submitted a formal application and technical proposal document in response to a tender issued by the Water Supply and Sanitation Department for water infrastructure development work. The submission includes a cover letter confirming thorough review of the tender document and possession of required technical expertise, skilled manpower, equipment, and financial capability. The contractor assures adherence to all departmental guidelines, safety standards, and quality requirements. The application is dated 19 February 2026 and includes the contractor's signature. The document spans two pages and is structured to provide comprehensive details about the contractor's profile, project understanding, scope of work, execution strategy, equipment, manpower, timeline, and safety measures. This submission represents a formal bid for the water infrastructure project, with the contractor declaring all information provided is true and agreeing to execute the project according to Water Department rules and regulations.	{"steps": ["Review tender document", "Prepare technical proposal", "Submit application with cover letter", "Include contractor profile and project details", "Sign and date declaration"], "tools": ["Excavators", "Trenching equipment", "Pipe cutting tools", "Welding machines", "Pumps", "Safety equipment"], "timeline": "Submission date: 19 February 2026", "processName": "Contractor Application Submission", "dependencies": ["Tender issuance by Water Supply and Sanitation Department"], "stakeholders": ["Contractor - Mr. Prajwal Atmaram Bhide", "Water Supply and Sanitation Department"], "documentation": ["Cover letter", "Contractor profile", "Project understanding", "Scope of work", "Execution strategy", "Equipment list", "Manpower deployment plan", "Project timeline", "Safety and quality assurance plan", "Declaration"], "prerequisites": ["Tender document from Water Supply and Sanitation Department", "Technical expertise in civil engineering", "Skilled manpower", "Equipment availability", "Financial capability"], "approvalLevels": ["Departmental review and approval"], "decisionCriteria": ["Adherence to departmental guidelines", "Safety standards compliance", "Quality requirements", "Technical expertise", "Financial capability"]}	{"contractor application","technical proposal","tender response","Water Supply and Sanitation Department","water infrastructure development","civil engineering","pipeline projects","Maharashtra India","Prajwal Atmaram Bhide","submission process","cover letter",declaration,"19 February 2026","departmental guidelines","safety standards","quality requirements","bid submission","infrastructure construction","project execution","contractor profile"}	{49fcaa0b-1d92-4471-887b-2976d8faddee}	318dae6c8e8717b76be8e17ab482d21cab3edd1442dfed00eb968a398df62068	\N	95	f	0	2026-02-22 10:34:12.849553	2026-02-22 10:34:12.849553
7fc40424-4986-49a5-af86-cdf058d37bfc	0688e5b5-1dbc-4b89-86ce-47f10d69be21	82cb8c83-fc1b-4fa3-b87d-990418225797	product	Water Infrastructure Development Project Scope	The project involves development, repair, and enhancement of water supply infrastructure to ensure efficient and uninterrupted water distribution to the public. The scope of work includes site survey and route planning, excavation and trench preparation, pipeline laying and installation, installation of valves and pump systems, and testing, commissioning, and final project handover. The execution strategy involves structured phases including planning, mobilization, execution, testing, and final inspection to ensure quality and timely completion. Equipment and machinery deployment includes excavators, trenching equipment, pipe cutting tools, welding machines, pumps, and safety equipment for efficient execution. Manpower deployment involves qualified site engineers, supervisors, skilled technicians, helpers, and safety officers to ensure smooth project completion. The estimated project completion duration is 50 days including planning, execution, testing, and final handover. Safety and quality assurance measures include strict adherence to safety protocols such as PPE usage, hazard monitoring, and quality inspections, with regular pipeline testing and quality verification.	{"benefits": ["Efficient water distribution", "Uninterrupted water supply to public", "Improved infrastructure reliability", "Enhanced water system performance", "Compliance with safety and quality standards"], "security": ["Safety protocols including PPE usage", "Hazard monitoring", "Regular quality inspections"], "useCases": ["Municipal water supply systems", "Pipeline installation projects", "Infrastructure repair and maintenance", "Pump system installations", "Water distribution network enhancements"], "compliance": ["Water Department rules and regulations", "Safety standards", "Quality requirements"], "deployment": ["On-site deployment of equipment and manpower", "Phased execution strategy"], "howItWorks": "The project follows a phased approach: planning, mobilization, execution, testing, and final inspection to develop, repair, and enhance water supply infrastructure.", "featureName": "Comprehensive Water Infrastructure Development", "limitations": ["Project duration limited to 50 days", "Dependent on equipment and manpower availability", "Subject to departmental guidelines and regulations"], "productName": "Water Infrastructure Development Project", "integrations": ["Water Supply and Sanitation Department systems", "Existing water infrastructure networks"], "requirements": ["Site survey completion", "Route planning", "Excavation and trench preparation", "Pipeline installation", "Valve and pump system installation"], "technicalSpecs": {"phases": ["planning", "mobilization", "execution", "testing", "final inspection"], "projectDuration": "50 days"}, "supportedPlatforms": ["Civil engineering infrastructure", "Water pipeline systems", "Pump and valve installations"]}	{"water infrastructure development","water supply infrastructure","water distribution","pipeline installation","infrastructure repair","infrastructure enhancement","site survey","route planning",excavation,"trench preparation","pipeline laying","valve installation","pump systems","testing and commissioning","project handover","execution strategy","phased approach","equipment deployment","manpower deployment","project timeline"}	{49fcaa0b-1d92-4471-887b-2976d8faddee}	0e76a7e636f54380a8940938a6f854756e0decd6ed5f58c3ca5553dc87a3cddc	\N	90	f	0	2026-02-22 10:34:13.07247	2026-02-22 10:34:13.07247
9182f391-29c0-42ae-9890-37296197d063	0688e5b5-1dbc-4b89-86ce-47f10d69be21	82cb8c83-fc1b-4fa3-b87d-990418225797	product	Contractor Profile and Expertise Details	The contractor is Mr. Prajwal Atmaram Bhide, operating as a Civil Engineering and Water Infrastructure Contractor based in Maharashtra, India. He has over 5 years of experience in civil works, pipeline projects, and infrastructure development. His expertise includes water pipeline installation, infrastructure construction, pump installation, and maintenance. The contractor confirms possession of required technical expertise, skilled manpower, equipment, and financial capability to execute the project successfully within the given timeframe. The business type is specifically civil engineering and water infrastructure contracting, indicating specialization in this sector. The location in Maharashtra, India, suggests local knowledge and potential familiarity with regional water infrastructure needs. The experience of 5+ years demonstrates a track record in similar projects, which may include previous work with water departments or municipal authorities. The expertise areas cover key aspects of water infrastructure projects, from pipeline installation to pump systems, ensuring comprehensive capability for the tender requirements.	{"benefits": ["Proven experience in civil works", "Specialization in water infrastructure", "Local knowledge in Maharashtra", "Comprehensive technical expertise", "Availability of skilled manpower and equipment"], "security": ["Adherence to safety standards", "Quality assurance measures"], "useCases": ["Water pipeline installation projects", "Infrastructure construction and repair", "Pump installation and maintenance", "Municipal water system development", "Tender responses for water departments"], "compliance": ["Water Department rules and regulations", "Industry standards for civil engineering"], "deployment": ["On-site project execution", "Mobilization of resources"], "howItWorks": "The contractor provides civil engineering and water infrastructure contracting services, leveraging 5+ years of experience and specialized expertise to execute projects.", "featureName": "Contractor Profile and Capabilities", "limitations": ["Geographically focused in Maharashtra, India", "Experience limited to 5+ years", "Dependent on project-specific requirements"], "productName": "Contractor Services", "integrations": ["Water Supply and Sanitation Department projects", "Local infrastructure networks"], "requirements": ["Technical expertise", "Skilled manpower", "Equipment availability", "Financial capability"], "technicalSpecs": {"location": "Maharashtra, India", "experience": "5+ years", "businessType": "Civil Engineering and Water Infrastructure Contractor"}, "supportedPlatforms": ["Civil engineering projects", "Water infrastructure systems"]}	{"contractor profile","Prajwal Atmaram Bhide","civil engineering contractor","water infrastructure contractor","Maharashtra India","5 years experience","civil works","pipeline projects","infrastructure development","water pipeline installation","infrastructure construction","pump installation",maintenance,"technical expertise","skilled manpower",equipment,"financial capability","business type","local contractor","specialized expertise"}	{49fcaa0b-1d92-4471-887b-2976d8faddee}	4090a870a38aa2f07ee871bc2e036b1a615abe860c70c6a65eb936403ecded24	\N	85	f	0	2026-02-22 10:34:13.295721	2026-02-22 10:34:13.295721
183d9b4b-80d2-4874-b79b-939c81f1ba0f	0688e5b5-1dbc-4b89-86ce-47f10d69be21	82cb8c83-fc1b-4fa3-b87d-990418225797	process	Project Execution and Safety Assurance Process	The execution strategy involves carrying out work in structured phases including planning, mobilization, execution, testing, and final inspection to ensure quality and timely completion. Equipment and machinery deployment includes excavators, trenching equipment, pipe cutting tools, welding machines, pumps, and safety equipment for efficient execution. Manpower deployment involves qualified site engineers, supervisors, skilled technicians, helpers, and safety officers to ensure smooth project completion. The project timeline estimates completion duration of 50 days including planning, execution, testing, and final handover. Safety and quality assurance measures include strict adherence to safety protocols such as PPE usage, hazard monitoring, and quality inspections, with regular pipeline testing and quality verification conducted regularly. This process ensures that all aspects of the project from initial planning to final handover are managed systematically, with a focus on safety, quality, and adherence to the 50-day timeline.	{"steps": ["Planning phase", "Mobilization of equipment and manpower", "Execution of scope of work", "Testing and commissioning", "Final inspection and handover"], "tools": ["Excavators", "Trenching equipment", "Pipe cutting tools", "Welding machines", "Pumps", "Safety equipment", "PPE"], "timeline": "50 days total duration", "processName": "Water Infrastructure Project Execution", "dependencies": ["Equipment functionality", "Manpower availability", "Weather conditions", "Departmental approvals"], "stakeholders": ["Site engineers", "Supervisors", "Skilled technicians", "Helpers", "Safety officers", "Water Supply and Sanitation Department"], "documentation": ["Safety protocols documentation", "Quality inspection reports", "Pipeline testing records", "Project completion certificates"], "prerequisites": ["Site survey completion", "Route planning", "Equipment availability", "Manpower deployment"], "approvalLevels": ["Departmental inspection and approval"], "decisionCriteria": ["Quality standards", "Safety compliance", "Timely completion", "Adherence to project scope"]}	{"project execution","execution strategy","structured phases",planning,mobilization,execution,testing,"final inspection","equipment deployment",excavators,"trenching equipment","pipe cutting tools","welding machines",pumps,"safety equipment","manpower deployment","site engineers",supervisors,"skilled technicians",helpers}	{49fcaa0b-1d92-4471-887b-2976d8faddee}	13574b809a856cbafe7e6041a072ae13f9d92cfac7427f420a083cdaf0a7f221	\N	88	f	0	2026-02-22 10:34:13.518391	2026-02-22 10:34:13.518391
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leads (id, name, email, company, phone, message, lead_type, department, total_seats, estimated_timeline, status, created_at) FROM stdin;
\.


--
-- Data for Name: license_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.license_assignments (id, license_package_id, user_id, status, assigned_at, unassigned_at, assigned_by, notes) FROM stdin;
67daeb9f-1640-4ac3-ac63-ed6d8f1758d8	ee70bc91-edeb-495d-98f3-9073a2bf6907	d637844e-1170-4291-b786-d9ad4242e34e	active	2026-02-22 11:47:11.071441	\N	82cb8c83-fc1b-4fa3-b87d-990418225797	\N
8c2fb427-65de-4589-844d-a1cac3570ae6	ee70bc91-edeb-495d-98f3-9073a2bf6907	8eaabe7e-246a-4e3c-8d5a-205011ccc478	active	2026-02-22 12:12:43.793947	\N	82cb8c83-fc1b-4fa3-b87d-990418225797	\N
1898dfaa-5a18-4d16-9240-d0a93823ae11	6d416874-0d4b-43a7-88ac-8d223e7bd4fc	86401085-206e-405e-87eb-e2a77b146d27	active	2026-02-22 12:25:12.759078	\N	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N
\.


--
-- Data for Name: license_packages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.license_packages (id, organization_id, package_type, total_seats, price_per_seat, total_amount, currency, start_date, end_date, previous_package_id, razorpay_subscription_id, razorpay_order_id, status, created_at) FROM stdin;
ee70bc91-edeb-495d-98f3-9073a2bf6907	4c8b1a0e-bfbc-4662-acf8-10eabac32621	monthly	5	6	30	USD	2026-02-22 10:41:46.896	2026-03-22 10:41:46.896	\N	\N	order_SJA6REhcj6tAMk	active	2026-02-22 10:41:46.668757
6d416874-0d4b-43a7-88ac-8d223e7bd4fc	baf39d94-3d9d-416e-827a-145993ff9934	monthly	10	6	60	USD	2026-02-22 12:23:52.926	2026-03-22 12:23:52.926	\N	\N	order_SJBqHtzWfQmC5y	active	2026-02-22 12:23:53.709532
07af9458-d43c-4f89-8e0f-477dc6d5cd6a	baf39d94-3d9d-416e-827a-145993ff9934	61a2e346-c35f-4395-8996-b3c4cfe8fcd8	1	149	149	USD	2026-02-22 12:29:58.787	2026-03-24 12:29:58.787	\N	\N	\N	active	2026-02-22 12:29:59.573292
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, conversation_id, content, sender, speaker_label, audio_source_id, customer_identification, discovery_questions, case_studies, competitor_analysis, solution_recommendations, product_features, next_steps, bant_qualification, solutions, problem_statement, recommended_solutions, suggested_next_prompt, "timestamp") FROM stdin;
7ab0f11b-45f5-4a2e-8f57-5f7111535729	2130eb6c-b369-47b0-bb1a-161c9aa577f8	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 07:51:15.777
c7a87626-1652-4650-97a2-b540a2282006	798ce7ce-1775-42c4-bd5c-695bdca83d4b	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 09:33:20.503
df2971c4-4436-40f9-bf24-f5137f741552	94843b28-6851-4022-bd18-ee51103f5446	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 09:38:16.446
14398244-6c36-4ae4-a065-31d5d8ca541e	998acd3d-29db-4e46-b32b-bcf4b9e767e6	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 09:41:35.073
6b9ef55c-dbd1-4b9d-bff9-1c6e6b9fac3f	7832fd92-1463-4439-bbb3-1f3b556c4da8	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 09:41:47.987
edb58096-86a9-4296-8842-6a2228cc0f2b	32871725-48ce-493e-b12b-d0ec5491bd8d	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 09:42:13.288
3ee974d6-ab77-4653-8180-adbfb16eee02	d81baaf0-8794-4dba-9f81-be371ca3c37d	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 09:43:17.29
47a2b268-1a59-4ea5-a2f4-5c6af4195078	98cdf599-00e1-4078-8a9b-7e8b4f144996	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 09:51:25.814
398cc942-f502-4cc5-8a86-faad7b03ec27	b11cb84e-8167-4319-a449-0aa678536b1c	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 10:01:53.074
5ae21598-11d3-4922-b1e9-26300e9fbd8f	28e57870-4f50-47f6-baaf-d4b8a82f83b4	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 10:34:41.769
af2337a1-8cec-4860-a32d-7e60e88db5c4	073a3365-cd19-4aa3-9218-a59dd0d203ad	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 11:49:30.733
c9253d76-a438-49dc-89b4-401631158096	49c6dc38-351e-42f7-81ac-5d8fc629b705	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 12:21:07.301
5b2474f8-e33c-4526-8a25-6f19fa6a1244	f2e92b96-c414-4128-b527-383abb275b4e	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 12:26:46.021
ad35ff09-e399-4e00-829c-ab5db2189bed	741c789d-1a28-4e96-aad1-9c618d5a7f71	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 12:32:27.459
cca3d505-1041-4f2b-825f-ee5ac48436d9	c7670aa2-392d-43c9-8b7f-32b0aa369538	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 12:45:48.572
a7d531f3-baa9-44a3-bfb8-2166289cc04f	8e993bbe-8674-4112-8cad-320de9c89a0e	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 12:45:56.643
a957ca6f-1651-4cff-be38-05081a8469fb	06cf4ffe-d6b0-4cb7-bc06-9f50630f6489	Hello! I'm here to help you conduct a comprehensive discovery call. What brings you here today? What challenges or opportunities are you looking to explore?	assistant	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-22 12:50:30.261
\.


--
-- Data for Name: organization_addons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organization_addons (id, organization_id, type, status, start_date, end_date, auto_renew, purchase_amount, currency, gateway_transaction_id, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: organization_memberships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organization_memberships (id, organization_id, user_id, role, status, joined_at, left_at) FROM stdin;
d0b4cea0-055e-4139-8c1a-1bc8d5e3eeba	4c8b1a0e-bfbc-4662-acf8-10eabac32621	82cb8c83-fc1b-4fa3-b87d-990418225797	license_manager	active	2026-02-22 10:41:46.050033	\N
cdf80e80-5401-4f6f-9362-6fa3d8117fde	4c8b1a0e-bfbc-4662-acf8-10eabac32621	d637844e-1170-4291-b786-d9ad4242e34e	member	active	2026-02-22 11:47:11.688972	\N
3dfc8f0b-44b7-4460-beb9-5704afd5cf1e	4c8b1a0e-bfbc-4662-acf8-10eabac32621	8eaabe7e-246a-4e3c-8d5a-205011ccc478	member	active	2026-02-22 12:12:44.303598	\N
5ec345cb-6a51-4d53-8087-2abd29e7604d	baf39d94-3d9d-416e-827a-145993ff9934	8eaabe7e-246a-4e3c-8d5a-205011ccc478	license_manager	active	2026-02-22 12:23:52.968375	\N
2aa2c6af-efdf-4347-bef6-31a2b59d140c	baf39d94-3d9d-416e-827a-145993ff9934	86401085-206e-405e-87eb-e2a77b146d27	member	active	2026-02-22 12:25:13.26041	\N
76d70b31-52cf-45a3-9ef1-9ac98d5d38d7	baf39d94-3d9d-416e-827a-145993ff9934	8eaabe7e-246a-4e3c-8d5a-205011ccc478	admin	active	2026-02-22 12:29:59.125009	\N
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizations (id, company_name, billing_email, primary_manager_id, razorpay_customer_id, status, created_at, updated_at) FROM stdin;
4c8b1a0e-bfbc-4662-acf8-10eabac32621	dolat capital	bilydo@denipl.net	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	active	2026-02-22 10:41:45.640635	2026-02-22 10:41:45.640635
baf39d94-3d9d-416e-827a-145993ff9934	Student	jyhazexy@denipl.net	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	active	2026-02-22 12:23:52.376195	2026-02-22 12:29:57.905
\.


--
-- Data for Name: otps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.otps (id, email, code, expires_at, attempts, is_used, created_at) FROM stdin;
928a95c7-c240-4673-96c4-d4ef59dc868a	hello@kunalpatil.me	745369	2026-02-22 09:22:17.709	0	f	2026-02-22 09:12:17.457477
1b4b1485-07a5-427d-bf1e-bd9a0d7e13f1	bobyzehy@denipl.net	175307	2026-02-22 09:22:58.744	0	f	2026-02-22 09:12:58.491979
ccd707df-8249-4fdb-a58c-c9f537965f31	nilibilu@forexzig.com	928600	2026-02-22 09:28:30.037	0	f	2026-02-22 09:18:29.792747
1f048ada-9caf-4c1f-b6c6-4dd49149f32f	gogulosa@denipl.com	706541	2026-02-22 09:38:00.606	0	f	2026-02-22 09:28:00.367217
f3faf3b1-33cd-4d1f-a659-1c2f1fbf6be9	nalicefo@denipl.net	376868	2026-02-22 09:40:53.968	0	f	2026-02-22 09:30:53.724909
b5360b42-140e-47af-ae5f-940344a526c3	xigacypa@denipl.net	470144	2026-02-22 09:42:57.769	0	t	2026-02-22 09:32:57.523521
a9b71ad5-9779-48f7-9f1b-a8c9d9cb0319	rekasuro@fxzig.com	871078	2026-02-22 09:52:57.318	0	t	2026-02-22 09:42:57.075095
1c220979-3e7d-45f0-8d69-742e29010530	2022.kunal.patil@ves.ac.in	761990	2026-02-22 12:59:58.179	0	t	2026-02-22 12:49:58.968426
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, email, token, expires_at, is_used, created_at) FROM stdin;
2c8902fa-9e0e-4f08-bf6d-73446bbe753c	testuser@microsoft.com	742ee7d7511487b795acb43ceab691cb6b71a6fa7a25b75fe60cc02761b3975c	2026-02-22 18:48:53.985	f	2026-02-22 12:18:55.216658
e30d0c3a-5f62-4b96-a5cb-a8e6deec31c8	jyhazexy@denipl.net	072178fda9cd38ec9835e69273e5f3e0f82ebbcb59eaee90f692da328271c9a4	2026-02-23 12:12:41.687	t	2026-02-22 12:12:42.458073
66d644a8-a473-4e53-ac9c-7a40b653f7cd	legekewy@denipl.com	f020788fdfa89ec39f1fe38da69091648a2f5d3b636ffc71cb277aac212d7d58	2026-02-23 12:25:10.559	t	2026-02-22 12:25:11.341013
6324c9de-a1d2-4245-b7ac-8cc6e33eaa03	jyhazexy@denipl.net	2132b6751dc40d14a045236035208524a34cce6f079e2cfeb0e93a43e05243b4	2026-02-23 12:30:00.963	f	2026-02-22 12:30:01.750704
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, user_id, subscription_id, organization_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, currency, status, payment_method, receipt_url, metadata, refunded_at, refund_amount, refund_reason, razorpay_refund_id, refunded_by, created_at) FROM stdin;
4b9db22b-c69c-4aa1-87da-57f8f52d0f24	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	\N	order_SJ9MDDYMpezh7W	pay_SJ9OD4KQboFtlU	\N	9000	USD	succeeded	razorpay	\N	{"type": "cart_checkout", "items": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "10", "packageSku": "f4fdc254-fe49-4de7-890a-0a703418609d", "companyName": null, "packageName": "DAI Lite (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"totalUnits": 5000, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "80", "packageSku": "ac84f933-15d3-4ff2-9a27-8b60c0f1858b", "companyName": null, "packageName": "5000 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "platform_access", "basePrice": "149", "packageSku": "61a2e346-c35f-4395-8996-b3c4cfe8fcd8", "companyName": null, "packageName": "3 Months Plan", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "orderId": "66f15a24-40f2-4e37-a37a-551660b0405a", "originalAmount": 90, "gatewayProvider": "razorpay"}	\N	\N	\N	\N	\N	2026-02-22 09:59:38.282579
6331d6e9-070e-49b6-916d-47794b2094d7	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	\N	order_SJ9TBFWvTal8Ej	pay_SJ9TRn7A4SMhqq	\N	2000	USD	succeeded	razorpay	\N	{"type": "cart_checkout", "items": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "orderId": "264d5544-3d31-4141-80ca-33327fcacdf0", "originalAmount": 20, "gatewayProvider": "razorpay"}	\N	\N	\N	\N	\N	2026-02-22 10:04:32.749454
a8943b6f-18aa-4a93-a5d3-fd2d834e6d30	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	\N	order_SJ9ghHyCRDidu2	pay_SJ9gyxxk1H1Yry	\N	2000	USD	succeeded	razorpay	\N	{"type": "cart_checkout", "items": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "orderId": "1dc460f0-46b5-439d-ad9d-3743775976a4", "originalAmount": 20, "gatewayProvider": "razorpay"}	\N	\N	\N	\N	\N	2026-02-22 10:17:26.225873
562ce708-a132-48ee-98cf-e1b546e0e36f	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	\N	FREE-1771755909277	free_1771755909493	\N	0.00	USD	succeeded	promo_code_100%	\N	{"type": "cart_checkout", "orderId": "3d877631-915c-427a-bd88-f193930f630e", "freePromo": true, "itemCount": 1, "gatewayProvider": "free_promo"}	\N	\N	\N	\N	\N	2026-02-22 10:25:09.267957
85a77d3b-6a9f-466a-8a25-f804f8eb590a	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	\N	FREE-1771756064742	free_1771756064965	\N	0.00	USD	succeeded	promo_code_100%	\N	{"type": "cart_checkout", "orderId": "89ea4487-7e7a-41e0-b394-f7710f21cb84", "freePromo": true, "itemCount": 1, "gatewayProvider": "free_promo"}	\N	\N	\N	\N	\N	2026-02-22 10:27:44.751918
a989ef1e-3a34-4dfd-8798-eca151532af7	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	\N	order_SJ9t93NTkYkykR	pay_SJ9tQbrJkFwOCp	\N	1600	USD	succeeded	razorpay	\N	{"type": "cart_checkout", "items": [{"currency": "USD", "metadata": {"totalUnits": 1000, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "16", "packageSku": "f19e48b0-2bbc-4a75-9d0e-73afa53b09d3", "companyName": null, "packageName": "1000 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "orderId": "f922f1e7-3913-4f7e-894a-ea0689e88336", "originalAmount": 16, "gatewayProvider": "razorpay"}	\N	\N	\N	\N	\N	2026-02-22 10:29:09.609146
371b3e13-f414-4f2a-a5b1-385c9893303f	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	\N	order_SJ9v0YK1sBWzfM	pay_SJ9vEViA98UaKU	\N	800	USD	succeeded	razorpay	\N	{"type": "cart_checkout", "items": [{"currency": "USD", "metadata": {"totalUnits": 500, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "8", "packageSku": "16b59eb6-e3cb-4235-9a53-df3315c4ed24", "companyName": null, "packageName": "500 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "orderId": "27413e0f-6cdf-4fb1-b649-bb6c71018807", "originalAmount": 8, "gatewayProvider": "razorpay"}	\N	\N	\N	\N	\N	2026-02-22 10:31:11.214666
48fe5972-4ddb-407b-9f12-ae708cd19af7	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	baf39d94-3d9d-416e-827a-145993ff9934	order_SJBqHtzWfQmC5y	pay_SJBqZ6CeG0TsXJ	\N	3000	USD	success	razorpay	\N	"{\\"type\\":\\"enterprise_license_purchase\\",\\"companyName\\":\\"dolat capital\\",\\"billingEmail\\":\\"jyhazexy@denipl.net\\",\\"totalSeats\\":5,\\"packageType\\":\\"monthly\\",\\"pricePerSeat\\":6,\\"organizationId\\":\\"baf39d94-3d9d-416e-827a-145993ff9934\\",\\"licensePackageId\\":\\"6d416874-0d4b-43a7-88ac-8d223e7bd4fc\\"}"	\N	\N	\N	\N	\N	2026-02-22 12:23:13.224622
feca25b5-c4d8-443e-9d97-e7c86ffd1f67	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	4c8b1a0e-bfbc-4662-acf8-10eabac32621	order_SJA6REhcj6tAMk	pay_SJA6kexDZAueBG	\N	3000	USD	success	razorpay	\N	"{\\"type\\":\\"enterprise_license_purchase\\",\\"companyName\\":\\"dolat capital\\",\\"billingEmail\\":\\"bilydo@denipl.net\\",\\"totalSeats\\":5,\\"packageType\\":\\"monthly\\",\\"pricePerSeat\\":6,\\"originalAmountUSD\\":30,\\"providerOrderId\\":\\"order_SJA6REhcj6tAMk\\",\\"gateway\\":\\"razorpay\\"}"	\N	\N	\N	\N	\N	2026-02-22 10:41:07.330132
836c46e7-99d4-4144-a491-a1a08ca93482	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	4c8b1a0e-bfbc-4662-acf8-10eabac32621	order_SJBvpXQec5zWUz	pay_SJBw2LZIepfbFI	\N	17700	USD	succeeded	razorpay	\N	{"type": "cart_checkout", "items": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": "Student", "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "team", "teamManagerName": "kunal deepak patil", "teamManagerEmail": "jyhazexy@denipl.net"}, {"currency": "USD", "metadata": {"totalUnits": 500, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "8", "packageSku": "16b59eb6-e3cb-4235-9a53-df3315c4ed24", "companyName": "Student", "packageName": "500 Minutes Package", "purchaseMode": "team", "teamManagerName": "kunal deepak patil", "teamManagerEmail": "jyhazexy@denipl.net"}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "platform_access", "basePrice": "149", "packageSku": "61a2e346-c35f-4395-8996-b3c4cfe8fcd8", "companyName": "Student", "packageName": "3 Months Plan", "purchaseMode": "team", "teamManagerName": "kunal deepak patil", "teamManagerEmail": "jyhazexy@denipl.net"}], "orderId": "b2ccf1ef-8ebd-4438-bbd1-efa4813fa4c2", "originalAmount": 177, "gatewayProvider": "razorpay"}	\N	\N	\N	\N	\N	2026-02-22 12:29:53.87833
6e7439b9-e46c-437b-acd5-678435d3ddd3	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	4c8b1a0e-bfbc-4662-acf8-10eabac32621	order_SJCEaCTvlTzkGs	pay_SJCEnFqcNyjUxn	\N	8000	USD	succeeded	razorpay	\N	{"type": "cart_checkout", "items": [{"currency": "USD", "metadata": {"totalUnits": 5000, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "80", "packageSku": "ac84f933-15d3-4ff2-9a27-8b60c0f1858b", "companyName": null, "packageName": "5000 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "orderId": "407b7ec0-12d8-4540-931c-9f428638899e", "originalAmount": 80, "gatewayProvider": "razorpay"}	\N	\N	\N	\N	\N	2026-02-22 12:46:44.5608
75a71f46-9edb-41c8-a614-8ef3e936ef06	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	4c8b1a0e-bfbc-4662-acf8-10eabac32621	order_SJCFmCnKUTbyI3	pay_SJCFzAYjELt0BD	\N	24400	USD	succeeded	razorpay	\N	{"type": "cart_checkout", "items": [{"currency": "USD", "metadata": {"totalUnits": 1500, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "24", "packageSku": "0297d197-2c45-410e-ad94-4ec73e77c79b", "companyName": null, "packageName": "1500 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "200", "packageSku": "f92de33c-cf9b-45ff-951b-9b576a2aed41", "companyName": null, "packageName": "DAI Enterprise (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "orderId": "0f95d78e-5d8d-44df-81cd-7ed79ed0d713", "originalAmount": 244, "gatewayProvider": "razorpay"}	\N	\N	\N	\N	\N	2026-02-22 12:47:52.13076
\.


--
-- Data for Name: pending_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pending_orders (id, user_id, package_sku, addon_type, amount, currency, gateway_order_id, gateway_provider, status, metadata, expires_at, completed_at, created_at) FROM stdin;
264d5544-3d31-4141-80ca-33327fcacdf0	82cb8c83-fc1b-4fa3-b87d-990418225797	CART-MULTI-ITEM	cart_checkout	20.00	USD	order_SJ9TBFWvTal8Ej	razorpay	completed	{"items": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "total": 20, "discount": 0, "subtotal": 20, "gstAmount": 0, "itemCount": 1, "finalAmount": 20, "finalCurrency": "USD", "roundoffAmount": 0, "originalCurrency": "USD", "perItemPromoCodes": [{"cartItemId": "bbf8c033-3f60-4eab-88f6-d27be8c7a713", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}]}	2026-02-22 10:33:56.772	2026-02-22 10:04:34.509	2026-02-22 10:03:56.539241
66f15a24-40f2-4e37-a37a-551660b0405a	82cb8c83-fc1b-4fa3-b87d-990418225797	CART-MULTI-ITEM	cart_checkout	90.00	USD	order_SJ9MDDYMpezh7W	razorpay	completed	{"items": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "10", "packageSku": "f4fdc254-fe49-4de7-890a-0a703418609d", "companyName": null, "packageName": "DAI Lite (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"totalUnits": 5000, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "80", "packageSku": "ac84f933-15d3-4ff2-9a27-8b60c0f1858b", "companyName": null, "packageName": "5000 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "platform_access", "basePrice": "149", "packageSku": "61a2e346-c35f-4395-8996-b3c4cfe8fcd8", "companyName": null, "packageName": "3 Months Plan", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "total": 90, "discount": 149, "subtotal": 239, "gstAmount": 0, "itemCount": 3, "finalAmount": 90, "finalCurrency": "USD", "roundoffAmount": 0, "originalCurrency": "USD", "perItemPromoCodes": [{"cartItemId": "f869ccb5-8b5f-4e6b-a720-c0661ae618e3", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}, {"cartItemId": "71023852-b9f8-4915-9138-7be2a84e52bd", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}, {"cartItemId": "09537d9c-b4d2-4e56-9b68-7ed171eb7cf3", "promoCodeId": "eb728eb5-ad22-40f3-bc31-094378a4040b", "promoCodeCode": "SAVE100", "appliedDiscountAmount": "149.00"}]}	2026-02-22 10:27:21.271	2026-02-22 09:59:42.77	2026-02-22 09:57:21.042056
89ea4487-7e7a-41e0-b394-f7710f21cb84	82cb8c83-fc1b-4fa3-b87d-990418225797	CART-MULTI-ITEM	cart_checkout	0.00	USD	FREE-1771756064742	free_promo	completed	{"items": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "total": 0, "discount": 20, "subtotal": 20, "freePromo": true, "gstAmount": 0, "itemCount": 1, "finalAmount": 0, "finalCurrency": "USD", "roundoffAmount": 0, "originalCurrency": "USD", "perItemPromoCodes": [{"cartItemId": "310f87ca-e0c6-424d-a9b6-be2ea889c014", "promoCodeId": "d322a98b-17ca-4925-b33e-7b04390eddd2", "promoCodeCode": "SAVEC100", "appliedDiscountAmount": "20.00"}]}	2026-02-22 10:57:44.743	\N	2026-02-22 10:27:44.53377
1dc460f0-46b5-439d-ad9d-3743775976a4	82cb8c83-fc1b-4fa3-b87d-990418225797	CART-MULTI-ITEM	cart_checkout	20.00	USD	order_SJ9ghHyCRDidu2	razorpay	completed	{"items": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "total": 20, "discount": 0, "subtotal": 20, "gstAmount": 0, "itemCount": 1, "finalAmount": 20, "finalCurrency": "USD", "roundoffAmount": 0, "originalCurrency": "USD", "perItemPromoCodes": [{"cartItemId": "bdf29020-1f1d-42e6-aab7-d262bffb9bec", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}]}	2026-02-22 10:46:44.867	2026-02-22 10:17:27.715	2026-02-22 10:16:44.6289
3d877631-915c-427a-bd88-f193930f630e	82cb8c83-fc1b-4fa3-b87d-990418225797	CART-MULTI-ITEM	cart_checkout	0.00	USD	FREE-1771755909277	free_promo	completed	{"items": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "total": 0, "discount": 20, "subtotal": 20, "freePromo": true, "gstAmount": 0, "itemCount": 1, "finalAmount": 0, "finalCurrency": "USD", "roundoffAmount": 0, "originalCurrency": "USD", "perItemPromoCodes": [{"cartItemId": "6632094e-50ef-4473-8f7d-c0c691dcc046", "promoCodeId": "d322a98b-17ca-4925-b33e-7b04390eddd2", "promoCodeCode": "SAVEC100", "appliedDiscountAmount": "20.00"}]}	2026-02-22 10:55:09.278	\N	2026-02-22 10:25:09.052635
f922f1e7-3913-4f7e-894a-ea0689e88336	82cb8c83-fc1b-4fa3-b87d-990418225797	CART-MULTI-ITEM	cart_checkout	16.00	USD	order_SJ9t93NTkYkykR	razorpay	completed	{"items": [{"currency": "USD", "metadata": {"totalUnits": 1000, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "16", "packageSku": "f19e48b0-2bbc-4a75-9d0e-73afa53b09d3", "companyName": null, "packageName": "1000 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "total": 16, "discount": 0, "subtotal": 16, "gstAmount": 0, "itemCount": 1, "finalAmount": 16, "finalCurrency": "USD", "roundoffAmount": 0, "originalCurrency": "USD", "perItemPromoCodes": [{"cartItemId": "fbfc0f26-2187-4006-bb89-f6f7e8de7abe", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}]}	2026-02-22 10:58:31.99	2026-02-22 10:29:11.335	2026-02-22 10:28:31.760374
27413e0f-6cdf-4fb1-b649-bb6c71018807	82cb8c83-fc1b-4fa3-b87d-990418225797	CART-MULTI-ITEM	cart_checkout	8.00	USD	order_SJ9v0YK1sBWzfM	razorpay	completed	{"items": [{"currency": "USD", "metadata": {"totalUnits": 500, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "8", "packageSku": "16b59eb6-e3cb-4235-9a53-df3315c4ed24", "companyName": null, "packageName": "500 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "total": 8, "discount": 0, "subtotal": 8, "gstAmount": 0, "itemCount": 1, "finalAmount": 8, "finalCurrency": "USD", "roundoffAmount": 0, "originalCurrency": "USD", "perItemPromoCodes": [{"cartItemId": "5e3e5cde-0bba-4420-b77a-d379861d25fb", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}]}	2026-02-22 11:00:17.993	2026-02-22 10:31:13.231	2026-02-22 10:30:17.763006
e666fded-8eaa-4ec4-a761-f91b9298c5c8	82cb8c83-fc1b-4fa3-b87d-990418225797	CART-MULTI-ITEM	cart_checkout	667.00	USD	order_SJBhDIEatdWRK9	razorpay	expired	{"items": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": "Student", "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "team", "teamManagerName": "kunal deepak patil", "teamManagerEmail": "rekasuro@fxzig.com"}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "200", "packageSku": "f92de33c-cf9b-45ff-951b-9b576a2aed41", "companyName": "Student", "packageName": "DAI Enterprise (Monthly)", "purchaseMode": "team", "teamManagerName": "kunal deepak patil", "teamManagerEmail": "rekasuro@fxzig.com"}, {"currency": "USD", "metadata": {"totalUnits": 3000, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "48", "packageSku": "4783537e-de2a-4a2a-a8e9-1194887d1f1e", "companyName": "Student", "packageName": "3000 Minutes Package", "purchaseMode": "team", "teamManagerName": "kunal deepak patil", "teamManagerEmail": "rekasuro@fxzig.com"}, {"currency": "USD", "metadata": {"validityDays": 365}, "quantity": 1, "addonType": "platform_access", "basePrice": "399", "packageSku": "e62f2310-d1dd-4f43-ba48-c63ae592d0f9", "companyName": "Student", "packageName": "12 Months Plan", "purchaseMode": "team", "teamManagerName": "kunal deepak patil", "teamManagerEmail": "rekasuro@fxzig.com"}], "total": 667, "discount": 0, "subtotal": 667, "gstAmount": 0, "itemCount": 4, "finalAmount": 667, "finalCurrency": "USD", "roundoffAmount": 0, "originalCurrency": "USD", "perItemPromoCodes": [{"cartItemId": "bdf6bb73-96b2-407e-95e3-be2cc210e123", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}, {"cartItemId": "f7cada42-e49c-457a-ab69-3c97767a6d1a", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}, {"cartItemId": "5728fafc-3e52-4232-ba72-ed3d2bbd5110", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}, {"cartItemId": "d61e8018-1a56-4620-8cc3-7d7d81b0253f", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}]}	2026-02-22 12:44:35.769	\N	2026-02-22 12:14:36.564311
b2ccf1ef-8ebd-4438-bbd1-efa4813fa4c2	8eaabe7e-246a-4e3c-8d5a-205011ccc478	CART-MULTI-ITEM	cart_checkout	177.00	USD	order_SJBvpXQec5zWUz	razorpay	completed	{"items": [{"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": "Student", "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "team", "teamManagerName": "kunal deepak patil", "teamManagerEmail": "jyhazexy@denipl.net"}, {"currency": "USD", "metadata": {"totalUnits": 500, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "8", "packageSku": "16b59eb6-e3cb-4235-9a53-df3315c4ed24", "companyName": "Student", "packageName": "500 Minutes Package", "purchaseMode": "team", "teamManagerName": "kunal deepak patil", "teamManagerEmail": "jyhazexy@denipl.net"}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "platform_access", "basePrice": "149", "packageSku": "61a2e346-c35f-4395-8996-b3c4cfe8fcd8", "companyName": "Student", "packageName": "3 Months Plan", "purchaseMode": "team", "teamManagerName": "kunal deepak patil", "teamManagerEmail": "jyhazexy@denipl.net"}], "total": 177, "discount": 0, "subtotal": 177, "gstAmount": 0, "itemCount": 3, "finalAmount": 177, "finalCurrency": "USD", "roundoffAmount": 0, "originalCurrency": "USD", "perItemPromoCodes": [{"cartItemId": "b1acf580-f303-4d3f-a785-9c794e46040e", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}, {"cartItemId": "12b0cad9-c23d-4976-9580-862b6f2cd533", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}, {"cartItemId": "9177ef68-3124-428e-84a4-eafa1c98dd44", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}]}	2026-02-22 12:58:26.486	2026-02-22 12:29:53.866	2026-02-22 12:28:27.259872
407b7ec0-12d8-4540-931c-9f428638899e	8eaabe7e-246a-4e3c-8d5a-205011ccc478	CART-MULTI-ITEM	cart_checkout	80.00	USD	order_SJCEaCTvlTzkGs	razorpay	completed	{"items": [{"currency": "USD", "metadata": {"totalUnits": 5000, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "80", "packageSku": "ac84f933-15d3-4ff2-9a27-8b60c0f1858b", "companyName": null, "packageName": "5000 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "total": 80, "discount": 0, "subtotal": 80, "gstAmount": 0, "itemCount": 1, "finalAmount": 80, "finalCurrency": "USD", "roundoffAmount": 0, "originalCurrency": "USD", "perItemPromoCodes": [{"cartItemId": "782c4bb1-31f4-415e-876b-fab52d660258", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}]}	2026-02-22 13:16:11.465	2026-02-22 12:46:45.446	2026-02-22 12:46:12.24015
0f95d78e-5d8d-44df-81cd-7ed79ed0d713	8eaabe7e-246a-4e3c-8d5a-205011ccc478	CART-MULTI-ITEM	cart_checkout	244.00	USD	order_SJCFmCnKUTbyI3	razorpay	completed	{"items": [{"currency": "USD", "metadata": {"totalUnits": 1500, "validityDays": 30}, "quantity": 1, "addonType": "usage_bundle", "basePrice": "24", "packageSku": "0297d197-2c45-410e-ad94-4ec73e77c79b", "companyName": null, "packageName": "1500 Minutes Package", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "200", "packageSku": "f92de33c-cf9b-45ff-951b-9b576a2aed41", "companyName": null, "packageName": "DAI Enterprise (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}, {"currency": "USD", "metadata": {"validityDays": 30}, "quantity": 1, "addonType": "service", "basePrice": "20", "packageSku": "258106b4-6b02-4af3-8b1d-af77d7af29c1", "companyName": null, "packageName": "Train Me Add-on (Monthly)", "purchaseMode": "user", "teamManagerName": null, "teamManagerEmail": null}], "total": 244, "discount": 0, "subtotal": 244, "gstAmount": 0, "itemCount": 3, "finalAmount": 244, "finalCurrency": "USD", "roundoffAmount": 0, "originalCurrency": "USD", "perItemPromoCodes": [{"cartItemId": "a02173a3-cd8f-4920-be4c-fa1f68bc961d", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}, {"cartItemId": "c51444ca-107e-4434-91c2-20d5504561bb", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}, {"cartItemId": "47b8fe93-6c05-4e2d-8ec7-e404dd831880", "promoCodeId": null, "promoCodeCode": null, "appliedDiscountAmount": null}]}	2026-02-22 13:17:19.826	2026-02-22 12:47:54.087	2026-02-22 12:47:20.602539
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, code, name, category, description, key_features, use_cases, target_industries, pricing_model, typical_price, implementation_time, integrates_with, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: promo_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promo_codes (id, code, category, allowed_plan_types, discount_type, discount_value, max_uses, uses_count, is_active, expires_at, created_at, updated_at) FROM stdin;
eb728eb5-ad22-40f3-bc31-094378a4040b	SAVE100	platform_subscription	["yearly", "three_year", "six_month", "monthly"]	percentage	100	100	1	t	2026-02-28 00:00:00	2026-02-22 09:57:09.41832	2026-02-22 09:59:39.367
d322a98b-17ca-4925-b33e-7b04390eddd2	SAVEC100	train_me	["train_me_30_days"]	percentage	100	100	2	t	2026-02-28 00:00:00	2026-02-22 10:24:55.050499	2026-02-22 10:27:45.409
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, user_id, token, expires_at, created_at) FROM stdin;
18fa773f-e156-428d-8075-7e40269163df	2cddba37-2b80-46f8-893f-a6622cce384c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyY2RkYmEzNy0yYjgwLTQ2ZjgtODkzZi1hNjYyMmNjZTM4NGMiLCJlbWFpbCI6InhpZ2FjeXBhQGRlbmlwbC5uZXQiLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoieGlnYWN5cGFAZGVuaXBsIiwic2Vzc2lvblZlcnNpb24iOjMsImlhdCI6MTc3MTc1MzMzMSwiZXhwIjoxNzcyMzU4MTMxfQ.5o4d5LqiWBod_kGseWYmlpMSxYMr1bXofEn2j-RBzrY	2026-03-01 09:42:11.14	2026-02-22 09:42:10.911594
34f91ba3-a231-44fa-9250-ad926e099100	82cb8c83-fc1b-4fa3-b87d-990418225797	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MmNiOGM4My1mYzFiLTRmYTMtYjg3ZC05OTA0MTgyMjU3OTciLCJlbWFpbCI6InJla2FzdXJvQGZ4emlnLmNvbSIsInJvbGUiOiJ1c2VyIiwidXNlcm5hbWUiOiJyZWthc3Vyb0BmeHppZyIsInNlc3Npb25WZXJzaW9uIjoxLCJpYXQiOjE3NzE3NTMzOTUsImV4cCI6MTc3MjM1ODE5NX0.T6bGzOQ7w75CZ_xRQBUJ9R4R5V2UnAK5_hH9vjeZsM8	2026-03-01 09:43:15.241	2026-02-22 09:43:15.005951
53d09328-0510-4ac7-9243-8c728520ab1a	d637844e-1170-4291-b786-d9ad4242e34e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNjM3ODQ0ZS0xMTcwLTQyOTEtYjc4Ni1kOWFkNDI0MmUzNGUiLCJlbWFpbCI6Imt1bmFsZHAzNzlAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwidXNlcm5hbWUiOiJrdW5hbGRwMzc5Iiwic2Vzc2lvblZlcnNpb24iOjEsImlhdCI6MTc3MTc2MDk2OCwiZXhwIjoxNzcyMzY1NzY4fQ.axb2uYiFRgPDLV3_zrxsDGCjtD--m4-5k-Pjh_CPVik	2026-03-01 11:49:28.281	2026-02-22 11:49:29.048497
4548d869-a1f8-4e8c-9e6d-fa1b0797a5cf	86401085-206e-405e-87eb-e2a77b146d27	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NjQwMTA4NS0yMDZlLTQwNWUtODdlYi1lMmE3N2IxNDZkMjciLCJlbWFpbCI6ImxlZ2VrZXd5QGRlbmlwbC5jb20iLCJyb2xlIjoidXNlciIsInVzZXJuYW1lIjoibGVnZWtld3ljM3o2Iiwic2Vzc2lvblZlcnNpb24iOjEsImlhdCI6MTc3MTc2MzIwMywiZXhwIjoxNzcyMzY4MDAzfQ.H45Wrt3IsMIomyNES2NbX8R82HsCJVau8wT2o5QD3OM	2026-03-01 12:26:43.224	2026-02-22 12:26:44.00939
5fb250d8-9fca-4ef1-8d8a-1ba38c6a56f6	8eaabe7e-246a-4e3c-8d5a-205011ccc478	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4ZWFhYmU3ZS0yNDZhLTRlM2MtOGQ1YS0yMDUwMTFjY2M0NzgiLCJlbWFpbCI6Imp5aGF6ZXh5QGRlbmlwbC5uZXQiLCJyb2xlIjoibGljZW5zZV9tYW5hZ2VyIiwidXNlcm5hbWUiOiJqeWhhemV4eXFidzAiLCJzZXNzaW9uVmVyc2lvbiI6MiwiaWF0IjoxNzcxNzY0MzU1LCJleHAiOjE3NzIzNjkxNTV9.T6qs3_qerH7DFVuEKEARR1L7TFRPAxHxealeloZhMnQ	2026-03-01 12:45:55.363	2026-02-22 12:45:56.137666
411e7071-11b8-4649-9b1e-54740b352d3d	3d28d643-6a20-449a-be67-091421899890	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzZDI4ZDY0My02YTIwLTQ0OWEtYmU2Ny0wOTE0MjE4OTk4OTAiLCJlbWFpbCI6IjIwMjIua3VuYWwucGF0aWxAdmVzLmFjLmluIiwicm9sZSI6InVzZXIiLCJ1c2VybmFtZSI6IjIwMjIua3VuYWwucGF0aWwiLCJzZXNzaW9uVmVyc2lvbiI6MSwiaWF0IjoxNzcxNzY0NjI4LCJleHAiOjE3NzIzNjk0Mjh9.IoArcsrxEr-iNph9qYugujd2ZR758KDF2N0dY6Nas48	2026-03-01 12:50:28.419	2026-02-22 12:50:29.196801
\.


--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refunds (id, payment_id, user_id, amount, currency, reason, status, razorpay_refund_id, processed_by, processed_at, created_at) FROM stdin;
\.


--
-- Data for Name: sales_intelligence_exports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_intelligence_exports (id, export_name, export_type, date_range_start, date_range_end, intent_filter, industry_filter, record_count, export_data, exported_by, purpose, notes, created_at) FROM stdin;
\.


--
-- Data for Name: sales_intelligence_knowledge; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_intelligence_knowledge (id, intent_type, industry, persona, sales_stage, trigger_keywords, trigger_patterns, suggested_response, follow_up_prompt, usage_count, acceptance_count, rejection_count, performance_score, is_validated, validated_by, validated_at, source, notes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sales_intelligence_learning_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_intelligence_learning_logs (id, suggestion_id, conversation_id, user_id, customer_question, detected_intent, suggested_response, rep_used_suggestion, rep_modified_response, outcome_signals, industry, persona, sales_stage, product_discussed, is_anonymized, can_use_for_marketing, can_use_for_training, processing_status, promoted_to_knowledge, promoted_knowledge_id, created_at, processed_at) FROM stdin;
\.


--
-- Data for Name: sales_intelligence_suggestions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_intelligence_suggestions (id, conversation_id, user_id, knowledge_id, detected_intent, intent_confidence, customer_question, assembled_context, suggested_response, follow_up_prompt, retrieval_confidence, was_displayed, was_used, response_latency_ms, created_at) FROM stdin;
\.


--
-- Data for Name: session_minutes_purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_minutes_purchases (id, user_id, organization_id, minutes_purchased, minutes_used, minutes_remaining, purchase_date, expiry_date, status, razorpay_order_id, razorpay_payment_id, amount_paid, currency, refunded_at, refund_amount, refund_reason, razorpay_refund_id, refunded_by, created_at) FROM stdin;
\.


--
-- Data for Name: session_minutes_usage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_minutes_usage (id, user_id, purchase_id, conversation_id, minutes_consumed, feature_used, consumed_at) FROM stdin;
\.


--
-- Data for Name: session_usage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_usage (id, user_id, session_id, start_time, end_time, duration_seconds, status, created_at) FROM stdin;
848d4209-669a-4b95-b130-2e3dbff04cee	c2af625b-64b0-43be-b9c0-a233115deba5	usage_1771746755564_7t0gi2emg	2026-02-22 07:52:35.564	2026-02-22 07:53:03.632	28	ended	2026-02-22 07:52:35.57
a77dd329-e42a-43a3-a133-14ea67da267c	2cddba37-2b80-46f8-893f-a6622cce384c	usage_1771752821502_x7gki2scm	2026-02-22 09:33:41.502	\N	\N	active	2026-02-22 09:33:41.504
56eb4f47-b3e8-4f2e-890f-431be34b7905	2cddba37-2b80-46f8-893f-a6622cce384c	usage_1771753107746_mcxtqm7xq	2026-02-22 09:38:27.746	2026-02-22 09:38:34.455	6	ended	2026-02-22 09:38:27.749
e7311e1b-11c1-4e55-8d71-02746e64ef45	2cddba37-2b80-46f8-893f-a6622cce384c	usage_1771753116791_ngjvl8qxe	2026-02-22 09:38:36.791	\N	\N	active	2026-02-22 09:38:36.791
89fd0ee3-33be-4d03-8529-afe2ffdf95ba	82cb8c83-fc1b-4fa3-b87d-990418225797	usage_1771753410914_olnteisxb	2026-02-22 09:43:30.914	2026-02-22 09:51:16.652	465	ended	2026-02-22 09:43:30.914
edbd5b2c-7939-45f2-b89a-a479b479799d	82cb8c83-fc1b-4fa3-b87d-990418225797	usage_1771753891948_4rzy1ado6	2026-02-22 09:51:31.948	\N	\N	active	2026-02-22 09:51:31.949
8403b441-f5a6-4cca-b5a7-fa9b28702d66	82cb8c83-fc1b-4fa3-b87d-990418225797	usage_1771754521197_pcsd3ukzo	2026-02-22 10:02:01.197	\N	\N	active	2026-02-22 10:02:01.198
a3e8fab8-3836-4e87-b842-63052e1e0114	82cb8c83-fc1b-4fa3-b87d-990418225797	usage_1771756490350_6lpcufx0p	2026-02-22 10:34:50.35	\N	\N	active	2026-02-22 10:34:50.351
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_plans (id, name, price, listed_price, currency, billing_interval, features, is_active, published_on_website, available_until, required_addons, razorpay_plan_id, created_at, updated_at) FROM stdin;
d4ea952f-20f8-4cfc-bcef-ef04d6faad3b	6 Months Plan	220	\N	USD	6-months	["Unlimited sessions", "Unlimited time", "Free upgrades", "24x5 support", "Bring your own AI key", "Hello"]	t	t	\N	[]	plan_6month_200	2026-02-22 07:19:41.621385	2026-02-22 07:19:41.621385
61a2e346-c35f-4395-8996-b3c4cfe8fcd8	3 Months Plan	149	199	USD	one_time	["Unlimited sessions", "Unlimited time", "Free upgrades", "24x5 support", "Bring your own AI key", "90 days access", "All AI features included", "Priority support", "Save $50"]	t	t	\N	[]	\N	2026-02-22 07:19:42.562417	2026-02-22 07:19:42.562417
e62f2310-d1dd-4f43-ba48-c63ae592d0f9	12 Months Plan	399	799	USD	1-year	["Unlimited sessions", "Unlimited time", "Free upgrades", "24x5 support", "Bring your own AI key"]	t	t	\N	[]	plan_yearly_399	2026-02-22 07:19:42.765009	2026-02-22 07:19:42.765009
689ee4f4-7ee7-4e5a-8fe7-edff014b30cd	36 Months Plan	499	999	USD	3-years	["Unlimited sessions", "Unlimited time", "Free upgrades", "24x5 support", "Bring your own AI key"]	t	t	\N	[]	plan_3year_499	2026-02-22 07:19:42.972271	2026-02-22 07:19:42.972271
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions (id, user_id, plan_id, plan_type, status, sessions_used, sessions_limit, minutes_used, minutes_limit, session_history, current_period_start, current_period_end, canceled_at, cancellation_reason, razorpay_subscription_id, razorpay_customer_id, created_at, updated_at) FROM stdin;
502d42d3-6c54-4ee3-bdc0-94108baa9f74	5fd9e414-de11-41f6-a4af-49e5a7e7d29f	\N	free_trial	trial	0	3	0	180	[]	\N	\N	\N	\N	\N	\N	2026-02-22 09:25:14.278355	2026-02-22 09:25:14.278355
9971d0a6-6dd6-4726-8756-46cc9184f5ff	c2af625b-64b0-43be-b9c0-a233115deba5	\N	enterprise	active	1	\N	0	\N	[{"endTime": "2026-02-22T07:53:03.632Z", "sessionId": "usage_1771746755564_7t0gi2emg", "startTime": "2026-02-22T07:52:35.564Z", "durationMinutes": 0}]	2026-02-22 07:14:41.3803	2036-02-22 07:14:41.3803	\N	\N	\N	\N	2026-02-22 07:14:41.3803	2026-02-22 12:00:00.359
91e390f0-1b28-4286-90f2-dfa6c59cd735	2cddba37-2b80-46f8-893f-a6622cce384c	\N	platform_access	active	1	\N	0	\N	[{"endTime": "2026-02-22T09:38:34.455Z", "sessionId": "usage_1771753107746_mcxtqm7xq", "startTime": "2026-02-22T09:38:27.746Z", "durationMinutes": 0}]	\N	\N	\N	\N	\N	\N	2026-02-22 09:33:14.426393	2026-02-22 12:00:00.674
e8aec5fa-fecc-417c-b188-a6da36665044	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	platform_access	active	0	\N	0	\N	[]	2026-02-22 09:59:42.365	2045-05-23 09:59:42.365	\N	\N	\N	\N	2026-02-22 09:43:11.618703	2026-02-22 12:00:00.975
46624d01-92d5-4f02-8475-5f378dc5108d	3d28d643-6a20-449a-be67-091421899890	\N	free_trial	trial	0	3	0	180	[]	\N	\N	\N	\N	\N	\N	2026-02-22 12:50:26.353255	2026-02-22 12:50:26.353255
\.


--
-- Data for Name: super_user_overrides; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.super_user_overrides (id, email, reason, granted_by, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.support_tickets (id, user_id, subject, description, status, priority, assigned_to, resolved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_config; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: system_metrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_metrics (id, metric_type, value, metadata, "timestamp") FROM stdin;
\.


--
-- Data for Name: terms_and_conditions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.terms_and_conditions (id, title, content, version, is_active, last_modified_by, created_at, updated_at) FROM stdin;
e6e6938a-dccb-45fa-9489-f8aa1d84a6e5	Rev Winner Terms & Conditions	\n# Rev Winner Terms & Conditions\n\n**Effective Date:** November 2025  \n**Product of:** Healthcaa Technologies India Private Limited\n\n## 1. Acceptance of Terms\n\nBy accessing and using Rev Winner, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.\n\n## 2. Service Description\n\nRev Winner is a sales enablement platform that provides:\n- Real-time conversation intelligence\n- AI-powered sales coaching\n- Call transcription and analysis\n- Sales performance analytics\n\n## 3. User Accounts\n\n### 3.1 Registration\n- You must provide accurate and complete information\n- You are responsible for maintaining account security\n- You must be at least 18 years old to use this service\n\n### 3.2 Account Security\n- Keep your password confidential\n- Notify us immediately of any unauthorized access\n- You are responsible for all activities under your account\n\n## 4. Acceptable Use\n\nYou agree NOT to:\n- Use the service for any illegal purposes\n- Attempt to gain unauthorized access to our systems\n- Interfere with or disrupt the service\n- Upload malicious code or viruses\n- Violate any applicable laws or regulations\n\n## 5. Privacy and Data Protection\n\n- We collect and process data as described in our Privacy Policy\n- You retain ownership of your data\n- We implement industry-standard security measures\n- We comply with applicable data protection laws\n\n## 6. Subscription and Payments\n\n### 6.1 Subscription Plans\n- Various subscription tiers are available\n- Prices are subject to change with notice\n- Subscriptions auto-renew unless cancelled\n\n### 6.2 Refunds\n- Refund policy applies as per our Refund Policy\n- No refunds for partial months\n- Contact support for refund requests\n\n## 7. Intellectual Property\n\n- Rev Winner and its content are protected by copyright\n- You may not copy, modify, or distribute our content\n- Your data remains your property\n\n## 8. Limitation of Liability\n\nRev Winner is provided "as is" without warranties. We are not liable for:\n- Service interruptions or downtime\n- Data loss or corruption\n- Indirect or consequential damages\n- Third-party actions or content\n\n## 9. Termination\n\nWe may terminate or suspend your account if you:\n- Violate these terms\n- Engage in fraudulent activity\n- Fail to pay subscription fees\n\n## 10. Changes to Terms\n\n- We may update these terms at any time\n- Continued use constitutes acceptance of changes\n- We will notify users of significant changes\n\n## 11. Governing Law\n\nThese terms are governed by the laws of India.\n\n## 12. Contact Information\n\nFor questions about these terms:\n- Email: support@revwinner.com\n- Website: https://revwinner.com\n\n---\n\n**Last Updated:** November 2025\n	1.0	t	c2af625b-64b0-43be-b9c0-a233115deba5	2026-02-22 07:48:09.357253	2026-02-22 07:48:09.357253
\.


--
-- Data for Name: time_extensions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.time_extensions (id, user_id, extension_type, extension_value, reason, granted_by, status, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: traffic_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.traffic_logs (id, ip_address, country, state, city, device_type, browser, visited_page, visit_time) FROM stdin;
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
\.


--
-- Data for Name: training_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.training_documents (id, domain_expertise_id, user_id, file_name, file_type, file_url, content, content_source, audio_duration, summary, summary_status, summary_error, last_summarized_at, metadata, processing_status, processing_error, knowledge_extracted_at, content_hash, uploaded_at, updated_at) FROM stdin;
d29b4dc6-8175-4a60-8768-5c0bfef771f9	0688e5b5-1dbc-4b89-86ce-47f10d69be21	82cb8c83-fc1b-4fa3-b87d-990418225797	Superset_Not Verified.pdf	pdf		\n\n-- 1 of 1 --\n\n	extraction	\N	\N	not_generated	\N	\N	{"size": 114895, "pageCount": 1, "wordCount": 7, "extractedFrom": "pdf"}	completed	\N	2026-02-22 10:14:35.135	196708383e254993e15bdf1d5127dc52d849497aac5f1341bec99b62c37349f0	2026-02-22 10:14:23.483532	2026-02-22 10:14:35.16
49fcaa0b-1d92-4471-887b-2976d8faddee	0688e5b5-1dbc-4b89-86ce-47f10d69be21	82cb8c83-fc1b-4fa3-b87d-990418225797	contractor_water_department_prajwal_atmaram_bhide.pdf	pdf		CONTRACTOR APPLICATION & TECHNICAL\nPROPOSAL DOCUMENT\nSubmitted by: Contractor – Mr. Prajwal Atmaram Bhide\nCover Letter\nI, Prajwal Atmaram Bhide, hereby submit my application in response to the tender issued by the\nWater Supply and Sanitation Department for water infrastructure development work. I confirm that I\nhave thoroughly reviewed the tender document and possess the required technical expertise,\nskilled manpower, equipment, and financial capability to execute the project successfully within the\ngiven timeframe. I assure adherence to all departmental guidelines, safety standards, and quality\nrequirements.\nContractor Profile\nName: Prajwal Atmaram Bhide\nBusiness Type: Civil Engineering and Water Infrastructure Contractor\nLocation: Maharashtra, India\nExperience: 5+ years in civil works, pipeline projects, and infrastructure development\nExpertise: Water pipeline installation, infrastructure construction, pump installation, and\nmaintenance\nProject Understanding\nThe project involves development, repair, and enhancement of water supply infrastructure to\nensure efficient and uninterrupted water distribution to the public.\nScope of Work\n• Site survey and route planning\n• Excavation and trench preparation\n• Pipeline laying and installation\n• Installation of valves and pump systems\n• Testing, commissioning, and final project handover\nExecution Strategy\nThe work will be carried out in structured phases including planning, mobilization, execution,\ntesting, and final inspection to ensure quality and timely completion.\nEquipment and Machinery\nDeployment of excavators, trenching equipment, pipe cutting tools, welding machines, pumps, and\nsafety equipment for efficient execution.\nManpower Deployment\n\n-- 1 of 2 --\n\nQualified Site Engineers, Supervisors, Skilled Technicians, Helpers, and Safety Officers will be\ndeployed to ensure smooth project completion.\nProject Timeline\nEstimated project completion duration: 50 days including planning, execution, testing, and final\nhandover.\nSafety and Quality Assurance\nStrict adherence to safety protocols including PPE usage, hazard monitoring, and quality\ninspections. Pipeline testing and quality verification will be conducted regularly.\nDeclaration\nI, Prajwal Atmaram Bhide, hereby declare that the information provided is true and I agree to\nexecute the project as per Water Department rules and regulations.\nContractor Signature: Prajwal Atmaram Bhide\nDate: 19 February 2026\n\n-- 2 of 2 --\n\n	extraction	\N	\N	not_generated	\N	\N	{"size": 4031, "pageCount": 2, "wordCount": 332, "extractedFrom": "pdf"}	completed	\N	\N	\N	2026-02-22 10:33:20.364055	2026-02-22 10:33:20.364055
\.


--
-- Data for Name: user_entitlements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_entitlements (id, user_id, organization_id, has_platform_access, platform_access_expires_at, session_minutes_balance, session_minutes_expires_at, has_train_me, train_me_expires_at, has_dai, dai_tokens_balance, dai_expires_at, is_enterprise_user, enterprise_train_me_enabled, enterprise_dai_enabled, last_calculated_at, updated_at) FROM stdin;
74c3a02a-bdcd-4aab-b042-56185e28df3a	2cddba37-2b80-46f8-893f-a6622cce384c	\N	t	\N	180	\N	f	\N	f	0	\N	f	f	f	2026-02-22 09:40:34.544937	2026-02-22 09:40:34.544937
d8414cb2-bcf8-4173-9d50-ac3c842fadd0	82cb8c83-fc1b-4fa3-b87d-990418225797	\N	t	2026-03-24 09:59:41.728	6500	2026-03-24 10:31:12.951	t	2026-03-24 10:27:46.249	f	0	2026-03-24 09:59:40.216	f	f	f	2026-02-22 10:31:15.185	2026-02-22 10:31:15.185
57644a7b-35b7-4cad-bf4f-96cb95f43115	8eaabe7e-246a-4e3c-8d5a-205011ccc478	\N	f	\N	7000	2026-03-24 12:47:52.607	t	2026-03-24 12:47:53.885	f	0	2026-03-24 12:47:53.226	f	f	f	2026-02-22 12:47:55.932	2026-02-22 12:47:55.932
\.


--
-- Data for Name: user_feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_feedback (id, user_id, conversation_id, rating, feedback, category, status, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
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
-- Name: addon_purchases addon_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addon_purchases
    ADD CONSTRAINT addon_purchases_pkey PRIMARY KEY (id);


--
-- Name: addons addons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addons
    ADD CONSTRAINT addons_pkey PRIMARY KEY (id);


--
-- Name: addons addons_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addons
    ADD CONSTRAINT addons_slug_key UNIQUE (slug);


--
-- Name: ai_token_usage ai_token_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_token_usage
    ADD CONSTRAINT ai_token_usage_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: api_key_usage_logs api_key_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_key_usage_logs
    ADD CONSTRAINT api_key_usage_logs_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: audio_sources audio_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_sources
    ADD CONSTRAINT audio_sources_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: auth_users auth_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_email_key UNIQUE (email);


--
-- Name: auth_users auth_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_pkey PRIMARY KEY (id);


--
-- Name: auth_users auth_users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_username_key UNIQUE (username);


--
-- Name: billing_adjustments billing_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_adjustments
    ADD CONSTRAINT billing_adjustments_pkey PRIMARY KEY (id);


--
-- Name: call_meeting_minutes call_meeting_minutes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_meeting_minutes
    ADD CONSTRAINT call_meeting_minutes_pkey PRIMARY KEY (id);


--
-- Name: call_recordings call_recordings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_recordings
    ADD CONSTRAINT call_recordings_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: case_studies case_studies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_studies
    ADD CONSTRAINT case_studies_pkey PRIMARY KEY (id);


--
-- Name: conversation_minutes_backup conversation_minutes_backup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_minutes_backup
    ADD CONSTRAINT conversation_minutes_backup_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: domain_expertise domain_expertise_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.domain_expertise
    ADD CONSTRAINT domain_expertise_pkey PRIMARY KEY (id);


--
-- Name: enterprise_user_assignments enterprise_user_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_user_assignments
    ADD CONSTRAINT enterprise_user_assignments_pkey PRIMARY KEY (id);


--
-- Name: enterprise_user_assignments enterprise_user_assignments_user_id_license_package_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_user_assignments
    ADD CONSTRAINT enterprise_user_assignments_user_id_license_package_id_key UNIQUE (user_id, license_package_id);


--
-- Name: gateway_providers gateway_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gateway_providers
    ADD CONSTRAINT gateway_providers_pkey PRIMARY KEY (id);


--
-- Name: gateway_providers gateway_providers_provider_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gateway_providers
    ADD CONSTRAINT gateway_providers_provider_name_key UNIQUE (provider_name);


--
-- Name: gateway_transactions gateway_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gateway_transactions
    ADD CONSTRAINT gateway_transactions_pkey PRIMARY KEY (id);


--
-- Name: gateway_webhooks gateway_webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gateway_webhooks
    ADD CONSTRAINT gateway_webhooks_pkey PRIMARY KEY (id);


--
-- Name: knowledge_entries knowledge_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_entries
    ADD CONSTRAINT knowledge_entries_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: license_assignments license_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_assignments
    ADD CONSTRAINT license_assignments_pkey PRIMARY KEY (id);


--
-- Name: license_packages license_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_packages
    ADD CONSTRAINT license_packages_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: organization_addons organization_addons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_addons
    ADD CONSTRAINT organization_addons_pkey PRIMARY KEY (id);


--
-- Name: organization_memberships organization_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: otps otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pending_orders pending_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_orders
    ADD CONSTRAINT pending_orders_pkey PRIMARY KEY (id);


--
-- Name: products products_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_code_key UNIQUE (code);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: promo_codes promo_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_code_key UNIQUE (code);


--
-- Name: promo_codes promo_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promo_codes
    ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- Name: sales_intelligence_exports sales_intelligence_exports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_intelligence_exports
    ADD CONSTRAINT sales_intelligence_exports_pkey PRIMARY KEY (id);


--
-- Name: sales_intelligence_knowledge sales_intelligence_knowledge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_intelligence_knowledge
    ADD CONSTRAINT sales_intelligence_knowledge_pkey PRIMARY KEY (id);


--
-- Name: sales_intelligence_learning_logs sales_intelligence_learning_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_intelligence_learning_logs
    ADD CONSTRAINT sales_intelligence_learning_logs_pkey PRIMARY KEY (id);


--
-- Name: sales_intelligence_suggestions sales_intelligence_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_intelligence_suggestions
    ADD CONSTRAINT sales_intelligence_suggestions_pkey PRIMARY KEY (id);


--
-- Name: session_minutes_purchases session_minutes_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_minutes_purchases
    ADD CONSTRAINT session_minutes_purchases_pkey PRIMARY KEY (id);


--
-- Name: session_minutes_usage session_minutes_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_minutes_usage
    ADD CONSTRAINT session_minutes_usage_pkey PRIMARY KEY (id);


--
-- Name: session_usage session_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_usage
    ADD CONSTRAINT session_usage_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: super_user_overrides super_user_overrides_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_user_overrides
    ADD CONSTRAINT super_user_overrides_email_key UNIQUE (email);


--
-- Name: super_user_overrides super_user_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.super_user_overrides
    ADD CONSTRAINT super_user_overrides_pkey PRIMARY KEY (id);


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- Name: system_config system_config_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_key_key UNIQUE (key);


--
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (id);


--
-- Name: system_metrics system_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_metrics
    ADD CONSTRAINT system_metrics_pkey PRIMARY KEY (id);


--
-- Name: terms_and_conditions terms_and_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.terms_and_conditions
    ADD CONSTRAINT terms_and_conditions_pkey PRIMARY KEY (id);


--
-- Name: time_extensions time_extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_extensions
    ADD CONSTRAINT time_extensions_pkey PRIMARY KEY (id);


--
-- Name: traffic_logs traffic_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.traffic_logs
    ADD CONSTRAINT traffic_logs_pkey PRIMARY KEY (id);


--
-- Name: training_documents training_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_documents
    ADD CONSTRAINT training_documents_pkey PRIMARY KEY (id);


--
-- Name: user_entitlements user_entitlements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entitlements
    ADD CONSTRAINT user_entitlements_pkey PRIMARY KEY (id);


--
-- Name: user_entitlements user_entitlements_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entitlements
    ADD CONSTRAINT user_entitlements_user_id_key UNIQUE (user_id);


--
-- Name: user_feedback user_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_feedback
    ADD CONSTRAINT user_feedback_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_addon_purchases_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_addon_purchases_user ON public.addon_purchases USING btree (user_id);


--
-- Name: idx_ai_token_usage_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_token_usage_user ON public.ai_token_usage USING btree (user_id);


--
-- Name: idx_api_key_usage_logs_api_key_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_key_usage_logs_api_key_id ON public.api_key_usage_logs USING btree (api_key_id);


--
-- Name: idx_api_key_usage_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_key_usage_logs_created_at ON public.api_key_usage_logs USING btree (created_at);


--
-- Name: idx_api_keys_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_created_by ON public.api_keys USING btree (created_by);


--
-- Name: idx_api_keys_organization_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_organization_id ON public.api_keys USING btree (organization_id);


--
-- Name: idx_api_keys_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_status ON public.api_keys USING btree (status);


--
-- Name: idx_audio_sources_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audio_sources_conversation ON public.audio_sources USING btree (conversation_id);


--
-- Name: idx_audit_logs_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_actor ON public.audit_logs USING btree (actor_id);


--
-- Name: idx_billing_adjustments_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_adjustments_org ON public.billing_adjustments USING btree (organization_id);


--
-- Name: idx_billing_adjustments_package; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_adjustments_package ON public.billing_adjustments USING btree (license_package_id);


--
-- Name: idx_billing_adjustments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_billing_adjustments_status ON public.billing_adjustments USING btree (status);


--
-- Name: idx_cart_items_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cart_items_user ON public.cart_items USING btree (user_id);


--
-- Name: idx_case_studies_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_case_studies_active ON public.case_studies USING btree (is_active);


--
-- Name: idx_case_studies_industry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_case_studies_industry ON public.case_studies USING btree (industry);


--
-- Name: idx_conversation_minutes_backup_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_minutes_backup_conversation ON public.conversation_minutes_backup USING btree (conversation_id);


--
-- Name: idx_conversation_minutes_backup_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversation_minutes_backup_user ON public.conversation_minutes_backup USING btree (user_id);


--
-- Name: idx_conversations_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_user ON public.conversations USING btree (user_id);


--
-- Name: idx_domain_expertise_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_domain_expertise_user ON public.domain_expertise USING btree (user_id);


--
-- Name: idx_enterprise_assignments_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enterprise_assignments_email ON public.enterprise_user_assignments USING btree (user_email);


--
-- Name: idx_enterprise_assignments_license; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enterprise_assignments_license ON public.enterprise_user_assignments USING btree (license_package_id);


--
-- Name: idx_enterprise_assignments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enterprise_assignments_status ON public.enterprise_user_assignments USING btree (status);


--
-- Name: idx_enterprise_assignments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enterprise_assignments_user ON public.enterprise_user_assignments USING btree (user_id);


--
-- Name: idx_gateway_transactions_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gateway_transactions_org ON public.gateway_transactions USING btree (organization_id);


--
-- Name: idx_gateway_transactions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gateway_transactions_user ON public.gateway_transactions USING btree (user_id);


--
-- Name: idx_gateway_webhooks_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gateway_webhooks_provider ON public.gateway_webhooks USING btree (provider_id);


--
-- Name: idx_knowledge_entries_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_knowledge_entries_domain ON public.knowledge_entries USING btree (domain_expertise_id);


--
-- Name: idx_license_assignments_package; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_license_assignments_package ON public.license_assignments USING btree (license_package_id);


--
-- Name: idx_license_packages_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_license_packages_org ON public.license_packages USING btree (organization_id);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id);


--
-- Name: idx_minutes_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_minutes_expires ON public.call_meeting_minutes USING btree (expires_at);


--
-- Name: idx_minutes_recording; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_minutes_recording ON public.call_meeting_minutes USING btree (recording_id);


--
-- Name: idx_minutes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_minutes_status ON public.call_meeting_minutes USING btree (status);


--
-- Name: idx_minutes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_minutes_user ON public.call_meeting_minutes USING btree (user_id);


--
-- Name: idx_org_addons_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_addons_org ON public.organization_addons USING btree (organization_id);


--
-- Name: idx_org_addons_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_addons_status ON public.organization_addons USING btree (status);


--
-- Name: idx_org_addons_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_addons_type ON public.organization_addons USING btree (type);


--
-- Name: idx_organization_memberships_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organization_memberships_org ON public.organization_memberships USING btree (organization_id);


--
-- Name: idx_otps_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_otps_email ON public.otps USING btree (email);


--
-- Name: idx_password_reset_tokens_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens USING btree (email);


--
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_payments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_user ON public.payments USING btree (user_id);


--
-- Name: idx_pending_orders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pending_orders_user ON public.pending_orders USING btree (user_id);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_active ON public.products USING btree (is_active);


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category ON public.products USING btree (category);


--
-- Name: idx_products_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_code ON public.products USING btree (code);


--
-- Name: idx_recordings_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recordings_expires ON public.call_recordings USING btree (expires_at);


--
-- Name: idx_recordings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recordings_status ON public.call_recordings USING btree (status);


--
-- Name: idx_recordings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recordings_user ON public.call_recordings USING btree (user_id);


--
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_expire ON public.sessions USING btree (expire);


--
-- Name: idx_session_minutes_consumed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_minutes_consumed_at ON public.session_minutes_usage USING btree (consumed_at);


--
-- Name: idx_session_minutes_purchase; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_minutes_purchase ON public.session_minutes_usage USING btree (purchase_id);


--
-- Name: idx_session_minutes_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_minutes_user ON public.session_minutes_usage USING btree (user_id);


--
-- Name: idx_session_usage_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_session_usage_user ON public.session_usage USING btree (user_id);


--
-- Name: idx_subscriptions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_user ON public.subscriptions USING btree (user_id);


--
-- Name: idx_system_config_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_config_key ON public.system_config USING btree (key);


--
-- Name: idx_system_config_section; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_config_section ON public.system_config USING btree (section);


--
-- Name: idx_terms_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_terms_active ON public.terms_and_conditions USING btree (is_active);


--
-- Name: idx_terms_version; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_terms_version ON public.terms_and_conditions USING btree (version);


--
-- Name: idx_training_documents_domain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_training_documents_domain ON public.training_documents USING btree (domain_expertise_id);


--
-- Name: idx_user_entitlements_org; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_entitlements_org ON public.user_entitlements USING btree (organization_id);


--
-- Name: idx_user_entitlements_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_entitlements_user ON public.user_entitlements USING btree (user_id);


--
-- Name: addon_purchases addon_purchases_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addon_purchases
    ADD CONSTRAINT addon_purchases_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: addon_purchases addon_purchases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addon_purchases
    ADD CONSTRAINT addon_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: ai_token_usage ai_token_usage_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_token_usage
    ADD CONSTRAINT ai_token_usage_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: ai_token_usage ai_token_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_token_usage
    ADD CONSTRAINT ai_token_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.auth_users(id);


--
-- Name: api_key_usage_logs api_key_usage_logs_api_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_key_usage_logs
    ADD CONSTRAINT api_key_usage_logs_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES public.api_keys(id) ON DELETE CASCADE;


--
-- Name: api_keys api_keys_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: api_keys api_keys_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: api_keys api_keys_revoked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_revoked_by_fkey FOREIGN KEY (revoked_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: audio_sources audio_sources_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_sources
    ADD CONSTRAINT audio_sources_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.auth_users(id);


--
-- Name: billing_adjustments billing_adjustments_added_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_adjustments
    ADD CONSTRAINT billing_adjustments_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.auth_users(id);


--
-- Name: billing_adjustments billing_adjustments_license_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_adjustments
    ADD CONSTRAINT billing_adjustments_license_package_id_fkey FOREIGN KEY (license_package_id) REFERENCES public.license_packages(id);


--
-- Name: billing_adjustments billing_adjustments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_adjustments
    ADD CONSTRAINT billing_adjustments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: call_meeting_minutes call_meeting_minutes_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_meeting_minutes
    ADD CONSTRAINT call_meeting_minutes_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: call_meeting_minutes call_meeting_minutes_recording_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_meeting_minutes
    ADD CONSTRAINT call_meeting_minutes_recording_id_fkey FOREIGN KEY (recording_id) REFERENCES public.call_recordings(id) ON DELETE SET NULL;


--
-- Name: call_meeting_minutes call_meeting_minutes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_meeting_minutes
    ADD CONSTRAINT call_meeting_minutes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: call_recordings call_recordings_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_recordings
    ADD CONSTRAINT call_recordings_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: call_recordings call_recordings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.call_recordings
    ADD CONSTRAINT call_recordings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: conversation_minutes_backup conversation_minutes_backup_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_minutes_backup
    ADD CONSTRAINT conversation_minutes_backup_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_minutes_backup conversation_minutes_backup_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_minutes_backup
    ADD CONSTRAINT conversation_minutes_backup_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: domain_expertise domain_expertise_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.domain_expertise
    ADD CONSTRAINT domain_expertise_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: enterprise_user_assignments enterprise_user_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_user_assignments
    ADD CONSTRAINT enterprise_user_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.auth_users(id);


--
-- Name: enterprise_user_assignments enterprise_user_assignments_license_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_user_assignments
    ADD CONSTRAINT enterprise_user_assignments_license_package_id_fkey FOREIGN KEY (license_package_id) REFERENCES public.license_packages(id) ON DELETE CASCADE;


--
-- Name: enterprise_user_assignments enterprise_user_assignments_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_user_assignments
    ADD CONSTRAINT enterprise_user_assignments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: enterprise_user_assignments enterprise_user_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enterprise_user_assignments
    ADD CONSTRAINT enterprise_user_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: gateway_transactions gateway_transactions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gateway_transactions
    ADD CONSTRAINT gateway_transactions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: gateway_transactions gateway_transactions_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gateway_transactions
    ADD CONSTRAINT gateway_transactions_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.gateway_providers(id);


--
-- Name: gateway_transactions gateway_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gateway_transactions
    ADD CONSTRAINT gateway_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: gateway_webhooks gateway_webhooks_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gateway_webhooks
    ADD CONSTRAINT gateway_webhooks_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.gateway_providers(id);


--
-- Name: knowledge_entries knowledge_entries_domain_expertise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_entries
    ADD CONSTRAINT knowledge_entries_domain_expertise_id_fkey FOREIGN KEY (domain_expertise_id) REFERENCES public.domain_expertise(id);


--
-- Name: knowledge_entries knowledge_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knowledge_entries
    ADD CONSTRAINT knowledge_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: license_assignments license_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_assignments
    ADD CONSTRAINT license_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.auth_users(id);


--
-- Name: license_assignments license_assignments_license_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_assignments
    ADD CONSTRAINT license_assignments_license_package_id_fkey FOREIGN KEY (license_package_id) REFERENCES public.license_packages(id);


--
-- Name: license_assignments license_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_assignments
    ADD CONSTRAINT license_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: license_packages license_packages_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_packages
    ADD CONSTRAINT license_packages_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: organization_addons organization_addons_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_addons
    ADD CONSTRAINT organization_addons_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_memberships organization_memberships_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- Name: organization_memberships organization_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organization_memberships
    ADD CONSTRAINT organization_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: organizations organizations_primary_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_primary_manager_id_fkey FOREIGN KEY (primary_manager_id) REFERENCES public.auth_users(id);


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: pending_orders pending_orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pending_orders
    ADD CONSTRAINT pending_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: refunds refunds_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- Name: refunds refunds_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.auth_users(id);


--
-- Name: refunds refunds_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: sales_intelligence_exports sales_intelligence_exports_exported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_intelligence_exports
    ADD CONSTRAINT sales_intelligence_exports_exported_by_fkey FOREIGN KEY (exported_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: sales_intelligence_knowledge sales_intelligence_knowledge_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_intelligence_knowledge
    ADD CONSTRAINT sales_intelligence_knowledge_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: sales_intelligence_learning_logs sales_intelligence_learning_logs_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_intelligence_learning_logs
    ADD CONSTRAINT sales_intelligence_learning_logs_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: sales_intelligence_learning_logs sales_intelligence_learning_logs_promoted_knowledge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_intelligence_learning_logs
    ADD CONSTRAINT sales_intelligence_learning_logs_promoted_knowledge_id_fkey FOREIGN KEY (promoted_knowledge_id) REFERENCES public.sales_intelligence_knowledge(id) ON DELETE SET NULL;


--
-- Name: sales_intelligence_learning_logs sales_intelligence_learning_logs_suggestion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_intelligence_learning_logs
    ADD CONSTRAINT sales_intelligence_learning_logs_suggestion_id_fkey FOREIGN KEY (suggestion_id) REFERENCES public.sales_intelligence_suggestions(id) ON DELETE CASCADE;


--
-- Name: sales_intelligence_learning_logs sales_intelligence_learning_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_intelligence_learning_logs
    ADD CONSTRAINT sales_intelligence_learning_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: sales_intelligence_suggestions sales_intelligence_suggestions_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_intelligence_suggestions
    ADD CONSTRAINT sales_intelligence_suggestions_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: sales_intelligence_suggestions sales_intelligence_suggestions_knowledge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_intelligence_suggestions
    ADD CONSTRAINT sales_intelligence_suggestions_knowledge_id_fkey FOREIGN KEY (knowledge_id) REFERENCES public.sales_intelligence_knowledge(id) ON DELETE SET NULL;


--
-- Name: sales_intelligence_suggestions sales_intelligence_suggestions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_intelligence_suggestions
    ADD CONSTRAINT sales_intelligence_suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: session_minutes_purchases session_minutes_purchases_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_minutes_purchases
    ADD CONSTRAINT session_minutes_purchases_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: session_minutes_purchases session_minutes_purchases_refunded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_minutes_purchases
    ADD CONSTRAINT session_minutes_purchases_refunded_by_fkey FOREIGN KEY (refunded_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: session_minutes_purchases session_minutes_purchases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_minutes_purchases
    ADD CONSTRAINT session_minutes_purchases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: session_minutes_usage session_minutes_usage_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_minutes_usage
    ADD CONSTRAINT session_minutes_usage_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: session_minutes_usage session_minutes_usage_purchase_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_minutes_usage
    ADD CONSTRAINT session_minutes_usage_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.addon_purchases(id) ON DELETE CASCADE;


--
-- Name: session_minutes_usage session_minutes_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_minutes_usage
    ADD CONSTRAINT session_minutes_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: session_usage session_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_usage
    ADD CONSTRAINT session_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: support_tickets support_tickets_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.auth_users(id);


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: system_config system_config_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.auth_users(id) ON DELETE SET NULL;


--
-- Name: terms_and_conditions terms_and_conditions_last_modified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.terms_and_conditions
    ADD CONSTRAINT terms_and_conditions_last_modified_by_fkey FOREIGN KEY (last_modified_by) REFERENCES public.auth_users(id);


--
-- Name: time_extensions time_extensions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_extensions
    ADD CONSTRAINT time_extensions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.auth_users(id);


--
-- Name: time_extensions time_extensions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_extensions
    ADD CONSTRAINT time_extensions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: training_documents training_documents_domain_expertise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_documents
    ADD CONSTRAINT training_documents_domain_expertise_id_fkey FOREIGN KEY (domain_expertise_id) REFERENCES public.domain_expertise(id);


--
-- Name: training_documents training_documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_documents
    ADD CONSTRAINT training_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id);


--
-- Name: user_entitlements user_entitlements_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entitlements
    ADD CONSTRAINT user_entitlements_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;


--
-- Name: user_entitlements user_entitlements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_entitlements
    ADD CONSTRAINT user_entitlements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- Name: user_feedback user_feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_feedback
    ADD CONSTRAINT user_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.auth_users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict nh7AYbn3GhhzWki1wfMN4zyy1i7xkobwlscFHLn4PVWVgsU5QtdF8cdv1QPb8cQ

