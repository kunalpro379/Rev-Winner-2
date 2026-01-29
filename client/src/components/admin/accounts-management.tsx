import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Search, Users, Eye, Loader2, Calendar, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { AdminOrganizationListItemDTO } from "@shared/schema";

interface OrganizationsResponse {
  success: boolean;
  organizations: AdminOrganizationListItemDTO[];
  total: number;
  limit: number;
  offset: number;
}

const ITEMS_PER_PAGE = 20;

export function AccountsManagement() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  
  const buildApiUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("search", searchQuery);
    if (statusFilter !== "all") params.append("status", statusFilter);
    params.append("limit", ITEMS_PER_PAGE.toString());
    params.append("offset", offset.toString());
    return `/api/admin/organizations?${params.toString()}`;
  };

  const { data, isLoading } = useQuery<OrganizationsResponse>({
    queryKey: [buildApiUrl()],
  });

  const organizations = data?.organizations || [];
  const total = data?.total || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 dark:bg-green-600" data-testid="badge-status-active">Active</Badge>;
      case "suspended":
        return <Badge variant="destructive" data-testid="badge-status-suspended">Suspended</Badge>;
      case "deleted":
        return <Badge variant="secondary" data-testid="badge-status-deleted">Deleted</Badge>;
      default:
        return <Badge variant="outline" data-testid="badge-status-default">{status}</Badge>;
    }
  };

  const getPackageBadge = (packageType: string | null) => {
    if (!packageType) {
      return <Badge variant="outline" data-testid="badge-no-package">No Package</Badge>;
    }
    return <Badge className="bg-purple-500 dark:bg-purple-600" data-testid="badge-package">{packageType}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-accounts-management">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Enterprise Accounts
          </CardTitle>
          <CardDescription>
            Manage enterprise organizations, license packages, and team accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                data-testid="input-search-accounts"
                placeholder="Search by company name, email, or license manager..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="select-item-status-all">All Status</SelectItem>
                <SelectItem value="active" data-testid="select-item-status-active">Active</SelectItem>
                <SelectItem value="suspended" data-testid="select-item-status-suspended">Suspended</SelectItem>
                <SelectItem value="deleted" data-testid="select-item-status-deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Organizations Found</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No enterprise accounts have been created yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Showing {organizations.length} of {total} organizations
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>License Manager</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id} data-testid={`row-org-${org.id}`}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium" data-testid={`text-company-${org.id}`}>
                              {org.companyName}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {org.billingEmail}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {org.licenseManagerName ? (
                            <div className="flex flex-col">
                              <span className="text-sm">{org.licenseManagerName}</span>
                              <span className="text-xs text-slate-500">{org.licenseManagerEmail}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getPackageBadge(org.activePackageType)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{org.assignedSeats}</span>
                            <span className="text-slate-400">/</span>
                            <span>{org.totalSeats}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(org.status)}
                        </TableCell>
                        <TableCell>
                          {org.packageEndDate ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {format(new Date(org.packageEndDate), "MMM d, yyyy")}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-view-org-${org.id}`}
                            onClick={() => setLocation(`/admin/accounts/${org.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {total > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Page {currentPage} of {Math.ceil(total / ITEMS_PER_PAGE)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(total / ITEMS_PER_PAGE), p + 1))}
                      disabled={currentPage >= Math.ceil(total / ITEMS_PER_PAGE)}
                      data-testid="button-next-page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
