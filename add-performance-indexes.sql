-- Performance optimization indexes for Rev Winner
-- Run this to speed up slow queries

-- Index for organization lookups by primary manager
CREATE INDEX IF NOT EXISTS idx_organizations_primary_manager 
ON organizations(primary_manager_id);

-- Index for organization memberships by organization
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_id 
ON organization_memberships(organization_id);

-- Index for organization memberships by user
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_id 
ON organization_memberships(user_id);

-- Index for license packages by organization
CREATE INDEX IF NOT EXISTS idx_license_packages_org_id 
ON license_packages(organization_id);

-- Index for license packages by status
CREATE INDEX IF NOT EXISTS idx_license_packages_status 
ON license_packages(status);

-- Index for license assignments by package
CREATE INDEX IF NOT EXISTS idx_license_assignments_package_id 
ON license_assignments(license_package_id);

-- Index for license assignments by user
CREATE INDEX IF NOT EXISTS idx_license_assignments_user_id 
ON license_assignments(user_id);

-- Index for license assignments by status
CREATE INDEX IF NOT EXISTS idx_license_assignments_status 
ON license_assignments(status);

-- Index for subscriptions by user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
ON subscriptions(user_id);

-- Index for subscriptions by plan
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id 
ON subscriptions(plan_id);

-- Index for cart items by user
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id 
ON cart_items(user_id);

-- Index for payments by user
CREATE INDEX IF NOT EXISTS idx_payments_user_id 
ON payments(user_id);

-- Index for payments by organization
CREATE INDEX IF NOT EXISTS idx_payments_organization_id 
ON payments(organization_id);

-- Index for payments by status
CREATE INDEX IF NOT EXISTS idx_payments_status 
ON payments(status);

-- Composite index for active license packages
CREATE INDEX IF NOT EXISTS idx_license_packages_org_status 
ON license_packages(organization_id, status);

-- Composite index for active license assignments
CREATE INDEX IF NOT EXISTS idx_license_assignments_package_status 
ON license_assignments(license_package_id, status);

-- Composite index for active organization memberships
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_status 
ON organization_memberships(organization_id, status);

ANALYZE;

-- Display index information
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'organizations',
        'organization_memberships',
        'license_packages',
        'license_assignments',
        'subscriptions',
        'cart_items',
        'payments'
    )
ORDER BY tablename, indexname;
