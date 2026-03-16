import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable, catchError, map, tap, throwError} from 'rxjs';
import {Router} from '@angular/router';
import {environment} from '../../../environments/environment';
import {AuthResponse, User, UserProfileUpdatePayload} from '../models/models';

interface SessionUserPayload {
  id?: number;
  email?: string;
  nom?: string;
  prenom?: string;
  role?: string;
  modulesActifs?: string[];
  telephone?: string;
  actif?: boolean;
}

@Injectable({providedIn: 'root'})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly userApiUrl = `${environment.apiUrl}/users`;
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly http: HttpClient, private readonly router: Router) {
  }

  private loadUser(): User | null {
    const stored = localStorage.getItem('altea_user');
    return stored ? JSON.parse(stored) : null;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {email, password}).pipe(
        tap(res => this.saveSession(res))
    );
  }

  register(data: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    telephone?: string
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
        tap(res => this.saveSession(res))
    );
  }

  getProfile(): Observable<User> {
    return this.requestWithFallback(
        this.getProfileUrls(),
        url => this.http.get<SessionUserPayload>(url)
    ).pipe(map(profile => this.persistUser(profile)));
  }

  updateProfile(payload: UserProfileUpdatePayload): Observable<User> {
    return this.requestWithFallback(
        this.getProfileUrls(),
        url => this.http.put<SessionUserPayload | null>(url, payload)
    ).pipe(map(profile => this.persistUser(profile ? {...payload, ...profile} : payload)));
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem('altea_token', res.token);
    this.persistUser(res);
  }

  private persistUser(payload: SessionUserPayload): User {
    const current = this.currentUserSubject.value;
    const user: User = {
      id: Number(payload.id ?? current?.id ?? 0),
      email: payload.email ?? current?.email ?? '',
      nom: payload.nom ?? current?.nom ?? '',
      prenom: payload.prenom ?? current?.prenom ?? '',
      role: (payload.role as User['role']) ?? current?.role ?? 'ROLE_USER',
      modulesActifs: payload.modulesActifs ?? current?.modulesActifs ?? [],
      telephone: payload.telephone ?? current?.telephone,
      actif: payload.actif ?? current?.actif
    };

    localStorage.setItem('altea_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    return user;
  }

  private getProfileUrls(): string[] {
    const currentUserId = this.currentUserSubject.value?.id;
    return [
      `${this.userApiUrl}/me`,
      `${this.apiUrl}/me`,
      `${this.apiUrl}/profile`,
      ...(currentUserId ? [`${this.userApiUrl}/${currentUserId}`] : [])
    ];
  }

  private requestWithFallback<T>(urls: string[], requestFactory: (url: string) => Observable<T>): Observable<T> {
    const [currentUrl, ...rest] = urls;

    if (!currentUrl) {
      return throwError(() => new Error('Aucun endpoint profil disponible'));
    }

    return requestFactory(currentUrl).pipe(
        catchError(error => rest.length ? this.requestWithFallback(rest, requestFactory) : throwError(() => error))
    );
  }

  logout(): void {
    localStorage.removeItem('altea_token');
    localStorage.removeItem('altea_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('altea_token');
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'ROLE_ADMIN';
  }

  hasModule(moduleName: string): boolean {
    return this.isAdmin() || (this.currentUserSubject.value?.modulesActifs.includes(moduleName) ?? false);
  }
}
