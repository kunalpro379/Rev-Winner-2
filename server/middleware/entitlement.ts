import type { Request, Response, NextFunction } from "express";
import { authStorage } from "../storage-auth";
import type { AuthenticatedRequest } from "./auth";

export interface EntitlementRequest extends AuthenticatedRequest {
  entitlementInfo?: {
    hasAccess: boolean;
    source: 'individual_subscription' | 'enterprise_license' | 'admin' | 'none';
    details?: any;
  };
}

export async function checkEntitlement(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const entitlementReq = req as EntitlementRequest;
    
    if (!entitlementReq.jwtUser) {
      return res.status(401).json({ 
        hasAccess: false,
        message: "Authentication required" 
      });
    }

    const userId = entitlementReq.jwtUser.userId;
    const role = entitlementReq.jwtUser.role;

    // Admins and Super Admins always have access
    if (role === 'admin' || role === 'super_admin') {
      entitlementReq.entitlementInfo = {
        hasAccess: true,
        source: 'admin',
        details: { role }
      };
      return next();
    }

    // Check for individual subscription (active or trial status with remaining usage)
    const subscription = await authStorage.getSubscriptionByUserId(userId);
    if (subscription) {
      const now = new Date();
      const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
      
      // Allow access for trial users if they have sessions/minutes remaining
      if (subscription.status === 'trial') {
        const sessionsUsed = parseInt(subscription.sessionsUsed || '0');
        const sessionsLimit = subscription.sessionsLimit ? parseInt(subscription.sessionsLimit) : null;
        const minutesUsed = parseInt(subscription.minutesUsed || '0');
        const minutesLimit = subscription.minutesLimit ? parseInt(subscription.minutesLimit) : null;
        
        const hasSessionsRemaining = sessionsLimit === null || sessionsUsed < sessionsLimit;
        const hasMinutesRemaining = minutesLimit === null || minutesUsed < minutesLimit;
        
        if (hasSessionsRemaining && hasMinutesRemaining) {
          entitlementReq.entitlementInfo = {
            hasAccess: true,
            source: 'individual_subscription',
            details: {
              planType: subscription.planType,
              expiresAt: periodEnd,
              sessionsUsed: subscription.sessionsUsed,
              minutesUsed: subscription.minutesUsed,
              isTrial: true
            }
          };
          return next();
        }
      }
      
      // Allow access for active paid subscriptions
      if (subscription.status === 'active') {
        if (!periodEnd || periodEnd > now) {
          entitlementReq.entitlementInfo = {
            hasAccess: true,
            source: 'individual_subscription',
            details: {
              planType: subscription.planType,
              expiresAt: periodEnd,
              sessionsUsed: subscription.sessionsUsed,
              minutesUsed: subscription.minutesUsed,
              isTrial: false
            }
          };
          return next();
        }
      }
    }

    // Check for enterprise license assignment
    const licenseAssignment = await authStorage.getUserActiveLicenseAssignment(userId);
    if (licenseAssignment) {
      // Verify the license package is still active and has available capacity
      const licensePackage = await authStorage.getLicensePackageById(licenseAssignment.licensePackageId);
      
      if (licensePackage && licensePackage.status === 'active') {
        const now = new Date();
        const packageEnd = new Date(licensePackage.endDate);
        
        if (packageEnd <= now) {
          return res.status(403).json({
            hasAccess: false,
            message: "Your enterprise license has expired. Please contact your license manager for renewal.",
            reason: "enterprise_license_expired"
          });
        }

        // CRITICAL: Verify membership is still active (not suspended/deactivated)
        const membership = await authStorage.getUserMembership(userId);
        if (!membership || membership.status !== 'active' || membership.organizationId !== licensePackage.organizationId) {
          return res.status(403).json({
            hasAccess: false,
            message: "Your organization membership is inactive or has been revoked. Please contact your license manager.",
            reason: "membership_inactive"
          });
        }

        // NOTE: User has VALID ASSIGNMENT - allow access even if org is at full capacity
        // Seat capacity is enforced when ASSIGNING licenses (License Manager), not during usage
        // Fetch overview for telemetry to detect over-subscription anomalies
        let overview;
        try {
          overview = await authStorage.getOrganizationOverview(licensePackage.organizationId);
          
          // Telemetry: Alert if assigned seats exceed total (indicates data corruption)
          if (overview && overview.assignedSeats > overview.totalSeats) {
            console.error(`⚠️ SEAT OVER-SUBSCRIPTION ANOMALY: Org ${licensePackage.organizationId} has ${overview.assignedSeats}/${overview.totalSeats} seats assigned`);
          }
        } catch (error: any) {
          console.warn(`⚠️ Failed to fetch org overview for telemetry (non-blocking):`, error);
          // Don't block access - user has valid assignment
          overview = null;
        }

        entitlementReq.entitlementInfo = {
          hasAccess: true,
          source: 'enterprise_license',
          details: {
            organizationId: licensePackage.organizationId,
            packageType: licensePackage.packageType,
            expiresAt: packageEnd,
            assignmentId: licenseAssignment.id,
            seatsAvailable: overview?.availableSeats,
            seatsTotal: overview?.totalSeats
          }
        };
        return next();
      }
    }

    // No valid entitlement found
    entitlementReq.entitlementInfo = {
      hasAccess: false,
      source: 'none'
    };

    return res.status(403).json({
      hasAccess: false,
      message: "You don't have an active subscription or enterprise license. Please purchase a plan to access the platform.",
      reason: "no_active_entitlement"
    });

  } catch (error: any) {
    console.error("❌ Entitlement check error:", error);
    return res.status(500).json({ 
      hasAccess: false,
      message: "Failed to verify entitlement",
      error: error.message 
    });
  }
}

export function requireEntitlement(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const entitlementReq = req as EntitlementRequest;
  
  if (!entitlementReq.entitlementInfo || !entitlementReq.entitlementInfo.hasAccess) {
    return res.status(403).json({
      hasAccess: false,
      message: "Valid subscription or enterprise license required to access this feature"
    });
  }
  
  next();
}
