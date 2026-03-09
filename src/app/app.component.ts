import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from './core/services/auth.service';
import { User } from './core/models/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatSidenavModule, MatListModule, MatMenuModule
  ],
  template: `
    <ng-container *ngIf="currentUser; else noNav">
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #sidenav mode="side" opened class="sidenav" [fixedInViewport]="true">
          <div class="sidenav-header">
            <mat-icon class="logo-icon">healing</mat-icon>
            <span class="logo-text">ALTEA</span>
          </div>
          <mat-nav-list>
            <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Tableau de bord</span>
            </a>
            <a mat-list-item routerLink="/patients" routerLinkActive="active-link">
              <mat-icon matListItemIcon>people</mat-icon>
              <span matListItemTitle>Patients</span>
            </a>
            <a mat-list-item routerLink="/planning" routerLinkActive="active-link">
              <mat-icon matListItemIcon>calendar_month</mat-icon>
              <span matListItemTitle>Planning</span>
            </a>
            <a mat-list-item routerLink="/map" routerLinkActive="active-link">
              <mat-icon matListItemIcon>map</mat-icon>
              <span matListItemTitle>Carte & Tournées</span>
            </a>
            <mat-divider></mat-divider>
            <a mat-list-item routerLink="/admin" routerLinkActive="active-link" *ngIf="isAdmin">
              <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
              <span matListItemTitle>Administration</span>
            </a>
          </mat-nav-list>
          <div class="sidenav-footer">
            <div class="user-info">
              <mat-icon>account_circle</mat-icon>
              <span>{{ currentUser.prenom }} {{ currentUser.nom }}</span>
            </div>
            <button mat-icon-button (click)="logout()" title="Déconnexion">
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </mat-sidenav>
        <mat-sidenav-content class="main-content">
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </ng-container>
    <ng-template #noNav>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }
    .sidenav {
      width: 240px;
      background: #0D3B66;
      color: white;
      display: flex;
      flex-direction: column;
    }
    .sidenav-header {
      display: flex; align-items: center; gap: 12px;
      padding: 24px 16px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.15);
    }
    .logo-icon { color: #64B5F6; font-size: 32px; width: 32px; height: 32px; }
    .logo-text { font-size: 22px; font-weight: 700; color: white; letter-spacing: 2px; }
    mat-nav-list { flex: 1; padding-top: 8px; }
    mat-nav-list a { color: rgba(255,255,255,0.8) !important; margin: 4px 8px; border-radius: 8px; }
    mat-nav-list a:hover { background: rgba(255,255,255,0.1) !important; color: white !important; }
    mat-nav-list a.active-link { background: rgba(100,181,246,0.2) !important; color: #64B5F6 !important; }
    mat-nav-list mat-icon { color: rgba(255,255,255,0.7); }
    mat-nav-list a.active-link mat-icon { color: #64B5F6; }
    .sidenav-footer {
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: space-between;
    }
    .user-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.8); }
    .user-info mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .main-content { background: #F5F7FA; }
    button[mat-icon-button] { color: rgba(255,255,255,0.7); }
  `]
})
export class AppComponent {
  currentUser: User | null = null;
  isAdmin = false;

  constructor(private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'ROLE_ADMIN';
    });
  }

  logout(): void { this.authService.logout(); }
}
