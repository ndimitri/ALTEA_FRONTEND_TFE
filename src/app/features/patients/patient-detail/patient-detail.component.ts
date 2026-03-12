import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink, ActivatedRoute, Router} from '@angular/router';
import {ReactiveFormsModule, FormBuilder, Validators} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTabsModule} from '@angular/material/tabs';
import {MatListModule} from '@angular/material/list';
import {MatDividerModule} from '@angular/material/divider';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatChipsModule} from '@angular/material/chips';
import {MatDialogModule} from '@angular/material/dialog';
import {
  PatientService,
  SoinService,
  SoinTemplateService,
  ModuleService,
  RendezVousService
} from '../../../core/services/api.services';
import {Patient, RendezVous, Soin, SoinTemplate} from '../../../core/models/models';
import {SkeletonComponent} from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTabsModule,
    MatListModule, MatDividerModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSnackBarModule, MatChipsModule, MatDialogModule,
    SkeletonComponent
  ],
  templateUrl: './patient-detail.component.html',
  styleUrl: './patient-detail.component.scss'
})
export class PatientDetailComponent implements OnInit {
  patient?: Patient;
  loading = true;
  soins: Soin[] = [];
  rdvs: RendezVous[] = [];
  rdvSoinsMap: Record<number, Soin[]> = {};
  showSoinForm = false;
  soinForm: any;
  editingSoin: Soin | null = null;
  editSoinForm: any;
  templates: SoinTemplate[] = [];

  // Filtres RDV
  readonly STATUTS = [
    {
      key: 'PLANIFIE',
      label: 'Planifié',
      icon: 'schedule',
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      border: 'border-orange-300',
      activeBg: 'bg-orange-500'
    },
    {
      key: 'REALISE',
      label: 'Réalisé',
      icon: 'check_circle',
      bg: 'bg-green-100',
      text: 'text-green-600',
      border: 'border-green-300',
      activeBg: 'bg-green-500'
    },
    {
      key: 'ANNULE',
      label: 'Annulé',
      icon: 'cancel',
      bg: 'bg-red-100',
      text: 'text-red-500',
      border: 'border-red-300',
      activeBg: 'bg-red-500'
    },
  ] as const;

  activeFilters = new Set<string>(['PLANIFIE', 'REALISE', 'ANNULE']); // tous actifs par défaut

  toggleFilter(key: string): void {
    if (this.activeFilters.has(key)) {
      // Ne pas désactiver si c'est le seul filtre actif
      if (this.activeFilters.size > 1) this.activeFilters.delete(key);
    } else {
      this.activeFilters.add(key);
    }
  }

  isFilterActive(key: string): boolean {
    return this.activeFilters.has(key);
  }

  countByStatut(key: string): number {
    return this.rdvs.filter(r => (r.statut ?? 'PLANIFIE') === key).length;
  }

  /** RDV filtrés et groupés par statut, dans l'ordre PLANIFIE → REALISE → ANNULE */
  get rdvGroups(): {
    statut: {
      key: string;
      label: string;
      icon: string;
      bg: string;
      text: string;
      border: string;
      activeBg: string
    };
    rdvs: RendezVous[]
  }[] {
    return this.STATUTS
        .filter(s => this.activeFilters.has(s.key))
        .map(s => ({
          statut: s,
          rdvs: this.rdvs.filter(r => (r.statut ?? 'PLANIFIE') === s.key)
        }))
        .filter(g => g.rdvs.length > 0);
  }

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      private patientService: PatientService,
      private soinService: SoinService,
      private moduleService: ModuleService,
      private rdvService: RendezVousService,
      private fb: FormBuilder,
      private snack: MatSnackBar,
      private templateService: SoinTemplateService
  ) {
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.patientService.getById(id).subscribe(p => {
      this.patient = p;
      this.loading = false;
      this.loadSoins();
      this.loadRdvs();
    });
    this.soinForm = this.fb.group({
      type: ['', Validators.required],
      dateSoin: ['', Validators.required],
      description: [''], notes: ['']
    });
    this.editSoinForm = this.fb.group({
      type: ['', Validators.required],
      dateSoin: ['', Validators.required],
      description: [''], notes: ['']
    });
    this.loadTemplates();
  }

  /** Charge les templates des modules actifs (globaux + personnels) */
  loadTemplates(): void {
    this.moduleService.getModules().subscribe(modules => {
      const actifs = modules.filter(m => m.activeForUser);
      if (actifs.length === 0) {
        this.templateService.getAll().subscribe(t => this.templates = t);
        return;
      }
      import('rxjs').then(({forkJoin}) => {
        forkJoin(actifs.map(m => this.templateService.getByModuleWithPersonnels(m.id)))
            .subscribe(results => {
              const all = results.flat();
              const seen = new Set<number>();
              this.templates = all.filter(t => {
                if (t.id == null) return true;
                if (seen.has(t.id)) return false;
                seen.add(t.id);
                return true;
              });
            });
      });
    });
  }

  loadSoins(): void {
    this.soinService.getByPatient(this.patient!.id!).subscribe(s => this.soins = s);
  }

  loadRdvs(): void {
    this.rdvService.getByPatient(this.patient!.id!).subscribe({
      next: r => {
        this.rdvs = r.sort((a, b) =>
            new Date(b.dateHeureDebut).getTime() - new Date(a.dateHeureDebut).getTime()
        );
        // Charger les soins de chaque RDV
        this.rdvs.forEach(rdv => {
          this.soinService.getByRdv(rdv.id!).subscribe({
            next: s => {
              this.rdvSoinsMap[rdv.id!] = s;
            },
            error: () => {
            }
          });
        });
      },
      error: () => {
      }
    });
  }

  saveSoin(): void {
    if (!this.soinForm.valid) return;
    const val = this.soinForm.value;
    this.soinService.create({
      ...val,
      dateSoin: val.dateSoin + ':00',
      patientId: this.patient!.id!
    }).subscribe(() => {
      this.showSoinForm = false;
      this.soinForm.reset();
      this.loadSoins();
      this.snack.open('Soin enregistré', 'OK', {duration: 2000});
    });
  }

  deleteSoin(id: number): void {
    this.soinService.delete(id).subscribe(() => {
      this.loadSoins();
      this.snack.open('Soin supprimé', 'OK', {duration: 2000});
    });
  }

  deletePatient(): void {
    if (confirm(`Supprimer ${this.patient!.prenom} ${this.patient!.nom} ?`)) {
      this.patientService.delete(this.patient!.id!).subscribe(() => {
        this.snack.open('Patient supprimé', 'OK', {duration: 2000});
        this.router.navigate(['/patients']);
      });
    }
  }

  applyTemplate(template: SoinTemplate): void {
    if (!template) return;
    this.soinForm.patchValue({
      type: template.type,
      description: template.description,
      notes: template.notes
    });
  }

  openEditSoin(soin: Soin): void {
    this.editingSoin = soin;
    const dateSoin = soin.dateSoin ? soin.dateSoin.slice(0, 16) : '';
    this.editSoinForm.patchValue({
      type: soin.type,
      dateSoin,
      description: soin.description ?? '',
      notes: soin.notes ?? ''
    });
  }

  saveEditSoin(): void {
    if (!this.editSoinForm.valid || !this.editingSoin) return;
    const val = this.editSoinForm.value;
    this.soinService.update(this.editingSoin.id!, {
      ...val,
      dateSoin: val.dateSoin + ':00',
      patientId: this.patient!.id!
    }).subscribe(() => {
      this.editingSoin = null;
      this.loadSoins();
      this.snack.open('Soin modifié', 'OK', {duration: 2000});
    });
  }

  getStatutColor(statut?: string): string {
    return statut === 'REALISE' ? 'text-green-600 bg-green-50' :
        statut === 'ANNULE' ? 'text-red-500 bg-red-50' :
            'text-orange-500 bg-orange-50';
  }

  getStatutIcon(statut?: string): string {
    return statut === 'REALISE' ? 'check_circle' : statut === 'ANNULE' ? 'cancel' : 'schedule';
  }

  getSoinsForRdv(rdvId: number | undefined): Soin[] {
    if (!rdvId) return [];
    return this.rdvSoinsMap[rdvId] ?? [];
  }
}
