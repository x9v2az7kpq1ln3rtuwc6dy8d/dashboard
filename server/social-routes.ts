import type { Express } from "express";
import { storage } from "./storage.js";
import { requireAuth, requireRole } from "./auth.js";
import { z } from "zod";
import { insertForumCategorySchema, insertForumThreadSchema, insertForumPostSchema, insertDirectMessageSchema, insertWebhookConfigSchema } from "@shared/schema";
import { sendWebhookNotification } from "./discord.js";

export function setupSocialRoutes(app: Express, broadcast: (type: string, data: any) => void) {
  
  // Forum Category Routes
  app.get("/api/forum/categories", requireAuth, async (req, res, next) => {
    try {
      const categories = await storage.getAllForumCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/forum/categories", requireRole("admin"), async (req, res, next) => {
    try {
      const data = insertForumCategorySchema.parse(req.body);
      const category = await storage.createForumCategory(data);
      broadcast("forum_category_created", category);
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/forum/categories/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const category = await storage.updateForumCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      broadcast("forum_category_updated", category);
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/forum/categories/:id", requireRole("admin"), async (req, res, next) => {
    try {
      await storage.deleteForumCategory(req.params.id);
      broadcast("forum_category_deleted", { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Forum Thread Routes
  app.get("/api/forum/threads", requireAuth, async (req, res, next) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const threads = await storage.getAllForumThreads(categoryId);
      res.json(threads);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/forum/threads/:id", requireAuth, async (req, res, next) => {
    try {
      const thread = await storage.getForumThread(req.params.id);
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }
      await storage.incrementThreadViews(req.params.id);
      res.json(thread);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/forum/threads", requireAuth, async (req, res, next) => {
    try {
      const threadSchema = z.object({
        categoryId: z.string(),
        title: z.string(),
        content: z.string(),
      });
      const { categoryId, title, content } = threadSchema.parse(req.body);
      
      const thread = await storage.createForumThread({ categoryId, title, createdById: req.user!.id });
      
      await storage.createForumPost({ 
        threadId: thread.id, 
        content, 
        createdById: req.user!.id 
      });
      
      broadcast("forum_thread_created", thread);
      res.json(thread);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/forum/threads/:id", requireAuth, async (req, res, next) => {
    try {
      const thread = await storage.getForumThread(req.params.id);
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }
      
      const canEdit = req.user!.role === "admin" || req.user!.role === "moderator" || thread.createdById === req.user!.id;
      if (!canEdit) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const updated = await storage.updateForumThread(req.params.id, req.body);
      broadcast("forum_thread_updated", updated);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/forum/threads/:id", requireAuth, async (req, res, next) => {
    try {
      const thread = await storage.getForumThread(req.params.id);
      if (!thread) {
        return res.status(404).json({ error: "Thread not found" });
      }

      const canDelete = req.user!.role === "admin" || req.user!.role === "moderator" || thread.createdById === req.user!.id;
      if (!canDelete) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await storage.deleteForumThread(req.params.id);
      broadcast("forum_thread_deleted", { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Forum Post Routes
  app.get("/api/forum/threads/:threadId/posts", requireAuth, async (req, res, next) => {
    try {
      const posts = await storage.getThreadPosts(req.params.threadId);
      res.json(posts);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/forum/threads/:threadId/posts", requireAuth, async (req, res, next) => {
    try {
      const data = insertForumPostSchema.parse(req.body);
      const post = await storage.createForumPost({ ...data, threadId: req.params.threadId, createdById: req.user!.id });
      broadcast("forum_post_created", post);
      res.json(post);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/forum/posts/:id", requireAuth, async (req, res, next) => {
    try {
      const posts = await storage.getThreadPosts("");
      const post = posts.find(p => p.id === req.params.id);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const canEdit = req.user!.role === "admin" || req.user!.role === "moderator" || post.createdById === req.user!.id;
      if (!canEdit) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const updated = await storage.updateForumPost(req.params.id, req.body.content);
      broadcast("forum_post_updated", updated);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/forum/posts/:id", requireAuth, async (req, res, next) => {
    try {
      const posts = await storage.getThreadPosts("");
      const post = posts.find(p => p.id === req.params.id);
      
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const canDelete = req.user!.role === "admin" || req.user!.role === "moderator" || post.createdById === req.user!.id;
      if (!canDelete) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await storage.deleteForumPost(req.params.id);
      broadcast("forum_post_deleted", { id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Direct Message Routes
  app.get("/api/messages/conversations", requireAuth, async (req, res, next) => {
    try {
      const conversations = await storage.getUserConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/messages/:userId", requireAuth, async (req, res, next) => {
    try {
      const messages = await storage.getConversationMessages(req.user!.id, req.params.userId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/messages", requireAuth, async (req, res, next) => {
    try {
      const data = insertDirectMessageSchema.parse(req.body);
      const message = await storage.sendDirectMessage(req.user!.id, data);
      broadcast("direct_message_sent", message);
      res.json(message);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/messages/:userId/read", requireAuth, async (req, res, next) => {
    try {
      await storage.markMessagesAsRead(req.user!.id, req.params.userId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/messages/unread/count", requireAuth, async (req, res, next) => {
    try {
      const count = await storage.getUnreadMessageCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  });

  // Discord Account Routes
  app.get("/api/discord/account", requireAuth, async (req, res, next) => {
    try {
      const account = await storage.getDiscordAccountByUserId(req.user!.id);
      res.json(account || null);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/discord/account", requireAuth, async (req, res, next) => {
    try {
      await storage.unlinkDiscordAccount(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Webhook Routes (Admin only)
  app.get("/api/admin/webhooks", requireRole("admin"), async (req, res, next) => {
    try {
      const webhooks = await storage.getAllWebhooks();
      res.json(webhooks);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/webhooks", requireRole("admin"), async (req, res, next) => {
    try {
      const data = insertWebhookConfigSchema.parse(req.body);
      const webhook = await storage.createWebhook(data);
      res.json(webhook);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/webhooks/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const webhook = await storage.updateWebhook(req.params.id, req.body);
      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }
      res.json(webhook);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/webhooks/:id", requireRole("admin"), async (req, res, next) => {
    try {
      await storage.deleteWebhook(req.params.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/webhooks/test/:id", requireRole("admin"), async (req, res, next) => {
    try {
      const webhook = await storage.getWebhook(req.params.id);
      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      const result = await sendWebhookNotification(
        webhook.webhookUrl,
        "Test Webhook",
        "This is a test message from Akcent Dashboard",
        0x00FF00
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  });
}

// Webhook trigger helper
export async function triggerWebhooks(event: string, title: string, message: string) {
  try {
    const webhooks = await storage.getActiveWebhooksByEvent(event);
    
    for (const webhook of webhooks) {
      await sendWebhookNotification(
        webhook.webhookUrl,
        title,
        message,
        event === "download" ? 0x5865F2 :
        event === "new_user" ? 0x57F287 :
        event === "announcement" ? 0xFEE75C :
        0x5865F2
      );
    }
  } catch (error) {
    console.error("Error triggering webhooks:", error);
  }
}
