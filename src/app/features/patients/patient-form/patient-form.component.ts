import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {PatientService} from '../../../core/services/api.services';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {HttpClientModule} from '@angular/common/http';

import {GeocodingService} from '../../../core/services/geocoding.service';
import {debounceTime, distinctUntilChanged, switchMap} from 'rxjs/operators';
import {AddressSuggestion} from "../../../core/models/models";

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDividerModule, MatSnackBarModule, MatAutocompleteModule,
    HttpClientModule
  ],
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.scss'
})
export class PatientFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  saving = false;
  patientId?: number;
  addressSuggestions: AddressSuggestion[] = [];

  constructor(
      private fb: FormBuilder,
      private patientService: PatientService,
      private router: Router,
      private route: ActivatedRoute,
      private snack: MatSnackBar,
      private geocodingService: GeocodingService,
  ) {
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      dateNaissance: [null],
      // adresse: [''],
      addressInput: [''],   // champ pour autocomplete

      address: this.fb.group({
        houseNumber: [''],
        road: [''],
        town: [''],
        county: [''],
        region: [''],
        postcode: [''],
        country: [''],
        countryCode: [''],
      }),
      latitude: [null], longitude: [null],
      telephone: [''],
      email: ['', Validators.email],
      informationsMedicales: [''],
      medecinReferent: [''],
      nomMutuelle: [''],
      numeroMutuelle: [''],
      notes: ['']
    });

    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.patientId && !Number.isNaN(this.patientId)) {
      this.isEdit = true;
      this.patientService.getById(this.patientId).subscribe(p => this.form.patchValue(p));
    }

    this.form.get('addressInput')?.valueChanges
        .pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(value => {
              if (!value || value.length < 3) return [];
              return this.geocodingService.searchAddress(value);
            })
        )
        .subscribe(results => {
          this.addressSuggestions = results;
        });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const {addressInput, ...payload} = this.form.value; // remove input field

    console.log('Payload avant envoi:', payload);

    const action = this.isEdit
        ? this.patientService.update(this.patientId!, payload)
        : this.patientService.create(payload);

    action.subscribe({
      next: (p) => {
        this.snack.open(this.isEdit ? 'Patient mis à jour' : 'Patient créé', 'OK', {duration: 2000});
        this.router.navigate(['/patients', p.id]);
      },
      error: () => {
        this.saving = false;
        this.snack.open('Erreur lors de la sauvegarde', 'OK', {duration: 3000});
      }
    });
  }

  selectAddress(address: AddressSuggestion) {

    this.form.patchValue({
      // adresse: address.display_name,// champ pour autocomplete

      addressInput:
          `${address.address.road} ${address.address.house_number}, ${address.address.postcode} ${address.address.town}`,

      address: {
        houseNumber: address.address.house_number,
        road: address.address.road,
        town: address.address.town,
        county: address.address.county,
        region: address.address.region,
        postcode: address.address.postcode,
        country: address.address.country,
        countryCode: address.address.country_code
      },
      latitude: address.lat,
      longitude: address.lon
    });

  }

}
