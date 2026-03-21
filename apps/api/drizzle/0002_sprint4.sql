ALTER TABLE "email_dispatches" ADD COLUMN "event_key" text;--> statement-breakpoint
ALTER TABLE "email_dispatches" ADD COLUMN "recipient_email" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "email_dispatches" ADD COLUMN "template_version_id" uuid;--> statement-breakpoint
ALTER TABLE "email_dispatches" ADD COLUMN "sender_id" uuid;--> statement-breakpoint
ALTER TABLE "email_dispatches" ADD COLUMN "subject" text;--> statement-breakpoint
ALTER TABLE "email_dispatches" ADD COLUMN "html_body" text;--> statement-breakpoint
ALTER TABLE "email_dispatches" ADD COLUMN "provider_message_id" text;--> statement-breakpoint
ALTER TABLE "email_dispatches" ADD COLUMN "last_error" text;--> statement-breakpoint
ALTER TABLE "email_dispatches" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "email_dispatches" ADD COLUMN "correlation_id" text;--> statement-breakpoint
ALTER TABLE "email_dispatches" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "email_dispatches" ADD CONSTRAINT "email_dispatches_template_version_id_email_template_versions_id_fk" FOREIGN KEY ("template_version_id") REFERENCES "public"."email_template_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_dispatches" ADD CONSTRAINT "email_dispatches_sender_id_sender_identities_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."sender_identities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_dispatches_provider_message_id_unique" ON "email_dispatches" USING btree ("provider_message_id") WHERE "provider_message_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "email_dispatches_tenant_created_idx" ON "email_dispatches" USING btree ("tenant_id","created_at" DESC);--> statement-breakpoint
CREATE UNIQUE INDEX "email_dispatches_tenant_idempotency_idx" ON "email_dispatches" USING btree ("tenant_id","idempotency_key") WHERE "idempotency_key" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "event_mappings" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "event_mappings" ADD COLUMN "sender_id" uuid;--> statement-breakpoint
ALTER TABLE "event_mappings" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "event_mappings" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "event_mappings" ADD CONSTRAINT "event_mappings_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_mappings" ADD CONSTRAINT "event_mappings_sender_id_sender_identities_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."sender_identities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_mappings_tenant_event_key_idx" ON "event_mappings" USING btree ("tenant_id","event_key");--> statement-breakpoint
CREATE TABLE "delivery_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispatch_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"raw_payload" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "delivery_events" ADD CONSTRAINT "delivery_events_dispatch_id_email_dispatches_id_fk" FOREIGN KEY ("dispatch_id") REFERENCES "public"."email_dispatches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_events" ADD CONSTRAINT "delivery_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "delivery_events_tenant_occurred_idx" ON "delivery_events" USING btree ("tenant_id","occurred_at" DESC);--> statement-breakpoint
CREATE INDEX "delivery_events_dispatch_occurred_idx" ON "delivery_events" USING btree ("dispatch_id","occurred_at");
