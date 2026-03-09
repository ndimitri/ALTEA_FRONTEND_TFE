// ==================== PATIENT LIST ====================
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PatientService } from '../../../core/services/api.services';
import { Patient } from '../../../core/models/models';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatListModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.scss'
})
export class PatientListComponent implements OnInit {
  patients: Patient[] = [];
  loading = true;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  constructor(private patientService: PatientService, private snack: MatSnackBar) {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(q => this.loadPatients(q));
  }

  ngOnInit(): void { this.loadPatients(); }

  loadPatients(q?: string): void {
    this.loading = true;
    this.patientService.getAll(q).subscribe({
      next: p => { this.patients = p; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  onSearch(q: string): void { this.searchSubject.next(q); }
}
