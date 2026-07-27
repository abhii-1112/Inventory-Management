import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportJobService, ReportJob } from '../../../core/services/report-job.service';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.css',
})
export class ReportsPage implements OnDestroy {
  format = signal<'csv' | 'xlsx'>('csv');
  requesting = signal(false);
  job = signal<ReportJob | null>(null);
  errorMessage = signal('');

  private pollHandle: ReturnType<typeof setInterval> | null = null;

  constructor(private reportJobService: ReportJobService) {}

  onRequestReport(): void {
    this.requesting.set(true);
    this.errorMessage.set('');
    this.job.set(null);

    this.reportJobService.requestReport(this.format()).subscribe({
      next: (res) => {
        this.requesting.set(false);
        this.startPolling(res.jobId);
      },
      error: (err) => {
        this.requesting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to start report generation');
      },
    });
  }

  private startPolling(jobId: string): void {
    this.pollHandle = setInterval(() => {
      this.reportJobService.getStatus(jobId).subscribe({
        next: (job) => {
          this.job.set(job);
          if (job.status === 'completed' || job.status === 'failed') {
            this.stopPolling();
          }
        },
        error: () => {
          this.stopPolling();
          this.errorMessage.set('Failed to check report status');
        },
      });
    }, 1500);
  }

  private stopPolling(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  getDownloadUrl(jobId: string): string {
    return this.reportJobService.getDownloadUrl(jobId);
  }
}