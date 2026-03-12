import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatChipsModule} from '@angular/material/chips';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatDividerModule} from '@angular/material/divider';
import {ModuleService, SoinTemplateService} from '../../core/services/api.services';
import {Module, SoinTemplate} from '../../core/models/models';
import {SkeletonComponent} from '../../shared/components/skeleton/skeleton.component';

interface ModuleConfig {
  nom: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

const MODULE_CONFIGS: ModuleConfig[] = [
  {
    nom: 'INFIRMIERE',
    label: 'Infirmier(ère)',
    description: 'Soins infirmiers, pansements, injections, prises de sang, suivi médical.',
    icon: 'vaccines',
    color: 'bg-blue-50 border-blue-200'
  },
  {
    nom: 'PEDICURE',
    label: 'Pédicure-podologue',
    description: 'Soins des pieds, ongles, cors, verrues et orthoplasties.',
    icon: 'footprint',
    color: 'bg-green-50 border-green-200'
  },
  {
    nom: 'KINE',
    label: 'Kinésithérapeute',
    description: 'Rééducation fonctionnelle, massages, mobilisations et exercices thérapeutiques.',
    icon: 'fitness_center',
    color: 'bg-orange-50 border-orange-200'
  },
  {
    nom: 'AIDE_SOIGNANT',
    label: 'Aide-soignant(e)',
    description: 'Aide à la toilette, habillage, repas, accompagnement et soins de confort.',
    icon: 'personal_injury',
    color: 'bg-purple-50 border-purple-200'
  },
];

@Component({
  selector: 'app-modules',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatSnackBarModule, MatExpansionModule,
    MatDividerModule, SkeletonComponent
  ],
  templateUrl: './modules.component.html',
  styleUrl: './modules.component.scss'
})
export class ModulesComponent implements OnInit {
  modules: Module[] = [];
  loading = true;
  // templates par moduleId
  templatesMap: Record<number, SoinTemplate[]> = {};
  loadingTemplates: Record<number, boolean> = {};

  constructor(
      private moduleService: ModuleService,
      private templateService: SoinTemplateService,
      private snack: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    this.moduleService.getModules().subscribe({
      next: modules => {
        this.modules = modules;
        this.loading = false;
        // Charger les templates pour les modules déjà actifs
        modules.filter(m => m.activeForUser).forEach(m => this.loadTemplates(m.id));
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getConfig(nom: string): ModuleConfig {
    return MODULE_CONFIGS.find(c => c.nom === nom) ?? {
      nom, label: nom, description: '', icon: 'extension', color: 'bg-gray-50 border-gray-200'
    };
  }

  toggleModule(module: Module): void {
    if (module.activeForUser) {
      this.moduleService.desactiver(module.id).subscribe({
        next: () => {
          module.activeForUser = false;
          delete this.templatesMap[module.id];
          this.snack.open(`Module "${this.getConfig(module.nom).label}" désactivé`, 'OK', {duration: 2000});
        },
        error: () => this.snack.open('Erreur lors de la désactivation', 'OK', {duration: 3000})
      });
    } else {
      this.moduleService.activer(module.id).subscribe({
        next: () => {
          module.activeForUser = true;
          this.loadTemplates(module.id);
          this.snack.open(`Module "${this.getConfig(module.nom).label}" activé ! 🎉`, 'OK', {duration: 2500});
        },
        error: () => this.snack.open('Erreur lors de l\'activation', 'OK', {duration: 3000})
      });
    }
  }

  loadTemplates(moduleId: number): void {
    this.loadingTemplates[moduleId] = true;
    // /module/{id}/all → templates globaux du module + templates personnels de l'user
    this.templateService.getByModuleWithPersonnels(moduleId).subscribe({
      next: templates => {
        this.templatesMap[moduleId] = templates;
        this.loadingTemplates[moduleId] = false;
      },
      error: () => {
        this.loadingTemplates[moduleId] = false;
      }
    });
  }

  getTemplates(moduleId: number): SoinTemplate[] {
    return this.templatesMap[moduleId] ?? [];
  }
}


