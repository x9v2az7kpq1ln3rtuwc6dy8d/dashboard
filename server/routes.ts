import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";
import {
  updateUserRoleSchema,
  updateUserStatusSchema,
  updateUserProfileSchema,
  insertInviteCodeSchema,
  fileUploadMetadataSchema,
  updateFileSchema,
  insertChatMessageSchema,
  insertFaqProductSchema,
  updateFaqProductSchema,
  insertFaqItemSchema,
  updateFaqItemSchema,
} from "@shared/schema";

// Sanitize filename to prevent path traversal
function sanitizeFilename(filename: string): string {
  // Remove any path separators and only keep the extension
  const ext = path.extname(filename);
  const sanitizedExt = ext.replace(/[^a-zA-Z0-9.]/g, "");
  // Generate a completely safe random filename
  const randomName = randomBytes(16).toString("hex");
  return randomName + sanitizedExt;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Use completely sanitized filename to prevent path traversal
      const safeFilename = sanitizeFilename(file.originalname);
      cb(null, safeFilename);
    },
  }),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Stats endpoint
  app.get("/api/stats", requireAuth, async (req, res, next) => {
    try {
      const user = req.user!;
      const downloadCount = await storage.getUserDownloadCount(user.id);
      const files = await storage.getFilesForUser(user.role);

      const stats: any = {
        totalDownloads: downloadCount,
        availableFiles: files.length,
      };

      // Add admin stats
      if (user.role === "admin") {
        const allUsers = await storage.getAllUsers();
        stats.totalUsers = allUsers.length;
      }

      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  // Get files for current user (based on role)
  app.get("/api/files", requireAuth, async (req, res, next) => {
    try {
      const user = req.user!;
      const files = await storage.getFilesForUser(user.role);
      res.json(files);
    } catch (error) {
      next(error);
    }
  });

  // Download a file
  app.post("/api/files/:fileId/download", requireAuth, async (req, res, next) => {
    try {
      const user = req.user!;
      const { fileId } = req.params;

      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).send("File not found");
      }

      // Check if user has permission to download this file
      if (!file.allowedRoles.includes(user.role)) {
        return res.status(403).send("You don't have permission to download this file");
      }

      // Record download
      await storage.recordDownload(user.id, fileId);

      // Securely construct file path and prevent directory traversal
      const uploadDir = path.resolve(process.cwd(), "uploads");
      const requestedPath = path.resolve(uploadDir, path.basename(file.filename));
      
      // Ensure the resolved path is still within the uploads directory
      if (!requestedPath.startsWith(uploadDir + path.sep)) {
        return res.status(403).send("Invalid file path");
      }

      if (!fs.existsSync(requestedPath)) {
        return res.status(404).send("File not found on server");
      }

      res.download(requestedPath, file.name);
    } catch (error) {
      next(error);
    }
  });

  // Get current user's profile
  app.get("/api/profile", requireAuth, async (req, res, next) => {
    try {
      const user = req.user!;
      const fullUser = await storage.getUser(user.id);
      if (!fullUser) {
        return res.status(404).send("User not found");
      }
      // Don't send password to client
      const { password, ...userWithoutPassword } = fullUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Update current user's profile
  app.patch("/api/profile", requireAuth, async (req, res, next) => {
    try {
      const user = req.user!;
      const validation = updateUserProfileSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const updatedUser = await storage.updateUserProfile(user.id, validation.data);
      if (!updatedUser) {
        return res.status(404).send("User not found");
      }

      // Don't send password to client
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Get current user's download history
  app.get("/api/downloads/history", requireAuth, async (req, res, next) => {
    try {
      const user = req.user!;
      const history = await storage.getUserDownloadHistory(user.id);
      res.json(history);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get all download history
  app.get("/api/admin/downloads/history", requireRole("admin"), async (req, res, next) => {
    try {
      const history = await storage.getAllDownloadHistory();
      res.json(history);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get all users
  app.get("/api/admin/users", requireRole("admin", "moderator"), async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Update user role
  app.patch("/api/admin/users/:userId/role", requireRole("admin"), async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // Validate request body with Zod
      const validation = updateUserRoleSchema.safeParse({ userId, ...req.body });
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const { role } = validation.data;
      const user = await storage.updateUserRole(userId, role);
      if (!user) {
        return res.status(404).send("User not found");
      }

      // Broadcast user update to all clients
      broadcast("user_updated", user);

      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Update user status
  app.patch("/api/admin/users/:userId/status", requireRole("admin"), async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // Validate request body with Zod
      const validation = updateUserStatusSchema.safeParse({ userId, ...req.body });
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const { isActive } = validation.data;
      const user = await storage.updateUserStatus(userId, isActive);
      if (!user) {
        return res.status(404).send("User not found");
      }

      // Broadcast user update to all clients
      broadcast("user_updated", user);

      res.json(user);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get all invite codes
  app.get("/api/admin/invite-codes", requireRole("admin", "moderator"), async (req, res, next) => {
    try {
      const codes = await storage.getAllInviteCodes();
      res.json(codes);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Generate invite code
  app.post("/api/admin/invite-codes", requireRole("admin"), async (req, res, next) => {
    try {
      // Validate request body with Zod
      const validation = insertInviteCodeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const { role } = validation.data;
      const code = await storage.createInviteCode({
        role,
        createdById: req.user!.id,
      });

      res.status(201).json(code);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Delete invite code
  app.delete("/api/admin/invite-codes/:codeId", requireRole("admin"), async (req, res, next) => {
    try {
      const { codeId } = req.params;
      await storage.deleteInviteCode(codeId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get all files
  app.get("/api/admin/files", requireRole("admin", "moderator"), async (req, res, next) => {
    try {
      const files = await storage.getAllFiles();
      res.json(files);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Upload file
  app.post("/api/admin/files", requireRole("admin"), upload.single("file"), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded");
      }

      // Parse allowedRoles from JSON string
      let parsedBody = { ...req.body };
      try {
        if (typeof req.body.allowedRoles === "string") {
          parsedBody.allowedRoles = JSON.parse(req.body.allowedRoles);
        }
      } catch {
        return res.status(400).send("Invalid allowedRoles format");
      }

      // Validate request body with Zod
      const validation = fileUploadMetadataSchema.safeParse(parsedBody);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const { name, description, version, allowedRoles, category } = validation.data;

      const file = await storage.createFile({
        name,
        description: description || null,
        filename: req.file.filename,
        fileSize: req.file.size,
        version: version || null,
        category,
        allowedRoles,
        uploadedById: req.user!.id,
      });

      // Broadcast file upload to all clients
      broadcast("file_uploaded", file);

      res.status(201).json(file);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Update file
  app.patch("/api/admin/files/:fileId", requireRole("admin"), async (req, res, next) => {
    try {
      const { fileId } = req.params;

      // Validate request body with Zod
      const validation = updateFileSchema.safeParse({ fileId, ...req.body });
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const { category, name, description, version } = validation.data;
      const updates: any = {};
      if (category !== undefined) updates.category = category;
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (version !== undefined) updates.version = version;

      const file = await storage.updateFile(fileId, updates);
      if (!file) {
        return res.status(404).send("File not found");
      }

      // Broadcast file update to all clients
      broadcast("file_updated", file);

      res.json(file);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Delete file
  app.delete("/api/admin/files/:fileId", requireRole("admin"), async (req, res, next) => {
    try {
      const { fileId } = req.params;

      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).send("File not found");
      }

      // Delete from filesystem
      const filePath = path.join(process.cwd(), "uploads", file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database
      await storage.deleteFile(fileId);

      // Broadcast file deletion to all clients
      broadcast("file_deleted", { id: fileId });

      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Chat: Get all messages
  app.get("/api/chat/messages", requireAuth, async (req, res, next) => {
    try {
      const messages = await storage.getAllChatMessages();
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  // Chat: Send message
  app.post("/api/chat/messages", requireAuth, async (req, res, next) => {
    try {
      const validation = insertChatMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const { message } = validation.data;
      const isAdminMessage = req.user!.role === "admin" || req.user!.role === "moderator";

      const newMessage = await storage.createChatMessage(
        req.user!.id,
        message,
        isAdminMessage
      );

      // Broadcast to WebSocket clients
      broadcast("chat_message", newMessage);

      res.status(201).json(newMessage);
    } catch (error) {
      next(error);
    }
  });

  // FAQ: Get all products (customer)
  app.get("/api/faq/products", requireAuth, async (req, res, next) => {
    try {
      const products = await storage.getAllFaqProducts();
      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  // FAQ: Get items for a product (customer)
  app.get("/api/faq/items/:productId", requireAuth, async (req, res, next) => {
    try {
      const { productId } = req.params;
      const items = await storage.getFaqItemsByProduct(productId);
      res.json(items);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Create FAQ product
  app.post("/api/admin/faq/products", requireRole("admin"), async (req, res, next) => {
    try {
      const validation = insertFaqProductSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const product = await storage.createFaqProduct(validation.data);
      broadcast("faq_product_created", product);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Update FAQ product
  app.patch("/api/admin/faq/products/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const { id } = req.params;
      const validation = updateFaqProductSchema.safeParse({ id, ...req.body });
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const { name, description, displayOrder } = validation.data;
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (displayOrder !== undefined) updates.displayOrder = displayOrder;

      const product = await storage.updateFaqProduct(id, updates);
      if (!product) {
        return res.status(404).send("Product not found");
      }

      broadcast("faq_product_updated", product);
      res.json(product);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Delete FAQ product
  app.delete("/api/admin/faq/products/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteFaqProduct(id);
      broadcast("faq_product_deleted", { id });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Create FAQ item
  app.post("/api/admin/faq/items", requireRole("admin"), async (req, res, next) => {
    try {
      const validation = insertFaqItemSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const item = await storage.createFaqItem(validation.data);
      broadcast("faq_item_created", item);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Update FAQ item
  app.patch("/api/admin/faq/items/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const { id } = req.params;
      const validation = updateFaqItemSchema.safeParse({ id, ...req.body });
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors });
      }

      const { issue, solutions, displayOrder } = validation.data;
      const updates: any = {};
      if (issue !== undefined) updates.issue = issue;
      if (solutions !== undefined) updates.solutions = solutions;
      if (displayOrder !== undefined) updates.displayOrder = displayOrder;

      const item = await storage.updateFaqItem(id, updates);
      if (!item) {
        return res.status(404).send("Item not found");
      }

      broadcast("faq_item_updated", item);
      res.json(item);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Delete FAQ item
  app.delete("/api/admin/faq/items/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteFaqItem(id);
      broadcast("faq_item_deleted", { id });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // ==================== AUDIT LOG ROUTES ====================
  app.get("/api/admin/audit-logs", requireRole("admin"), async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAllAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  // ==================== ANNOUNCEMENT ROUTES ====================
  app.get("/api/announcements", requireAuth, async (req, res, next) => {
    try {
      const announcements = await storage.getAllAnnouncements(false);
      res.json(announcements);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/announcements", requireRole("admin"), async (req, res, next) => {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const announcements = await storage.getAllAnnouncements(includeInactive);
      res.json(announcements);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/announcements", requireRole("admin"), async (req, res, next) => {
    try {
      const announcement = await storage.createAnnouncement({
        ...req.body,
        createdById: req.user!.id,
      });
      
      // Notify all users
      const users = await storage.getAllUsers();
      await Promise.all(users.map(user => 
        storage.createNotification({
          userId: user.id,
          type: "announcement",
          title: "New Announcement",
          message: announcement.title,
          relatedEntityId: announcement.id,
        })
      ));
      
      broadcast("announcement_created", announcement);
      broadcast("new_notification", { userIds: users.map(u => u.id) });
      res.status(201).json(announcement);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/announcements/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const { id } = req.params;
      const announcement = await storage.updateAnnouncement(id, req.body);
      if (!announcement) {
        res.status(404).json({ message: "Announcement not found" });
        return;
      }
      broadcast("announcement_updated", announcement);
      res.json(announcement);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/announcements/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteAnnouncement(id);
      broadcast("announcement_deleted", { id });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // ==================== NOTIFICATION ROUTES ====================
  app.get("/api/notifications", requireAuth, async (req, res, next) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res, next) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.markNotificationRead(id);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/notifications/read-all", requireAuth, async (req, res, next) => {
    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // ==================== FILE VERSION ROUTES ====================
  app.get("/api/files/:fileId/versions", requireAuth, async (req, res, next) => {
    try {
      const { fileId } = req.params;
      const versions = await storage.getFileVersions(fileId);
      res.json(versions);
    } catch (error) {
      next(error);
    }
  });

  // ==================== FILE COMMENT ROUTES ====================
  app.get("/api/files/:fileId/comments", requireRole("admin"), async (req, res, next) => {
    try {
      const { fileId } = req.params;
      const comments = await storage.getFileComments(fileId);
      res.json(comments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/files/:fileId/comments", requireRole("admin"), async (req, res, next) => {
    try {
      const { fileId } = req.params;
      const comment = await storage.createFileComment({
        fileId,
        comment: req.body.comment,
        createdById: req.user!.id,
      });
      broadcast("file_comment_created", { fileId, comment });
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/files/comments/:commentId", requireRole("admin"), async (req, res, next) => {
    try {
      const { commentId } = req.params;
      await storage.deleteFileComment(commentId);
      broadcast("file_comment_deleted", { commentId });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // ==================== FAVORITE ROUTES ====================
  app.get("/api/favorites", requireAuth, async (req, res, next) => {
    try {
      const favorites = await storage.getFavoritesByUser(req.user!.id);
      res.json(favorites);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/favorites/check/:fileId", requireAuth, async (req, res, next) => {
    try {
      const { fileId } = req.params;
      const isFavorite = await storage.isFavorite(req.user!.id, fileId);
      res.json({ isFavorite });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/favorites/:fileId", requireAuth, async (req, res, next) => {
    try {
      const { fileId } = req.params;
      await storage.addFavorite(req.user!.id, fileId);
      res.sendStatus(201);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/favorites/:fileId", requireAuth, async (req, res, next) => {
    try {
      const { fileId } = req.params;
      await storage.removeFavorite(req.user!.id, fileId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // ==================== TAG ROUTES ====================
  app.get("/api/tags", requireAuth, async (req, res, next) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/files/:fileId/tags", requireAuth, async (req, res, next) => {
    try {
      const { fileId } = req.params;
      const tags = await storage.getFileTags(fileId);
      res.json(tags);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/tags", requireRole("admin"), async (req, res, next) => {
    try {
      const tag = await storage.createTag({
        ...req.body,
        createdById: req.user!.id,
      });
      broadcast("tag_created", tag);
      res.status(201).json(tag);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/tags/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const { id } = req.params;
      const tag = await storage.updateTag(id, req.body);
      if (!tag) {
        res.status(404).json({ message: "Tag not found" });
        return;
      }
      broadcast("tag_updated", tag);
      res.json(tag);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/tags/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteTag(id);
      broadcast("tag_deleted", { id });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/files/:fileId/tags/:tagId", requireRole("admin"), async (req, res, next) => {
    try {
      const { fileId, tagId } = req.params;
      await storage.addTagToFile(fileId, tagId);
      broadcast("file_tag_added", { fileId, tagId });
      res.sendStatus(201);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/files/:fileId/tags/:tagId", requireRole("admin"), async (req, res, next) => {
    try {
      const { fileId, tagId } = req.params;
      await storage.removeTagFromFile(fileId, tagId);
      broadcast("file_tag_removed", { fileId, tagId });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // ==================== COLLECTION ROUTES ====================
  app.get("/api/collections", requireAuth, async (req, res, next) => {
    try {
      const collections = await storage.getAllCollections();
      res.json(collections);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/collections/:id", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const collection = await storage.getCollection(id);
      if (!collection) {
        res.status(404).json({ message: "Collection not found" });
        return;
      }
      res.json(collection);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/collections/:id/files", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const files = await storage.getCollectionFiles(id);
      res.json(files);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/collections", requireRole("admin"), async (req, res, next) => {
    try {
      const collection = await storage.createCollection({
        ...req.body,
        createdById: req.user!.id,
      });
      broadcast("collection_created", collection);
      res.status(201).json(collection);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/collections/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const { id } = req.params;
      const collection = await storage.updateCollection(id, req.body);
      if (!collection) {
        res.status(404).json({ message: "Collection not found" });
        return;
      }
      broadcast("collection_updated", collection);
      res.json(collection);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/collections/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const { id } = req.params;
      await storage.deleteCollection(id);
      broadcast("collection_deleted", { id });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/collections/:collectionId/files/:fileId", requireRole("admin"), async (req, res, next) => {
    try {
      const { collectionId, fileId } = req.params;
      const displayOrder = req.body.displayOrder || 0;
      await storage.addFileToCollection(collectionId, fileId, displayOrder);
      broadcast("collection_file_added", { collectionId, fileId });
      res.sendStatus(201);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/collections/:collectionId/files/:fileId", requireRole("admin"), async (req, res, next) => {
    try {
      const { collectionId, fileId } = req.params;
      await storage.removeFileFromCollection(collectionId, fileId);
      broadcast("collection_file_removed", { collectionId, fileId });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // ==================== ANALYTICS ROUTES ====================
  app.get("/api/admin/analytics/downloads", requireRole("admin"), async (req, res, next) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const stats = await storage.getDownloadStats(days);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/analytics/files", requireRole("admin"), async (req, res, next) => {
    try {
      const stats = await storage.getFileDownloadCounts();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/analytics/users", requireRole("admin"), async (req, res, next) => {
    try {
      const stats = await storage.getUserActivityStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates on a specific path
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: "/realtime-ws"
  });
  const clients = new Set<WebSocket>();

  wss.on("connection", (ws: WebSocket) => {
    clients.add(ws);
    console.log("WebSocket client connected. Total clients:", clients.size);

    ws.on("close", () => {
      clients.delete(ws);
      console.log("WebSocket client disconnected. Total clients:", clients.size);
    });
  });

  function broadcast(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Setup social feature routes (forums, messaging, webhooks, Discord)
  const { setupSocialRoutes } = await import("./social-routes.js");
  setupSocialRoutes(app, broadcast);

  return httpServer;
}
