import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportJob {
  id: string;
  format: 'csv' | 'xlsx';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filePath: string | null;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReportJobService {
  private baseUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  requestReport(format: 'csv' | 'xlsx'): Observable<{ jobId: string }> {
    return this.http.post<{ jobId: string }>(`${this.baseUrl}?format=${format}`, {});
  }

  getStatus(jobId: string): Observable<ReportJob> {
    return this.http.get<ReportJob>(`${this.baseUrl}/${jobId}`);
  }

  getDownloadUrl(jobId: string): string {
    return `${this.baseUrl}/${jobId}/download`;
  }
}
