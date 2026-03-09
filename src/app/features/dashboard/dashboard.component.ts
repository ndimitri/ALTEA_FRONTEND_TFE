import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { PatientService, RendezVousService, ModuleService } from '../../core/services/api.services';
import { AuthService } from '../../core/services/auth.service';
import { User, RendezVous, Module } from '../../core/models/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatListModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  today = new Date();
  patientCount = 0;
  todayRdvCount = 0;
  weekRdvCount = 0;
  activeModules = 0;
  upcomingRdv: RendezVous[] = [];
  modules: Module[] = [];

  constructor(
    private authService: AuthService,
    private patientService: PatientService,
    private rdvService: RendezVousService,
    private moduleService: ModuleService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    forkJoin({
      patients: this.patientService.getAll(),
      rdvs: this.rdvService.getAll(),
      modules: this.moduleService.getModules()
    }).subscribe(({ patients, rdvs, modules }) => {
      this.patientCount = patients.length;

      const now = new Date();
      const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59);
      const endOfWeek = new Date(now); endOfWeek.setDate(now.getDate() + 7);

      this.todayRdvCount = rdvs.filter(r => {
        const d = new Date(r.dateHeureDebut);
        return d >= now && d <= endOfDay;
      }).length;

      this.weekRdvCount = rdvs.filter(r => {
        const d = new Date(r.dateHeureDebut);
        return d >= now && d <= endOfWeek;
      }).length;

      this.upcomingRdv = rdvs
        .filter(r => new Date(r.dateHeureDebut) >= now)
        .slice(0, 5);

      this.modules = modules;
      this.activeModules = modules.filter(m => m.activeForUser).length;
    });
  }

  getModuleIcon(nom: string): string {
    const icons: Record<string, string> = {
      PEDICURE: 'footprint', INFIRMIERE: 'vaccines',
      KINE: 'fitness_center', AIDE_SOIGNANT: 'personal_injury'
    };
    return icons[nom] || 'extension';
  }

  getModuleLabel(nom: string): string {
    const labels: Record<string, string> = {
      PEDICURE: 'Pédicure-podologue', INFIRMIERE: 'Infirmier(ère)',
      KINE: 'Kinésithérapeute', AIDE_SOIGNANT: 'Aide-soignant(e)'
    };
    return labels[nom] || nom;
  }
}
