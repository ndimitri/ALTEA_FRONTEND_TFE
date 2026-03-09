import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ModuleService } from '../../core/services/api.services';
import { Module } from '../../core/models/models';
import { forkJoin } from 'rxjs';

interface AdminUser {
  id: number; nom: string; prenom: string; email: string;
  role: string; actif: boolean; telephone?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatSlideToggleModule, MatChipsModule, MatSnackBarModule
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  users: AdminUser[] = [];
  allModules: Module[] = [];
  userModules: Record<number, Set<number>> = {}; // userId -> Set<moduleId>
  displayedCols = ['name', 'role', 'modules', 'actif'];

  private adminUrl = `${environment.apiUrl}/admin`;

  constructor(
    private http: HttpClient,
    private moduleService: ModuleService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    forkJoin({
      users: this.http.get<AdminUser[]>(`${this.adminUrl}/users`),
      modules: this.moduleService.getModules()
    }).subscribe(({ users, modules }) => {
      this.users = users;
      this.allModules = modules;
    });
  }

  isModuleActive(userId: number, moduleId: number): boolean {
    return this.userModules[userId]?.has(moduleId) ?? false;
  }

  toggleModule(userId: number, moduleId: number): void {
    if (!this.userModules[userId]) this.userModules[userId] = new Set();
    const active = this.userModules[userId].has(moduleId);

    if (active) {
      this.http.delete(`${this.adminUrl}/users/${userId}/modules/${moduleId}`).subscribe(() => {
        this.userModules[userId].delete(moduleId);
        this.snack.open('Module désactivé', 'OK', { duration: 1500 });
      });
    } else {
      this.http.post(`${this.adminUrl}/users/${userId}/modules/${moduleId}`, {}).subscribe(() => {
        this.userModules[userId].add(moduleId);
        this.snack.open('Module activé', 'OK', { duration: 1500 });
      });
    }
  }

  toggleUser(userId: number): void {
    this.http.put<AdminUser>(`${this.adminUrl}/users/${userId}/toggle`, {}).subscribe(u => {
      const idx = this.users.findIndex(x => x.id === userId);
      if (idx !== -1) this.users[idx] = u;
      this.snack.open(`Utilisateur ${u.actif ? 'activé' : 'désactivé'}`, 'OK', { duration: 2000 });
    });
  }

  getModuleShort(nom: string): string {
    const s: Record<string, string> = { PEDICURE: 'Pédi', INFIRMIERE: 'Inf', KINE: 'Kiné', AIDE_SOIGNANT: 'AS' };
    return s[nom] || nom;
  }
}
