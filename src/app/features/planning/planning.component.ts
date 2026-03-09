import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DateSelectArg, EventChangeArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import frLocale from '@fullcalendar/core/locales/fr';
import { RendezVousService } from '../../core/services/api.services';
import { PatientService } from '../../core/services/api.services';
import { CalendarEvent, Patient } from '../../core/models/models';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FullCalendarModule,
    MatCardModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatChipsModule
  ],
  templateUrl: './planning.component.html',
  styles: [`
    .planning-container { padding: 24px; position: relative; }
    .planning-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .planning-header h2 { margin: 0; font-size: 24px; color: #0D3B66; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 14px; }
    .calendar-card { padding: 16px; }
    ::ng-deep .fc-toolbar-title { font-size: 1.2em !important; }
    ::ng-deep .fc-button { background: #1F5C8B !important; border-color: #1F5C8B !important; }
    ::ng-deep .fc-button:hover { background: #0D3B66 !important; }
    ::ng-deep .fc-today-button { background: #64B5F6 !important; border-color: #64B5F6 !important; }
    ::ng-deep .fc-event { cursor: pointer; border-radius: 4px; }
    .rdv-panel { position: fixed; right: 24px; top: 100px; width: 300px; z-index: 100; }
    .rdv-panel mat-icon { font-size: 16px; vertical-align: middle; margin-right: 4px; }
    .create-dialog-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .create-dialog { width: 480px; max-width: 95vw; max-height: 90vh; overflow-y: auto; }
    .full-width { width: 100%; margin-bottom: 12px; }
    .color-picker { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .colors { display: flex; gap: 8px; }
    .color-dot {
      width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
      transition: transform 0.15s; border: 2px solid transparent;
    }
    .color-dot:hover { transform: scale(1.2); }
    .color-dot.selected { border-color: #333; transform: scale(1.2); }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; }
  `]
})
export class PlanningComponent implements OnInit {
  calendarOptions: CalendarOptions = {};
  selectedEvent: CalendarEvent | null = null;
  showCreateDialog = false;
  patients: Patient[] = [];
  rdvForm!: FormGroup;
  colors = ['#1F5C8B', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4'];
  preselectedDates: { start: string; end: string } | null = null;

  constructor(
    private rdvService: RendezVousService,
    private patientService: PatientService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadPatients();
    this.initCalendar();
  }

  initForm(): void {
    this.rdvForm = this.fb.group({
      patientId: [null, Validators.required],
      dateHeureDebut: ['', Validators.required],
      dateHeureFin: ['', Validators.required],
      lieu: [''],
      commentaire: [''],
      couleur: ['#1F5C8B']
    });
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
      selectable: true,
      selectMirror: true,
      editable: true,
      dayMaxEvents: true,
      allDaySlot: false,
      slotMinTime: '07:00:00',
      slotMaxTime: '21:00:00',
      height: 'auto',
      events: (info, successCb, failureCb) => {
        this.rdvService.getForCalendar(
          info.startStr, info.endStr
        ).subscribe({
          next: (events: CalendarEvent[]) => {
            const inputs: EventInput[] = events.map(e => ({
              ...e,
              id: String(e.id)
            }));
            successCb(inputs);
          },
          error: failureCb
        });
      },
      select: (arg: DateSelectArg) => {
        this.preselectedDates = { start: arg.startStr.slice(0, 16), end: arg.endStr.slice(0, 16) };
        this.openCreateDialog();
      },
      eventClick: (arg: EventClickArg) => {
        this.selectedEvent = {
          id: Number(arg.event.id),
          title: arg.event.title,
          start: arg.event.startStr,
          end: arg.event.endStr,
          color: arg.event.backgroundColor,
          allDay: arg.event.allDay,
          extendedProps: arg.event.extendedProps as any
        };
      },
      eventChange: (arg: EventChangeArg) => {
        const id = Number(arg.event.id);
        this.rdvService.update(id, {
          patientId: arg.event.extendedProps['patientId'],
          dateHeureDebut: arg.event.startStr,
          dateHeureFin: arg.event.endStr!,
          lieu: arg.event.extendedProps['lieu'],
          commentaire: arg.event.extendedProps['commentaire'],
          couleur: arg.event.backgroundColor
        } as any).subscribe({
          error: () => {
            arg.revert();
            this.snackBar.open('Conflit d\'horaire détecté', 'OK', { duration: 3000 });
          }
        });
      }
    };
  }

  loadPatients(): void {
    this.patientService.getAll().subscribe(p => this.patients = p);
  }

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
    this.rdvForm.reset({ couleur: '#1F5C8B' });
  }

  submitRdv(): void {
    if (this.rdvForm.invalid) return;
    const val = this.rdvForm.value;
    this.rdvService.create({
      ...val,
      dateHeureDebut: val.dateHeureDebut + ':00',
      dateHeureFin: val.dateHeureFin + ':00'
    }).subscribe({
      next: () => {
        this.closeDialog();
        this.snackBar.open('Rendez-vous créé', 'OK', { duration: 2000 });
        // Refresh calendar
        this.initCalendar();
      },
      error: err => {
        const msg = err.status === 409 ? 'Conflit d\'horaire !' : 'Erreur lors de la création';
        this.snackBar.open(msg, 'OK', { duration: 3000 });
      }
    });
  }

  deleteRdv(id: number): void {
    this.rdvService.delete(id).subscribe(() => {
      this.selectedEvent = null;
      this.snackBar.open('Rendez-vous supprimé', 'OK', { duration: 2000 });
      this.initCalendar();
    });
  }
}
