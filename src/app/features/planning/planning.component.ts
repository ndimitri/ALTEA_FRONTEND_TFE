import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule} from '@angular/forms';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDialogModule} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatChipsModule} from '@angular/material/chips';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDividerModule} from '@angular/material/divider';
import {FullCalendarModule} from '@fullcalendar/angular';
import {
  CalendarOptions,
  EventClickArg,
  DateSelectArg,
  EventChangeArg,
  EventInput
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import frLocale from '@fullcalendar/core/locales/fr';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {
  RendezVousService,
  SoinService,
  SoinTemplateService,
  PatientService,
  ModuleService
} from '../../core/services/api.services';
import {GeocodingService} from '../../core/services/geocoding.service';
import {
  AddressSuggestion,
  CalendarEvent,
  Patient,
  Soin,
  SoinTemplate
} from '../../core/models/models';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from '@angular/material/expansion';

// id présent = soin existant à lier, id absent = nouveau soin à créer
interface PendingSoin {
  id?: number;
  type: string;
  description: string;
  notes: string;
}

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, FullCalendarModule,
    MatCardModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatChipsModule, MatAutocompleteModule,
    MatTooltipModule, MatDividerModule,
    MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle
  ],
  templateUrl: './planning.component.html',
  styleUrl: './planning.component.scss'
})
export class PlanningComponent implements OnInit {

  calendarOptions: CalendarOptions = {};
  selectedEvent: CalendarEvent | null = null;
  showCreateDialog = false;
  patients: Patient[] = [];
  rdvForm!: FormGroup;
  colors = ['#1F5C8B', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];
  preselectedDates: { start: string; end: string } | null = null;

  lieuSuggestions: AddressSuggestion[] = [];

  // Panneau détail RDV
  rdvSoins: Soin[] = [];
  patientSoins: Soin[] = [];
  showAddSoinToRdv = false;
  addSoinMode: 'existing' | 'new' = 'new';
  selectedExistingSoinId: number | null = null;
  rdvSoinForm: any;
  editingRdv = false;          // true = panneau en mode édition
  editRdvForm!: FormGroup;
  lieuSuggestionsEdit: AddressSuggestion[] = [];

  // Dialog création RDV
  pendingSoins: PendingSoin[] = [];
  showPendingSoinForm = false;
  pendingSoinMode: 'existing' | 'new' = 'new';
  patientSoinsForDialog: Soin[] = [];
  selectedDialogSoin: Soin | null = null;
  pendingSoinForm: any;

  templates: SoinTemplate[] = [];

  constructor(
      private rdvService: RendezVousService,
      private patientService: PatientService,
      private templateService: SoinTemplateService,
      private moduleService: ModuleService,
      private soinService: SoinService,
      private geocodingService: GeocodingService,
      private fb: FormBuilder,
      private snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
    this.initForm();
    this.loadPatients();
    this.initCalendar();
    this.loadTemplates();

    this.rdvSoinForm = this.fb.group({
      type: ['', Validators.required],
      description: [''],
      notes: ['']
    });

    this.editRdvForm = this.fb.group({
      patientId: [null, Validators.required],
      dateHeureDebut: ['', Validators.required],
      dateHeureFin: ['', Validators.required],
      lieuInput: [''],
      lieu: this.fb.group({
        houseNumber: [''], road: [''], town: [''], county: [''],
        region: [''], postcode: [''], country: [''], countryCode: [''],
      }),
      commentaire: [''],
      couleur: ['#1F5C8B'],
      statut: ['PLANIFIE']
    });

    this.editRdvForm.get('lieuInput')?.valueChanges.pipe(
        debounceTime(400), distinctUntilChanged(),
        switchMap(v => (!v || v.length < 3) ? [] : this.geocodingService.searchAddress(v))
    ).subscribe(r => this.lieuSuggestionsEdit = r);

    this.pendingSoinForm = this.fb.group({
      templateId: [null],
      type: ['', Validators.required],
      description: [''],
      notes: ['']
    });

    this.rdvForm.get('lieuInput')?.valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(v => {
          if (!v || v.length < 3) return [];
          return this.geocodingService.searchAddress(v);
        })
    ).subscribe(results => this.lieuSuggestions = results);
  }

  initForm(): void {
    this.rdvForm = this.fb.group({
      patientId: [null, Validators.required],
      dateHeureDebut: ['', Validators.required],
      dateHeureFin: ['', Validators.required],
      lieuInput: [''],
      lieu: this.fb.group({
        houseNumber: [''], road: [''], town: [''], county: [''],
        region: [''], postcode: [''], country: [''], countryCode: [''],
      }),
      commentaire: [''],
      couleur: ['#1F5C8B']
    });
  }

  selectLieu(suggestion: AddressSuggestion): void {
    const a = suggestion.address;
    this.rdvForm.patchValue({
      lieuInput: `${a.road ?? ''} ${a.house_number ?? ''}, ${a.postcode ?? ''} ${a.town ?? a.county ?? ''}`.trim(),
      lieu: {
        houseNumber: a.house_number, road: a.road, town: a.town, county: a.county,
        region: a.region, postcode: a.postcode, country: a.country, countryCode: a.country_code,
      }
    });
    this.lieuSuggestions = [];
  }

  initCalendar(): void {
    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
      locale: frLocale,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      },
      initialView: 'timeGridWeek',
      selectable: true, selectMirror: true, editable: true,
      dayMaxEvents: true, allDaySlot: false,
      slotMinTime: '07:00:00', slotMaxTime: '21:00:00', height: 'auto',

      events: (info, successCb, failureCb) => {
        this.rdvService.getForCalendar(info.startStr, info.endStr).subscribe({
          next: (events: CalendarEvent[]) => successCb(events.map(e => ({...e, id: String(e.id)}))),
          error: failureCb
        });
      },

      select: (arg: DateSelectArg) => {
        this.preselectedDates = {start: arg.startStr.slice(0, 16), end: arg.endStr.slice(0, 16)};
        this.openCreateDialog();
      },

      eventClick: (arg: EventClickArg) => {
        this.selectedEvent = {
          id: Number(arg.event.id), title: arg.event.title,
          start: arg.event.startStr, end: arg.event.endStr,
          color: arg.event.backgroundColor, allDay: arg.event.allDay,
          extendedProps: arg.event.extendedProps as any
        };
        this.showAddSoinToRdv = false;
        this.selectedExistingSoinId = null;
        this.addSoinMode = 'new';
        this.editingRdv = false;
        this.soinService.getByRdv(this.selectedEvent.id).subscribe(s => this.rdvSoins = s);
        const patientId = this.selectedEvent.extendedProps['patientId'];
        if (patientId) {
          this.soinService.getByPatient(patientId).subscribe(s => this.patientSoins = s);
        }
      },

      eventChange: (arg: EventChangeArg) => {
        this.rdvService.update(Number(arg.event.id), {
          patientId: arg.event.extendedProps['patientId'],
          dateHeureDebut: arg.event.startStr,
          dateHeureFin: arg.event.endStr ?? arg.event.startStr,
          lieu: null,
          commentaire: arg.event.extendedProps['commentaire'] || null,
          couleur: arg.event.backgroundColor
        } as any).subscribe({
          error: () => {
            arg.revert();
            this.snackBar.open('Conflit d\'horaire détecté', 'OK', {duration: 3000});
          }
        });
      }
    };
  }

  loadPatients(): void {
    this.patientService.getAll().subscribe(p => this.patients = p);
  }

  /** Charge les templates de tous les modules actifs (globaux + personnels) + templates sans module */
  loadTemplates(): void {
    this.moduleService.getModules().subscribe(modules => {
      const actifs = modules.filter(m => m.activeForUser);
      if (actifs.length === 0) {
        // Pas de module actif → charger uniquement les templates personnels sans module
        this.templateService.getAll().subscribe(t => this.templates = t);
        return;
      }
      // Pour chaque module actif, charger globaux + personnels, puis dédupliquer
      const requests = actifs.map(m => this.templateService.getByModuleWithPersonnels(m.id));
      import('rxjs').then(({forkJoin}) => {
        forkJoin(requests).subscribe(results => {
          const all = results.flat();
          // Déduplication par id
          const seen = new Set<number>();
          this.templates = all.filter(t => {
            if (t.id == null) return true;
            if (seen.has(t.id)) return false;
            seen.add(t.id);
            return true;
          });
        });
      });
    });
  }

  // ── Dialog création ───────────────────────────────────

  openCreateDialog(): void {
    if (this.preselectedDates) {
      this.rdvForm.patchValue({
        dateHeureDebut: this.preselectedDates.start,
        dateHeureFin: this.preselectedDates.end
      });
      this.preselectedDates = null;
    }
    this.showCreateDialog = true;
  }

  closeDialog(): void {
    this.showCreateDialog = false;
    this.showPendingSoinForm = false;
    this.pendingSoinMode = 'new';
    this.pendingSoins = [];
    this.patientSoinsForDialog = [];
    this.selectedDialogSoin = null;
    this.lieuSuggestions = [];
    this.rdvForm.reset({couleur: '#1F5C8B'});
    this.pendingSoinForm.reset();
  }

  submitRdv(): void {
    if (this.rdvForm.invalid) return;
    const val = this.rdvForm.value;
    const lieuObj = val.lieu;
    const lieuVide = !lieuObj || Object.values(lieuObj).every(v => !v);

    const payload: any = {
      patientId: val.patientId,
      dateHeureDebut: val.dateHeureDebut + ':00',
      dateHeureFin: val.dateHeureFin + ':00',
      lieu: lieuVide ? null : lieuObj,
      commentaire: val.commentaire || null,
      couleur: val.couleur,
    };

    this.rdvService.create(payload).subscribe({
      next: (rdv) => {
        if (this.pendingSoins.length === 0) {
          this.closeDialog();
          this.snackBar.open('Rendez-vous créé', 'OK', {duration: 2000});
          this.initCalendar();
          return;
        }
        // id présent → backend lie sans recréer / id absent → backend crée
        const requests = this.pendingSoins.map(s =>
            this.rdvService.addSoin(rdv.id!, {
              id: s.id,
              type: s.type,
              description: s.description,
              notes: s.notes,
              patientId: val.patientId
            })
        );
        let chain = Promise.resolve<any>(null);
        requests.forEach(req => {
          chain = chain.then(() => req.toPromise());
        });
        chain.finally(() => {
          this.closeDialog();
          this.snackBar.open(`Rendez-vous créé avec ${this.pendingSoins.length} soin(s)`, 'OK', {duration: 2500});
          this.initCalendar();
        });
      },
      error: err => {
        const msg = err.status === 409 ? 'Conflit d\'horaire !' : 'Erreur lors de la création';
        this.snackBar.open(msg, 'OK', {duration: 3000});
      }
    });
  }

  deleteRdv(id: number): void {
    this.rdvService.delete(id).subscribe(() => {
      this.selectedEvent = null;
      this.snackBar.open('Rendez-vous supprimé', 'OK', {duration: 2000});
      this.initCalendar();
    });
  }

  // ── Édition RDV ──────────────────────────────────────

  openEditRdv(): void {
    if (!this.selectedEvent) return;
    this.editingRdv = true;
    this.lieuSuggestionsEdit = [];

    // Pré-remplir les champs depuis l'event sélectionné
    const ep = this.selectedEvent.extendedProps;
    const start = this.selectedEvent.start?.slice(0, 16) ?? '';
    const end = this.selectedEvent.end?.slice(0, 16) ?? '';

    // Reconstruire une string lisible du lieu
    let lieuStr = '';
    if (ep['lieu'] && typeof ep['lieu'] === 'object') {
      const l = ep['lieu'] as any;
      lieuStr = `${l.road ?? ''} ${l.houseNumber ?? ''}, ${l.postcode ?? ''} ${l.town ?? l.county ?? ''}`.trim();
    }

    this.editRdvForm.patchValue({
      patientId: ep['patientId'],
      dateHeureDebut: start,
      dateHeureFin: end,
      lieuInput: lieuStr,
      lieu: ep['lieu'] ?? {},
      commentaire: ep['commentaire'] ?? '',
      couleur: this.selectedEvent.color,
      statut: ep['statut'] ?? 'PLANIFIE'
    });
  }

  selectLieuEdit(suggestion: AddressSuggestion): void {
    const a = suggestion.address;
    this.editRdvForm.patchValue({
      lieuInput: `${a.road ?? ''} ${a.house_number ?? ''}, ${a.postcode ?? ''} ${a.town ?? a.county ?? ''}`.trim(),
      lieu: {
        houseNumber: a.house_number, road: a.road, town: a.town, county: a.county,
        region: a.region, postcode: a.postcode, country: a.country, countryCode: a.country_code,
      }
    });
    this.lieuSuggestionsEdit = [];
  }

  submitEditRdv(): void {
    if (!this.editRdvForm.valid || !this.selectedEvent) return;
    const val = this.editRdvForm.value;
    const lieuObj = val.lieu;
    const lieuVide = !lieuObj || Object.values(lieuObj).every(v => !v);

    const payload: any = {
      patientId: val.patientId,
      dateHeureDebut: val.dateHeureDebut + ':00',
      dateHeureFin: val.dateHeureFin + ':00',
      lieu: lieuVide ? null : lieuObj,
      commentaire: val.commentaire || null,
      couleur: val.couleur,
      statut: val.statut
    };

    this.rdvService.update(this.selectedEvent.id, payload).subscribe({
      next: () => {
        this.editingRdv = false;
        this.selectedEvent = null;
        this.snackBar.open('Rendez-vous modifié', 'OK', {duration: 2000});
        this.initCalendar();
      },
      error: err => {
        const msg = err.status === 409 ? 'Conflit d\'horaire !' : 'Erreur lors de la modification';
        this.snackBar.open(msg, 'OK', {duration: 3000});
      }
    });
  }

  // ── Soins dans le dialog de création ─────────────────

  loadPatientSoinsForDialog(): void {
    const patientId = this.rdvForm.get('patientId')?.value;
    if (!patientId) return;
    this.soinService.getByPatient(patientId).subscribe(s => this.patientSoinsForDialog = s);
  }

  /** Soin existant → garde l'id pour que le backend lie sans recréer */
  addExistingSoinToPending(): void {
    if (!this.selectedDialogSoin) return;
    const s = this.selectedDialogSoin;
    this.pendingSoins.push({
      id: s.id,
      type: s.type,
      description: s.description ?? '',
      notes: s.notes ?? ''
    });
    this.selectedDialogSoin = null;
    this.showPendingSoinForm = false;
  }

  /** Nouveau soin saisi → pas d'id → le backend crée */
  addPendingSoin(): void {
    if (this.pendingSoinForm.invalid) return;
    const {templateId, ...soin} = this.pendingSoinForm.value;
    this.pendingSoins.push(soin);
    this.pendingSoinForm.reset();
    this.showPendingSoinForm = false;
  }

  removePendingSoin(index: number): void {
    this.pendingSoins.splice(index, 1);
  }

  applyPendingTemplate(template: SoinTemplate): void {
    if (!template) return;
    this.pendingSoinForm.patchValue({
      type: template.type,
      description: template.description,
      notes: template.notes
    });
  }

  // ── Soins dans le panneau détail RDV ─────────────────

  openAddSoinPanel(): void {
    this.showAddSoinToRdv = true;
    this.addSoinMode = 'new';
    this.selectedExistingSoinId = null;
  }

  /** Nouveau soin → pas d'id → le backend crée */
  addSoinToRdv(): void {
    if (!this.rdvSoinForm.valid || !this.selectedEvent) return;
    this.rdvService.addSoin(this.selectedEvent.id, {
      ...this.rdvSoinForm.value,
      patientId: this.selectedEvent.extendedProps['patientId']
    }).subscribe({
      next: () => {
        this.showAddSoinToRdv = false;
        this.rdvSoinForm.reset();
        this.soinService.getByRdv(this.selectedEvent!.id).subscribe(s => this.rdvSoins = s);
        this.snackBar.open('Soin ajouté', 'OK', {duration: 2000});
      },
      error: () => this.snackBar.open('Erreur lors de l\'ajout', 'OK', {duration: 3000})
    });
  }

  applyRdvTemplate(template: SoinTemplate): void {
    if (!template) return;
    this.rdvSoinForm.patchValue({
      type: template.type,
      description: template.description,
      notes: template.notes
    });
  }

  /** Soin existant → envoie l'id → le backend lie sans recréer */
  attachExistingSoin(): void {
    if (!this.selectedEvent || !this.selectedExistingSoinId) return;
    const soin = this.patientSoins.find(s => s.id === this.selectedExistingSoinId);
    if (!soin) return;
    this.rdvService.addSoin(this.selectedEvent.id, {
      id: soin.id,        // <-- backend voit l'id → lie sans recréer
      type: soin.type,
      description: soin.description,
      notes: soin.notes,
      patientId: soin.patientId,
      dateSoin: soin.dateSoin
    }).subscribe({
      next: () => {
        this.showAddSoinToRdv = false;
        this.selectedExistingSoinId = null;
        this.soinService.getByRdv(this.selectedEvent!.id).subscribe(s => this.rdvSoins = s);
        this.snackBar.open('Soin attaché au rendez-vous', 'OK', {duration: 2000});
      },
      error: () => this.snackBar.open('Erreur lors de l\'attachement', 'OK', {duration: 3000})
    });
  }

  removeSoinFromRdv(soinId: number): void {
    if (!this.selectedEvent) return;
    this.rdvService.removeSoin(this.selectedEvent.id, soinId).subscribe({
      next: () => {
        this.soinService.getByRdv(this.selectedEvent!.id).subscribe(s => this.rdvSoins = s);
        this.snackBar.open('Soin retiré', 'OK', {duration: 2000});
      },
      error: () => this.snackBar.open('Erreur lors de la suppression', 'OK', {duration: 3000})
    });
  }
}
