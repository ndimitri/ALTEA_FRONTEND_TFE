import {Component, HostListener, OnInit} from '@angular/core';
import {Router, RouterOutlet, RouterLink, RouterLinkActive} from '@angular/router';
import {CommonModule} from '@angular/common';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {MatMenuModule} from '@angular/material/menu';
import {MatDividerModule} from '@angular/material/divider';
import {MatTooltipModule} from '@angular/material/tooltip';
import {AuthService} from './core/services/auth.service';
import {ModuleService} from './core/services/api.services';
import {Module, User} from './core/models/models';
import {filter} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatSidenavModule, MatListModule, MatMenuModule,
    MatDividerModule, MatTooltipModule
  ],
  template: `
    <ng-container *ngIf="currentUser; else noNav">
      <mat-sidenav-container class="h-screen">
        <mat-sidenav #sidenav
                     [mode]="isMobile ? 'over' : 'side'"
                     [opened]="!isMobile"
                     class="w-60 bg-primary flex flex-col text-white">
          <!-- Header -->
          <div class="flex items-center gap-3 px-4 py-6 border-b border-white/15">
            <mat-icon class="!text-[32px] !w-8 !h-8 text-primary-lighter">healing</mat-icon>
            <span class="text-[22px] font-bold tracking-[2px]">ALTEA</span>
          </div>
          <!-- Nav -->
          <mat-nav-list class="flex-1 pt-2">
            <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link"
               (click)="isMobile && sidenav.close()">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Tableau de bord</span>
            </a>
            <a mat-list-item routerLink="/patients" routerLinkActive="active-link"
               (click)="isMobile && sidenav.close()">
              <mat-icon matListItemIcon>people</mat-icon>
              <span matListItemTitle>Patients</span>
            </a>
            <a mat-list-item routerLink="/planning" routerLinkActive="active-link"
               (click)="isMobile && sidenav.close()">
              <mat-icon matListItemIcon>calendar_month</mat-icon>
              <span matListItemTitle>Planning</span>
            </a>
            <a mat-list-item routerLink="/map" routerLinkActive="active-link"
               (click)="isMobile && sidenav.close()">
              <mat-icon matListItemIcon>map</mat-icon>
              <span matListItemTitle>Carte & Tournées</span>
            </a>
            <mat-divider class="!my-2"></mat-divider>
            <!-- Lien Mes modules (toujours visible) -->
            <a mat-list-item routerLink="/modules" routerLinkActive="active-link"
               [routerLinkActiveOptions]="{exact: true}"
               (click)="isMobile && sidenav.close()">
              <mat-icon matListItemIcon>extension</mat-icon>
              <span matListItemTitle>Mes modules</span>
            </a>
            <!-- Liens dynamiques par module actif -->
            <ng-container *ngFor="let m of activeModules">
              <a mat-list-item [routerLink]="['/modules', m.nom.toLowerCase()]"
                 routerLinkActive="active-link"
                 (click)="isMobile && sidenav.close()"
                 class="module-link pl-4">
                <mat-icon matListItemIcon class="!text-base">{{ getModuleIcon(m.nom) }}</mat-icon>
                <span matListItemTitle class="text-sm">{{ getModuleLabel(m.nom) }}</span>
              </a>
            </ng-container>
            <mat-divider class="!my-2"></mat-divider>
            <a mat-list-item routerLink="/admin" routerLinkActive="active-link" *ngIf="isAdmin"
               (click)="isMobile && sidenav.close()">
              <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
              <span matListItemTitle>Administration</span>
            </a>
          </mat-nav-list>
          <!-- Footer -->
          <div class="flex items-center justify-between px-4 py-3 border-t border-white/15">
            <div class="flex items-center gap-2 text-sm text-white/80">
              <mat-icon class="!text-xl !w-5 !h-5">account_circle</mat-icon>
              <span>{{ currentUser.prenom }} {{ currentUser.nom }}</span>
            </div>
            <button mat-icon-button (click)="logout()" title="Déconnexion" class="text-white/70">
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </mat-sidenav>

        <mat-sidenav-content class="bg-surface flex flex-col">
          <!-- Topbar mobile -->
          <div class="flex items-center gap-3 px-4 py-3 bg-primary text-white md:hidden">
            <button mat-icon-button (click)="sidenav.toggle()" class="text-white">
              <mat-icon>menu</mat-icon>
            </button>
            <span class="font-bold tracking-widest">ALTEA</span>
          </div>
          <div class="flex-1 overflow-auto">
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </ng-container>
    <ng-template #noNav>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    mat-nav-list a {
      color: rgba(255, 255, 255, 0.8) !important;
      margin: 4px 8px;
      border-radius: 8px;
    }

    mat-nav-list a:hover {
      background: rgba(255, 255, 255, 0.1) !important;
      color: white !important;
    }

    mat-nav-list a.active-link {
      background: rgba(100, 181, 246, 0.2) !important;
      color: #64B5F6 !important;
    }

    mat-nav-list mat-icon {
      color: rgba(255, 255, 255, 0.7);
    }

    mat-nav-list a.active-link mat-icon {
      color: #64B5F6;
    }
  `]
})
export class AppComponent implements OnInit {
  currentUser: User | null = null;
  isAdmin = false;
  isMobile = window.innerWidth < 768;
  activeModules: Module[] = [];

  private readonly MODULE_ICONS: Record<string, string> = {
    PEDICURE: 'footprint', INFIRMIERE: 'vaccines',
    KINE: 'fitness_center', AIDE_SOIGNANT: 'personal_injury'
  };
  private readonly MODULE_LABELS: Record<string, string> = {
    PEDICURE: 'Pédicure-podologue', INFIRMIERE: 'Infirmier(ère)',
    KINE: 'Kinésithérapeute', AIDE_SOIGNANT: 'Aide-soignant(e)'
  };

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  constructor(
      private authService: AuthService,
      private moduleService: ModuleService,
      private router: Router
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'ROLE_ADMIN';
      if (user) this.loadActiveModules();
      else this.activeModules = [];
    });
    // Recharger la navbar à chaque activation/désactivation de module (temps réel)
    this.moduleService.modulesChanged$.pipe(
        filter(() => !!this.currentUser)
    ).subscribe(() => this.loadActiveModules());
  }

  ngOnInit(): void {
  }

  loadActiveModules(): void {
    this.moduleService.getModules().subscribe(modules => {
      this.activeModules = modules.filter(m => m.activeForUser);
    });
  }

  getModuleIcon(nom: string): string {
    return this.MODULE_ICONS[nom] ?? 'extension';
  }

  getModuleLabel(nom: string): string {
    return this.MODULE_LABELS[nom] ?? nom;
  }

  logout(): void {
    this.authService.logout();
  }
}
