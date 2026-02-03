import { updateJobQueueMetrics } from "../middleware/performance-logger";

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  status: JobStatus;
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  onProgress?: (progress: number, message?: string) => void;
}

interface JobResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

type JobHandler<T = any, R = any> = (job: Job<T>, reportProgress: (progress: number, message?: string) => void) => Promise<R>;

class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processing: Set<string> = new Set();
  private maxConcurrent: number = 3;
  private subscribers: Map<string, Set<(job: Job) => void>> = new Map();

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  registerHandler<T, R>(type: string, handler: JobHandler<T, R>) {
    this.handlers.set(type, handler);
  }

  async enqueue<T>(type: string, data: T): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: Job<T> = {
      id,
      type,
      data,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    this.jobs.set(id, job);
    this.updateMetrics();
    
    this.processNext();
    
    return id;
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  getJobStatus(id: string): { status: JobStatus; progress: number; result?: any; error?: string } | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    return {
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error
    };
  }

  subscribe(jobId: string, callback: (job: Job) => void): () => void {
    if (!this.subscribers.has(jobId)) {
      this.subscribers.set(jobId, new Set());
    }
    this.subscribers.get(jobId)!.add(callback);
    
    return () => {
      this.subscribers.get(jobId)?.delete(callback);
    };
  }

  private notifySubscribers(job: Job) {
    const subs = this.subscribers.get(job.id);
    if (subs) {
      subs.forEach(cb => {
        try {
          cb(job);
        } catch (e) {
          console.error('Error in job subscriber:', e);
        }
      });
    }
  }

  private async processNext() {
    if (this.processing.size >= this.maxConcurrent) {
      return;
    }

    const pendingJob = Array.from(this.jobs.values())
      .find(j => j.status === 'pending');

    if (!pendingJob) {
      return;
    }

    const handler = this.handlers.get(pendingJob.type);
    if (!handler) {
      pendingJob.status = 'failed';
      pendingJob.error = `No handler registered for job type: ${pendingJob.type}`;
      this.notifySubscribers(pendingJob);
      return;
    }

    this.processing.add(pendingJob.id);
    pendingJob.status = 'processing';
    pendingJob.startedAt = new Date();
    this.updateMetrics();
    this.notifySubscribers(pendingJob);

    const reportProgress = (progress: number, message?: string) => {
      pendingJob.progress = Math.min(100, Math.max(0, progress));
      if (message) {
        console.log(` Job ${pendingJob.id}: ${progress}% - ${message}`);
      }
      this.notifySubscribers(pendingJob);
    };

    try {
      const result = await handler(pendingJob, reportProgress);
      pendingJob.status = 'completed';
      pendingJob.progress = 100;
      pendingJob.result = result;
      pendingJob.completedAt = new Date();
    } catch (error: any) {
      pendingJob.status = 'failed';
      pendingJob.error = error.message || 'Unknown error';
      pendingJob.completedAt = new Date();
      console.error(`❌ Job ${pendingJob.id} failed:`, error);
    } finally {
      this.processing.delete(pendingJob.id);
      this.updateMetrics();
      this.notifySubscribers(pendingJob);
      
      setTimeout(() => this.processNext(), 0);
    }
  }

  private updateMetrics() {
    const pending = Array.from(this.jobs.values()).filter(j => j.status === 'pending').length;
    updateJobQueueMetrics(pending, this.processing.size);
  }

  cleanup(maxAge: number = 3600000) {
    const now = Date.now();
    const entries = Array.from(this.jobs.entries());
    for (const [id, job] of entries) {
      if (job.completedAt && (now - job.completedAt.getTime()) > maxAge) {
        this.jobs.delete(id);
        this.subscribers.delete(id);
      }
    }
  }

  getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length
    };
  }
}

export const jobQueue = new JobQueue(3);

jobQueue.registerHandler('analyze_conversation', async (job, reportProgress) => {
  reportProgress(10, 'Starting analysis...');
  
  await new Promise(resolve => setTimeout(resolve, 100));
  reportProgress(30, 'Processing transcript...');
  
  return { message: 'Analysis job placeholder - replace with actual implementation' };
});

jobQueue.registerHandler('generate_meeting_minutes', async (job, reportProgress) => {
  reportProgress(10, 'Generating meeting minutes...');
  
  await new Promise(resolve => setTimeout(resolve, 100));
  reportProgress(50, 'Formatting output...');
  
  return { message: 'Meeting minutes job placeholder - replace with actual implementation' };
});

setInterval(() => {
  jobQueue.cleanup();
}, 300000);

export type { Job, JobResult, JobStatus };
