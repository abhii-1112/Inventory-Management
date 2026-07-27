import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  failedRows: number;
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class UploadJobService {
  private baseUrl = `${environment.apiUrl}/upload-jobs`;

  constructor(private http: HttpClient) {}

  upload(file: File): Observable<{ jobId: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ jobId: string }>(`${this.baseUrl}/upload`, formData);
  }

  getStatus(jobId: string): Observable<UploadJob> {
    return this.http.get<UploadJob>(`${this.baseUrl}/${jobId}`);
  }
}