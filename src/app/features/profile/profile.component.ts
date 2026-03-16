import {CommonModule} from '@angular/common';
import {Component, DestroyRef, OnInit, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {finalize} from 'rxjs';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatChipsModule} from '@angular/material/chips';
import {MatDividerModule} from '@angular/material/divider';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {AuthService} from '../../core/services/auth.service';
import {ModuleService} from '../../core/services/api.services';
import {User, UserProfileUpdatePayload} from '../../core/models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  form: FormGroup;
  currentUser: User | null = null;
  activeModuleNames: string[] = [];
  loadingProfile = true;
  loadingModules = true;
  saving = false;
  syncNotice = '';
  fatalLoadError = '';

  private readonly destroyRef = inject(DestroyRef);

  private readonly ROLE_LABELS: Record<string, string> = {
    ROLE_ADMIN: 'Administrateur',
    ROLE_USER: 'Professionnel de santé'
  };

  private readonly MODULE_LABELS: Record<string, string> = {
    PEDICURE: 'Pédicure-podologue',
    INFIRMIERE: 'Infirmier(ère)',
    KINE: 'Kinésithérapeute',
    AIDE_SOIGNANT: 'Aide-soignant(e)'
  };

  private readonly MODULE_ICONS: Record<string, string> = {
    PEDICURE: 'footprint',
    INFIRMIERE: 'vaccines',
    KINE: 'fitness_center',
    AIDE_SOIGNANT: 'personal_injury'
  };

  constructor(
      private readonly fb: FormBuilder,
      private readonly authService: AuthService,
      private readonly moduleService: ModuleService,
      private readonly snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      prenom: ['', [Validators.required, Validators.maxLength(80)]],
      nom: ['', [Validators.required, Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.maxLength(20), Validators.pattern(/^[0-9+\s().-]*$/)]]
    });
  }

  ngOnInit(): void {
    const sessionUser = this.authService.getCurrentUser();
    if (sessionUser) {
      this.applyUser(sessionUser);
      this.loadingProfile = false;
    }

    this.authService.currentUser$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(user => {
          if (!user) {
            return;
          }

          const shouldPatchForm = !this.currentUser || !this.form.dirty;
          this.currentUser = user;

          if (shouldPatchForm) {
            this.patchForm(user);
          }

          if (!this.activeModuleNames.length && user.modulesActifs?.length) {
            this.activeModuleNames = [...user.modulesActifs];
          }
        });

    this.loadProfile();
    this.loadModules();
  }

  get fullName(): string {
    if (!this.currentUser) {
      return 'Mon profil';
    }

    return `${this.currentUser.prenom} ${this.currentUser.nom}`.trim();
  }

  get initials(): string {
    const user = this.currentUser;
    if (!user) {
      return 'AL';
    }

    return `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase() || 'AL';
  }

  get roleLabel(): string {
    return this.ROLE_LABELS[this.currentUser?.role ?? 'ROLE_USER'] ?? 'Utilisateur';
  }

  get activeModulesCount(): number {
    return this.activeModuleNames.length;
  }

  get profileCompletion(): number {
    const raw = this.form.getRawValue();
    const fields = [raw.prenom, raw.nom, raw.email, raw.telephone];
    const filled = fields.filter(value => `${value ?? ''}`.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }

  get preferredContact(): string {
    return `${this.form.get('telephone')?.value ?? ''}`.trim() ? 'Téléphone' : 'Email';
  }

  get accountStatusLabel(): string {
    return this.currentUser?.actif === false ? 'Compte désactivé' : 'Compte actif';
  }

  loadProfile(): void {
    this.loadingProfile = true;

    this.authService.getProfile()
        .pipe(
            finalize(() => this.loadingProfile = false),
            takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: user => {
            this.syncNotice = '';
            this.fatalLoadError = '';
            this.applyUser(user);
          },
          error: () => {
            if (this.currentUser) {
              this.syncNotice = 'Le profil s’affiche depuis la session locale. Les informations serveur n’ont pas pu être rafraîchies.';
              return;
            }

            this.fatalLoadError = 'Impossible de charger votre profil pour le moment.';
          }
        });
  }

  loadModules(): void {
    this.loadingModules = true;

    this.moduleService.getModules()
        .pipe(
            finalize(() => this.loadingModules = false),
            takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: modules => {
            this.activeModuleNames = modules.filter(module => module.activeForUser).map(module => module.nom);
          },
          error: () => {
            this.activeModuleNames = [...(this.currentUser?.modulesActifs ?? [])];
          }
        });
  }

  onSubmit(): void {
    if (!this.currentUser) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: UserProfileUpdatePayload = {
      prenom: raw.prenom.trim(),
      nom: raw.nom.trim(),
      email: raw.email.trim(),
      telephone: raw.telephone?.trim() || undefined
    };

    this.saving = true;
    this.authService.updateProfile(payload)
        .pipe(
            finalize(() => this.saving = false),
            takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: user => {
            this.applyUser(user);
            this.snack.open('Profil mis à jour avec succès.', 'OK', {duration: 2500});
          },
          error: err => {
            const message = err?.status === 409
                ? 'Cette adresse email est déjà utilisée.'
                : 'La mise à jour du profil a échoué.';
            this.snack.open(message, 'OK', {duration: 3500});
          }
        });
  }

  resetForm(): void {
    if (!this.currentUser) {
      return;
    }

    this.patchForm(this.currentUser);
  }

  getModuleLabel(moduleName: string): string {
    return this.MODULE_LABELS[moduleName] ?? moduleName;
  }

  getModuleIcon(moduleName: string): string {
    return this.MODULE_ICONS[moduleName] ?? 'extension';
  }

  private applyUser(user: User): void {
    this.currentUser = user;
    this.patchForm(user);
  }

  private patchForm(user: User): void {
    this.form.reset({
      prenom: user.prenom ?? '',
      nom: user.nom ?? '',
      email: user.email ?? '',
      telephone: user.telephone ?? ''
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }
}
