import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PatientService } from '../../../core/services/api.services';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDividerModule, MatSnackBarModule
  ],
  templateUrl: './patient-form.component.html',
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .page-header h2 { margin: 0; color: #0D3B66; }
    .form-card { max-width: 760px; }
    h3 { color: #1F5C8B; margin: 20px 0 12px; font-size: 15px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { width: 100%; }
    mat-form-field { width: 100%; margin-bottom: 8px; }
    mat-divider { margin: 16px 0; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
    @media (max-width: 600px) { .row-2 { grid-template-columns: 1fr; } }
  `]
})
export class PatientFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  saving = false;
  patientId?: number;

  constructor(
    private fb: FormBuilder,
    private patientService: PatientService,
    private router: Router,
    private route: ActivatedRoute,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      dateNaissance: [null],
      adresse: [''], latitude: [null], longitude: [null],
      telephone: [''], email: ['', Validators.email],
      informationsMedicales: [''], medecinReferent: [''],
      nomMutuelle: [''], numeroMutuelle: [''], notes: ['']
    });

    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.patientId && !Number.isNaN(this.patientId)) {
      this.isEdit = true;
      this.patientService.getById(this.patientId).subscribe(p => this.form.patchValue(p));
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const action = this.isEdit
      ? this.patientService.update(this.patientId!, this.form.value)
      : this.patientService.create(this.form.value);

    action.subscribe({
      next: (p) => {
        this.snack.open(this.isEdit ? 'Patient mis à jour' : 'Patient créé', 'OK', { duration: 2000 });
        this.router.navigate(['/patients', p.id]);
      },
      error: () => { this.saving = false; this.snack.open('Erreur lors de la sauvegarde', 'OK', { duration: 3000 }); }
    });
  }
}
