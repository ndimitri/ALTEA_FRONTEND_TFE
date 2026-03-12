import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatChipsModule} from '@angular/material/chips';
import {MatDividerModule} from '@angular/material/divider';
import {ModuleService, SoinTemplateService} from '../../../core/services/api.services';
import {Module, SoinTemplate} from '../../../core/models/models';
import {SkeletonComponent} from '../../../shared/components/skeleton/skeleton.component';

interface ModuleConfig {
  nom: string;
  label: string;
  description: string;
  longDescription: string;
  icon: string;
  accentColor: string;
  heroFrom: string;   // couleur CSS de départ du gradient
  heroTo: string;     // couleur CSS d'arrivée du gradient
  features: { icon: string; title: string; desc: string }[];
  comingSoon: { icon: string; title: string }[];
}

export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  INFIRMIERE: {
    nom: 'INFIRMIERE',
    label: 'Infirmier(ère)',
    description: 'Soins infirmiers, pansements, injections, prises de sang, suivi médical.',
    longDescription: 'Gérez l\'ensemble de vos actes infirmiers au quotidien : planification des soins, suivi des prescriptions, gestion des pansements et des prises de sang.',
    icon: 'vaccines',
    accentColor: 'text-blue-500',
    heroFrom: '#1d4ed8', heroTo: '#3b82f6',
    features: [
      {
        icon: 'medical_services',
        title: 'Templates de soins',
        desc: 'Pansements, injections, bilans prêts à l\'emploi'
      },
      {
        icon: 'calendar_month',
        title: 'Planning',
        desc: 'Planifiez et suivez vos visites infirmières'
      },
      {icon: 'people', title: 'Suivi patient', desc: 'Historique complet des actes par patient'},
    ],
    comingSoon: [
      {icon: 'description', title: 'Ordonnances & prescriptions'},
      {icon: 'assignment', title: 'Transmissions infirmières'},
      {icon: 'notifications', title: 'Alertes renouvellement'},
    ]
  },
  PEDICURE: {
    nom: 'PEDICURE',
    label: 'Pédicure-podologue',
    description: 'Soins des pieds, ongles, cors, verrues et orthoplasties.',
    longDescription: 'Organisez vos soins podologiques : suivi des pathologies du pied, gestion des orthoplasties, et templates adaptés à votre pratique.',
    icon: 'footprint',
    accentColor: 'text-green-500',
    heroFrom: '#15803d', heroTo: '#22c55e',
    features: [
      {
        icon: 'medical_services',
        title: 'Templates podologiques',
        desc: 'Cors, ongles, verrues, orthoplasties'
      },
      {icon: 'calendar_month', title: 'Planning', desc: 'Tournées et rendez-vous podologiques'},
      {icon: 'people', title: 'Dossier patient', desc: 'Suivi des pathologies du pied'},
    ],
    comingSoon: [
      {icon: 'photo_camera', title: 'Photos avant/après'},
      {icon: 'description', title: 'Ordonnances podologiques'},
      {icon: 'inventory_2', title: 'Gestion du matériel'},
    ]
  },
  KINE: {
    nom: 'KINE',
    label: 'Kinésithérapeute',
    description: 'Rééducation fonctionnelle, massages, mobilisations et exercices thérapeutiques.',
    longDescription: 'Suivez vos patients en rééducation : bilan de séance, évolution des capacités motrices, et programmes d\'exercices personnalisés.',
    icon: 'fitness_center',
    accentColor: 'text-orange-500',
    heroFrom: '#c2410c', heroTo: '#f97316',
    features: [
      {
        icon: 'medical_services',
        title: 'Actes de rééducation',
        desc: 'Massages, mobilisations, électrothérapie'
      },
      {
        icon: 'calendar_month',
        title: 'Séances & planning',
        desc: 'Suivi des séances prescrites et réalisées'
      },
      {icon: 'people', title: 'Bilan fonctionnel', desc: 'Évolution et objectifs par patient'},
    ],
    comingSoon: [
      {icon: 'fitness_center', title: 'Programmes d\'exercices'},
      {icon: 'show_chart', title: 'Courbe de progression'},
      {icon: 'video_library', title: 'Vidéos d\'exercices'},
    ]
  },
  AIDE_SOIGNANT: {
    nom: 'AIDE_SOIGNANT',
    label: 'Aide-soignant(e)',
    description: 'Aide à la toilette, habillage, repas, accompagnement et soins de confort.',
    longDescription: 'Gérez l\'accompagnement quotidien de vos patients : toilettes, repas, soins de confort et transmissions entre équipes.',
    icon: 'personal_injury',
    accentColor: 'text-purple-500',
    heroFrom: '#7e22ce', heroTo: '#a855f7',
    features: [
      {
        icon: 'medical_services',
        title: 'Soins de confort',
        desc: 'Toilette, habillage, aide repas, prévention escarre'
      },
      {icon: 'calendar_month', title: 'Tournées', desc: 'Organisation des passages et des tâches'},
      {icon: 'people', title: 'Suivi quotidien', desc: 'Transmissions et observations par patient'},
    ],
    comingSoon: [
      {icon: 'assignment', title: 'Transmissions d\'équipe'},
      {icon: 'restaurant', title: 'Suivi alimentaire'},
      {icon: 'accessibility', title: 'Prévention des chutes'},
    ]
  },
};

@Component({
  selector: 'app-module-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule,
    SkeletonComponent
  ],
  templateUrl: './module-detail.component.html',
  styleUrl: './module-detail.component.scss'
})
export class ModuleDetailComponent implements OnInit {
  config: ModuleConfig | null = null;
  module: Module | null = null;
  templates: SoinTemplate[] = [];
  loading = true;
  nomParam = '';

  constructor(
      private route: ActivatedRoute,
      private moduleService: ModuleService,
      private templateService: SoinTemplateService
  ) {
  }

  ngOnInit(): void {
    // paramMap.subscribe (pas snapshot) → se déclenche à chaque changement de :nom
    this.route.paramMap.subscribe(params => {
      this.nomParam = params.get('nom')?.toUpperCase() ?? '';
      this.config = MODULE_CONFIGS[this.nomParam] ?? null;
      this.loading = true;
      this.templates = [];
      this.module = null;

      this.moduleService.getModules().subscribe(modules => {
        this.module = modules.find(m => m.nom === this.nomParam) ?? null;
        this.loading = false;
        if (this.module) {
          this.templateService.getByModuleWithPersonnels(this.module.id)
              .subscribe(t => this.templates = t);
        }
      });
    });
  }

  getGlobalTemplates(): SoinTemplate[] {
    return this.templates.filter(t => t.global);
  }

  getPersonalTemplates(): SoinTemplate[] {
    return this.templates.filter(t => !t.global);
  }

  getHeroStyle(): string {
    if (!this.config) return '';
    return `background: linear-gradient(135deg, ${this.config.heroFrom}, ${this.config.heroTo})`;
  }
}



