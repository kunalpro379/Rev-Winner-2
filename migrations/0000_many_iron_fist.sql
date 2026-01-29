CREATE TABLE "activation_invites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"assignment_id" varchar NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"recipient_name" varchar(255),
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"accepted_at" timestamp,
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "activation_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "addon_purchases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"organization_id" varchar,
	"addon_type" varchar(50) NOT NULL,
	"package_sku" varchar(100) NOT NULL,
	"billing_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"purchase_amount" varchar(20) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"gateway_transaction_id" varchar,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"auto_renew" boolean DEFAULT false,
	"total_units" integer NOT NULL,
	"used_units" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"parent_purchase_id" varchar(255),
	"renewal_scheduled_at" timestamp,
	"refunded_at" timestamp,
	"refund_amount" varchar(20),
	"refund_reason" text,
	"gateway_refund_id" varchar(255),
	"refunded_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "addons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"billing_interval" varchar(20),
	"pricing_tiers" jsonb,
	"flat_price" varchar(20),
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true,
	"published_on_website" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "addons_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "addons_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"addon_id" varchar NOT NULL,
	"version_number" integer NOT NULL,
	"change_type" varchar(20) NOT NULL,
	"reason_code" varchar(50) NOT NULL,
	"reason_detail" text,
	"snapshot" jsonb NOT NULL,
	"effective_start_at" timestamp NOT NULL,
	"effective_end_at" timestamp,
	"committed_at" timestamp DEFAULT now() NOT NULL,
	"committed_by" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_actions_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"action_type" varchar(100) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" varchar(255),
	"changes" jsonb DEFAULT '{}'::jsonb,
	"reason" text NOT NULL,
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_token_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"organization_id" varchar,
	"provider" varchar(20) NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"request_id" varchar(255),
	"feature" varchar(50),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"target_audience" varchar(50) DEFAULT 'all' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_key_usage_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key_id" varchar NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"method" varchar(10) NOT NULL,
	"status_code" integer,
	"response_time" integer,
	"ip_address" varchar(45),
	"user_agent" text,
	"request_body" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"key_prefix" varchar(10) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"created_by" varchar NOT NULL,
	"organization_id" varchar,
	"scopes" text[] DEFAULT '{}',
	"rate_limit" integer DEFAULT 1000,
	"rate_limit_window" varchar(20) DEFAULT 'hour',
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_used_at" timestamp,
	"usage_count" integer DEFAULT 0,
	"expires_at" timestamp,
	"ip_whitelist" text[],
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"revoked_at" timestamp,
	"revoked_by" varchar
);
--> statement-breakpoint
CREATE TABLE "audio_sources" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text,
	"teams_meeting_id" varchar,
	"status" text DEFAULT 'active' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"connected_at" timestamp DEFAULT now(),
	"disconnected_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" varchar,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(50),
	"target_id" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"mobile" varchar(20),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"organization" varchar(255),
	"username" varchar(100) NOT NULL,
	"hashed_password" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"trial_start_date" timestamp,
	"trial_end_date" timestamp,
	"train_me_subscription_date" timestamp,
	"email_verified" boolean DEFAULT false,
	"stripe_customer_id" varchar(255),
	"ai_engine" varchar(50),
	"encrypted_api_key" text,
	"ai_engine_setup_completed" boolean DEFAULT false,
	"terms_accepted" boolean DEFAULT false,
	"terms_accepted_at" timestamp,
	"session_version" integer DEFAULT 0 NOT NULL,
	"call_recording_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "auth_users_email_unique" UNIQUE("email"),
	CONSTRAINT "auth_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "billing_adjustments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"license_package_id" varchar,
	"adjustment_type" varchar(50) NOT NULL,
	"delta_seats" integer NOT NULL,
	"razorpay_order_id" varchar(255),
	"razorpay_payment_id" varchar(255),
	"amount" varchar(20) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"processed_at" timestamp,
	"added_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "buyer_stages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"stage" varchar(50) NOT NULL,
	"confidence" varchar(10),
	"signals" text[],
	"detected_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "call_meeting_minutes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"conversation_id" varchar,
	"recording_id" varchar,
	"title" varchar(255),
	"summary" text,
	"key_points" jsonb DEFAULT '[]'::jsonb,
	"action_items" jsonb DEFAULT '[]'::jsonb,
	"participants" jsonb DEFAULT '[]'::jsonb,
	"pain_points" jsonb DEFAULT '[]'::jsonb,
	"recommendations" jsonb DEFAULT '[]'::jsonb,
	"next_steps" jsonb DEFAULT '[]'::jsonb,
	"full_transcript" text,
	"structured_minutes" jsonb,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "call_recordings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"conversation_id" varchar,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"duration" integer,
	"recording_url" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"package_sku" varchar(100) NOT NULL,
	"addon_type" varchar(50) NOT NULL,
	"package_name" varchar(255) NOT NULL,
	"base_price" varchar(20) NOT NULL,
	"currency" varchar(10) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"purchase_mode" varchar(20) DEFAULT 'user' NOT NULL,
	"team_manager_name" varchar(255),
	"team_manager_email" varchar(255),
	"company_name" varchar(255),
	"promo_code_id" varchar,
	"promo_code_code" varchar(50),
	"applied_discount_amount" varchar(20),
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "case_studies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"industry" varchar(100),
	"product_codes" text[],
	"problem_statement" text NOT NULL,
	"solution" text NOT NULL,
	"implementation" text,
	"outcomes" jsonb NOT NULL,
	"customer_size" varchar(50),
	"time_to_value" varchar(100),
	"tags" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversation_intents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"message_id" varchar,
	"intent" varchar(100) NOT NULL,
	"confidence" varchar(10),
	"entities" jsonb,
	"detected_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversation_memories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"spin_situation" text,
	"spin_problems" text[],
	"spin_implications" text[],
	"spin_need_payoff" text[],
	"meddic_metrics" jsonb,
	"meddic_economic_buyer" text,
	"meddic_decision_criteria" text[],
	"meddic_decision_process" text,
	"meddic_pain" text[],
	"meddic_champion" text,
	"challenger_teachings" text[],
	"challenger_tailoring" jsonb,
	"challenger_control" text,
	"bant_budget" text,
	"bant_authority" text,
	"bant_need" text,
	"bant_timeline" text,
	"buyer_stage" varchar(50),
	"conversation_tone" varchar(50),
	"objections" text[],
	"urgency_level" varchar(20),
	"engagement_score" integer,
	"key_insights" text[],
	"customer_persona" jsonb,
	"competitive_landscape" jsonb,
	"success_metrics" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversation_minutes_backup" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"user_id" varchar,
	"client_name" text,
	"company_name" text,
	"industry" text,
	"meeting_date" timestamp,
	"meeting_duration_minutes" integer,
	"executive_summary" text,
	"key_topics_discussed" jsonb DEFAULT '[]'::jsonb,
	"client_pain_points" jsonb DEFAULT '[]'::jsonb,
	"client_requirements" jsonb DEFAULT '[]'::jsonb,
	"solutions_proposed" jsonb DEFAULT '[]'::jsonb,
	"competitors_discussed" jsonb DEFAULT '[]'::jsonb,
	"objections" jsonb DEFAULT '[]'::jsonb,
	"action_items" jsonb DEFAULT '[]'::jsonb,
	"next_steps" jsonb DEFAULT '[]'::jsonb,
	"full_transcript" text,
	"message_count" integer DEFAULT 0,
	"key_quotes" jsonb DEFAULT '[]'::jsonb,
	"marketing_hooks" jsonb DEFAULT '[]'::jsonb,
	"best_practices" jsonb DEFAULT '[]'::jsonb,
	"challenges_identified" jsonb DEFAULT '[]'::jsonb,
	"success_indicators" jsonb DEFAULT '[]'::jsonb,
	"raw_minutes_data" jsonb DEFAULT '{}'::jsonb,
	"discovery_insights" jsonb DEFAULT '{}'::jsonb,
	"backup_status" text DEFAULT 'pending',
	"backup_source" text DEFAULT 'manual',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"user_id" varchar,
	"client_name" text,
	"status" text DEFAULT 'active' NOT NULL,
	"discovery_insights" jsonb DEFAULT '{}'::jsonb,
	"call_summary" text,
	"created_at" timestamp DEFAULT now(),
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "dai_usage_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"purchase_id" varchar NOT NULL,
	"conversation_id" varchar,
	"feature_used" varchar(100) NOT NULL,
	"tokens_consumed" integer NOT NULL,
	"model_used" varchar(100),
	"prompt" text,
	"response" text,
	"consumed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_expertise" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"company_domain" varchar(255),
	"is_shared" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enterprise_promo_code_usages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promo_code_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"license_package_id" varchar NOT NULL,
	"discount_applied" varchar(20) NOT NULL,
	"original_amount" varchar(20) NOT NULL,
	"final_amount" varchar(20) NOT NULL,
	"used_by" varchar NOT NULL,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enterprise_promo_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" varchar(20) NOT NULL,
	"applicable_packages" varchar(100)[],
	"minimum_seats" integer,
	"max_uses" varchar(10),
	"uses_count" varchar(10) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true,
	"valid_from" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"created_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "enterprise_promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "enterprise_user_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"user_id" varchar,
	"user_email" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending_activation' NOT NULL,
	"activation_token" varchar(255),
	"activation_token_expires_at" timestamp,
	"activated_at" timestamp,
	"train_me_enabled" boolean DEFAULT false,
	"dai_enabled" boolean DEFAULT false,
	"assigned_by" varchar,
	"assigned_at" timestamp DEFAULT now(),
	"revoked_by" varchar,
	"revoked_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gateway_providers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"configuration" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "gateway_providers_provider_name_unique" UNIQUE("provider_name")
);
--> statement-breakpoint
CREATE TABLE "gateway_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" varchar NOT NULL,
	"provider_transaction_id" varchar(255),
	"transaction_type" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"amount" varchar(20) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"user_id" varchar,
	"organization_id" varchar,
	"related_entity" varchar(50),
	"related_entity_id" varchar(255),
	"payload" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gateway_webhooks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" varchar NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"signature" text,
	"verified" boolean DEFAULT false,
	"processed" boolean DEFAULT false,
	"processed_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "implementation_playbooks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"product_codes" text[],
	"scenario" text NOT NULL,
	"steps" jsonb NOT NULL,
	"prerequisites" text[],
	"common_challenges" jsonb,
	"success_metrics" text[],
	"tags" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_expertise_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"category" varchar(30) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb,
	"keywords" text[],
	"source_document_ids" text[],
	"content_hash" varchar(64),
	"embedding" jsonb,
	"confidence" integer DEFAULT 80,
	"is_verified" boolean DEFAULT false,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" varchar NOT NULL,
	"company" text,
	"phone" text,
	"message" text,
	"lead_type" text NOT NULL,
	"department" text,
	"total_seats" integer,
	"estimated_timeline" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "license_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"license_package_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"unassigned_at" timestamp,
	"assigned_by" varchar,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "license_packages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"package_type" varchar(50) NOT NULL,
	"total_seats" integer NOT NULL,
	"price_per_seat" varchar(20) NOT NULL,
	"total_amount" varchar(20) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"previous_package_id" varchar(255),
	"razorpay_subscription_id" varchar(255),
	"razorpay_order_id" varchar(255),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_access" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"granted_by" varchar NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"access_token" varchar(255),
	"password_setup" boolean DEFAULT false,
	"hashed_password" varchar(255),
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_generated_content" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"content_type" varchar(30) NOT NULL,
	"title" varchar(255),
	"content" text NOT NULL,
	"length" varchar(20),
	"tone" varchar(50),
	"hashtags" text[],
	"contact_details_included" boolean DEFAULT false,
	"data_source" varchar(20) DEFAULT 'data_bank',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_user_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"contact_website" varchar(255),
	"preferred_tone" varchar(50) DEFAULT 'professional',
	"default_hashtag_mode" varchar(20) DEFAULT 'auto',
	"data_bank_mode" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "marketing_user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"content" text NOT NULL,
	"sender" text NOT NULL,
	"speaker_label" text,
	"audio_source_id" varchar,
	"customer_identification" jsonb,
	"discovery_questions" jsonb,
	"case_studies" jsonb,
	"competitor_analysis" jsonb,
	"solution_recommendations" jsonb,
	"product_features" jsonb,
	"next_steps" jsonb,
	"bant_qualification" jsonb,
	"solutions" jsonb,
	"problem_statement" text,
	"recommended_solutions" jsonb,
	"suggested_next_prompt" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"billing_email" varchar(255) NOT NULL,
	"primary_manager_id" varchar,
	"razorpay_customer_id" varchar(255),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "otps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"code" varchar(10) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"attempts" varchar(10) DEFAULT '0' NOT NULL,
	"is_used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"subscription_id" varchar,
	"organization_id" varchar,
	"razorpay_order_id" varchar(255),
	"razorpay_payment_id" varchar(255),
	"razorpay_signature" varchar(500),
	"amount" varchar(20) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"status" varchar(20) NOT NULL,
	"payment_method" varchar(50),
	"receipt_url" varchar(500),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"refunded_at" timestamp,
	"refund_amount" varchar(20),
	"refund_reason" text,
	"razorpay_refund_id" varchar(255),
	"refunded_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pending_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"package_sku" varchar(100) NOT NULL,
	"addon_type" varchar(50) NOT NULL,
	"amount" varchar(20) NOT NULL,
	"currency" varchar(10) NOT NULL,
	"gateway_order_id" varchar(255) NOT NULL,
	"gateway_provider" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"expires_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"description" text NOT NULL,
	"key_features" text[],
	"use_cases" text[],
	"target_industries" text[],
	"pricing_model" varchar(100),
	"typical_price" varchar(100),
	"implementation_time" varchar(100),
	"integrates_with" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"category" varchar(50),
	"allowed_plan_types" jsonb,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" varchar(20) NOT NULL,
	"max_uses" varchar(10),
	"uses_count" varchar(10) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "prompt_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"feature" varchar(50) NOT NULL,
	"system_prompt" text NOT NULL,
	"example_inputs" jsonb,
	"example_outputs" jsonb,
	"output_schema" jsonb,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "prompt_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar(500) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" varchar(20) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"reason" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"razorpay_refund_id" varchar(255),
	"processed_by" varchar,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales_intelligence_exports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"export_name" text NOT NULL,
	"export_type" text NOT NULL,
	"date_range_start" timestamp,
	"date_range_end" timestamp,
	"intent_filter" text,
	"industry_filter" text,
	"record_count" integer DEFAULT 0,
	"export_data" jsonb DEFAULT '[]'::jsonb,
	"exported_by" varchar,
	"purpose" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales_intelligence_knowledge" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intent_type" text NOT NULL,
	"industry" text,
	"persona" text,
	"sales_stage" text,
	"trigger_keywords" jsonb DEFAULT '[]'::jsonb,
	"trigger_patterns" jsonb DEFAULT '[]'::jsonb,
	"suggested_response" text NOT NULL,
	"follow_up_prompt" text,
	"usage_count" integer DEFAULT 0,
	"acceptance_count" integer DEFAULT 0,
	"rejection_count" integer DEFAULT 0,
	"performance_score" integer DEFAULT 50,
	"is_validated" boolean DEFAULT false,
	"validated_by" varchar,
	"validated_at" timestamp,
	"source" text DEFAULT 'manual',
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales_intelligence_learning_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"suggestion_id" varchar,
	"conversation_id" varchar,
	"user_id" varchar,
	"customer_question" text NOT NULL,
	"detected_intent" text NOT NULL,
	"suggested_response" text NOT NULL,
	"rep_used_suggestion" boolean,
	"rep_modified_response" text,
	"outcome_signals" jsonb DEFAULT '{}'::jsonb,
	"industry" text,
	"persona" text,
	"sales_stage" text,
	"product_discussed" text,
	"is_anonymized" boolean DEFAULT false,
	"can_use_for_marketing" boolean DEFAULT true,
	"can_use_for_training" boolean DEFAULT true,
	"processing_status" text DEFAULT 'pending',
	"promoted_to_knowledge" boolean DEFAULT false,
	"promoted_knowledge_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sales_intelligence_suggestions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar,
	"user_id" varchar,
	"knowledge_id" varchar,
	"detected_intent" text NOT NULL,
	"intent_confidence" integer NOT NULL,
	"customer_question" text NOT NULL,
	"assembled_context" jsonb DEFAULT '{}'::jsonb,
	"suggested_response" text NOT NULL,
	"follow_up_prompt" text,
	"retrieval_confidence" integer NOT NULL,
	"was_displayed" boolean DEFAULT true,
	"was_used" boolean,
	"response_latency_ms" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_minutes_purchases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"organization_id" varchar,
	"minutes_purchased" integer NOT NULL,
	"minutes_used" integer DEFAULT 0 NOT NULL,
	"minutes_remaining" integer NOT NULL,
	"purchase_date" timestamp DEFAULT now() NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"razorpay_order_id" varchar(255),
	"razorpay_payment_id" varchar(255),
	"amount_paid" varchar(20) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"refunded_at" timestamp,
	"refund_amount" varchar(20),
	"refund_reason" text,
	"razorpay_refund_id" varchar(255),
	"refunded_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session_minutes_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"purchase_id" varchar NOT NULL,
	"conversation_id" varchar,
	"minutes_consumed" integer NOT NULL,
	"feature_used" varchar(100),
	"consumed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"duration_seconds" varchar(20),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"price" varchar(20) NOT NULL,
	"listed_price" varchar(20),
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"billing_interval" varchar(20) NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"published_on_website" boolean DEFAULT false,
	"available_until" timestamp,
	"required_addons" jsonb DEFAULT '[]'::jsonb,
	"razorpay_plan_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_plans_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" varchar NOT NULL,
	"version_number" integer NOT NULL,
	"change_type" varchar(20) NOT NULL,
	"reason_code" varchar(50) NOT NULL,
	"reason_detail" text,
	"snapshot" jsonb NOT NULL,
	"effective_start_at" timestamp NOT NULL,
	"effective_end_at" timestamp,
	"committed_at" timestamp DEFAULT now() NOT NULL,
	"committed_by" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"plan_id" varchar,
	"plan_type" varchar(20) DEFAULT 'free_trial' NOT NULL,
	"status" varchar(20) DEFAULT 'trial' NOT NULL,
	"sessions_used" varchar(10) DEFAULT '0' NOT NULL,
	"sessions_limit" varchar(10),
	"minutes_used" varchar(10) DEFAULT '0' NOT NULL,
	"minutes_limit" varchar(10),
	"session_history" jsonb DEFAULT '[]'::jsonb,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"canceled_at" timestamp,
	"cancellation_reason" text,
	"razorpay_subscription_id" varchar(255),
	"razorpay_customer_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "super_user_overrides" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"reason" text NOT NULL,
	"granted_by" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "super_user_overrides_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"subject" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"assigned_to" varchar,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_type" varchar(50) NOT NULL,
	"value" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teams_meetings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"meeting_id" text,
	"meeting_title" text,
	"organizer_id" text,
	"start_time" timestamp,
	"end_time" timestamp,
	"recording_url" text,
	"transcript_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"participants" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "terms_and_conditions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) DEFAULT 'Terms & Conditions' NOT NULL,
	"content" text NOT NULL,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_modified_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_extensions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"extension_type" varchar(20) NOT NULL,
	"extension_value" varchar(20) NOT NULL,
	"reason" text NOT NULL,
	"granted_by" varchar NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "traffic_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_address" varchar,
	"country" varchar,
	"state" varchar,
	"city" varchar,
	"device_type" varchar,
	"browser" varchar,
	"visited_page" text,
	"visit_time" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_expertise_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(20) NOT NULL,
	"file_url" text NOT NULL,
	"content" text,
	"content_source" varchar(20) DEFAULT 'extraction',
	"audio_duration" integer,
	"summary" jsonb,
	"summary_status" varchar(20) DEFAULT 'not_generated',
	"summary_error" text,
	"last_summarized_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"processing_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"processing_error" text,
	"knowledge_extracted_at" timestamp,
	"content_hash" varchar(64),
	"uploaded_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_entitlements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"organization_id" varchar,
	"has_platform_access" boolean DEFAULT false,
	"platform_access_expires_at" timestamp,
	"session_minutes_balance" integer DEFAULT 0,
	"session_minutes_expires_at" timestamp,
	"has_train_me" boolean DEFAULT false,
	"train_me_expires_at" timestamp,
	"has_dai" boolean DEFAULT false,
	"dai_tokens_balance" integer DEFAULT 0,
	"dai_expires_at" timestamp,
	"is_enterprise_user" boolean DEFAULT false,
	"enterprise_train_me_enabled" boolean DEFAULT false,
	"enterprise_dai_enabled" boolean DEFAULT false,
	"last_calculated_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_entitlements_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"preferred_methodology" varchar(50),
	"conversation_style" varchar(50),
	"primary_industries" text[],
	"product_expertise" text[],
	"avg_deal_size" text,
	"avg_sales_cycle" text,
	"successful_patterns" jsonb,
	"common_objections" text[],
	"coaching_intensity" varchar(20),
	"focus_areas" text[],
	"total_conversations" integer DEFAULT 0,
	"avg_conversion_rate" integer,
	"strongest_framework" varchar(50),
	"improvement_areas" text[],
	"learnings" jsonb,
	"custom_preferences" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activation_invites" ADD CONSTRAINT "activation_invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activation_invites" ADD CONSTRAINT "activation_invites_assignment_id_enterprise_user_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."enterprise_user_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_purchases" ADD CONSTRAINT "addon_purchases_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_purchases" ADD CONSTRAINT "addon_purchases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_purchases" ADD CONSTRAINT "addon_purchases_gateway_transaction_id_gateway_transactions_id_fk" FOREIGN KEY ("gateway_transaction_id") REFERENCES "public"."gateway_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_purchases" ADD CONSTRAINT "addon_purchases_refunded_by_auth_users_id_fk" FOREIGN KEY ("refunded_by") REFERENCES "public"."auth_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addons_history" ADD CONSTRAINT "addons_history_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addons_history" ADD CONSTRAINT "addons_history_committed_by_auth_users_id_fk" FOREIGN KEY ("committed_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions_log" ADD CONSTRAINT "admin_actions_log_admin_id_auth_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_token_usage" ADD CONSTRAINT "ai_token_usage_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_token_usage" ADD CONSTRAINT "ai_token_usage_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_auth_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key_usage_logs" ADD CONSTRAINT "api_key_usage_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_auth_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_revoked_by_auth_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."auth_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audio_sources" ADD CONSTRAINT "audio_sources_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audio_sources" ADD CONSTRAINT "audio_sources_teams_meeting_id_teams_meetings_id_fk" FOREIGN KEY ("teams_meeting_id") REFERENCES "public"."teams_meetings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_auth_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_adjustments" ADD CONSTRAINT "billing_adjustments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_adjustments" ADD CONSTRAINT "billing_adjustments_license_package_id_license_packages_id_fk" FOREIGN KEY ("license_package_id") REFERENCES "public"."license_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_adjustments" ADD CONSTRAINT "billing_adjustments_added_by_auth_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_stages" ADD CONSTRAINT "buyer_stages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_meeting_minutes" ADD CONSTRAINT "call_meeting_minutes_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_meeting_minutes" ADD CONSTRAINT "call_meeting_minutes_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_meeting_minutes" ADD CONSTRAINT "call_meeting_minutes_recording_id_call_recordings_id_fk" FOREIGN KEY ("recording_id") REFERENCES "public"."call_recordings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_recordings" ADD CONSTRAINT "call_recordings_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_recordings" ADD CONSTRAINT "call_recordings_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_intents" ADD CONSTRAINT "conversation_intents_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_intents" ADD CONSTRAINT "conversation_intents_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_memories" ADD CONSTRAINT "conversation_memories_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_memories" ADD CONSTRAINT "conversation_memories_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_minutes_backup" ADD CONSTRAINT "conversation_minutes_backup_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_minutes_backup" ADD CONSTRAINT "conversation_minutes_backup_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dai_usage_logs" ADD CONSTRAINT "dai_usage_logs_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dai_usage_logs" ADD CONSTRAINT "dai_usage_logs_purchase_id_addon_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."addon_purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dai_usage_logs" ADD CONSTRAINT "dai_usage_logs_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_expertise" ADD CONSTRAINT "domain_expertise_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_promo_code_usages" ADD CONSTRAINT "enterprise_promo_code_usages_promo_code_id_enterprise_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."enterprise_promo_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_promo_code_usages" ADD CONSTRAINT "enterprise_promo_code_usages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_promo_code_usages" ADD CONSTRAINT "enterprise_promo_code_usages_license_package_id_license_packages_id_fk" FOREIGN KEY ("license_package_id") REFERENCES "public"."license_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_promo_code_usages" ADD CONSTRAINT "enterprise_promo_code_usages_used_by_auth_users_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_promo_codes" ADD CONSTRAINT "enterprise_promo_codes_created_by_auth_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_user_assignments" ADD CONSTRAINT "enterprise_user_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_user_assignments" ADD CONSTRAINT "enterprise_user_assignments_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_user_assignments" ADD CONSTRAINT "enterprise_user_assignments_assigned_by_auth_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."auth_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enterprise_user_assignments" ADD CONSTRAINT "enterprise_user_assignments_revoked_by_auth_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."auth_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_transactions" ADD CONSTRAINT "gateway_transactions_provider_id_gateway_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."gateway_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_transactions" ADD CONSTRAINT "gateway_transactions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_transactions" ADD CONSTRAINT "gateway_transactions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_webhooks" ADD CONSTRAINT "gateway_webhooks_provider_id_gateway_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."gateway_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_entries" ADD CONSTRAINT "knowledge_entries_domain_expertise_id_domain_expertise_id_fk" FOREIGN KEY ("domain_expertise_id") REFERENCES "public"."domain_expertise"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_entries" ADD CONSTRAINT "knowledge_entries_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_assignments" ADD CONSTRAINT "license_assignments_license_package_id_license_packages_id_fk" FOREIGN KEY ("license_package_id") REFERENCES "public"."license_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_assignments" ADD CONSTRAINT "license_assignments_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_assignments" ADD CONSTRAINT "license_assignments_assigned_by_auth_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_packages" ADD CONSTRAINT "license_packages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_access" ADD CONSTRAINT "marketing_access_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_access" ADD CONSTRAINT "marketing_access_granted_by_auth_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_generated_content" ADD CONSTRAINT "marketing_generated_content_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_user_settings" ADD CONSTRAINT "marketing_user_settings_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_audio_source_id_audio_sources_id_fk" FOREIGN KEY ("audio_source_id") REFERENCES "public"."audio_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_primary_manager_id_auth_users_id_fk" FOREIGN KEY ("primary_manager_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_refunded_by_auth_users_id_fk" FOREIGN KEY ("refunded_by") REFERENCES "public"."auth_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_orders" ADD CONSTRAINT "pending_orders_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_auth_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_intelligence_exports" ADD CONSTRAINT "sales_intelligence_exports_exported_by_auth_users_id_fk" FOREIGN KEY ("exported_by") REFERENCES "public"."auth_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_intelligence_knowledge" ADD CONSTRAINT "sales_intelligence_knowledge_validated_by_auth_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."auth_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_intelligence_learning_logs" ADD CONSTRAINT "sales_intelligence_learning_logs_suggestion_id_sales_intelligence_suggestions_id_fk" FOREIGN KEY ("suggestion_id") REFERENCES "public"."sales_intelligence_suggestions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_intelligence_learning_logs" ADD CONSTRAINT "sales_intelligence_learning_logs_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_intelligence_learning_logs" ADD CONSTRAINT "sales_intelligence_learning_logs_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_intelligence_learning_logs" ADD CONSTRAINT "sales_intelligence_learning_logs_promoted_knowledge_id_sales_intelligence_knowledge_id_fk" FOREIGN KEY ("promoted_knowledge_id") REFERENCES "public"."sales_intelligence_knowledge"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_intelligence_suggestions" ADD CONSTRAINT "sales_intelligence_suggestions_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_intelligence_suggestions" ADD CONSTRAINT "sales_intelligence_suggestions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_intelligence_suggestions" ADD CONSTRAINT "sales_intelligence_suggestions_knowledge_id_sales_intelligence_knowledge_id_fk" FOREIGN KEY ("knowledge_id") REFERENCES "public"."sales_intelligence_knowledge"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_minutes_purchases" ADD CONSTRAINT "session_minutes_purchases_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_minutes_purchases" ADD CONSTRAINT "session_minutes_purchases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_minutes_purchases" ADD CONSTRAINT "session_minutes_purchases_refunded_by_auth_users_id_fk" FOREIGN KEY ("refunded_by") REFERENCES "public"."auth_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_minutes_usage" ADD CONSTRAINT "session_minutes_usage_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_minutes_usage" ADD CONSTRAINT "session_minutes_usage_purchase_id_addon_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."addon_purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_minutes_usage" ADD CONSTRAINT "session_minutes_usage_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_usage" ADD CONSTRAINT "session_usage_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_plans_history" ADD CONSTRAINT "subscription_plans_history_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_plans_history" ADD CONSTRAINT "subscription_plans_history_committed_by_auth_users_id_fk" FOREIGN KEY ("committed_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_auth_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams_meetings" ADD CONSTRAINT "teams_meetings_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_and_conditions" ADD CONSTRAINT "terms_and_conditions_last_modified_by_auth_users_id_fk" FOREIGN KEY ("last_modified_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_extensions" ADD CONSTRAINT "time_extensions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_extensions" ADD CONSTRAINT "time_extensions_granted_by_auth_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_documents" ADD CONSTRAINT "training_documents_domain_expertise_id_domain_expertise_id_fk" FOREIGN KEY ("domain_expertise_id") REFERENCES "public"."domain_expertise"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_documents" ADD CONSTRAINT "training_documents_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entitlements" ADD CONSTRAINT "user_entitlements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activation_invites_org" ON "activation_invites" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_activation_invites_token" ON "activation_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_activation_invites_status" ON "activation_invites" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_addon_purchases_user" ON "addon_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_addon_purchases_org" ON "addon_purchases" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_addon_purchases_type_status" ON "addon_purchases" USING btree ("addon_type","status");--> statement-breakpoint
CREATE INDEX "idx_addon_purchases_expiry" ON "addon_purchases" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "idx_addon_purchases_sku" ON "addon_purchases" USING btree ("package_sku");--> statement-breakpoint
CREATE INDEX "idx_addon_purchases_gateway_tx" ON "addon_purchases" USING btree ("gateway_transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_addon_per_user" ON "addon_purchases" USING btree ("user_id","addon_type") WHERE status = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "unique_addon_version" ON "addons_history" USING btree ("addon_id","version_number");--> statement-breakpoint
CREATE INDEX "addon_history_idx" ON "addons_history" USING btree ("addon_id","effective_start_at");--> statement-breakpoint
CREATE INDEX "idx_admin_actions_admin" ON "admin_actions_log" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_admin_actions_type" ON "admin_actions_log" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "idx_admin_actions_target" ON "admin_actions_log" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_admin_actions_created" ON "admin_actions_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_token_usage_user" ON "ai_token_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_token_usage_org" ON "ai_token_usage" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_ai_token_usage_provider" ON "ai_token_usage" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_ai_token_usage_occurred_at" ON "ai_token_usage" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_ai_token_usage_user_provider_date" ON "ai_token_usage" USING btree ("user_id","provider","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_billing_adjustments_org" ON "billing_adjustments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_billing_adjustments_package" ON "billing_adjustments" USING btree ("license_package_id");--> statement-breakpoint
CREATE INDEX "idx_billing_adjustments_status" ON "billing_adjustments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_buyer_stages_conversation" ON "buyer_stages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_buyer_stages_stage" ON "buyer_stages" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_minutes_user" ON "call_meeting_minutes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_minutes_recording" ON "call_meeting_minutes" USING btree ("recording_id");--> statement-breakpoint
CREATE INDEX "idx_minutes_expires" ON "call_meeting_minutes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_minutes_status" ON "call_meeting_minutes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_recordings_user" ON "call_recordings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_recordings_expires" ON "call_recordings" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_recordings_status" ON "call_recordings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_cart_items_user" ON "cart_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cart_items_addon_type" ON "cart_items" USING btree ("addon_type");--> statement-breakpoint
CREATE INDEX "idx_cart_items_promo_code" ON "cart_items" USING btree ("promo_code_id");--> statement-breakpoint
CREATE INDEX "idx_cart_items_purchase_mode" ON "cart_items" USING btree ("purchase_mode");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_cart_items_user_sku" ON "cart_items" USING btree ("user_id","package_sku");--> statement-breakpoint
CREATE INDEX "idx_case_studies_industry" ON "case_studies" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "idx_case_studies_active" ON "case_studies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_intents_conversation" ON "conversation_intents" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_intents_type" ON "conversation_intents" USING btree ("intent");--> statement-breakpoint
CREATE INDEX "idx_memories_conversation" ON "conversation_memories" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_memories_user" ON "conversation_memories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_memories_stage" ON "conversation_memories" USING btree ("buyer_stage");--> statement-breakpoint
CREATE INDEX "idx_conversations_session" ON "conversations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_user" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_status" ON "conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_conversations_created_at" ON "conversations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_dai_usage_user" ON "dai_usage_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_dai_usage_purchase" ON "dai_usage_logs" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "idx_dai_usage_consumed_at" ON "dai_usage_logs" USING btree ("consumed_at");--> statement-breakpoint
CREATE INDEX "idx_enterprise_promo_usage_code" ON "enterprise_promo_code_usages" USING btree ("promo_code_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_promo_usage_org" ON "enterprise_promo_code_usages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_promo_codes_active" ON "enterprise_promo_codes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_enterprise_promo_codes_expires" ON "enterprise_promo_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_enterprise_assignments_org" ON "enterprise_user_assignments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_assignments_user" ON "enterprise_user_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_enterprise_assignments_status" ON "enterprise_user_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_enterprise_assignments_email" ON "enterprise_user_assignments" USING btree ("user_email");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_enterprise_assignment_email" ON "enterprise_user_assignments" USING btree ("organization_id","user_email") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "idx_gateway_transactions_user" ON "gateway_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_gateway_transactions_org" ON "gateway_transactions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_gateway_transactions_status" ON "gateway_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_gateway_transactions_provider" ON "gateway_transactions" USING btree ("provider_id","provider_transaction_id");--> statement-breakpoint
CREATE INDEX "idx_gateway_webhooks_provider" ON "gateway_webhooks" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_gateway_webhooks_processed" ON "gateway_webhooks" USING btree ("processed");--> statement-breakpoint
CREATE INDEX "idx_playbooks_active" ON "implementation_playbooks" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_license_assignments_package" ON "license_assignments" USING btree ("license_package_id");--> statement-breakpoint
CREATE INDEX "idx_license_assignments_user" ON "license_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_license_assignments_status" ON "license_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_license_assignments_unique_active" ON "license_assignments" USING btree ("license_package_id","user_id","status");--> statement-breakpoint
CREATE INDEX "idx_license_packages_org" ON "license_packages" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_license_packages_status" ON "license_packages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_license_packages_dates" ON "license_packages" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_org_memberships_org" ON "organization_memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_org_memberships_user" ON "organization_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_org_memberships_status" ON "organization_memberships" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_org_membership" ON "organization_memberships" USING btree ("organization_id","user_id") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "idx_organizations_status" ON "organizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_organizations_primary_manager" ON "organizations" USING btree ("primary_manager_id");--> statement-breakpoint
CREATE INDEX "idx_pending_orders_user" ON "pending_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_pending_orders_gateway" ON "pending_orders" USING btree ("gateway_order_id");--> statement-breakpoint
CREATE INDEX "idx_pending_orders_status" ON "pending_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_products_active" ON "products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_prompts_feature" ON "prompt_templates" USING btree ("feature");--> statement-breakpoint
CREATE INDEX "idx_prompts_active" ON "prompt_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_session_minutes_user" ON "session_minutes_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_session_minutes_purchase" ON "session_minutes_usage" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "idx_session_minutes_consumed_at" ON "session_minutes_usage" USING btree ("consumed_at");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_plan_version" ON "subscription_plans_history" USING btree ("plan_id","version_number");--> statement-breakpoint
CREATE INDEX "plan_history_idx" ON "subscription_plans_history" USING btree ("plan_id","effective_start_at");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_active_subscription_per_user" ON "subscriptions" USING btree ("user_id") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "idx_terms_active" ON "terms_and_conditions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_terms_version" ON "terms_and_conditions" USING btree ("version");--> statement-breakpoint
CREATE INDEX "idx_user_entitlements_user" ON "user_entitlements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_entitlements_org" ON "user_entitlements" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_profiles_user" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_profiles_methodology" ON "user_profiles" USING btree ("preferred_methodology");