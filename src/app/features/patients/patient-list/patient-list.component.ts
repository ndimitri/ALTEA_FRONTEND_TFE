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
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h2 { margin: 0; color: #0D3B66; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .search-field { width: 100%; max-width: 480px; margin-bottom: 20px; display: block; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .patients-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .patient-card { cursor: pointer; transition: box-shadow 0.2s, transform 0.2s; }
    .patient-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.15); transform: translateY(-2px); }
    mat-card-content { display: flex; align-items: center; gap: 16px; padding: 16px !important; }
    .card-avatar {
      width: 48px; height: 48px; border-radius: 50%; background: #1F5C8B;
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: bold; font-size: 18px; flex-shrink: 0;
    }
    .card-info h3 { margin: 0 0 4px; font-size: 16px; }
    .card-info p { margin: 2px 0; font-size: 13px; color: #666; display: flex; align-items: center; gap: 4px; }
    .card-info mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .empty-state { grid-column: 1/-1; text-align: center; padding: 64px; color: #aaa; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; }
  `]
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
