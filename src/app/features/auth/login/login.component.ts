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
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styles: [`
    .auth-container { display: flex; height: 100vh; }
    .auth-left {
      flex: 1; background: linear-gradient(135deg, #0D3B66, #1F5C8B);
      display: flex; align-items: center; justify-content: center;
    }
    .brand { color: white; text-align: center; }
    .brand-icon { font-size: 72px; width: 72px; height: 72px; color: #64B5F6; }
    .brand h1 { font-size: 48px; font-weight: 700; letter-spacing: 6px; margin: 16px 0 8px; }
    .brand p { font-size: 16px; opacity: 0.8; max-width: 260px; }
    .auth-right {
      flex: 1; display: flex; align-items: center; justify-content: center;
      background: #F5F7FA; padding: 24px;
    }
    .login-card { width: 100%; max-width: 420px; padding: 16px; }
    .full-width { width: 100%; margin-bottom: 12px; }
    .submit-btn { width: 100%; margin-top: 8px; height: 44px; }
    .error-message {
      display: flex; align-items: center; gap: 8px;
      color: #d32f2f; background: #fce4ec; padding: 10px 12px;
      border-radius: 6px; margin-bottom: 12px; font-size: 14px;
    }
    mat-card-actions p { text-align: center; width: 100%; }
    @media (max-width: 768px) { .auth-left { display: none; } }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPwd = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.loading = false;
        this.errorMessage = err.status === 401
          ? 'Identifiants incorrects'
          : 'Erreur de connexion. Réessayez.';
      }
    });
  }
}
