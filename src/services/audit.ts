import { collection, addDoc, serverTimestamp } from '../lib/db/supabaseData';
import { db, auth } from '../lib/supabase/appClient';

export enum AuditAction {
  AUTH_PROVIDER_INITIATED = 'AUTH_PROVIDER_INITIATED',
  AUTH_ENTERPRISE_SSO_INITIATED = 'AUTH_ENTERPRISE_SSO_INITIATED',
  AUTH_MAGIC_LINK_REQUESTED = 'AUTH_MAGIC_LINK_REQUESTED',
  AUTH_OTP_REQUESTED = 'AUTH_OTP_REQUESTED',
  AUTH_OTP_VERIFIED = 'AUTH_OTP_VERIFIED',
  AUTH_PASSWORD_RESET_REQUESTED = 'AUTH_PASSWORD_RESET_REQUESTED',
  AUTH_SIGN_IN = 'AUTH_SIGN_IN',
  AUTH_SIGN_OUT = 'AUTH_SIGN_OUT',
  AUTH_LOGOUT_ALL = 'AUTH_LOGOUT_ALL',
  AUTH_SESSION_REVOKED = 'AUTH_SESSION_REVOKED',
  AUTH_TRUSTED_DEVICE_UPDATED = 'AUTH_TRUSTED_DEVICE_UPDATED',
  PWA_INSTALL_PROMPT_SHOWN = 'PWA_INSTALL_PROMPT_SHOWN',
  PWA_INSTALL_DISMISSED = 'PWA_INSTALL_DISMISSED',
  PWA_INSTALLED = 'PWA_INSTALLED',
  PWA_UPDATE_READY = 'PWA_UPDATE_READY',
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  FEATURE_CREATED = 'FEATURE_CREATED',
  FEATURE_UPDATED = 'FEATURE_UPDATED',
  FEATURE_DELETED = 'FEATURE_DELETED',
  FEATURE_LOCKED = 'FEATURE_LOCKED',
  FEATURE_UNLOCKED = 'FEATURE_UNLOCKED',
  FEATURE_ARCHIVED = 'FEATURE_ARCHIVED',
  AI_GENERATION = 'AI_GENERATION',
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  REPO_ADDED = 'REPO_ADDED',
  REPO_REMOVED = 'REPO_REMOVED',
  VERSION_CREATED = 'VERSION_CREATED',
  VERSION_UPDATED = 'VERSION_UPDATED',
  USER_FEEDBACK_SUBMITTED = 'USER_FEEDBACK_SUBMITTED',
}

export interface AuditLogEntry {
  action: AuditAction | string;
  details: any;
  userId: string;
  userEmail: string;
  projectId?: string;
  featureId?: string;
  timestamp: any;
}

export const AuditService = {
  async log(action: AuditAction | string, details: any, projectId?: string, featureId?: string) {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const logData: Omit<AuditLogEntry, 'timestamp'> & { timestamp: any } = {
        action,
        details,
        userId: user.uid,
        userEmail: user.email || 'unknown',
        projectId,
        featureId,
        timestamp: serverTimestamp(),
      };

      // Log to global audit logs
      await addDoc(collection(db, 'admin/audit/logs'), logData);

      // Also log to project-specific audit logs if projectId is provided
      if (projectId) {
        await addDoc(collection(db, `projects/${projectId}/audit_logs`), logData);
      }
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }
};


