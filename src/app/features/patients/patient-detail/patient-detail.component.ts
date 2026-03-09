import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { PatientService, SoinService } from '../../../core/services/api.services';
import { Patient, Soin } from '../../../core/models/models';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTabsModule,
    MatListModule, MatDividerModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSnackBarModule, MatChipsModule, MatDialogModule
  ],
  templateUrl: './patient-detail.component.html',
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .patient-title { display: flex; align-items: center; gap: 16px; flex: 1; }
    .avatar { width: 52px; height: 52px; border-radius: 50%; background: #1F5C8B; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; flex-shrink: 0; }
    .patient-title h2 { margin: 0; color: #0D3B66; }
    .patient-title p { margin: 4px 0 0; color: #666; font-size: 13px; }
    .header-actions { display: flex; gap: 8px; }
    .tab-content { padding: 20px 0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .info-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .info-row mat-icon { color: #1F5C8B; font-size: 18px; }
    .medical-info { font-size: 14px; color: #555; margin-top: 8px; }
    .notes-card { margin-top: 16px; }
    .tab-actions { margin-bottom: 16px; }
    .soin-form-card { margin-bottom: 16px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { width: 100%; }
    mat-form-field { width: 100%; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .soins-list { display: flex; flex-direction: column; gap: 12px; }
    .soin-card { padding: 12px 16px; }
    .soin-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .soin-date { flex: 1; color: #666; font-size: 13px; }
    .soin-desc { margin: 0; color: #444; font-size: 14px; }
    .soin-notes { margin: 4px 0 0; color: #888; font-size: 13px; display: flex; align-items: center; gap: 4px; }
    .soin-notes mat-icon { font-size: 14px; }
    .empty-state { text-align: center; padding: 48px; color: #aaa; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    @media (max-width: 600px) { .info-grid, .row-2 { grid-template-columns: 1fr; } }
  `]
})
export class PatientDetailComponent implements OnInit {
  patient?: Patient;
  soins: Soin[] = [];
  showSoinForm = false;
  soinForm: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private patientService: PatientService,
    private soinService: SoinService,
    private fb: FormBuilder,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.patientService.getById(id).subscribe(p => {
      this.patient = p;
      this.loadSoins();
    });
    this.soinForm = this.fb.group({
      type: ['', Validators.required],
      dateSoin: ['', Validators.required],
      description: [''], notes: ['']
    });
  }

  loadSoins(): void {
    this.soinService.getByPatient(this.patient!.id!).subscribe(s => this.soins = s);
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
      this.snack.open('Soin enregistré', 'OK', { duration: 2000 });
    });
  }

  deleteSoin(id: number): void {
    this.soinService.delete(id).subscribe(() => {
      this.loadSoins();
      this.snack.open('Soin supprimé', 'OK', { duration: 2000 });
    });
  }

  deletePatient(): void {
    if (confirm(`Supprimer ${this.patient!.prenom} ${this.patient!.nom} ?`)) {
      this.patientService.delete(this.patient!.id!).subscribe(() => {
        this.snack.open('Patient supprimé', 'OK', { duration: 2000 });
        this.router.navigate(['/patients']);
      });
    }
  }
}
