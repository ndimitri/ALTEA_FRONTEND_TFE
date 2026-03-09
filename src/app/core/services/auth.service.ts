import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  private loadUser(): User | null {
    const stored = localStorage.getItem('altea_user');
    return stored ? JSON.parse(stored) : null;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  register(data: { nom: string; prenom: string; email: string; password: string; telephone?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.saveSession(res))
    );
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem('altea_token', res.token);
    const user: User = {
      id: res.id, email: res.email, nom: res.nom, prenom: res.prenom,
      role: res.role as any, modulesActifs: res.modulesActifs
    };
    localStorage.setItem('altea_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  logout(): void {
    localStorage.removeItem('altea_token');
    localStorage.removeItem('altea_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null { return localStorage.getItem('altea_token'); }
  isAuthenticated(): boolean { return !!this.currentUserSubject.value; }
  getCurrentUser(): User | null { return this.currentUserSubject.value; }
  isAdmin(): boolean { return this.currentUserSubject.value?.role === 'ROLE_ADMIN'; }
  hasModule(moduleName: string): boolean {
    return this.isAdmin() || (this.currentUserSubject.value?.modulesActifs.includes(moduleName) ?? false);
  }
}
