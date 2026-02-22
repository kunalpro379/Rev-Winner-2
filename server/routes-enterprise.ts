import type { Express, Request, Response, NextFunction } from "express";
import { authStorage } from "./storage-auth";
import { authenticateToken, requireAuthenticated, AuthenticatedRequest, withAuthenticated } from "./middleware/auth";
import { z } from "zod";
import { randomBytes } from "crypto";
import { eventLogger } from './services/event-logger';
import { PaymentGatewayFactory } from './services/payments/PaymentGatewayFactory';
import { currencyConverter } from "./services/currency-converter";
import { DEFAULT_PAYMENT_GATEWAY } from "./config/payment.config";

// Get the base URL for payment callbacks
function getBaseUrl(req: Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
}

// Get Cashfree mode for frontend SDK
function getCashfreeMode(): 'sandbox' | 'production' {
  return process.env.CASHFREE_ENVIRONMENT === 'SANDBOX' ? 'sandbox' : 'production';
}

// Helper function to get Razorpay key ID based on environment
// RAZORPAY_MODE takes absolute precedence - if set to LIVE, use LIVE regardless of NODE_ENV
function getRazorpayKeyId(): string | undefined {
  // Check RAZORPAY_MODE first - if explicitly set, use it regardless of NODE_ENV
  if (process.env.RAZORPAY_MODE === 'LIVE' || process.env.RAZORPAY_MODE === 'PRODUCTION') {
    return process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID;
  } else if (process.env.RAZORPAY_MODE === 'TEST') {
    return process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID;
  }
  
  // Fallback: auto-detect based on NODE_ENV only if RAZORPAY_MODE is not set
  const isDevelopment = process.env.NODE_ENV === 'development';
  const razorpayMode = isDevelopment ? 'TEST' : 'LIVE';
  
  if (razorpayMode === 'TEST') {
    return process.env.RAZORPAY_TEST_KEY_ID || process.env.RAZORPAY_KEY_ID;
  } else {
    return process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID;
  }
}

export function setupEnterpriseRoutes(app: Express) {
  
  // Middleware to verify license manager access
  const requireLicenseManager = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.jwtUser.userId;
      const isManager = await authStorage.isLicenseManager(userId);
      
      if (!isManager && authReq.jwtUser.role !== 'admin') {
        return res.status(403).json({ 
          message: "Access denied. License manager role required." 
        });
      }
      
      next();
    } catch (error: any) {
      console.error("Error verifying license manager access:", error);
      res.status(500).json({ message: "Failed to verify access", error: error.message });
    }
  };
  
  // Lightweight check: does the current user already have an organization (as primary manager)?
  // Used by enterprise-purchase page to show "Add seats" CTA instead of first-time purchase form.
  app.get("/api/enterprise/has-organization", authenticateToken, requireAuthenticated, withAuthenticated(async (req, res) => {
    try {
      const userId = (req as AuthenticatedRequest).jwtUser.userId;
      const organization = await authStorage.getOrganizationByManagerId(userId);
      res.json({ hasOrganization: !!organization });
    } catch (error: any) {
      console.error("Error checking has-organization:", error);
      res.status(500).json({ hasOrganization: false, error: error.message });
    }
  }));

  // Get organization overview (license manager only)
  app.get("/api/enterprise/overview", authenticateToken, requireAuthenticated, requireLicenseManager, withAuthenticated(async (req, res) => {
    try {
      const userId = req.jwtUser.userId;
      
      // Get user's organization
      let organization = await authStorage.getOrganizationByManagerId(userId);
      
      // If not primary manager, check membership
      if (!organization) {
        const membership = await authStorage.getUserMembership(userId);
        if (membership) {
          organization = await authStorage.getOrganizationById(membership.organizationId);
        }
      }
      
      if (!organization) {
        return res.status(404).json({ message: "No organization found for this user" });
      }
      
      // Verify user can manage this organization
      const canManage = await authStorage.canManageLicenses(userId, organization.id);
      if (!canManage && req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "You do not have permission to manage this organization" });
      }
      
      // Get organization overview
      const overview = await authStorage.getOrganizationOverview(organization.id);
      
      res.json({ success: true, ...overview });
    } catch (error: any) {
      console.error("Error fetching organization overview:", error);
      res.status(500).json({ message: "Failed to fetch organization overview", error: error.message });
    }
  }));
  
  // Assign license to user
  app.post("/api/enterprise/assign", authenticateToken, requireAuthenticated, requireLicenseManager, withAuthenticated(async (req, res) => {
    try {
      const userId = req.jwtUser.userId;
      const { userEmail, firstName, lastName, phone, notes } = req.body;
      
      // Validate mandatory fields
      if (!userEmail) {
        return res.status(400).json({ message: "User email is required" });
      }
      if (!firstName || firstName.trim().length === 0) {
        return res.status(400).json({ message: "First name is required" });
      }
      if (!lastName || lastName.trim().length === 0) {
        return res.status(400).json({ message: "Last name is required" });
      }
      if (!phone || phone.trim().length < 10) {
        return res.status(400).json({ message: "Phone number is required (minimum 10 digits)" });
      }
      
      // Get user's organization
      let organization = await authStorage.getOrganizationByManagerId(userId);
      if (!organization) {
        const membership = await authStorage.getUserMembership(userId);
        if (membership) {
          organization = await authStorage.getOrganizationById(membership.organizationId);
        }
      }
      
      if (!organization) {
        return res.status(404).json({ message: "No organization found" });
      }
      
      // Verify permissions
      const canManage = await authStorage.canManageLicenses(userId, organization.id);
      if (!canManage && req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get active license package
      const activePackage = await authStorage.getActiveLicensePackage(organization.id);
      if (!activePackage) {
        return res.status(404).json({ message: "No active license package found" });
      }
      
      // Find or create user by email
      let targetUser = await authStorage.getUserByEmail(userEmail);
      
      if (!targetUser) {
        // Auto-create new user account when assigning license to new email
        // Use the provided firstName, lastName, and phone from license manager
        
        // Generate temporary username from email
        const username = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.random().toString(36).slice(2, 6);
        
        // Create user with random password (will be reset via email link)
        const tempPassword = randomBytes(32).toString('hex');
        
        targetUser = await authStorage.createUser({
          email: userEmail,
          mobile: phone.trim(),
          password: tempPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username,
          organization: organization.companyName,
          role: 'user'
        });
        
        // Immediately activate the user (no email verification needed for enterprise users)
        await authStorage.updateUser(targetUser.id, {
          status: 'active',
          emailVerified: true
        });
        
        // Generate password reset token for account activation (24-hour expiry)
        const resetToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await authStorage.createPasswordResetToken(userEmail, resetToken, expiresAt);
        
        // Send license assignment email with password setup link (fire-and-forget, don't block)
        import('./services/email').then(({ sendLicenseAssignmentEmail }) => {
          sendLicenseAssignmentEmail(
            userEmail,
            targetUser!.firstName,
            resetToken,
            organization.companyName
          ).catch(err => {
            console.error('Error sending license assignment email:', err);
          });
        }).catch(err => {
          console.error('Error importing email service:', err);
        });
        
        // Log user creation
        await eventLogger.log({
          actorId: userId,
          action: 'USER_CREATED_VIA_LICENSE',
          targetType: 'user',
          targetId: targetUser.id,
          metadata: { 
            organizationId: organization.id,
            createdByLicenseManager: true,
            email: userEmail,
            passwordResetTokenSent: true
          }
        });
      }
      
      // Check if user already has an active license
      const existingAssignment = await authStorage.getUserActiveLicenseAssignment(targetUser.id);
      if (existingAssignment) {
        return res.status(500).json({ message: "User already has an active license assignment" });
      }
      
      // Create license assignment
      const assignment = await authStorage.createLicenseAssignment({
        licensePackageId: activePackage.id,
        userId: targetUser.id,
        assignedBy: userId,
        notes,
        status: 'active'
      });

      // Ensure user has organization membership so profile/subscription/session minutes show org entitlements
      const existingMembership = await authStorage.getUserMembership(targetUser.id);
      if (!existingMembership) {
        await authStorage.createOrganizationMembership({
          organizationId: organization.id,
          userId: targetUser.id,
          role: 'member',
          status: 'active',
        });
      }
      
      // Send notification email for ALL license assignments
      // ALWAYS send password setup/reset link (fire-and-forget - don't block the response)
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      authStorage.createPasswordResetToken(userEmail, resetToken, expiresAt).then(() => {
        return import('./services/email');
      }).then(({ sendLicenseAssignmentEmail }) => {
        return sendLicenseAssignmentEmail(
          userEmail,
          targetUser.firstName,
          resetToken,
          organization.companyName
        );
      }).then(() => {
        console.log(`Password setup/reset email sent to ${userEmail}`);
      }).catch(err => {
        console.error(`Error sending password setup/reset email to ${userEmail}:`, err);
      });
      
      // Create audit log
      await eventLogger.log({
        actorId: userId,
        action: 'LICENSE_ASSIGNED',
        targetType: 'license_assignment',
        targetId: assignment.id,
        metadata: { 
          organizationId: organization.id,
          targetUserId: targetUser.id,
          targetUserEmail: userEmail
        }
      });
      
      res.json({ success: true, assignment });
    } catch (error: any) {
      console.error("Error assigning license:", error);
      res.status(500).json({ message: error.message || "Failed to assign license" });
    }
  }));
  
  // Reassign license from one user to another
  // Note: Add-ons are NOT transferred - the new user gets the Platform Access seat only.
  // If the new user needs add-ons, they must be purchased separately.
  app.post("/api/enterprise/reassign", authenticateToken, requireAuthenticated, requireLicenseManager, withAuthenticated(async (req, res) => {
    try {
      const userId = req.jwtUser.userId;
      const { assignmentId, newUserEmail, notes } = req.body;
      
      if (!assignmentId || !newUserEmail) {
        return res.status(400).json({ message: "Assignment ID and new user email are required" });
      }
      
      // Get user's organization
      let organization = await authStorage.getOrganizationByManagerId(userId);
      if (!organization) {
        const membership = await authStorage.getUserMembership(userId);
        if (membership) {
          organization = await authStorage.getOrganizationById(membership.organizationId);
        }
      }
      
      if (!organization) {
        return res.status(404).json({ message: "No organization found" });
      }
      
      // Verify permissions
      const canManage = await authStorage.canManageLicenses(userId, organization.id);
      if (!canManage && req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Find or create new user by email
      let newUser = await authStorage.getUserByEmail(newUserEmail);
      let isNewUser = false;
      
      if (!newUser) {
        // Auto-create new user account when reassigning license to new email
        const [firstName, ...lastNameParts] = newUserEmail.split('@')[0].split('.');
        const lastName = lastNameParts.length > 0 ? lastNameParts.join('.') : firstName;
        
        // Generate temporary username from email
        const username = newUserEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.random().toString(36).slice(2, 6);
        
        // Create user with random password (will be reset via email link)
        const tempPassword = randomBytes(32).toString('hex');
        
        newUser = await authStorage.createUser({
          email: newUserEmail,
          password: tempPassword,
          firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
          username,
          organization: organization.companyName,
          role: 'user'
        });
        
        // Immediately activate the user (no email verification needed for enterprise users)
        await authStorage.updateUser(newUser.id, {
          status: 'active',
          emailVerified: true
        });
        
        isNewUser = true;
        
        // Log user creation
        await eventLogger.log({
          actorId: userId,
          action: 'USER_CREATED_VIA_LICENSE_REASSIGNMENT',
          targetType: 'user',
          targetId: newUser.id,
          metadata: { 
            organizationId: organization.id,
            createdByLicenseManager: true,
            email: newUserEmail
          }
        });
      }
      
      // Check if new user already has an active license
      const existingAssignment = await authStorage.getUserActiveLicenseAssignment(newUser.id);
      if (existingAssignment) {
        return res.status(400).json({ message: "New user already has an active license assignment" });
      }
      
      // Reassign license (transfers remaining validity, NOT add-ons)
      const newAssignment = await authStorage.reassignLicense(assignmentId, newUser.id, userId, notes);

      // Ensure new user has organization membership so profile/subscription/session minutes show org entitlements
      const existingMembership = await authStorage.getUserMembership(newUser.id);
      if (!existingMembership) {
        await authStorage.createOrganizationMembership({
          organizationId: organization.id,
          userId: newUser.id,
          role: 'member',
          status: 'active',
        });
      }
      
      // Send notification email to the new user
      // ALWAYS send password setup/reset link
      const { sendLicenseAssignmentEmail } = await import('./services/email');
      
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await authStorage.createPasswordResetToken(newUserEmail, resetToken, expiresAt);
      
      await sendLicenseAssignmentEmail(
        newUserEmail,
        newUser.firstName,
        resetToken,
        organization.companyName
      );
      
      const emailType = isNewUser || !newUser.hashedPassword || newUser.hashedPassword === '' 
        ? 'password_setup' 
        : 'password_reset';
      
      console.log(`${emailType} email sent to ${newUserEmail} (via reassignment)`);
      
      // Create audit log
      await eventLogger.log({
        actorId: userId,
        action: 'LICENSE_REASSIGNED',
        targetType: 'license_assignment',
        targetId: newAssignment.id,
        metadata: { 
          organizationId: organization.id,
          oldAssignmentId: assignmentId,
          newUserId: newUser.id,
          newUserEmail,
          isNewUser,
          addOnsTransferred: false // Add-ons are NOT transferred
        }
      });
      
      res.json({ 
        success: true, 
        assignment: newAssignment,
        message: isNewUser 
          ? "License reassigned to new user. They will receive an email to set up their account." 
          : "License reassigned successfully. Note: Any add-ons must be purchased separately for the new user."
      });
    } catch (error: any) {
      console.error("Error reassigning license:", error);
      res.status(500).json({ message: error.message || "Failed to reassign license" });
    }
  }));
  
  // Unassign license from user
  app.post("/api/enterprise/unassign", authenticateToken, requireAuthenticated, requireLicenseManager, withAuthenticated(async (req, res) => {
    try {
      const userId = req.jwtUser.userId;
      const { assignmentId } = req.body;
      
      if (!assignmentId) {
        return res.status(400).json({ message: "Assignment ID is required" });
      }
      
      // Get user's organization
      let organization = await authStorage.getOrganizationByManagerId(userId);
      if (!organization) {
        const membership = await authStorage.getUserMembership(userId);
        if (membership) {
          organization = await authStorage.getOrganizationById(membership.organizationId);
        }
      }
      
      if (!organization) {
        return res.status(404).json({ message: "No organization found" });
      }
      
      // Verify permissions
      const canManage = await authStorage.canManageLicenses(userId, organization.id);
      if (!canManage && req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get assignment and user info BEFORE unassigning (for email notification)
      const assignment = await authStorage.getLicenseAssignmentById(assignmentId);
      let targetUser = null;
      if (assignment?.userId) {
        targetUser = await authStorage.getUserById(assignment.userId);
      }
      
      // Unassign license
      await authStorage.unassignLicense(assignmentId);
      
      // Send revocation notification email
      if (targetUser) {
        try {
          const { sendLicenseRevocationEmail } = await import('./services/email');
          await sendLicenseRevocationEmail(
            targetUser.email,
            targetUser.firstName || 'User',
            organization.companyName,
            'License Manager'
          );
          console.log(`License revocation email sent to ${targetUser.email}`);
        } catch (emailError) {
          console.error('Failed to send license revocation email:', emailError);
        }
      }
      
      // Create audit log
      await eventLogger.log({
        actorId: userId,
        action: 'LICENSE_UNASSIGNED',
        targetType: 'license_assignment',
        targetId: assignmentId,
        metadata: { 
          organizationId: organization.id,
          unassignedUserId: assignment?.userId,
          unassignedUserEmail: targetUser?.email
        }
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error unassigning license:", error);
      res.status(500).json({ message: error.message || "Failed to unassign license" });
    }
  }));
  
  // Resend license access email to user
  app.post("/api/enterprise/resend-email", authenticateToken, requireAuthenticated, requireLicenseManager, withAuthenticated(async (req, res) => {
    try {
      const userId = req.jwtUser.userId;
      const { assignmentId } = req.body;
      
      if (!assignmentId) {
        return res.status(400).json({ message: "Assignment ID is required" });
      }
      
      // Get user's organization
      let organization = await authStorage.getOrganizationByManagerId(userId);
      if (!organization) {
        const membership = await authStorage.getUserMembership(userId);
        if (membership) {
          organization = await authStorage.getOrganizationById(membership.organizationId);
        }
      }
      
      if (!organization) {
        return res.status(404).json({ message: "No organization found" });
      }
      
      // Verify permissions
      const canManage = await authStorage.canManageLicenses(userId, organization.id);
      if (!canManage && req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get the assignment details
      const assignment = await authStorage.getLicenseAssignmentById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "License assignment not found" });
      }
      
      // Get the user
      const targetUser = await authStorage.getUserById(assignment.userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { sendLicenseAssignmentEmail } = await import('./services/email');
      
      // Always send password setup/reset link for resend
      // Generate new password reset token
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await authStorage.createPasswordResetToken(targetUser.email, resetToken, expiresAt);
      
      await sendLicenseAssignmentEmail(
        targetUser.email,
        targetUser.firstName,
        resetToken,
        organization.companyName
      );
      
      const emailType = !targetUser.hashedPassword || targetUser.hashedPassword === '' 
        ? 'password_setup' 
        : 'password_reset';
      
      console.log(`Resent ${emailType} email to ${targetUser.email}`);
      
      // Create audit log
      await eventLogger.log({
        actorId: userId,
        action: 'LICENSE_EMAIL_RESENT',
        targetType: 'license_assignment',
        targetId: assignmentId,
        metadata: { 
          organizationId: organization.id,
          targetUserEmail: targetUser.email,
          emailType
        }
      });
      
      res.json({ 
        success: true, 
        message: "Password setup email sent successfully. User can create/reset their password using the link."
      });
    } catch (error: any) {
      console.error("Error resending email:", error);
      res.status(500).json({ message: error.message || "Failed to resend email" });
    }
  }));
  
  // Delete/deactivate user from organization
  app.delete("/api/enterprise/users/:userId", authenticateToken, requireAuthenticated, requireLicenseManager, withAuthenticated(async (req, res) => {
    try {
      const actorId = req.jwtUser.userId;
      const { userId: targetUserId } = req.params;
      
      if (!targetUserId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Prevent self-deletion
      if (actorId === targetUserId) {
        return res.status(400).json({ message: "Cannot delete yourself" });
      }
      
      // Get user's organization
      let organization = await authStorage.getOrganizationByManagerId(actorId);
      if (!organization) {
        const membership = await authStorage.getUserMembership(actorId);
        if (membership) {
          organization = await authStorage.getOrganizationById(membership.organizationId);
        }
      }
      
      if (!organization) {
        return res.status(404).json({ message: "No organization found" });
      }
      
      // Verify permissions
      const canManage = await authStorage.canManageLicenses(actorId, organization.id);
      if (!canManage && req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Verify target user belongs to the organization via license assignment or membership
      const orgData = await authStorage.getOrganizationOverview(organization.id);
      const userInOrg = orgData.assignments.some(a => a.userId === targetUserId) || 
                        orgData.members.some(m => m.userId === targetUserId);
      
      if (!userInOrg) {
        return res.status(404).json({ message: "User not found in this organization" });
      }
      
      // Prevent deleting organization owner/primary manager
      if (organization.primaryManagerId === targetUserId) {
        return res.status(400).json({ message: "Cannot delete organization owner" });
      }
      
      // Get target user to check if they exist
      const targetUser = await authStorage.getUserById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Deactivate the user (soft delete)
      await authStorage.deactivateEnterpriseUser(targetUserId, actorId, organization.id);
      
      // Get updated organization overview for response
      const overview = await authStorage.getOrganizationOverview(organization.id);
      
      res.json({ 
        success: true,
        message: "User deactivated successfully",
        updatedSeats: {
          total: overview.totalSeats,
          assigned: overview.assignedSeats,
          available: overview.availableSeats
        }
      });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: error.message || "Failed to delete user" });
    }
  }));
  
  // Get all organization members
  app.get("/api/enterprise/members", authenticateToken, requireAuthenticated, requireLicenseManager, withAuthenticated(async (req, res) => {
    try {
      const userId = req.jwtUser.userId;
      
      // Get user's organization
      let organization = await authStorage.getOrganizationByManagerId(userId);
      if (!organization) {
        const membership = await authStorage.getUserMembership(userId);
        if (membership) {
          organization = await authStorage.getOrganizationById(membership.organizationId);
        }
      }
      
      if (!organization) {
        return res.status(404).json({ message: "No organization found" });
      }
      
      // Verify permissions
      const canManage = await authStorage.canManageLicenses(userId, organization.id);
      if (!canManage && req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get organization overview (includes members)
      const overview = await authStorage.getOrganizationOverview(organization.id);
      
      res.json({ success: true, members: overview.members });
    } catch (error: any) {
      console.error("Error fetching organization members:", error);
      res.status(500).json({ message: "Failed to fetch organization members", error: error.message });
    }
  }));
  
  // Validation schemas for enterprise purchase
  const purchaseSchema = z.object({
    totalSeats: z.number().int().min(5, "Minimum 5 seats required"),
    packageType: z.enum(['monthly', 'annual']),
    companyName: z.string().min(1, "Company name is required").max(255),
    billingEmail: z.string().email("Valid email required"),
    paymentGateway: z.enum(['cashfree', 'razorpay']).optional(),
  });

  const verifyPurchaseSchema = z.object({
    orderId: z.string().min(1),
    companyName: z.string().optional(), // Optional - will use server-stored value
    billingEmail: z.string().email().optional(), // Optional - will use server-stored value
    totalSeats: z.number().int().min(5).optional(), // Optional - will use server-stored value
    packageType: z.enum(['monthly', 'annual']).optional(), // Optional - will use server-stored value
    pricePerSeat: z.number().positive().optional(), // Optional - will use server-stored value
    razorpay_payment_id: z.string().optional(),
    razorpay_order_id: z.string().optional(),
    razorpay_signature: z.string().optional(),
    cfPaymentId: z.string().optional(),
    cashfreeOrderId: z.string().optional(),
  });

  // Create order for bulk license purchase (new organization)
  // Accessible to any authenticated user who doesn't have an organization
  app.post("/api/enterprise/purchase", authenticateToken, requireAuthenticated, withAuthenticated(async (req, res) => {
    try {
      const userId = req.jwtUser.userId;
      
      // Validate request body
      const validation = purchaseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validation.error.errors
        });
      }
      
      const { totalSeats, packageType, companyName, billingEmail, paymentGateway: requestedGateway } = validation.data;
      
      // Use requested gateway or fall back to configured default
      const paymentGateway = requestedGateway || DEFAULT_PAYMENT_GATEWAY;
      
      // Check if user already has an organization
      const existingOrg = await authStorage.getOrganizationByManagerId(userId);
      if (existingOrg) {
        return res.status(400).json({ 
          message: "You already have an organization. Use add-seats endpoint to purchase more licenses." 
        });
      }
      
      // Get user details
      const user = await authStorage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Calculate pricing based on package type
      const pricePerSeat = packageType === 'annual' ? 60 : 6; // $60/year or $6/month per seat
      const totalAmountUSD = totalSeats * pricePerSeat;
      
      // IMPORTANT: Use INR for Cashfree (only supports INR), USD for Razorpay
      let finalCurrency = paymentGateway === 'cashfree' ? 'INR' : 'USD';
      let finalAmount = totalAmountUSD;
      let conversionInfo = null;
      
      // Real-time currency conversion for Cashfree
      if (paymentGateway === 'cashfree') {
        try {
          const conversion = await currencyConverter.convertCurrency(totalAmountUSD, 'USD', 'INR');
          finalAmount = conversion.convertedAmount;
          finalCurrency = 'INR';
          conversionInfo = conversion;
          console.log(`[Enterprise Cashfree] Converted ${conversion.originalAmount} USD to ${conversion.convertedAmount} INR (rate: ${conversion.exchangeRate})`);
        } catch (error) {
          console.error(`[Enterprise Cashfree] Currency conversion failed:`, error);
          return res.status(500).json({ 
            message: "Currency conversion failed. Please try again later.",
            error: "CURRENCY_CONVERSION_ERROR"
          });
        }
      }
      
      // Use PaymentGatewayFactory
      const gateway = PaymentGatewayFactory.getGateway(paymentGateway);
      const baseUrl = getBaseUrl(req);
      
      const orderId = `ent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const orderResult = await gateway.createOrder({
        amount: finalAmount,
        currency: finalCurrency,
        receipt: orderId,
        customerName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer",
        customerEmail: user.email || billingEmail || 'customer@example.com',
        customerPhone: user.mobile || "9999999999",
        metadata: {
          type: "enterprise_license_purchase",
          userId,
          totalSeats: totalSeats.toString(),
          packageType,
          companyName,
          billingEmail,
          pricePerSeat: pricePerSeat.toString(),
          originalAmountUSD: totalAmountUSD.toString(),
          returnUrl: `${baseUrl}/payment/success?orderId=${orderId}&type=enterprise`,
          notifyUrl: `${baseUrl}/api/billing/webhook`,
        },
      });
      
      // Create pending payment record for idempotency tracking
      await authStorage.createPayment({
        userId,
        razorpayOrderId: orderResult.providerOrderId,
        amount: Math.round(finalAmount * 100).toString(), // Store in smallest unit (paise/cents)
        currency: finalCurrency,
        status: "pending",
        paymentMethod: paymentGateway,
        metadata: JSON.stringify({
          type: "enterprise_license_purchase",
          companyName,
          billingEmail,
          totalSeats,
          packageType,
          pricePerSeat,
          originalAmountUSD: totalAmountUSD,
          paymentSessionId: orderResult.paymentSessionId,
          providerOrderId: orderResult.providerOrderId,
          gateway: paymentGateway,
        })
      });
      
      // Return response based on gateway
      if (paymentGateway === 'razorpay') {
        res.json({ 
          success: true, 
          orderId: orderResult.providerOrderId,
          razorpayOrderId: orderResult.providerOrderId,
          razorpayKeyId: getRazorpayKeyId(),
          gateway: 'razorpay',
          amount: finalAmount,
          currency: finalCurrency,
          pricePerSeat,
          totalSeats,
          packageType,
          companyName,
          billingEmail
        });
      } else {
        res.json({ 
          success: true, 
          orderId: orderResult.providerOrderId,
          paymentSessionId: orderResult.paymentSessionId,
          gatewayOrderId: orderResult.providerOrderId,
          gateway: 'cashfree',
          cashfreeMode: getCashfreeMode(),
          cashfreeEnvironment: getCashfreeMode(),
          amount: finalAmount,
          currency: finalCurrency,
          pricePerSeat,
          totalSeats,
          packageType,
          companyName,
          billingEmail
        });
      }
    } catch (error: any) {
      console.error("Error creating enterprise purchase order:", error);
      res.status(500).json({ message: "Failed to create purchase order", error: error.message });
    }
  }));
  
  // Verify enterprise license purchase payment
  // Accessible to any authenticated user who doesn't have an organization
  app.post("/api/enterprise/verify-purchase", authenticateToken, requireAuthenticated, withAuthenticated(async (req, res) => {
    try {
      const userId = req.jwtUser.userId;
      
      // Validate request body
      const validation = verifyPurchaseSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validation.error.errors
        });
      }
      
      const { 
        orderId,
        companyName,
        billingEmail,
        totalSeats,
        packageType,
        pricePerSeat
      } = validation.data;
      
      // Idempotency check: Check if payment already processed successfully
      const existingPayment = await authStorage.getPaymentByRazorpayOrderId(orderId);
      if (!existingPayment) {
        return res.status(404).json({ 
          message: "Payment record not found. Please initiate purchase first." 
        });
      }

      if (existingPayment.status === "success") {
        // Payment already processed, return success without re-provisioning
        const metadata = typeof existingPayment.metadata === 'string'
          ? JSON.parse(existingPayment.metadata)
          : (existingPayment.metadata || {});
        return res.json({ 
          success: true, 
          message: "Purchase already processed",
          organizationId: metadata.organizationId,
          licensePackageId: metadata.licensePackageId
        });
      }
      
      // SECURITY: Validate client values against server-stored payment metadata (only if provided)
      const paymentMetadata = typeof existingPayment.metadata === 'string' 
        ? JSON.parse(existingPayment.metadata) 
        : (existingPayment.metadata || {});
      const serverTotalSeats = paymentMetadata.totalSeats;
      const serverPackageType = paymentMetadata.packageType;
      const serverPricePerSeat = paymentMetadata.pricePerSeat;
      const serverCompanyName = paymentMetadata.companyName;
      const serverBillingEmail = paymentMetadata.billingEmail;

      // Only validate if client provided values (for direct API calls)
      // Skip validation if values not provided (for payment gateway redirects)
      if (companyName && billingEmail && totalSeats && packageType && pricePerSeat) {
        // Verify all critical parameters match server-stored values
        if (
          totalSeats !== serverTotalSeats ||
          packageType !== serverPackageType ||
          pricePerSeat !== serverPricePerSeat ||
          companyName !== serverCompanyName ||
          billingEmail !== serverBillingEmail
        ) {
          return res.status(400).json({ 
            message: "Verification data mismatch. Payment parameters do not match the original order.",
            error: "PARAMETER_MISMATCH"
          });
        }
      }
      
      // Verify payment status with payment gateway
      const gatewayProvider = paymentMetadata.gateway || DEFAULT_PAYMENT_GATEWAY;
      const gateway = PaymentGatewayFactory.getGateway(gatewayProvider);
      
      let verifiedPaymentId: string;
      
      if (gatewayProvider === 'razorpay') {
        // Razorpay verification
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = validation.data;
        
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
          return res.status(400).json({ message: "Missing Razorpay payment details" });
        }
        
        const isValid = gateway.verifyPaymentSignature(
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        );
        
        if (!isValid) {
          return res.status(400).json({ message: "Payment verification failed" });
        }
        
        verifiedPaymentId = razorpay_payment_id;
      } else {
        // Cashfree verification
        const { cfPaymentId, cashfreeOrderId } = validation.data;
        
        // For Cashfree, we might not have payment details in the redirect
        // We can fetch the payment status using the stored gateway order ID
        let orderIdToCheck = cashfreeOrderId;
        
        if (!orderIdToCheck) {
          // If cashfreeOrderId not provided, use the stored gateway order ID from payment
          orderIdToCheck = existingPayment.razorpayOrderId || undefined; // This field stores gateway order ID for both Razorpay and Cashfree
        }
        
        if (!orderIdToCheck) {
          return res.status(400).json({ 
            message: "Missing Cashfree payment details. Please contact support with your order ID.",
            orderId: orderId
          });
        }
        
        console.log(`[Enterprise Verify] Checking Cashfree payment status for order: ${orderIdToCheck}`);
        
        const paymentStatus = await gateway.getPaymentStatus(orderIdToCheck);
        
        console.log(`[Enterprise Verify] Cashfree payment status:`, paymentStatus);
        
        const isPaid = paymentStatus.status === 'PAID' || 
                       paymentStatus.status === 'SUCCESS';
        
        if (!isPaid) {
          return res.status(400).json({ 
            message: "Payment not completed",
            status: paymentStatus.status
          });
        }
        
        verifiedPaymentId = cfPaymentId || paymentStatus.paymentId || orderIdToCheck;
      }
      
      // Double-check user doesn't already have an organization
      const existingOrg = await authStorage.getOrganizationByManagerId(userId);
      if (existingOrg) {
        return res.status(400).json({ 
          message: "You already have an organization" 
        });
      }
      
      // Update payment status to success
      await authStorage.updatePayment(existingPayment.id, {
        razorpayPaymentId: verifiedPaymentId,
        status: "success"
      });
      
      // Use SERVER-STORED VALUES for provisioning (NOT client values)
      const provisionTotalSeats = serverTotalSeats;
      const provisionPackageType = serverPackageType;
      const provisionPricePerSeat = serverPricePerSeat;
      const provisionCompanyName = serverCompanyName;
      const provisionBillingEmail = serverBillingEmail;
      
      // Create organization using server-stored values
      const organization = await authStorage.createOrganization({
        companyName: provisionCompanyName,
        billingEmail: provisionBillingEmail,
        primaryManagerId: userId,
        status: 'active'
      });
      
      // Update payment with organization ID to record customer type
      await authStorage.updatePayment(existingPayment.id, {
        organizationId: organization.id
      });
      
      // Create organization membership for the manager
      await authStorage.createOrganizationMembership({
        organizationId: organization.id,
        userId,
        role: 'license_manager',
        status: 'active'
      });
      
      // Update user role to license_manager if not already
      const user = await authStorage.getUserById(userId);
      if (user && user.role === 'user') {
        await authStorage.updateUser(userId, { role: 'license_manager' });
      }
      
      // Create license package using server-stored values
      const startDate = new Date();
      const endDate = new Date();
      if (provisionPackageType === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1); // 1 year license
      } else {
        endDate.setMonth(endDate.getMonth() + 1); // 1 month license
      }
      
      const licensePackage = await authStorage.createLicensePackage({
        organizationId: organization.id,
        packageType: provisionPackageType,
        totalSeats: provisionTotalSeats,
        pricePerSeat: provisionPricePerSeat.toString(),
        totalAmount: (provisionTotalSeats * provisionPricePerSeat).toString(),
        currency: existingPayment.currency || 'INR',
        startDate,
        endDate,
        razorpayOrderId: orderId,
        status: 'active'
      });
      
      // Create billing adjustment record using server-stored values
      await authStorage.createBillingAdjustment({
        organizationId: organization.id,
        licensePackageId: licensePackage.id,
        adjustmentType: 'initial_purchase',
        deltaSeats: provisionTotalSeats,
        razorpayOrderId: orderId,
        razorpayPaymentId: verifiedPaymentId,
        amount: (provisionTotalSeats * provisionPricePerSeat).toString(),
        currency: existingPayment.currency || 'INR',
        status: 'completed',
        addedBy: userId
      });
      
      // Create audit log using server-stored values
      await eventLogger.log({
        actorId: userId,
        action: 'ENTERPRISE_LICENSE_PURCHASED',
        targetType: 'organization',
        targetId: organization.id,
        metadata: {
          licensePackageId: licensePackage.id,
          totalSeats: provisionTotalSeats,
          amount: (provisionTotalSeats * provisionPricePerSeat).toString(),
          orderId: orderId,
        }
      });
      
      // Update payment metadata with provisioned resources
      await authStorage.updatePayment(existingPayment.id, {
        metadata: JSON.stringify({
          type: "enterprise_license_purchase",
          companyName: provisionCompanyName,
          billingEmail: provisionBillingEmail,
          totalSeats: provisionTotalSeats,
          packageType: provisionPackageType,
          pricePerSeat: provisionPricePerSeat,
          organizationId: organization.id,
          licensePackageId: licensePackage.id
        })
      });
      
      res.json({ 
        success: true, 
        organization,
        licensePackage
      });
    } catch (error: any) {
      console.error("Error verifying enterprise purchase:", error);
      res.status(500).json({ message: "Failed to verify purchase", error: error.message });
    }
  }));
  
  // Add additional seats to existing license package
  app.post("/api/enterprise/add-seats", authenticateToken, requireAuthenticated, requireLicenseManager, withAuthenticated(async (req, res) => {
    try {
      const userId = req.jwtUser.userId;
      const { additionalSeats } = req.body;
      
      if (!additionalSeats) {
        return res.status(400).json({ message: "Additional seats count is required" });
      }
      
      const seats = parseInt(additionalSeats, 10);
      if (isNaN(seats) || seats < 1) {
        return res.status(400).json({ message: "Additional seats must be a positive number" });
      }
      
      // Get user's organization
      let organization = await authStorage.getOrganizationByManagerId(userId);
      if (!organization) {
        const membership = await authStorage.getUserMembership(userId);
        if (membership) {
          organization = await authStorage.getOrganizationById(membership.organizationId);
        }
      }
      
      if (!organization) {
        return res.status(404).json({ message: "No organization found" });
      }
      
      // Verify permissions
      const canManage = await authStorage.canManageLicenses(userId, organization.id);
      if (!canManage && req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get active license package
      const activePackage = await authStorage.getActiveLicensePackage(organization.id);
      if (!activePackage) {
        return res.status(404).json({ message: "No active license package found" });
      }
      
      // Calculate additional cost with $1 minimum
      const pricePerSeat = parseFloat(activePackage.pricePerSeat);
      const calculatedCost = seats * pricePerSeat;
      const MINIMUM_USD_AMOUNT = 1.00;
      const additionalCost = Math.max(calculatedCost, MINIMUM_USD_AMOUNT);
      
      // Get user details
      const user = await authStorage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Use PaymentGatewayFactory
      const paymentGateway = PaymentGatewayFactory.getGateway();
      const defaultGatewayProvider = PaymentGatewayFactory.getDefaultProvider();
      
      const orderId = `seats_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const orderResult = await paymentGateway.createOrder({
        amount: additionalCost,
        currency: "USD",
        receipt: orderId,
        customerName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer",
        customerEmail: user.email || 'customer@example.com',
        customerPhone: user.mobile || "9999999999",
        notes: {
          type: "additional_seats",
          organizationId: organization.id,
          licensePackageId: activePackage.id,
          additionalSeats: seats.toString(),
          pricePerSeat: pricePerSeat.toString(),
          userId
        },
      });
      
      res.json({ 
        success: true, 
        orderId: orderResult.orderId,
        paymentSessionId: orderResult.paymentSessionId,
        razorpayOrderId: orderResult.providerOrderId, // For Razorpay
        razorpayKeyId: defaultGatewayProvider === 'razorpay' ? getRazorpayKeyId() : undefined,
        gateway: defaultGatewayProvider,
        amount: additionalCost,
        currency: "USD",
        pricePerSeat,
        additionalSeats: seats,
        licensePackageId: activePackage.id
      });
    } catch (error: any) {
      console.error("Error creating add-seats order:", error);
      res.status(500).json({ message: "Failed to create add-seats order", error: error.message });
    }
  }));
  
  // Verify additional seats payment
  app.post("/api/enterprise/verify-add-seats", authenticateToken, requireAuthenticated, requireLicenseManager, withAuthenticated(async (req, res) => {
    try {
      const userId = req.jwtUser.userId;
      const { 
        orderId,
        additionalSeats,
        licensePackageId,
        razorpayPaymentId
      } = req.body;
      
      if (!orderId || !additionalSeats || !licensePackageId) {
        return res.status(400).json({ message: "Payment verification details are required" });
      }
      
      // Verify payment status with payment gateway (Razorpay expects payment ID pay_xxx, not order ID)
      const paymentGateway = PaymentGatewayFactory.getGateway();
      const paymentIdToVerify = razorpayPaymentId || orderId;
      const verifyResult = await paymentGateway.getPaymentStatus(paymentIdToVerify);
      
      // Check if payment is successful (handle Razorpay status codes)
      const isPaid = verifyResult.status === 'PAID' || 
                     verifyResult.status === 'SUCCESS' || 
                     verifyResult.status === 'captured' ||
                     verifyResult.status === 'authorized';
      
      if (!isPaid) {
        return res.status(400).json({ 
          message: "Payment not completed",
          status: verifyResult.status
        });
      }
      
      // Get license package
      const licensePackage = await authStorage.getLicensePackageById(licensePackageId);
      if (!licensePackage) {
        return res.status(404).json({ message: "License package not found" });
      }
      
      // Verify permissions
      const canManage = await authStorage.canManageLicenses(userId, licensePackage.organizationId);
      if (!canManage && req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Increment seats
      const seats = parseInt(additionalSeats, 10);
      const updatedPackage = await authStorage.incrementPackageSeats(licensePackageId, seats);
      
      // Create billing adjustment
      await authStorage.createBillingAdjustment({
        organizationId: licensePackage.organizationId,
        licensePackageId,
        adjustmentType: 'seat_addition',
        deltaSeats: seats,
        razorpayOrderId: orderId,
        razorpayPaymentId: verifyResult.paymentId || orderId,
        amount: (seats * parseFloat(licensePackage.pricePerSeat)).toString(),
        currency: 'USD',
        status: 'completed',
        addedBy: userId
      });
      
      // Create audit log
      await eventLogger.log({
        actorId: userId,
        action: 'SEATS_ADDED',
        targetType: 'license_package',
        targetId: licensePackageId,
        metadata: {
          additionalSeats: seats,
          newTotalSeats: updatedPackage.totalSeats,
          amount: (seats * parseFloat(licensePackage.pricePerSeat)).toString(),
          orderId: orderId,
        }
      });
      
      res.json({ 
        success: true, 
        licensePackage: updatedPackage
      });
    } catch (error: any) {
      console.error("Error verifying add-seats payment:", error);
      res.status(500).json({ message: "Failed to verify payment", error: error.message });
    }
  }));
  
  // Get organization add-ons with subscription dates
  app.get("/api/enterprise/addons", authenticateToken, requireAuthenticated, requireLicenseManager, withAuthenticated(async (req, res) => {
    try {
      const userId = req.jwtUser.userId;
      
      // Get user's organization
      let organization = await authStorage.getOrganizationByManagerId(userId);
      if (!organization) {
        const membership = await authStorage.getUserMembership(userId);
        if (membership) {
          organization = await authStorage.getOrganizationById(membership.organizationId);
        }
      }
      
      if (!organization) {
        return res.status(404).json({ message: "No organization found" });
      }
      
      // Verify permissions
      const canManage = await authStorage.canManageLicenses(userId, organization.id);
      if (!canManage && req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get organization add-ons with dates
      const addons = await authStorage.getOrganizationAddons(organization.id);
      
      res.json({ success: true, addons });
    } catch (error: any) {
      console.error("Error fetching organization addons:", error);
      res.status(500).json({ message: "Failed to fetch addons", error: error.message });
    }
  }));
  
  // Get license package details
  app.get("/api/enterprise/license-package", authenticateToken, requireAuthenticated, requireLicenseManager, withAuthenticated(async (req, res) => {
    try {
      const userId = req.jwtUser.userId;
      
      // Get user's organization
      let organization = await authStorage.getOrganizationByManagerId(userId);
      if (!organization) {
        const membership = await authStorage.getUserMembership(userId);
        if (membership) {
          organization = await authStorage.getOrganizationById(membership.organizationId);
        }
      }
      
      if (!organization) {
        return res.status(404).json({ message: "No organization found" });
      }
      
      // Verify permissions
      const canManage = await authStorage.canManageLicenses(userId, organization.id);
      if (!canManage && req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get active license package
      const licensePackage = await authStorage.getActiveLicensePackage(organization.id);
      if (!licensePackage) {
        return res.status(404).json({ message: "No active license package found" });
      }
      
      res.json({ 
        success: true, 
        licensePackage: {
          ...licensePackage,
          startDate: licensePackage.startDate,
          endDate: licensePackage.endDate,
          autoRenew: false  // Auto-renew feature not yet implemented
        }
      });
    } catch (error: any) {
      console.error("Error fetching license package:", error);
      res.status(500).json({ message: "Failed to fetch license package", error: error.message });
    }
  }));
  
  // Toggle auto-renewal setting (placeholder - feature not yet fully implemented)
  app.patch("/api/enterprise/auto-renew", authenticateToken, requireAuthenticated, requireLicenseManager, withAuthenticated(async (req, res) => {
    try {
      const userId = req.jwtUser.userId;
      const { autoRenew } = req.body;
      
      if (typeof autoRenew !== 'boolean') {
        return res.status(400).json({ message: "autoRenew must be a boolean" });
      }
      
      // Get user's organization
      let organization = await authStorage.getOrganizationByManagerId(userId);
      if (!organization) {
        const membership = await authStorage.getUserMembership(userId);
        if (membership) {
          organization = await authStorage.getOrganizationById(membership.organizationId);
        }
      }
      
      if (!organization) {
        return res.status(404).json({ message: "No organization found" });
      }
      
      // Verify permissions
      const canManage = await authStorage.canManageLicenses(userId, organization.id);
      if (!canManage && req.jwtUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get active license package
      const activePackage = await authStorage.getActiveLicensePackage(organization.id);
      if (!activePackage) {
        return res.status(404).json({ message: "No active license package found" });
      }
      
      // Auto-renewal feature is not yet implemented - return 501 Not Implemented
      return res.status(501).json({ 
        success: false, 
        message: "Auto-renewal feature is not yet implemented. Please contact support for renewal assistance."
      });
    } catch (error: any) {
      console.error("Error updating auto-renew setting:", error);
      res.status(500).json({ message: "Failed to update auto-renew setting", error: error.message });
    }
  }));
}
