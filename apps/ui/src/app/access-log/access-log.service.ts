import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {RegisterAccessResponse} from '../members/members.service';

@Injectable({
  providedIn: 'root'
})
export class AccessLogService {

  private accessLogApiUrl = `${environment.apiBaseUrl}/access`;

  constructor(private httpClient: HttpClient) {
  }

  registerAccess(dni: string) {
    return this.httpClient.post<RegisterAccessResponse>(this.accessLogApiUrl, {dni});
  }
}
