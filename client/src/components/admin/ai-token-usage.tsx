import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Cpu, TrendingUp, Zap, Hash } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface ProviderUsage {
  provider: string;
  total_tokens: string;
  prompt_tokens: string;
  completion_tokens: string;
  request_count: string;
  first_usage?: string;
  last_usage?: string;
}

interface TokenUsageSummary {
  byProvider: ProviderUsage[];
  totals: {
    total_tokens: string;
    prompt_tokens: string;
    completion_tokens: string;
    request_count: string;
  };
}

const providerColors: Record<string, string> = {
  deepseek: "bg-blue-500",
  gemini: "bg-yellow-500",
  claude: "bg-orange-500",
  chatgpt: "bg-green-500",
  grok: "bg-purple-500",
  "kimi-k2": "bg-pink-500",
  openai: "bg-emerald-500",
};

const providerLabels: Record<string, string> = {
  deepseek: "DeepSeek",
  gemini: "Gemini",
  claude: "Claude",
  chatgpt: "ChatGPT",
  grok: "Grok",
  "kimi-k2": "Kimi K2",
  openai: "OpenAI",
};

export function AITokenUsage() {
  const [dateRange, setDateRange] = useState("last-30");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("all");

  const getDateParams = () => {
    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined;

    switch (dateRange) {
      case "today":
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date();
        break;
      case "last-7":
        start = subDays(new Date(), 7);
        end = new Date();
        break;
      case "last-30":
        start = subDays(new Date(), 30);
        end = new Date();
        break;
      case "this-month":
        start = startOfMonth(new Date());
        end = endOfMonth(new Date());
        break;
      case "last-month":
        start = startOfMonth(subMonths(new Date(), 1));
        end = endOfMonth(subMonths(new Date(), 1));
        break;
      case "custom":
        if (startDate) start = new Date(startDate);
        if (endDate) end = new Date(endDate);
        break;
      default:
        start = subDays(new Date(), 30);
        end = new Date();
    }

    return { start, end };
  };

  const { start, end } = getDateParams();

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (start) params.append('startDate', start.toISOString());
    if (end) params.append('endDate', end.toISOString());
    if (selectedProvider && selectedProvider !== 'all') params.append('provider', selectedProvider);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  const { data, isLoading, refetch, isFetching, error } = useQuery<TokenUsageSummary>({
    queryKey: [
      "/api/admin/ai-token-usage/summary",
      { startDate: start?.toISOString(), endDate: end?.toISOString(), provider: selectedProvider }
    ],
    queryFn: async () => {
      // Include access token in headers
      const accessToken = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      
      const queryString = buildQueryString();
      console.log('[AI Token Usage] Fetching data with query:', queryString);
      
      const response = await fetch(`/api/admin/ai-token-usage/summary${queryString}`, {
        credentials: 'include',
        headers,
      });
      
      // Handle 401 errors gracefully - user may not be authenticated
      if (response.status === 401) {
        console.warn('[AI Token Usage] Not authenticated');
        return { byProvider: [], totals: { total_tokens: "0", prompt_tokens: "0", completion_tokens: "0", request_count: "0" } };
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AI Token Usage] API Error:', response.status, errorText);
        throw new Error(`Failed to fetch token usage: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[AI Token Usage] Received data:', result);
      return result;
    },
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  });

  const formatNumber = (value: string | number | undefined) => {
    if (!value) return "0";
    return parseInt(String(value)).toLocaleString();
  };

  const getProviderBadge = (provider: string) => {
    const color = providerColors[provider] || "bg-gray-500";
    const label = providerLabels[provider] || provider;
    return (
      <Badge className={`${color} text-white`} data-testid={`badge-provider-${provider}`}>
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Error loading AI token usage:</strong> {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}
      
      <Card data-testid="card-ai-token-filters">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            AI Token Usage
          </CardTitle>
          <CardDescription>
            Track token usage across all AI providers: DeepSeek, Gemini, Claude, ChatGPT, Grok, and Kimi K2
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]" data-testid="select-date-range">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last-7">Last 7 Days</SelectItem>
                  <SelectItem value="last-30">Last 30 Days</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    data-testid="input-end-date"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="w-[180px]" data-testid="select-provider">
                  <SelectValue placeholder="All Providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="chatgpt">ChatGPT</SelectItem>
                  <SelectItem value="grok">Grok</SelectItem>
                  <SelectItem value="kimi-k2">Kimi K2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              onClick={() => refetch()} 
              disabled={isFetching}
              data-testid="button-refresh-usage"
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="card-total-tokens">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-tokens">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatNumber(data?.totals?.total_tokens)}
            </div>
            <p className="text-xs text-muted-foreground">Combined usage across all providers</p>
          </CardContent>
        </Card>

        <Card data-testid="card-prompt-tokens">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prompt Tokens</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-prompt-tokens">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatNumber(data?.totals?.prompt_tokens)}
            </div>
            <p className="text-xs text-muted-foreground">Input tokens sent to AI</p>
          </CardContent>
        </Card>

        <Card data-testid="card-completion-tokens">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completion-tokens">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatNumber(data?.totals?.completion_tokens)}
            </div>
            <p className="text-xs text-muted-foreground">Output tokens received from AI</p>
          </CardContent>
        </Card>

        <Card data-testid="card-request-count">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-request-count">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatNumber(data?.totals?.request_count)}
            </div>
            <p className="text-xs text-muted-foreground">AI API calls made</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-usage-by-provider">
        <CardHeader>
          <CardTitle>Usage by Provider</CardTitle>
          <CardDescription>
            Token usage breakdown for each AI provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !data?.byProvider?.length ? (
            <div className="text-center py-8" data-testid="text-no-usage">
              <p className="text-muted-foreground mb-2">No AI token usage recorded yet</p>
              <p className="text-sm text-muted-foreground">
                Token usage will appear here once AI features are used by your users.
              </p>
            </div>
          ) : (
            <Table data-testid="table-usage-by-provider">
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Total Tokens</TableHead>
                  <TableHead className="text-right">Prompt Tokens</TableHead>
                  <TableHead className="text-right">Completion Tokens</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byProvider
                  .filter(p => selectedProvider === "all" || p.provider === selectedProvider)
                  .map((provider) => (
                    <TableRow key={provider.provider} data-testid={`row-provider-${provider.provider}`}>
                      <TableCell>{getProviderBadge(provider.provider)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(provider.total_tokens)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(provider.prompt_tokens)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(provider.completion_tokens)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(provider.request_count)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
