import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadJobService, UploadJob } from '../../../core/services/upload-job.service';

@Component({
  selector: 'app-bulk-upload-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-upload-page.html',
  styleUrl: './bulk-upload-page.css',
})
export class BulkUploadPage implements OnDestroy {
  selectedFile: File | null = null;
  uploading = signal(false);
  job = signal<UploadJob | null>(null);
  errorMessage = signal('');

  private pollHandle: ReturnType<typeof setInterval> | null = null;

  constructor(private uploadJobService: UploadJobService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.errorMessage.set('');
    }
  }

  onUpload(): void {
    if (!this.selectedFile) {
      this.errorMessage.set('Please select a CSV or Excel file first.');
      return;
    }

    this.uploading.set(true);
    this.errorMessage.set('');
    this.job.set(null);

    this.uploadJobService.upload(this.selectedFile).subscribe({
      next: (res) => {
        this.uploading.set(false);
        this.startPolling(res.jobId);
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMessage.set(err.error?.message || 'Upload failed');
      },
    });
  }

  private startPolling(jobId: string): void {
    // poll every 1.5s until status is completed or failed
    this.pollHandle = setInterval(() => {
      this.uploadJobService.getStatus(jobId).subscribe({
        next: (job) => {
          this.job.set(job);
          if (job.status === 'completed' || job.status === 'failed') {
            this.stopPolling();
          }
        },
        error: () => {
          this.stopPolling();
          this.errorMessage.set('Failed to check upload status');
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
    // critical: stop polling if the user navigates away mid-upload,
    // otherwise the interval keeps firing forever in the background
    this.stopPolling();
  }

  progressPercent(): number {
    const j = this.job();
    if (!j || j.totalRows === 0) return 0;
    return Math.round((j.processedRows / j.totalRows) * 100);
  }
}