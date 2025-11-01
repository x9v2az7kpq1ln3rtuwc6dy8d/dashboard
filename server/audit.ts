import { storage } from "./storage";
import type { Request } from "express";

export async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details: string | null,
  req: Request
) {
  const ipAddress = req.ip || req.socket.remoteAddress || null;
  
  await storage.createAuditLog({
    userId,
    action,
    entityType,
    entityId: entityId || undefined,
    details: details || undefined,
    ipAddress: ipAddress || undefined,
  });
}

// Helper functions for common actions
export function auditCreate(userId: string, entityType: string, entityId: string, req: Request) {
  return logAudit(userId, "CREATE", entityType, entityId, null, req);
}

export function auditUpdate(userId: string, entityType: string, entityId: string, details: string, req: Request) {
  return logAudit(userId, "UPDATE", entityType, entityId, details, req);
}

export function auditDelete(userId: string, entityType: string, entityId: string, req: Request) {
  return logAudit(userId, "DELETE", entityType, entityId, null, req);
}

export function auditAction(userId: string, action: string, entityType: string, details: string, req: Request) {
  return logAudit(userId, action, entityType, null, details, req);
}
