import { Request, Response, NextFunction } from "express";

interface PerformanceMetrics {
  requestCount: number;
  totalLatency: number;
  latencies: number[];
  errorCount: number;
  lastReset: Date;
}

interface RouteMetrics {
  [path: string]: PerformanceMetrics;
}

interface WebSocketMetrics {
  connections: number;
  messagesReceived: number;
  messagesSent: number;
  bytesReceived: number;
  bytesSent: number;
  lastReset: Date;
}

interface DatabaseMetrics {
  queryCount: number;
  totalQueryTime: number;
  slowQueries: number;
  lastReset: Date;
}

class PerformanceMonitor {
  private routeMetrics: RouteMetrics = {};
  private wsMetrics: WebSocketMetrics = {
    connections: 0,
    messagesReceived: 0,
    messagesSent: 0,
    bytesReceived: 0,
    bytesSent: 0,
    lastReset: new Date()
  };
  private dbMetrics: DatabaseMetrics = {
    queryCount: 0,
    totalQueryTime: 0,
    slowQueries: 0,
    lastReset: new Date()
  };
  private jobQueueLength: number = 0;
  private jobsProcessing: number = 0;

  recordRequest(path: string, latencyMs: number, isError: boolean = false) {
    const normalizedPath = this.normalizePath(path);
    
    if (!this.routeMetrics[normalizedPath]) {
      this.routeMetrics[normalizedPath] = {
        requestCount: 0,
        totalLatency: 0,
        latencies: [],
        errorCount: 0,
        lastReset: new Date()
      };
    }

    const metrics = this.routeMetrics[normalizedPath];
    metrics.requestCount++;
    metrics.totalLatency += latencyMs;
    metrics.latencies.push(latencyMs);
    
    if (metrics.latencies.length > 1000) {
      metrics.latencies = metrics.latencies.slice(-500);
    }
    
    if (isError) {
      metrics.errorCount++;
    }

    if (latencyMs > 1000) {
      console.log(`⚠️ Slow request: ${normalizedPath} took ${latencyMs}ms`);
    }
  }

  recordWebSocketEvent(type: 'connect' | 'disconnect' | 'messageIn' | 'messageOut', bytes: number = 0) {
    switch (type) {
      case 'connect':
        this.wsMetrics.connections++;
        break;
      case 'disconnect':
        this.wsMetrics.connections = Math.max(0, this.wsMetrics.connections - 1);
        break;
      case 'messageIn':
        this.wsMetrics.messagesReceived++;
        this.wsMetrics.bytesReceived += bytes;
        break;
      case 'messageOut':
        this.wsMetrics.messagesSent++;
        this.wsMetrics.bytesSent += bytes;
        break;
    }
  }

  recordDatabaseQuery(durationMs: number) {
    this.dbMetrics.queryCount++;
    this.dbMetrics.totalQueryTime += durationMs;
    if (durationMs > 100) {
      this.dbMetrics.slowQueries++;
    }
  }

  updateJobQueue(queueLength: number, processing: number) {
    this.jobQueueLength = queueLength;
    this.jobsProcessing = processing;
  }

  private normalizePath(path: string): string {
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .split('?')[0];
  }

  private calculatePercentile(arr: number[], percentile: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  getHealthReport() {
    const allLatencies: number[] = [];
    let totalRequests = 0;
    let totalErrors = 0;

    Object.values(this.routeMetrics).forEach(m => {
      allLatencies.push(...m.latencies);
      totalRequests += m.requestCount;
      totalErrors += m.errorCount;
    });

    const avgLatency = allLatencies.length > 0 
      ? Math.round(allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length)
      : 0;

    return {
      queue: {
        length: this.jobQueueLength,
        processing: this.jobsProcessing
      },
      api: {
        totalRequests,
        totalErrors,
        avgLatency,
        p50Latency: this.calculatePercentile(allLatencies, 50),
        p95Latency: this.calculatePercentile(allLatencies, 95),
        p99Latency: this.calculatePercentile(allLatencies, 99)
      },
      websocket: {
        activeConnections: this.wsMetrics.connections,
        messagesReceived: this.wsMetrics.messagesReceived,
        messagesSent: this.wsMetrics.messagesSent,
        bytesReceived: this.wsMetrics.bytesReceived,
        bytesSent: this.wsMetrics.bytesSent
      },
      database: {
        queryCount: this.dbMetrics.queryCount,
        avgQueryTime: this.dbMetrics.queryCount > 0 
          ? Math.round(this.dbMetrics.totalQueryTime / this.dbMetrics.queryCount)
          : 0,
        slowQueries: this.dbMetrics.slowQueries
      },
      timestamp: new Date().toISOString()
    };
  }

  getRouteMetrics() {
    const result: Record<string, any> = {};
    
    Object.entries(this.routeMetrics).forEach(([path, metrics]) => {
      result[path] = {
        requestCount: metrics.requestCount,
        avgLatency: metrics.requestCount > 0 
          ? Math.round(metrics.totalLatency / metrics.requestCount)
          : 0,
        errorRate: metrics.requestCount > 0 
          ? (metrics.errorCount / metrics.requestCount * 100).toFixed(2) + '%'
          : '0%',
        p95Latency: this.calculatePercentile(metrics.latencies, 95)
      };
    });

    return result;
  }

  reset() {
    this.routeMetrics = {};
    this.wsMetrics = {
      connections: this.wsMetrics.connections,
      messagesReceived: 0,
      messagesSent: 0,
      bytesReceived: 0,
      bytesSent: 0,
      lastReset: new Date()
    };
    this.dbMetrics = {
      queryCount: 0,
      totalQueryTime: 0,
      slowQueries: 0,
      lastReset: new Date()
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function performanceLoggerMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const isError = res.statusCode >= 400;
      performanceMonitor.recordRequest(req.path, duration, isError);
    });
    
    next();
  };
}

export function logDatabaseQuery(durationMs: number) {
  performanceMonitor.recordDatabaseQuery(durationMs);
}

export function logWebSocketEvent(type: 'connect' | 'disconnect' | 'messageIn' | 'messageOut', bytes: number = 0) {
  performanceMonitor.recordWebSocketEvent(type, bytes);
}

export function updateJobQueueMetrics(queueLength: number, processing: number) {
  performanceMonitor.updateJobQueue(queueLength, processing);
}
