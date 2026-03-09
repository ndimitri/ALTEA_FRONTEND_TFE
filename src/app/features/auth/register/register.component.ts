import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styles: [`
    .auth-container { display: flex; height: 100vh; }
    .auth-left { flex: 1; background: linear-gradient(135deg, #0D3B66, #1F5C8B); display: flex; align-items: center; justify-content: center; }
    .brand { color: white; text-align: center; }
    .brand-icon { font-size: 72px; width: 72px; height: 72px; color: #64B5F6; }
    .brand h1 { font-size: 48px; font-weight: 700; letter-spacing: 6px; margin: 16px 0 8px; }
    .auth-right { flex: 1; display: flex; align-items: center; justify-content: center; background: #F5F7FA; padding: 24px; }
    .register-card { width: 100%; max-width: 480px; padding: 16px; }
    .name-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .submit-btn { width: 100%; margin-top: 12px; height: 44px; }
    .error-message { display: flex; align-items: center; gap: 8px; color: #d32f2f; background: #fce4ec; padding: 10px 12px; border-radius: 6px; margin-bottom: 12px; font-size: 14px; }
    mat-card-actions p { text-align: center; width: 100%; }
    @media (max-width: 768px) { .auth-left { display: none; } }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  showPwd = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.authService.register(this.form.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.loading = false;
        this.errorMessage = err.status === 409 ? 'Cet email est déjà utilisé' : 'Erreur lors de l\'inscription';
      }
    });
  }
}
