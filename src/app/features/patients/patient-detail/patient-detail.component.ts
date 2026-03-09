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
  styleUrl: './patient-detail.component.scss'
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
