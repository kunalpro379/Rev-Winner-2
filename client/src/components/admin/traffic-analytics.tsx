import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Globe, RefreshCw, BarChart3, Users, MapPin, Download } from "lucide-react";
import { format, subDays } from "date-fns";

interface TrafficLog {
  id: string;
  ipAddress: string;
  country: string;
  state: string;
  city: string;
  deviceType: string;
  browser: string;
  visitedPage: string;
  visitTime: string;
}

// Helper to get default date range (last 90 days to capture historical data)
function getDefaultDateRange() {
  const today = new Date();
  const ninetyDaysAgo = subDays(today, 90);
  return {
    start: format(ninetyDaysAgo, "yyyy-MM-dd"),
    end: format(today, "yyyy-MM-dd"),
  };
}

export function TrafficAnalytics() {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedPage, setSelectedPage] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  const { data: trafficData, isLoading, refetch, isFetching, error } = useQuery<{ 
    success: boolean; 
    data: TrafficLog[]; 
    count: number;
  }>({
    queryKey: [
      "/api/admin/traffic",
      startDate || "all",
      endDate || "all",
      selectedCountry,
      selectedPage,
    ],
    queryFn: async () => {
      const accessToken = localStorage.getItem("accessToken");
      const params = new URLSearchParams();
      
      if (startDate && startDate !== "all") params.append("startDate", startDate);
      if (endDate && endDate !== "all") params.append("endDate", endDate);
      if (selectedCountry && selectedCountry !== "all") params.append("country", selectedCountry);
      if (selectedPage && selectedPage !== "all") params.append("page", selectedPage);
      
      console.log('[Traffic Analytics] Fetching with params:', params.toString());
      
      const response = await fetch(`/api/admin/traffic?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Traffic Analytics] API Error:', response.status, errorText);
        throw new Error(`Failed to fetch traffic data: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Traffic Analytics] Received data:', { count: result.data?.length, success: result.success });
      return result;
    },
    enabled: true,
    staleTime: 30000,
    retry: 1,
  });

  const logs = trafficData?.data || [];
  
  // Pagination
  const totalItems = logs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = logs.slice(startIndex, endIndex);
  
  const countries = Array.from(new Set(logs.map((log) => log.country))).sort();
  const pages = Array.from(new Set(logs.map((log) => log.visitedPage))).sort();

  const handleFilter = () => {
    refetch();
  };

  const handleClearFilters = () => {
    const range = getDefaultDateRange();
    setStartDate(range.start);
    setEndDate(range.end);
    setSelectedCountry("all");
    setSelectedPage("all");
    setCurrentPage(1);
  };

  // Compute analytics summary
  const uniqueVisitors = new Set(logs.map(log => log.ipAddress)).size;
  // Count unique countries, treating localhost IPs as "Local" and excluding "Unknown"
  const uniqueCountries = new Set(
    logs.map(log => {
      const isLocalhost = log.ipAddress === '::1' || log.ipAddress === '127.0.0.1' || log.ipAddress === 'localhost';
      return isLocalhost ? 'Local' : (log.country && log.country !== 'Unknown' ? log.country : null);
    }).filter(c => c !== null)
  ).size;
  const uniquePages = new Set(logs.map(log => log.visitedPage)).size;
  
  // Advanced analytics
  const deviceBreakdown = logs.reduce((acc, log) => {
    acc[log.deviceType] = (acc[log.deviceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const browserBreakdown = logs.reduce((acc, log) => {
    acc[log.browser] = (acc[log.browser] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topPages = Object.entries(
    logs.reduce((acc, log) => {
      acc[log.visitedPage] = (acc[log.visitedPage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const topCountries = Object.entries(
    logs.reduce((acc, log) => {
      const isLocalhost = log.ipAddress === '::1' || log.ipAddress === '127.0.0.1';
      const country = isLocalhost ? 'Local' : (log.country || 'Unknown');
      if (country !== 'Unknown') {
        acc[country] = (acc[country] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  // Export function
  const handleExport = () => {
    const csvHeader = "IP Address,Country,State,City,Device,Browser,Page Visited,Visit Time\n";
    const csvRows = logs.map(log => {
      const isLocalhost = log.ipAddress === '::1' || log.ipAddress === '127.0.0.1';
      const country = isLocalhost ? 'Local' : log.country;
      const state = isLocalhost ? 'Development' : log.state;
      const city = isLocalhost ? 'Localhost' : log.city;
      
      return [
        log.ipAddress,
        country,
        state,
        city,
        log.deviceType,
        log.browser,
        log.visitedPage,
        format(new Date(log.visitTime), "yyyy-MM-dd HH:mm:ss")
      ].join(",");
    }).join("\n");
    
    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traffic-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Error loading traffic data:</strong> {(error as Error).message}
          </p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            Please check your authentication or try refreshing the page.
          </p>
        </div>
      )}
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold text-purple-500">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Visitors</p>
                <p className="text-2xl font-bold text-blue-500">{uniqueVisitors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MapPin className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Countries</p>
                <p className="text-2xl font-bold text-green-500">{uniqueCountries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Globe className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pages Visited</p>
                <p className="text-2xl font-bold text-orange-500">{uniquePages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Traffic Analytics
              </CardTitle>
              <CardDescription>
                Monitor and analyze website visitor traffic and engagement patterns
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={logs.length === 0}
                data-testid="button-export-traffic"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                data-testid="button-refresh-traffic"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                Start Date
              </label>
              <Input
                data-testid="input-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                End Date
              </label>
              <Input
                data-testid="input-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                Country
              </label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger data-testid="select-country">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                Page
              </label>
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger data-testid="select-page">
                  <SelectValue placeholder="All Pages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pages</SelectItem>
                  {pages.map((page) => (
                    <SelectItem key={page} value={page}>
                      {page}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              data-testid="button-filter"
              onClick={handleFilter}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-900 hover:from-purple-700 hover:to-blue-950"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Apply Filters"
              )}
            </Button>
            <Button
              data-testid="button-clear-filters"
              onClick={handleClearFilters}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Analytics */}
      {logs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Pages</CardTitle>
              <CardDescription>Most visited pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topPages.map(([page, count], index) => (
                  <div key={page} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm font-medium text-purple-600">#{index + 1}</span>
                      <span className="text-sm truncate">{page}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {count} visits
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Countries</CardTitle>
              <CardDescription>Visitors by location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topCountries.map(([country, count], index) => (
                  <div key={country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-600">#{index + 1}</span>
                      <span className="text-sm">{country}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {count} visits
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Device Breakdown</CardTitle>
              <CardDescription>Visitors by device type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(deviceBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([device, count]) => {
                    const percentage = ((count / logs.length) * 100).toFixed(1);
                    return (
                      <div key={device} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize">{device}</span>
                          <span className="font-medium">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Browser Distribution</CardTitle>
              <CardDescription>Visitors by browser</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(browserBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([browser, count]) => {
                    const percentage = ((count / logs.length) * 100).toFixed(1);
                    return (
                      <div key={browser} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{browser}</span>
                          <span className="font-medium">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Traffic Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Visitor Traffic ({logs.length})</CardTitle>
            {totalPages > 1 && (
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-3" />
              <p className="text-sm text-muted-foreground">Loading traffic data...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No traffic data found</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Try adjusting your filters or date range
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>Page Visited</TableHead>
                      <TableHead>Visit Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => {
                    // Check if IP is localhost and display accordingly
                    const isLocalhost = log.ipAddress === '::1' || log.ipAddress === '127.0.0.1' || log.ipAddress === 'localhost';
                    const displayCountry = isLocalhost ? 'Local' : (log.country || 'Unknown');
                    const displayState = isLocalhost ? 'Development' : (log.state || 'Unknown');
                    const displayCity = isLocalhost ? 'Localhost' : (log.city || 'Unknown');
                    
                    return (
                      <TableRow key={log.id} data-testid={`row-traffic-${log.id}`}>
                        <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                        <TableCell>{displayCountry}</TableCell>
                        <TableCell>{displayState}</TableCell>
                        <TableCell>{displayCity}</TableCell>
                        <TableCell>{log.deviceType}</TableCell>
                        <TableCell>{log.browser}</TableCell>
                        <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                          {log.visitedPage}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(
                            new Date(log.visitTime),
                            "MMM dd, yyyy HH:mm:ss"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? "bg-purple-600 hover:bg-purple-700" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      {currentPage < totalPages - 2 && <span className="px-2">...</span>}
                      {currentPage < totalPages - 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
