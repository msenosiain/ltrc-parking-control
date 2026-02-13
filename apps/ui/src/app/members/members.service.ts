import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Member} from './member.interface';
import {PaginatedResponse} from '../common/PaginatedResponse';
import {SortDirection} from '@angular/material/sort';

export interface RegisterAccessResponse {
  accessGranted: boolean;
  member: Member;
  title: string;
  subtitle: string;
}

@Injectable({
  providedIn: 'root'
})
export class MembersService {

  private membersApiUrl = `${environment.apiBaseUrl}/members`;

  constructor(private httpClient: HttpClient) {
  }

  createMember(payload: Member) {
    return this.httpClient.post<Member>(this.membersApiUrl, payload);
  }

  updateMember(id: string, payload: Partial<Member>) {
    return this.httpClient.put<Member>(`${this.membersApiUrl}/${id}`, payload);
  }

  searchMemberByDni(dni: string): Observable<Member> {
    return this.httpClient.get<Member>(`${this.membersApiUrl}/${dni}`);
  }

  getMembers(query: string, page: number = 1, limit: number = 10, sortBy?: string, direction?: SortDirection): Observable<PaginatedResponse<Member>> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', sortBy ?? 'fullName')
      .set('sortOrder', direction ?? 'asc');

    return this.httpClient.get<PaginatedResponse<Member>>(`${this.membersApiUrl}`, {params});
  }

  deleteMember(dni: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.membersApiUrl}/${dni}`);
  }
}
