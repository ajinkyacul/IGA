import { mysqlTable, varchar, int, boolean, timestamp, text } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User & Authentication
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("Customer"),
  tenantId: int("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  tenantId: true,
});

// Tenants
export const tenants = mysqlTable("tenants", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  industry: varchar("industry", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTenantSchema = createInsertSchema(tenants).pick({
  name: true,
  description: true,
  industry: true,
});

// Questionnaire Domains
export const domains = mysqlTable("domains", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).default("help_outline"),
});

export const insertDomainSchema = createInsertSchema(domains).pick({
  name: true,
  description: true,
  icon: true,
});

// Questions
export const questions = mysqlTable("questions", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  domainId: int("domain_id").references(() => domains.id, { onDelete: "cascade" }).notNull(),
  required: boolean("required").default(false),
  tags: text("tags"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  title: true,
  description: true,
  domainId: true,
  required: true,
  tags: true,
});

// Tenant Questions (assigns questions to tenants)
export const tenantQuestions = mysqlTable("tenant_questions", {
  id: int("id").primaryKey().autoincrement(),
  tenantId: int("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
  questionId: int("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
  status: varchar("status", { length: 50 }).default("Unanswered"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertTenantQuestionSchema = createInsertSchema(tenantQuestions).pick({
  tenantId: true,
  questionId: true,
  status: true,
});

// Responses
export const responses = mysqlTable("responses", {
  id: int("id").primaryKey().autoincrement(),
  tenantQuestionId: int("tenant_question_id").references(() => tenantQuestions.id, { onDelete: "cascade" }).notNull(),
  userId: int("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertResponseSchema = createInsertSchema(responses).pick({
  tenantQuestionId: true,
  userId: true,
  content: true,
});

// Attachments
export const attachments = mysqlTable("attachments", {
  id: int("id").primaryKey().autoincrement(),
  responseId: int("response_id").references(() => responses.id, { onDelete: "cascade" }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 255 }).notNull(),
  size: int("size").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAttachmentSchema = createInsertSchema(attachments).pick({
  responseId: true,
  filename: true,
  originalName: true,
  mimeType: true,
  size: true,
});

// Define all types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type Domain = typeof domains.$inferSelect;
export type InsertDomain = z.infer<typeof insertDomainSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type TenantQuestion = typeof tenantQuestions.$inferSelect;
export type InsertTenantQuestion = z.infer<typeof insertTenantQuestionSchema>;

export type Response = typeof responses.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;

// Domain enum for convenience
export const QuestionDomains = {
  ACCESS_REVIEWS: "Access Reviews",
  GOVERNANCE: "Generic Governance Questions",
  APP_ONBOARDING: "Application Onboarding",
  SOD: "Segregation of Duties (SOD)",
  DIRECTORY: "AD/Directory Services"
};