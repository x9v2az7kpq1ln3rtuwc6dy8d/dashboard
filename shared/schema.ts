import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoles = ["admin", "moderator", "customer"] as const;
export type UserRole = typeof userRoles[number];

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("customer"),
  isActive: boolean("is_active").notNull().default(true),
  avatar: text("avatar"),
  discordUsername: text("discord_username"),
  bio: text("bio"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  lastIpAddress: text("last_ip_address"),
  inviteCodeId: varchar("invite_code_id"),
});

// Invite codes table
export const inviteCodes = pgTable("invite_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  role: text("role").notNull().default("customer"),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdById: varchar("created_by_id"),
  usedById: varchar("used_by_id"),
  usedAt: timestamp("used_at"),
});

// File categories enum
export const fileCategories = ["cheat", "loader", "tool", "update", "other"] as const;
export type FileCategory = typeof fileCategories[number];

// Download files table
export const downloadFiles = pgTable("download_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  version: text("version"),
  category: text("category").notNull().default("other"),
  allowedRoles: text("allowed_roles").array().notNull().default(sql`ARRAY['customer', 'moderator', 'admin']::text[]`),
  uploadedById: varchar("uploaded_by_id"),
  expiresAt: timestamp("expires_at"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Download history table
export const downloadHistory = pgTable("download_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fileId: varchar("file_id").notNull(),
  downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  message: text("message").notNull(),
  isAdminMessage: boolean("is_admin_message").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// FAQ Products table
export const faqProducts = pgTable("faq_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// FAQ Items table
export const faqItems = pgTable("faq_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => faqProducts.id, { onDelete: "cascade" }),
  issue: text("issue").notNull(),
  solutions: text("solutions").array().notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Announcements table
export const announcementPriorities = ["low", "normal", "high", "urgent"] as const;
export type AnnouncementPriority = typeof announcementPriorities[number];

export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").notNull().default("normal"),
  isActive: boolean("is_active").notNull().default(true),
  createdById: varchar("created_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Notifications table
export const notificationTypes = ["file_upload", "announcement", "system", "file_expiring"] as const;
export type NotificationType = typeof notificationTypes[number];

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  relatedEntityId: varchar("related_entity_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// File versions table
export const fileVersions = pgTable("file_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: varchar("file_id").notNull().references(() => downloadFiles.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedById: varchar("uploaded_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// File comments table (admin notes)
export const fileComments = pgTable("file_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: varchar("file_id").notNull().references(() => downloadFiles.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  createdById: varchar("created_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// File favorites (many-to-many)
export const fileFavorites = pgTable("file_favorites", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileId: varchar("file_id").notNull().references(() => downloadFiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.fileId] }),
}));

// Audit log table
export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// File tags table
export const fileTags = pgTable("file_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#3b82f6"),
  createdById: varchar("created_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// File tag relations (many-to-many)
export const fileTagRelations = pgTable("file_tag_relations", {
  fileId: varchar("file_id").notNull().references(() => downloadFiles.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => fileTags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.fileId, table.tagId] }),
}));

// File collections table
export const fileCollections = pgTable("file_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdById: varchar("created_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Collection files (many-to-many with ordering)
export const collectionFiles = pgTable("collection_files", {
  collectionId: varchar("collection_id").notNull().references(() => fileCollections.id, { onDelete: "cascade" }),
  fileId: varchar("file_id").notNull().references(() => downloadFiles.id, { onDelete: "cascade" }),
  displayOrder: integer("display_order").notNull().default(0),
  addedAt: timestamp("added_at").notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.collectionId, table.fileId] }),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  inviteCode: one(inviteCodes, {
    fields: [users.inviteCodeId],
    references: [inviteCodes.id],
  }),
  downloadHistory: many(downloadHistory),
  uploadedFiles: many(downloadFiles),
  createdInviteCodes: many(inviteCodes),
}));

export const inviteCodesRelations = relations(inviteCodes, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [inviteCodes.createdById],
    references: [users.id],
  }),
  usedBy: one(users, {
    fields: [inviteCodes.usedById],
    references: [users.id],
  }),
  registeredUsers: many(users),
}));

export const downloadFilesRelations = relations(downloadFiles, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [downloadFiles.uploadedById],
    references: [users.id],
  }),
  downloadHistory: many(downloadHistory),
}));

export const downloadHistoryRelations = relations(downloadHistory, ({ one }) => ({
  user: one(users, {
    fields: [downloadHistory.userId],
    references: [users.id],
  }),
  file: one(downloadFiles, {
    fields: [downloadHistory.fileId],
    references: [downloadFiles.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const faqProductsRelations = relations(faqProducts, ({ many }) => ({
  faqItems: many(faqItems),
}));

export const faqItemsRelations = relations(faqItems, ({ one }) => ({
  product: one(faqProducts, {
    fields: [faqItems.productId],
    references: [faqProducts.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  createdBy: one(users, {
    fields: [announcements.createdById],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const fileVersionsRelations = relations(fileVersions, ({ one }) => ({
  file: one(downloadFiles, {
    fields: [fileVersions.fileId],
    references: [downloadFiles.id],
  }),
  uploadedBy: one(users, {
    fields: [fileVersions.uploadedById],
    references: [users.id],
  }),
}));

export const fileCommentsRelations = relations(fileComments, ({ one }) => ({
  file: one(downloadFiles, {
    fields: [fileComments.fileId],
    references: [downloadFiles.id],
  }),
  createdBy: one(users, {
    fields: [fileComments.createdById],
    references: [users.id],
  }),
}));

export const fileFavoritesRelations = relations(fileFavorites, ({ one }) => ({
  user: one(users, {
    fields: [fileFavorites.userId],
    references: [users.id],
  }),
  file: one(downloadFiles, {
    fields: [fileFavorites.fileId],
    references: [downloadFiles.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));

export const fileTagsRelations = relations(fileTags, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [fileTags.createdById],
    references: [users.id],
  }),
  fileTagRelations: many(fileTagRelations),
}));

export const fileTagRelationsRelations = relations(fileTagRelations, ({ one }) => ({
  file: one(downloadFiles, {
    fields: [fileTagRelations.fileId],
    references: [downloadFiles.id],
  }),
  tag: one(fileTags, {
    fields: [fileTagRelations.tagId],
    references: [fileTags.id],
  }),
}));

export const fileCollectionsRelations = relations(fileCollections, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [fileCollections.createdById],
    references: [users.id],
  }),
  collectionFiles: many(collectionFiles),
}));

export const collectionFilesRelations = relations(collectionFiles, ({ one }) => ({
  collection: one(fileCollections, {
    fields: [collectionFiles.collectionId],
    references: [fileCollections.id],
  }),
  file: one(downloadFiles, {
    fields: [collectionFiles.fileId],
    references: [downloadFiles.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  inviteCode: z.string().min(1, "Invite code is required"),
});

export const insertInviteCodeSchema = createInsertSchema(inviteCodes).pick({
  role: true,
});

export const insertDownloadFileSchema = createInsertSchema(downloadFiles).pick({
  name: true,
  description: true,
  filename: true,
  fileSize: true,
  version: true,
  category: true,
  allowedRoles: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  avatar: true,
  discordUsername: true,
  bio: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertInviteCode = z.infer<typeof insertInviteCodeSchema>;
export type InviteCode = typeof inviteCodes.$inferSelect;

export type InsertDownloadFile = z.infer<typeof insertDownloadFileSchema>;
export type DownloadFile = typeof downloadFiles.$inferSelect;

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export type DownloadHistory = typeof downloadHistory.$inferSelect;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

// Update user role schema
export const updateUserRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(userRoles),
});

export type UpdateUserRole = z.infer<typeof updateUserRoleSchema>;

// Update user status schema
export const updateUserStatusSchema = z.object({
  userId: z.string(),
  isActive: z.boolean(),
});

export type UpdateUserStatus = z.infer<typeof updateUserStatusSchema>;

// File upload metadata schema (for multipart form data)
export const fileUploadMetadataSchema = z.object({
  name: z.string().min(1, "File name is required"),
  description: z.string().optional(),
  version: z.string().optional(),
  category: z.enum(fileCategories).default("other"),
  allowedRoles: z.array(z.enum(userRoles)).min(1, "At least one role must be selected"),
});

export type FileUploadMetadata = z.infer<typeof fileUploadMetadataSchema>;

// File update schema
export const updateFileSchema = z.object({
  fileId: z.string(),
  category: z.enum(fileCategories).optional(),
  name: z.string().min(1, "File name is required").optional(),
  description: z.string().optional(),
  version: z.string().optional(),
});

export type UpdateFile = z.infer<typeof updateFileSchema>;

// Chat message schema
export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  message: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect & { username?: string };

// FAQ Product schemas
export const insertFaqProductSchema = createInsertSchema(faqProducts).pick({
  name: true,
  description: true,
  displayOrder: true,
});

export const updateFaqProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Product name is required").optional(),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
});

export type InsertFaqProduct = z.infer<typeof insertFaqProductSchema>;
export type UpdateFaqProduct = z.infer<typeof updateFaqProductSchema>;
export type FaqProduct = typeof faqProducts.$inferSelect;

// FAQ Item schemas
export const insertFaqItemSchema = createInsertSchema(faqItems).pick({
  productId: true,
  issue: true,
  solutions: true,
  displayOrder: true,
});

export const updateFaqItemSchema = z.object({
  id: z.string(),
  issue: z.string().min(1, "Issue is required").optional(),
  solutions: z.array(z.string()).min(1, "At least one solution is required").optional(),
  displayOrder: z.number().optional(),
});

export type InsertFaqItem = z.infer<typeof insertFaqItemSchema>;
export type UpdateFaqItem = z.infer<typeof updateFaqItemSchema>;
export type FaqItem = typeof faqItems.$inferSelect;

// Announcement schemas
export const insertAnnouncementSchema = createInsertSchema(announcements).pick({
  title: true,
  content: true,
  priority: true,
  isActive: true,
});

export const updateAnnouncementSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  priority: z.enum(announcementPriorities).optional(),
  isActive: z.boolean().optional(),
});

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type UpdateAnnouncement = z.infer<typeof updateAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect & { createdByUsername?: string };

// Notification schemas
export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  relatedEntityId: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// File version schemas
export const insertFileVersionSchema = createInsertSchema(fileVersions).pick({
  fileId: true,
  version: true,
  filename: true,
  fileSize: true,
  uploadedById: true,
});

export type InsertFileVersion = z.infer<typeof insertFileVersionSchema>;
export type FileVersion = typeof fileVersions.$inferSelect & { uploaderUsername?: string };

// File comment schemas
export const insertFileCommentSchema = createInsertSchema(fileComments).pick({
  fileId: true,
  comment: true,
});

export type InsertFileComment = z.infer<typeof insertFileCommentSchema>;
export type FileComment = typeof fileComments.$inferSelect & { createdByUsername?: string };

// Audit log schemas
export const insertAuditLogSchema = createInsertSchema(auditLog).pick({
  userId: true,
  action: true,
  entityType: true,
  entityId: true,
  details: true,
  ipAddress: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLog.$inferSelect & { username?: string };

// File tag schemas
export const insertFileTagSchema = createInsertSchema(fileTags).pick({
  name: true,
  color: true,
});

export const updateFileTagSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tag name is required").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").optional(),
});

export type InsertFileTag = z.infer<typeof insertFileTagSchema>;
export type UpdateFileTag = z.infer<typeof updateFileTagSchema>;
export type FileTag = typeof fileTags.$inferSelect;

// File collection schemas
export const insertFileCollectionSchema = createInsertSchema(fileCollections).pick({
  name: true,
  description: true,
});

export const updateFileCollectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Collection name is required").optional(),
  description: z.string().optional(),
});

export type InsertFileCollection = z.infer<typeof insertFileCollectionSchema>;
export type UpdateFileCollection = z.infer<typeof updateFileCollectionSchema>;
export type FileCollection = typeof fileCollections.$inferSelect & { createdByUsername?: string; fileCount?: number };

// Discord account linking
export const discordAccounts = pgTable("discord_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  discordId: text("discord_id").notNull().unique(),
  discordUsername: text("discord_username").notNull(),
  discordAvatar: text("discord_avatar"),
  discordEmail: text("discord_email"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  linkedAt: timestamp("linked_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Forum categories
export const forumCategories = pgTable("forum_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Forum threads
export const forumThreads = pgTable("forum_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull(),
  title: text("title").notNull(),
  createdById: varchar("created_by_id").notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  lastPostAt: timestamp("last_post_at"),
  lastPostById: varchar("last_post_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Forum posts
export const forumPosts = pgTable("forum_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  threadId: varchar("thread_id").notNull(),
  createdById: varchar("created_by_id").notNull(),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").notNull().default(false),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Direct messages
export const directMessages = pgTable("direct_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull(),
  toUserId: varchar("to_user_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Webhook configuration (for Discord/Slack notifications)
export const webhookConfig = pgTable("webhook_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'discord' or 'slack'
  webhookUrl: text("webhook_url").notNull(),
  events: text("events").array().notNull().default(sql`ARRAY[]::text[]`), // ['download', 'new_user', 'announcement', etc]
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Discord account schemas
export const insertDiscordAccountSchema = createInsertSchema(discordAccounts).pick({
  userId: true,
  discordId: true,
  discordUsername: true,
  discordAvatar: true,
  discordEmail: true,
  accessToken: true,
  refreshToken: true,
  tokenExpiresAt: true,
});

export type InsertDiscordAccount = z.infer<typeof insertDiscordAccountSchema>;
export type DiscordAccount = typeof discordAccounts.$inferSelect;

// Forum category schemas
export const insertForumCategorySchema = createInsertSchema(forumCategories).pick({
  name: true,
  description: true,
  displayOrder: true,
});

export type InsertForumCategory = z.infer<typeof insertForumCategorySchema>;
export type ForumCategory = typeof forumCategories.$inferSelect & { threadCount?: number };

// Forum thread schemas
export const insertForumThreadSchema = createInsertSchema(forumThreads).pick({
  categoryId: true,
  title: true,
  createdById: true,
});

export type InsertForumThread = z.infer<typeof insertForumThreadSchema>;
export type ForumThread = typeof forumThreads.$inferSelect & { 
  createdByUsername?: string;
  lastPostByUsername?: string;
  categoryName?: string;
};

// Forum post schemas
export const insertForumPostSchema = createInsertSchema(forumPosts).pick({
  threadId: true,
  content: true,
});

export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumPost = typeof forumPosts.$inferSelect & { createdByUsername?: string; createdByAvatar?: string };

// Direct message schemas
export const insertDirectMessageSchema = createInsertSchema(directMessages).pick({
  toUserId: true,
  content: true,
});

export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DirectMessage = typeof directMessages.$inferSelect & {
  fromUsername?: string;
  fromAvatar?: string;
  toUsername?: string;
  toAvatar?: string;
};

// Webhook config schemas
export const insertWebhookConfigSchema = createInsertSchema(webhookConfig).pick({
  name: true,
  type: true,
  webhookUrl: true,
  events: true,
});

export type InsertWebhookConfig = z.infer<typeof insertWebhookConfigSchema>;
export type WebhookConfig = typeof webhookConfig.$inferSelect;
