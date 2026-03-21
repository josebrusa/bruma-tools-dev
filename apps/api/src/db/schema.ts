import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  contact: text("contact"),
  timezone: text("timezone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const domains = pgTable(
  "domains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    fqdn: text("fqdn").notNull(),
    verificationStatus: text("verification_status").notNull().default("pending"),
    verificationError: text("verification_error"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    dkimSelector: text("dkim_selector"),
    dkimPublicKeyPem: text("dkim_public_key_pem"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("domains_tenant_fqdn_idx").on(t.tenantId, t.fqdn)],
);

export const tenantApiKeys = pgTable("tenant_api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const senderIdentities = pgTable(
  "sender_identities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    domainId: uuid("domain_id")
      .notNull()
      .references(() => domains.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    replyTo: text("reply_to"),
    state: text("state").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("sender_tenant_email_idx").on(t.tenantId, t.email)],
);

export const brandingProfiles = pgTable("branding_profiles", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  logoUrl: text("logo_url").notNull(),
  primaryColor: text("color_primario").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emailTemplateVersions = pgTable("email_template_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: uuid("template_id")
    .notNull()
    .references(() => emailTemplates.id, { onDelete: "cascade" }),
  bodyHtml: text("body_html").notNull(),
  variableNames: text("variable_names").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emailDispatches = pgTable(
  "email_dispatches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("queued"),
    eventKey: text("event_key"),
    recipientEmail: text("recipient_email").notNull().default(""),
    templateVersionId: uuid("template_version_id").references(
      () => emailTemplateVersions.id,
      { onDelete: "set null" },
    ),
    senderId: uuid("sender_id").references(() => senderIdentities.id, {
      onDelete: "set null",
    }),
    subject: text("subject"),
    htmlBody: text("html_body"),
    providerMessageId: text("provider_message_id"),
    correlationId: text("correlation_id"),
    lastError: text("last_error"),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("email_dispatches_tenant_idempotency_idx")
      .on(t.tenantId, t.idempotencyKey)
      .where(sql`${t.idempotencyKey} is not null`),
    uniqueIndex("email_dispatches_provider_message_id_unique")
      .on(t.providerMessageId)
      .where(sql`${t.providerMessageId} is not null`),
    index("email_dispatches_tenant_created_idx").on(t.tenantId, t.createdAt),
  ],
);

export const deliveryEvents = pgTable(
  "delivery_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dispatchId: uuid("dispatch_id")
      .notNull()
      .references(() => emailDispatches.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    rawPayload: text("raw_payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("delivery_events_tenant_occurred_idx").on(t.tenantId, t.occurredAt),
    index("delivery_events_dispatch_occurred_idx").on(
      t.dispatchId,
      t.occurredAt,
    ),
  ],
);

export const eventMappings = pgTable(
  "event_mappings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    eventKey: text("event_key").notNull(),
    templateId: uuid("template_id").references(() => emailTemplates.id, {
      onDelete: "cascade",
    }),
    senderId: uuid("sender_id").references(() => senderIdentities.id, {
      onDelete: "cascade",
    }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("event_mappings_tenant_event_key_idx").on(t.tenantId, t.eventKey)],
);
