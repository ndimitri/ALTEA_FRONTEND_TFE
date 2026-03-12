import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatChipsModule} from '@angular/material/chips';
import {
  PatientService,
  RendezVousService,
  ModuleService,
  SoinService
} from '../../core/services/api.services';
import {AuthService} from '../../core/services/auth.service';
import {User, RendezVous, Module, Soin} from '../../core/models/models';
import {forkJoin} from 'rxjs';
import {SkeletonComponent} from '../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatChipsModule,
    SkeletonComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  today = new Date();
  loading = true;
  patientCount = 0;
  todayRdvCount = 0;
  weekRdvCount = 0;
  activeModules = 0;
  upcomingRdv: RendezVous[] = [];
  modules: Module[] = [];

  // Modal détail RDV
  selectedRdv: RendezVous | null = null;
  selectedRdvSoins: Soin[] = [];
  loadingSoins = false;
  // Soins par rdvId pour l'affichage dans la liste
  rdvSoinsMap: Record<number, Soin[]> = {};

  constructor(
      private authService: AuthService,
      private patientService: PatientService,
      private rdvService: RendezVousService,
      private moduleService: ModuleService,
      private soinService: SoinService,
      private router: Router
  ) {
  }

  goToPlanning(rdvId: number): void {
    this.closeRdvDetail();
    this.router.navigate(['/planning'], {queryParams: {rdvId}});
  }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    forkJoin({
      patients: this.patientService.getAll(),
      rdvs: this.rdvService.getAll(),
      modules: this.moduleService.getModules()
    }).subscribe(({patients, rdvs, modules}) => {
      this.patientCount = patients.length;
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59);
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 7);
      this.todayRdvCount = rdvs.filter(r => {
        const d = new Date(r.dateHeureDebut);
        return d >= now && d <= endOfDay;
      }).length;
      // Seulement les RDV PLANIFIE pour cette semaine
      this.weekRdvCount = rdvs.filter(r => {
        const d = new Date(r.dateHeureDebut);
        return d >= now && d <= endOfWeek && (r.statut === 'PLANIFIE' || !r.statut);
      }).length;
      this.upcomingRdv = rdvs.filter(r => new Date(r.dateHeureDebut) >= now).slice(0, 5);
      this.modules = modules;
      this.activeModules = modules.filter(m => m.activeForUser).length;
      this.loading = false;
      // Charger les soins des prochains RDV
      this.upcomingRdv.forEach(rdv => {
        this.soinService.getByRdv(rdv.id!).subscribe({
          next: s => {
            this.rdvSoinsMap[rdv.id!] = s;
          },
          error: () => {
          }
        });
      });
    });
  }

  openRdvDetail(rdv: RendezVous): void {
    this.selectedRdv = rdv;
    this.selectedRdvSoins = [];
    this.loadingSoins = true;
    this.soinService.getByRdv(rdv.id!).subscribe({
      next: s => {
        this.selectedRdvSoins = s;
        this.loadingSoins = false;
      },
      error: () => {
        this.loadingSoins = false;
      }
    });
  }

  closeRdvDetail(): void {
    this.selectedRdv = null;
  }

  getStatutColor(statut?: string): string {
    return statut === 'REALISE' ? 'text-green-600' : statut === 'ANNULE' ? 'text-red-500' : 'text-orange-500';
  }

  getStatutIcon(statut?: string): string {
    return statut === 'REALISE' ? 'check_circle' : statut === 'ANNULE' ? 'cancel' : 'schedule';
  }

  getModuleIcon(nom: string): string {
    const icons: Record<string, string> = {
      PEDICURE: 'footprint',
      INFIRMIERE: 'vaccines',
      KINE: 'fitness_center',
      AIDE_SOIGNANT: 'personal_injury'
    };
    return icons[nom] || 'extension';
  }

  getModuleLabel(nom: string): string {
    const labels: Record<string, string> = {
      PEDICURE: 'Pédicure-podologue',
      INFIRMIERE: 'Infirmier(ère)',
      KINE: 'Kinésithérapeute',
      AIDE_SOIGNANT: 'Aide-soignant(e)'
    };
    return labels[nom] || nom;
  }

  getSoinsForRdv(rdvId: number | undefined): Soin[] {
    if (!rdvId) return [];
    return this.rdvSoinsMap[rdvId] ?? [];
  }
}
