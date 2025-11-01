import {
  users,
  inviteCodes,
  downloadFiles,
  downloadHistory,
  chatMessages,
  faqProducts,
  faqItems,
  announcements,
  notifications,
  fileVersions,
  fileComments,
  fileFavorites,
  auditLog,
  fileTags,
  fileTagRelations,
  fileCollections,
  collectionFiles,
  discordAccounts,
  forumCategories,
  forumThreads,
  forumPosts,
  directMessages,
  webhookConfig,
  type User,
  type InsertUser,
  type InviteCode,
  type InsertInviteCode,
  type DownloadFile,
  type InsertDownloadFile,
  type DownloadHistory,
  type ChatMessage,
  type InsertChatMessage,
  type UpdateUserProfile,
  type FaqProduct,
  type InsertFaqProduct,
  type FaqItem,
  type InsertFaqItem,
  type Announcement,
  type InsertAnnouncement,
  type Notification,
  type InsertNotification,
  type FileVersion,
  type InsertFileVersion,
  type FileComment,
  type InsertFileComment,
  type AuditLog,
  type InsertAuditLog,
  type FileTag,
  type InsertFileTag,
  type FileCollection,
  type InsertFileCollection,
  type DiscordAccount,
  type InsertDiscordAccount,
  type ForumCategory,
  type InsertForumCategory,
  type ForumThread,
  type InsertForumThread,
  type ForumPost,
  type InsertForumPost,
  type DirectMessage,
  type InsertDirectMessage,
  type WebhookConfig,
  type InsertWebhookConfig,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, "inviteCode"> & { role?: string; inviteCodeId?: string }): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  updateUserStatus(userId: string, isActive: boolean): Promise<User | undefined>;
  updateUserLastLogin(userId: string, ipAddress?: string): Promise<void>;
  updateUserProfile(userId: string, profile: UpdateUserProfile): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Invite code operations
  getInviteCodeByCode(code: string): Promise<InviteCode | undefined>;
  createInviteCode(code: InsertInviteCode & { createdById: string }): Promise<InviteCode>;
  markInviteCodeUsed(codeId: string, userId: string): Promise<void>;
  getAllInviteCodes(): Promise<InviteCode[]>;
  deleteInviteCode(codeId: string): Promise<void>;

  // File operations
  getFile(fileId: string): Promise<DownloadFile | undefined>;
  getAllFiles(): Promise<DownloadFile[]>;
  getFilesForUser(userRole: string): Promise<DownloadFile[]>;
  createFile(file: InsertDownloadFile & { uploadedById: string }): Promise<DownloadFile>;
  updateFile(fileId: string, updates: Partial<Pick<DownloadFile, 'category' | 'name' | 'description' | 'version'>>): Promise<DownloadFile | undefined>;
  deleteFile(fileId: string): Promise<void>;

  // Download history
  recordDownload(userId: string, fileId: string): Promise<void>;
  getUserDownloadCount(userId: string): Promise<number>;
  getUserDownloadHistory(userId: string): Promise<(DownloadHistory & { file?: DownloadFile })[]>;
  getAllDownloadHistory(): Promise<(DownloadHistory & { file?: DownloadFile; user?: User })[]>;

  // Chat operations
  getAllChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(userId: string, message: string, isAdminMessage: boolean): Promise<ChatMessage>;

  // FAQ operations
  getAllFaqProducts(): Promise<FaqProduct[]>;
  getFaqProduct(productId: string): Promise<FaqProduct | undefined>;
  createFaqProduct(product: InsertFaqProduct): Promise<FaqProduct>;
  updateFaqProduct(productId: string, updates: Partial<Pick<FaqProduct, 'name' | 'description' | 'displayOrder'>>): Promise<FaqProduct | undefined>;
  deleteFaqProduct(productId: string): Promise<void>;
  
  getFaqItemsByProduct(productId: string): Promise<FaqItem[]>;
  getFaqItem(itemId: string): Promise<FaqItem | undefined>;
  createFaqItem(item: InsertFaqItem): Promise<FaqItem>;
  updateFaqItem(itemId: string, updates: Partial<Pick<FaqItem, 'issue' | 'solutions' | 'displayOrder'>>): Promise<FaqItem | undefined>;
  deleteFaqItem(itemId: string): Promise<void>;

  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<void>;
  getAllAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: string): Promise<AuditLog[]>;
  getAuditLogsByEntityType(entityType: string): Promise<AuditLog[]>;

  // Announcement operations
  getAllAnnouncements(includeInactive?: boolean): Promise<Announcement[]>;
  getAnnouncement(id: string): Promise<Announcement | undefined>;
  createAnnouncement(announcement: InsertAnnouncement & { createdById: string }): Promise<Announcement>;
  updateAnnouncement(id: string, updates: Partial<Pick<Announcement, 'title' | 'content' | 'priority' | 'isActive'>>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<void>;

  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;

  // File version operations
  getFileVersions(fileId: string): Promise<FileVersion[]>;
  createFileVersion(version: InsertFileVersion): Promise<FileVersion>;
  deleteFileVersion(versionId: string): Promise<void>;

  // File comment operations
  getFileComments(fileId: string): Promise<FileComment[]>;
  createFileComment(comment: InsertFileComment & { createdById: string }): Promise<FileComment>;
  deleteFileComment(commentId: string): Promise<void>;

  // Favorite operations
  getFavoritesByUser(userId: string): Promise<DownloadFile[]>;
  isFavorite(userId: string, fileId: string): Promise<boolean>;
  addFavorite(userId: string, fileId: string): Promise<void>;
  removeFavorite(userId: string, fileId: string): Promise<void>;

  // Tag operations
  getAllTags(): Promise<FileTag[]>;
  getTag(id: string): Promise<FileTag | undefined>;
  createTag(tag: InsertFileTag & { createdById: string }): Promise<FileTag>;
  updateTag(id: string, updates: Partial<Pick<FileTag, 'name' | 'color'>>): Promise<FileTag | undefined>;
  deleteTag(id: string): Promise<void>;
  getFileTags(fileId: string): Promise<FileTag[]>;
  addTagToFile(fileId: string, tagId: string): Promise<void>;
  removeTagFromFile(fileId: string, tagId: string): Promise<void>;

  // Collection operations
  getAllCollections(): Promise<FileCollection[]>;
  getCollection(id: string): Promise<FileCollection | undefined>;
  createCollection(collection: InsertFileCollection & { createdById: string }): Promise<FileCollection>;
  updateCollection(id: string, updates: Partial<Pick<FileCollection, 'name' | 'description'>>): Promise<FileCollection | undefined>;
  deleteCollection(id: string): Promise<void>;
  getCollectionFiles(collectionId: string): Promise<DownloadFile[]>;
  addFileToCollection(collectionId: string, fileId: string, displayOrder?: number): Promise<void>;
  removeFileFromCollection(collectionId: string, fileId: string): Promise<void>;

  // Analytics operations
  getDownloadStats(days: number): Promise<{ date: string; count: number }[]>;
  getFileDownloadCounts(): Promise<{ fileId: string; fileName: string; downloadCount: number }[]>;
  getUserActivityStats(): Promise<{ userId: string; username: string; downloadCount: number; lastActive: Date }[]>;

  // Discord account operations
  getDiscordAccountByUserId(userId: string): Promise<DiscordAccount | undefined>;
  getDiscordAccountByDiscordId(discordId: string): Promise<DiscordAccount | undefined>;
  linkDiscordAccount(account: InsertDiscordAccount): Promise<DiscordAccount>;
  unlinkDiscordAccount(userId: string): Promise<void>;
  updateDiscordAccount(userId: string, updates: Partial<DiscordAccount>): Promise<void>;

  // Forum category operations
  getAllForumCategories(): Promise<ForumCategory[]>;
  getForumCategory(id: string): Promise<ForumCategory | undefined>;
  createForumCategory(category: InsertForumCategory): Promise<ForumCategory>;
  updateForumCategory(id: string, updates: Partial<Pick<ForumCategory, 'name' | 'description' | 'displayOrder' | 'isLocked'>>): Promise<ForumCategory | undefined>;
  deleteForumCategory(id: string): Promise<void>;

  // Forum thread operations
  getAllForumThreads(categoryId?: string): Promise<ForumThread[]>;
  getForumThread(id: string): Promise<ForumThread | undefined>;
  createForumThread(thread: InsertForumThread): Promise<ForumThread>;
  updateForumThread(id: string, updates: Partial<Pick<ForumThread, 'title' | 'isPinned' | 'isLocked'>>): Promise<ForumThread | undefined>;
  deleteForumThread(id: string): Promise<void>;
  incrementThreadViews(id: string): Promise<void>;

  // Forum post operations
  getThreadPosts(threadId: string): Promise<ForumPost[]>;
  createForumPost(post: InsertForumPost & { createdById: string }): Promise<ForumPost>;
  updateForumPost(id: string, content: string): Promise<ForumPost | undefined>;
  deleteForumPost(id: string): Promise<void>;

  // Direct message operations
  getUserConversations(userId: string): Promise<{ userId: string; username: string; avatar: string | null; lastMessage: string; lastMessageAt: Date; unreadCount: number }[]>;
  getConversationMessages(userId: string, otherUserId: string): Promise<DirectMessage[]>;
  sendDirectMessage(fromUserId: string, message: InsertDirectMessage): Promise<DirectMessage>;
  markMessagesAsRead(userId: string, fromUserId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;

  // Webhook operations
  getAllWebhooks(): Promise<WebhookConfig[]>;
  getWebhook(id: string): Promise<WebhookConfig | undefined>;
  getActiveWebhooksByEvent(event: string): Promise<WebhookConfig[]>;
  createWebhook(webhook: InsertWebhookConfig): Promise<WebhookConfig>;
  updateWebhook(id: string, updates: Partial<Pick<WebhookConfig, 'name' | 'webhookUrl' | 'events' | 'isActive'>>): Promise<WebhookConfig | undefined>;
  deleteWebhook(id: string): Promise<void>;

  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: Omit<InsertUser, "inviteCode"> & { role?: string; inviteCodeId?: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: userData.username,
        password: userData.password,
        role: userData.role || "customer",
        inviteCodeId: userData.inviteCodeId,
      })
      .returning();
    return user;
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ isActive })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserLastLogin(userId: string, ipAddress?: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        lastLoginAt: new Date(),
        lastIpAddress: ipAddress 
      })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(userId: string, profile: UpdateUserProfile): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(profile)
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getInviteCodeByCode(code: string): Promise<InviteCode | undefined> {
    const [inviteCode] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, code));
    return inviteCode || undefined;
  }

  async createInviteCode(codeData: InsertInviteCode & { createdById: string }): Promise<InviteCode> {
    const code = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const [inviteCode] = await db
      .insert(inviteCodes)
      .values({
        code,
        role: codeData.role || "customer",
        createdById: codeData.createdById,
      })
      .returning();
    return inviteCode;
  }

  async markInviteCodeUsed(codeId: string, userId: string): Promise<void> {
    await db
      .update(inviteCodes)
      .set({
        isUsed: true,
        usedById: userId,
        usedAt: new Date(),
      })
      .where(eq(inviteCodes.id, codeId));
  }

  async getAllInviteCodes(): Promise<InviteCode[]> {
    return await db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));
  }

  async deleteInviteCode(codeId: string): Promise<void> {
    await db.delete(inviteCodes).where(eq(inviteCodes.id, codeId));
  }

  async getFile(fileId: string): Promise<DownloadFile | undefined> {
    const [file] = await db.select().from(downloadFiles).where(eq(downloadFiles.id, fileId));
    return file || undefined;
  }

  async getAllFiles(): Promise<DownloadFile[]> {
    return await db.select().from(downloadFiles).orderBy(desc(downloadFiles.createdAt));
  }

  async getFilesForUser(userRole: string): Promise<DownloadFile[]> {
    const allFiles = await db.select().from(downloadFiles).orderBy(desc(downloadFiles.createdAt));
    return allFiles.filter((file) => file.allowedRoles.includes(userRole));
  }

  async createFile(fileData: InsertDownloadFile & { uploadedById: string }): Promise<DownloadFile> {
    const [file] = await db
      .insert(downloadFiles)
      .values(fileData)
      .returning();
    return file;
  }

  async updateFile(fileId: string, updates: Partial<Pick<DownloadFile, 'category' | 'name' | 'description' | 'version'>>): Promise<DownloadFile | undefined> {
    const [file] = await db
      .update(downloadFiles)
      .set(updates)
      .where(eq(downloadFiles.id, fileId))
      .returning();
    return file || undefined;
  }

  async deleteFile(fileId: string): Promise<void> {
    await db.delete(downloadFiles).where(eq(downloadFiles.id, fileId));
  }

  async recordDownload(userId: string, fileId: string): Promise<void> {
    await db.insert(downloadHistory).values({
      userId,
      fileId,
    });
  }

  async getUserDownloadCount(userId: string): Promise<number> {
    const records = await db
      .select()
      .from(downloadHistory)
      .where(eq(downloadHistory.userId, userId));
    return records.length;
  }

  async getUserDownloadHistory(userId: string): Promise<(DownloadHistory & { file?: DownloadFile })[]> {
    const records = await db
      .select({
        id: downloadHistory.id,
        userId: downloadHistory.userId,
        fileId: downloadHistory.fileId,
        downloadedAt: downloadHistory.downloadedAt,
        file: downloadFiles,
      })
      .from(downloadHistory)
      .leftJoin(downloadFiles, eq(downloadHistory.fileId, downloadFiles.id))
      .where(eq(downloadHistory.userId, userId))
      .orderBy(desc(downloadHistory.downloadedAt));
    
    return records.map(r => ({
      id: r.id,
      userId: r.userId,
      fileId: r.fileId,
      downloadedAt: r.downloadedAt,
      file: r.file || undefined,
    }));
  }

  async getAllDownloadHistory(): Promise<(DownloadHistory & { file?: DownloadFile; user?: User })[]> {
    const records = await db
      .select({
        id: downloadHistory.id,
        userId: downloadHistory.userId,
        fileId: downloadHistory.fileId,
        downloadedAt: downloadHistory.downloadedAt,
        file: downloadFiles,
        user: users,
      })
      .from(downloadHistory)
      .leftJoin(downloadFiles, eq(downloadHistory.fileId, downloadFiles.id))
      .leftJoin(users, eq(downloadHistory.userId, users.id))
      .orderBy(desc(downloadHistory.downloadedAt));
    
    return records.map(r => ({
      id: r.id,
      userId: r.userId,
      fileId: r.fileId,
      downloadedAt: r.downloadedAt,
      file: r.file || undefined,
      user: r.user || undefined,
    }));
  }

  async getAllChatMessages(): Promise<ChatMessage[]> {
    const messages = await db
      .select({
        id: chatMessages.id,
        userId: chatMessages.userId,
        message: chatMessages.message,
        isAdminMessage: chatMessages.isAdminMessage,
        createdAt: chatMessages.createdAt,
        username: users.username,
      })
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.userId, users.id))
      .orderBy(chatMessages.createdAt);
    return messages.map(m => ({ ...m, username: m.username || undefined }));
  }

  async createChatMessage(userId: string, message: string, isAdminMessage: boolean): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values({
        userId,
        message,
        isAdminMessage,
      })
      .returning();

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    return {
      ...newMessage,
      username: user?.username,
    };
  }

  async getAllFaqProducts(): Promise<FaqProduct[]> {
    return await db.select().from(faqProducts).orderBy(faqProducts.displayOrder, faqProducts.name);
  }

  async getFaqProduct(productId: string): Promise<FaqProduct | undefined> {
    const [product] = await db.select().from(faqProducts).where(eq(faqProducts.id, productId));
    return product || undefined;
  }

  async createFaqProduct(productData: InsertFaqProduct): Promise<FaqProduct> {
    const [product] = await db.insert(faqProducts).values(productData).returning();
    return product;
  }

  async updateFaqProduct(productId: string, updates: Partial<Pick<FaqProduct, 'name' | 'description' | 'displayOrder'>>): Promise<FaqProduct | undefined> {
    const [product] = await db
      .update(faqProducts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(faqProducts.id, productId))
      .returning();
    return product || undefined;
  }

  async deleteFaqProduct(productId: string): Promise<void> {
    await db.delete(faqProducts).where(eq(faqProducts.id, productId));
  }

  async getFaqItemsByProduct(productId: string): Promise<FaqItem[]> {
    return await db.select().from(faqItems).where(eq(faqItems.productId, productId)).orderBy(faqItems.displayOrder);
  }

  async getFaqItem(itemId: string): Promise<FaqItem | undefined> {
    const [item] = await db.select().from(faqItems).where(eq(faqItems.id, itemId));
    return item || undefined;
  }

  async createFaqItem(itemData: InsertFaqItem): Promise<FaqItem> {
    const [item] = await db.insert(faqItems).values(itemData).returning();
    return item;
  }

  async updateFaqItem(itemId: string, updates: Partial<Pick<FaqItem, 'issue' | 'solutions' | 'displayOrder'>>): Promise<FaqItem | undefined> {
    const [item] = await db
      .update(faqItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(faqItems.id, itemId))
      .returning();
    return item || undefined;
  }

  async deleteFaqItem(itemId: string): Promise<void> {
    await db.delete(faqItems).where(eq(faqItems.id, itemId));
  }

  // Audit log operations
  async createAuditLog(logData: InsertAuditLog): Promise<void> {
    await db.insert(auditLog).values(logData);
  }

  async getAllAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    const logs = await db
      .select()
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit);
    
    const logsWithUsernames = await Promise.all(
      logs.map(async (log) => {
        const user = await this.getUser(log.userId);
        return { ...log, username: user?.username };
      })
    );
    
    return logsWithUsernames;
  }

  async getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.userId, userId))
      .orderBy(desc(auditLog.createdAt));
  }

  async getAuditLogsByEntityType(entityType: string): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.entityType, entityType))
      .orderBy(desc(auditLog.createdAt));
  }

  // Announcement operations
  async getAllAnnouncements(includeInactive: boolean = false): Promise<Announcement[]> {
    const query = db.select().from(announcements).orderBy(desc(announcements.createdAt));
    const results = await (includeInactive ? query : query.where(eq(announcements.isActive, true)));
    
    const announcementsWithUsernames = await Promise.all(
      results.map(async (announcement) => {
        const user = await this.getUser(announcement.createdById);
        return { ...announcement, createdByUsername: user?.username };
      })
    );
    
    return announcementsWithUsernames;
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
    if (!announcement) return undefined;
    
    const user = await this.getUser(announcement.createdById);
    return { ...announcement, createdByUsername: user?.username };
  }

  async createAnnouncement(announcementData: InsertAnnouncement & { createdById: string }): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values(announcementData).returning();
    return announcement;
  }

  async updateAnnouncement(id: string, updates: Partial<Pick<Announcement, 'title' | 'content' | 'priority' | 'isActive'>>): Promise<Announcement | undefined> {
    const [announcement] = await db
      .update(announcements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return announcement || undefined;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.length;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // File version operations
  async getFileVersions(fileId: string): Promise<FileVersion[]> {
    const versions = await db
      .select()
      .from(fileVersions)
      .where(eq(fileVersions.fileId, fileId))
      .orderBy(desc(fileVersions.createdAt));
    
    const versionsWithUsernames = await Promise.all(
      versions.map(async (version) => {
        const user = await this.getUser(version.uploadedById);
        return { ...version, uploaderUsername: user?.username };
      })
    );
    
    return versionsWithUsernames;
  }

  async createFileVersion(versionData: InsertFileVersion): Promise<FileVersion> {
    const [version] = await db.insert(fileVersions).values(versionData).returning();
    return version;
  }

  async deleteFileVersion(versionId: string): Promise<void> {
    await db.delete(fileVersions).where(eq(fileVersions.id, versionId));
  }

  // File comment operations
  async getFileComments(fileId: string): Promise<FileComment[]> {
    const comments = await db
      .select()
      .from(fileComments)
      .where(eq(fileComments.fileId, fileId))
      .orderBy(desc(fileComments.createdAt));
    
    const commentsWithUsernames = await Promise.all(
      comments.map(async (comment) => {
        const user = await this.getUser(comment.createdById);
        return { ...comment, createdByUsername: user?.username };
      })
    );
    
    return commentsWithUsernames;
  }

  async createFileComment(commentData: InsertFileComment & { createdById: string }): Promise<FileComment> {
    const [comment] = await db.insert(fileComments).values(commentData).returning();
    return comment;
  }

  async deleteFileComment(commentId: string): Promise<void> {
    await db.delete(fileComments).where(eq(fileComments.id, commentId));
  }

  // Favorite operations
  async getFavoritesByUser(userId: string): Promise<DownloadFile[]> {
    const favoriteRecords = await db
      .select()
      .from(fileFavorites)
      .where(eq(fileFavorites.userId, userId));
    
    const files = await Promise.all(
      favoriteRecords.map(async (fav) => {
        const file = await this.getFile(fav.fileId);
        return file;
      })
    );
    
    return files.filter(Boolean) as DownloadFile[];
  }

  async isFavorite(userId: string, fileId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(fileFavorites)
      .where(and(eq(fileFavorites.userId, userId), eq(fileFavorites.fileId, fileId)));
    return !!result;
  }

  async addFavorite(userId: string, fileId: string): Promise<void> {
    await db.insert(fileFavorites).values({ userId, fileId }).onConflictDoNothing();
  }

  async removeFavorite(userId: string, fileId: string): Promise<void> {
    await db
      .delete(fileFavorites)
      .where(and(eq(fileFavorites.userId, userId), eq(fileFavorites.fileId, fileId)));
  }

  // Tag operations
  async getAllTags(): Promise<FileTag[]> {
    return await db.select().from(fileTags).orderBy(fileTags.name);
  }

  async getTag(id: string): Promise<FileTag | undefined> {
    const [tag] = await db.select().from(fileTags).where(eq(fileTags.id, id));
    return tag || undefined;
  }

  async createTag(tagData: InsertFileTag & { createdById: string }): Promise<FileTag> {
    const [tag] = await db.insert(fileTags).values(tagData).returning();
    return tag;
  }

  async updateTag(id: string, updates: Partial<Pick<FileTag, 'name' | 'color'>>): Promise<FileTag | undefined> {
    const [tag] = await db
      .update(fileTags)
      .set(updates)
      .where(eq(fileTags.id, id))
      .returning();
    return tag || undefined;
  }

  async deleteTag(id: string): Promise<void> {
    await db.delete(fileTags).where(eq(fileTags.id, id));
  }

  async getFileTags(fileId: string): Promise<FileTag[]> {
    const tagRelations = await db
      .select()
      .from(fileTagRelations)
      .where(eq(fileTagRelations.fileId, fileId));
    
    const tags = await Promise.all(
      tagRelations.map(async (rel) => {
        const tag = await this.getTag(rel.tagId);
        return tag;
      })
    );
    
    return tags.filter(Boolean) as FileTag[];
  }

  async addTagToFile(fileId: string, tagId: string): Promise<void> {
    await db.insert(fileTagRelations).values({ fileId, tagId }).onConflictDoNothing();
  }

  async removeTagFromFile(fileId: string, tagId: string): Promise<void> {
    await db
      .delete(fileTagRelations)
      .where(and(eq(fileTagRelations.fileId, fileId), eq(fileTagRelations.tagId, tagId)));
  }

  // Collection operations
  async getAllCollections(): Promise<FileCollection[]> {
    const collections = await db.select().from(fileCollections).orderBy(desc(fileCollections.createdAt));
    
    const collectionsWithDetails = await Promise.all(
      collections.map(async (collection) => {
        const user = await this.getUser(collection.createdById);
        const files = await this.getCollectionFiles(collection.id);
        return {
          ...collection,
          createdByUsername: user?.username,
          fileCount: files.length,
        };
      })
    );
    
    return collectionsWithDetails;
  }

  async getCollection(id: string): Promise<FileCollection | undefined> {
    const [collection] = await db.select().from(fileCollections).where(eq(fileCollections.id, id));
    if (!collection) return undefined;
    
    const user = await this.getUser(collection.createdById);
    const files = await this.getCollectionFiles(id);
    return {
      ...collection,
      createdByUsername: user?.username,
      fileCount: files.length,
    };
  }

  async createCollection(collectionData: InsertFileCollection & { createdById: string }): Promise<FileCollection> {
    const [collection] = await db.insert(fileCollections).values(collectionData).returning();
    return collection;
  }

  async updateCollection(id: string, updates: Partial<Pick<FileCollection, 'name' | 'description'>>): Promise<FileCollection | undefined> {
    const [collection] = await db
      .update(fileCollections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fileCollections.id, id))
      .returning();
    return collection || undefined;
  }

  async deleteCollection(id: string): Promise<void> {
    await db.delete(fileCollections).where(eq(fileCollections.id, id));
  }

  async getCollectionFiles(collectionId: string): Promise<DownloadFile[]> {
    const collectionFileRecords = await db
      .select()
      .from(collectionFiles)
      .where(eq(collectionFiles.collectionId, collectionId))
      .orderBy(collectionFiles.displayOrder);
    
    const files = await Promise.all(
      collectionFileRecords.map(async (cf) => {
        const file = await this.getFile(cf.fileId);
        return file;
      })
    );
    
    return files.filter(Boolean) as DownloadFile[];
  }

  async addFileToCollection(collectionId: string, fileId: string, displayOrder: number = 0): Promise<void> {
    await db
      .insert(collectionFiles)
      .values({ collectionId, fileId, displayOrder })
      .onConflictDoNothing();
  }

  async removeFileFromCollection(collectionId: string, fileId: string): Promise<void> {
    await db
      .delete(collectionFiles)
      .where(and(eq(collectionFiles.collectionId, collectionId), eq(collectionFiles.fileId, fileId)));
  }

  // Analytics operations
  async getDownloadStats(days: number): Promise<{ date: string; count: number }[]> {
    const result = await db
      .select()
      .from(downloadHistory)
      .orderBy(desc(downloadHistory.downloadedAt))
      .limit(10000);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filtered = result.filter(r => r.downloadedAt >= cutoffDate);
    
    const grouped = filtered.reduce((acc: Record<string, number>, record) => {
      const date = record.downloadedAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getFileDownloadCounts(): Promise<{ fileId: string; fileName: string; downloadCount: number }[]> {
    const downloads = await db.select().from(downloadHistory);
    
    const counts = downloads.reduce((acc: Record<string, number>, record) => {
      acc[record.fileId] = (acc[record.fileId] || 0) + 1;
      return acc;
    }, {});
    
    const results = await Promise.all(
      Object.entries(counts).map(async ([fileId, count]) => {
        const file = await this.getFile(fileId);
        return {
          fileId,
          fileName: file?.name || 'Unknown',
          downloadCount: count,
        };
      })
    );
    
    return results.sort((a, b) => b.downloadCount - a.downloadCount);
  }

  async getUserActivityStats(): Promise<{ userId: string; username: string; downloadCount: number; lastActive: Date }[]> {
    const downloads = await db.select().from(downloadHistory);
    
    const userStats = downloads.reduce((acc: Record<string, { count: number; lastActive: Date }>, record) => {
      if (!acc[record.userId]) {
        acc[record.userId] = { count: 0, lastActive: record.downloadedAt };
      }
      acc[record.userId].count++;
      if (record.downloadedAt > acc[record.userId].lastActive) {
        acc[record.userId].lastActive = record.downloadedAt;
      }
      return acc;
    }, {});
    
    const results = await Promise.all(
      Object.entries(userStats).map(async ([userId, stats]) => {
        const user = await this.getUser(userId);
        return {
          userId,
          username: user?.username || 'Unknown',
          downloadCount: stats.count,
          lastActive: stats.lastActive,
        };
      })
    );
    
    return results.sort((a, b) => b.downloadCount - a.downloadCount);
  }

  // Discord account operations
  async getDiscordAccountByUserId(userId: string): Promise<DiscordAccount | undefined> {
    const [account] = await db.select().from(discordAccounts).where(eq(discordAccounts.userId, userId));
    return account;
  }

  async getDiscordAccountByDiscordId(discordId: string): Promise<DiscordAccount | undefined> {
    const [account] = await db.select().from(discordAccounts).where(eq(discordAccounts.discordId, discordId));
    return account;
  }

  async linkDiscordAccount(account: InsertDiscordAccount): Promise<DiscordAccount> {
    const [newAccount] = await db.insert(discordAccounts).values(account).returning();
    return newAccount;
  }

  async unlinkDiscordAccount(userId: string): Promise<void> {
    await db.delete(discordAccounts).where(eq(discordAccounts.userId, userId));
  }

  async updateDiscordAccount(userId: string, updates: Partial<DiscordAccount>): Promise<void> {
    await db.update(discordAccounts).set({ ...updates, updatedAt: new Date() }).where(eq(discordAccounts.userId, userId));
  }

  // Forum category operations
  async getAllForumCategories(): Promise<ForumCategory[]> {
    return await db.select().from(forumCategories).orderBy(forumCategories.displayOrder);
  }

  async getForumCategory(id: string): Promise<ForumCategory | undefined> {
    const [category] = await db.select().from(forumCategories).where(eq(forumCategories.id, id));
    return category;
  }

  async createForumCategory(category: InsertForumCategory): Promise<ForumCategory> {
    const [newCategory] = await db.insert(forumCategories).values(category).returning();
    return newCategory;
  }

  async updateForumCategory(id: string, updates: Partial<Pick<ForumCategory, 'name' | 'description' | 'displayOrder' | 'isLocked'>>): Promise<ForumCategory | undefined> {
    const [updated] = await db.update(forumCategories).set(updates).where(eq(forumCategories.id, id)).returning();
    return updated;
  }

  async deleteForumCategory(id: string): Promise<void> {
    await db.delete(forumCategories).where(eq(forumCategories.id, id));
  }

  // Forum thread operations
  async getAllForumThreads(categoryId?: string): Promise<ForumThread[]> {
    if (categoryId) {
      return await db.select().from(forumThreads).where(eq(forumThreads.categoryId, categoryId)).orderBy(desc(forumThreads.isPinned), desc(forumThreads.lastPostAt));
    }
    return await db.select().from(forumThreads).orderBy(desc(forumThreads.isPinned), desc(forumThreads.lastPostAt));
  }

  async getForumThread(id: string): Promise<ForumThread | undefined> {
    const [thread] = await db.select().from(forumThreads).where(eq(forumThreads.id, id));
    return thread;
  }

  async createForumThread(thread: InsertForumThread): Promise<ForumThread> {
    const [newThread] = await db.insert(forumThreads).values(thread).returning();
    return newThread;
  }

  async updateForumThread(id: string, updates: Partial<Pick<ForumThread, 'title' | 'isPinned' | 'isLocked'>>): Promise<ForumThread | undefined> {
    const [updated] = await db.update(forumThreads).set({ ...updates, updatedAt: new Date() }).where(eq(forumThreads.id, id)).returning();
    return updated;
  }

  async deleteForumThread(id: string): Promise<void> {
    await db.delete(forumPosts).where(eq(forumPosts.threadId, id));
    await db.delete(forumThreads).where(eq(forumThreads.id, id));
  }

  async incrementThreadViews(id: string): Promise<void> {
    const thread = await this.getForumThread(id);
    if (thread) {
      await db.update(forumThreads).set({ viewCount: thread.viewCount + 1 }).where(eq(forumThreads.id, id));
    }
  }

  // Forum post operations
  async getThreadPosts(threadId: string): Promise<ForumPost[]> {
    return await db.select().from(forumPosts).where(eq(forumPosts.threadId, threadId)).orderBy(forumPosts.createdAt);
  }

  async createForumPost(post: InsertForumPost & { createdById: string }): Promise<ForumPost> {
    const [newPost] = await db.insert(forumPosts).values(post).returning();
    const thread = await this.getForumThread(post.threadId);
    if (thread) {
      await db.update(forumThreads).set({
        replyCount: thread.replyCount + 1,
        lastPostAt: newPost.createdAt,
        lastPostById: post.createdById,
        updatedAt: new Date()
      }).where(eq(forumThreads.id, post.threadId));
    }
    return newPost;
  }

  async updateForumPost(id: string, content: string): Promise<ForumPost | undefined> {
    const [updated] = await db.update(forumPosts).set({ content, isEdited: true, editedAt: new Date(), updatedAt: new Date() }).where(eq(forumPosts.id, id)).returning();
    return updated;
  }

  async deleteForumPost(id: string): Promise<void> {
    const [post] = await db.select().from(forumPosts).where(eq(forumPosts.id, id));
    if (post) {
      await db.delete(forumPosts).where(eq(forumPosts.id, id));
      const thread = await this.getForumThread(post.threadId);
      if (thread && thread.replyCount > 0) {
        await db.update(forumThreads).set({ replyCount: thread.replyCount - 1 }).where(eq(forumThreads.id, post.threadId));
      }
    }
  }

  // Direct message operations
  async getUserConversations(userId: string): Promise<{ userId: string; username: string; avatar: string | null; lastMessage: string; lastMessageAt: Date; unreadCount: number }[]> {
    const sentMessages = await db.select().from(directMessages).where(eq(directMessages.fromUserId, userId));
    const receivedMessages = await db.select().from(directMessages).where(eq(directMessages.toUserId, userId));
    
    const conversations = new Map<string, { lastMessage: string; lastMessageAt: Date; unreadCount: number }>();
    
    [...sentMessages, ...receivedMessages].forEach(msg => {
      const otherUserId = msg.fromUserId === userId ? msg.toUserId : msg.fromUserId;
      const existing = conversations.get(otherUserId);
      
      if (!existing || msg.createdAt > existing.lastMessageAt) {
        const unreadCount = receivedMessages.filter(m => m.fromUserId === otherUserId && !m.isRead).length;
        conversations.set(otherUserId, {
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount
        });
      }
    });
    
    const results = await Promise.all(
      Array.from(conversations.entries()).map(async ([otherUserId, data]) => {
        const user = await this.getUser(otherUserId);
        return {
          userId: otherUserId,
          username: user?.username || 'Unknown',
          avatar: user?.avatar || null,
          ...data
        };
      })
    );
    
    return results.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  async getConversationMessages(userId: string, otherUserId: string): Promise<DirectMessage[]> {
    const messages = await db.select().from(directMessages).where(
      and(
        eq(directMessages.fromUserId, userId),
        eq(directMessages.toUserId, otherUserId)
      )
    );
    
    const otherMessages = await db.select().from(directMessages).where(
      and(
        eq(directMessages.fromUserId, otherUserId),
        eq(directMessages.toUserId, userId)
      )
    );
    
    return [...messages, ...otherMessages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async sendDirectMessage(fromUserId: string, message: InsertDirectMessage): Promise<DirectMessage> {
    const [newMessage] = await db.insert(directMessages).values({ ...message, fromUserId }).returning();
    return newMessage;
  }

  async markMessagesAsRead(userId: string, fromUserId: string): Promise<void> {
    await db.update(directMessages)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(directMessages.toUserId, userId), eq(directMessages.fromUserId, fromUserId), eq(directMessages.isRead, false)));
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const unreadMessages = await db.select().from(directMessages).where(and(eq(directMessages.toUserId, userId), eq(directMessages.isRead, false)));
    return unreadMessages.length;
  }

  // Webhook operations
  async getAllWebhooks(): Promise<WebhookConfig[]> {
    return await db.select().from(webhookConfig).orderBy(webhookConfig.createdAt);
  }

  async getWebhook(id: string): Promise<WebhookConfig | undefined> {
    const [webhook] = await db.select().from(webhookConfig).where(eq(webhookConfig.id, id));
    return webhook;
  }

  async getActiveWebhooksByEvent(event: string): Promise<WebhookConfig[]> {
    const webhooks = await db.select().from(webhookConfig).where(eq(webhookConfig.isActive, true));
    return webhooks.filter(w => w.events.includes(event));
  }

  async createWebhook(webhook: InsertWebhookConfig): Promise<WebhookConfig> {
    const [newWebhook] = await db.insert(webhookConfig).values(webhook).returning();
    return newWebhook;
  }

  async updateWebhook(id: string, updates: Partial<Pick<WebhookConfig, 'name' | 'webhookUrl' | 'events' | 'isActive'>>): Promise<WebhookConfig | undefined> {
    const [updated] = await db.update(webhookConfig).set({ ...updates, updatedAt: new Date() }).where(eq(webhookConfig.id, id)).returning();
    return updated;
  }

  async deleteWebhook(id: string): Promise<void> {
    await db.delete(webhookConfig).where(eq(webhookConfig.id, id));
  }
}

export const storage = new DatabaseStorage();
