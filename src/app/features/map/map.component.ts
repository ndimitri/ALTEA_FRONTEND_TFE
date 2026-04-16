import {Component, OnInit, OnDestroy, AfterViewInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatChipsModule} from '@angular/material/chips';
import {PatientService, RouteService} from '../../core/services/api.services';
import {Patient} from '../../core/models/models';
import * as L from 'leaflet';
import {FormsModule} from "@angular/forms";

// Fix Leaflet default marker icons
const iconDefault = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = iconDefault;

const homeIcon = L.divIcon({
  className: '',
  html: '<div style="background:#0D3B66;width:32px;height:32px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><span style="color:white;font-size:16px">🏠</span></div>',
  iconSize: [32, 32], iconAnchor: [16, 16]
});

const patientIcon = (index: number) => L.divIcon({
  className: '',
  html: `<div style="background:#1F5C8B;color:white;width:30px;height:30px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${index}</div>`,
  iconSize: [30, 30], iconAnchor: [15, 15]
});

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatListModule, MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule, FormsModule
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  map!: L.Map;
  patients: Patient[] = [];
  selectedPatients: Patient[] = [];
  markers: L.Marker[] = [];
  routeLayer?: L.Polyline;
  routeInfo: { distance: number; duration: number } | null = null;
  loadingPatients = true;
  loadingRoute = false;

  constructor(
      private patientService: PatientService,
      private routeService: RouteService,
      private snackBar: MatSnackBar
  ) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.loadPatients();
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  initMap(): void {
    this.map = L.map('altea-map', {zoomControl: true}).setView([50.85, 4.35], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);
  }

  loadPatients(): void {
    this.patientService.getForMap().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.loadingPatients = false;
        this.addPatientMarkers();
      },
      error: () => {
        this.loadingPatients = false;
      }
    });
  }

  addPatientMarkers(): void {
    // Clear existing markers
    this.markers.forEach(m => m.remove());
    this.markers = [];

    const bounds: L.LatLng[] = [];

    this.patients.forEach((p, i) => {
      if (p.latitude && p.longitude) {
        const marker = L.marker([p.latitude, p.longitude], {icon: patientIcon(i + 1)})
            .addTo(this.map)
            .bindPopup(`
            <div style="min-width:160px">
              <strong>${p.prenom} ${p.nom}</strong><br>
              ${p.address ? `<small> ${p.address.road} ${p.address.houseNumber}
                  , ${p.address.postcode}</small><br>` : ''}
              ${p.telephone ? `📞 ${p.telephone}` : ''}
            </div>
          `);

        console.log("adresse : ", p.address)

        marker.on('click', () => {
          if (!this.selectedPatients.includes(p)) {
            this.selectedPatients = [...this.selectedPatients, p];
          }
        });

        this.markers.push(marker);
        bounds.push(L.latLng(p.latitude, p.longitude));
      }
    });

    if (bounds.length > 0) {
      this.map.fitBounds(L.latLngBounds(bounds), {padding: [40, 40]});
    }
  }

  onSelectionChange(): void {
    // Highlight selected markers
    this.markers.forEach((m, i) => {
      const p = this.patients[i];
      const isSelected = this.selectedPatients.includes(p);
      const num = this.selectedPatients.indexOf(p) + 1;
      if (isSelected) {
        m.setIcon(L.divIcon({
          className: '',
          html: `<div style="background:#FF6B35;color:white;width:34px;height:34px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;box-shadow:0 3px 8px rgba(0,0,0,0.4)">${num}</div>`,
          iconSize: [34, 34], iconAnchor: [17, 17]
        }));
      } else {
        m.setIcon(patientIcon(i + 1));
      }
    });
  }

  calculateRoute(): void {
    if (this.selectedPatients.length < 2) return;

    const waypoints: [number, number][] = this.selectedPatients
        .filter(p => p.latitude && p.longitude)
        .map(p => [p.longitude!, p.latitude!]); // ORS: [lng, lat]

    if (waypoints.length < 2) {
      this.snackBar.open('Pas assez de patients géolocalisés', 'OK', {duration: 3000});
      return;
    }

    this.loadingRoute = true;
    this.routeService.getRoute(waypoints).subscribe({
      next: (response) => {
        console.log("ORS response:", response);

        let result;
        try {
          result = this.routeService.parseRouteResponse(response);
        } catch (e) {
          this.loadingRoute = false;
          this.snackBar.open("Impossible de calculer l'itinéraire", "OK", {duration: 4000});
          return;
        }

        if (this.routeLayer) this.routeLayer.remove();

        // ORS GeoJSON geometry: coordonnées en [lng, lat] → Leaflet: [lat, lng]
        const latlngs = result.geometry.map(([lng, lat]: [number, number]) => L.latLng(lat, lng));

        this.routeLayer = L.polyline(latlngs, {
          color: '#2563EB',
          weight: 6,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
          // dashArray: '10, 5'
        }).addTo(this.map);

        this.map.fitBounds(this.routeLayer.getBounds(), {padding: [30, 30]});

        this.routeInfo = {
          distance: result.distance,
          duration: result.duration
        };

        this.loadingRoute = false;
      },
      error: (err) => {
        console.error("Erreur ORS:", err);
        this.loadingRoute = false;
        this.snackBar.open(
            "Erreur calcul d'itinéraire. Vérifiez votre clé API OpenRouteService.",
            'OK', {duration: 5000}
        );
      }
    });
  }

  clearRoute(): void {
    if (this.routeLayer) {
      this.routeLayer.remove();
      this.routeLayer = undefined;
    }
    this.routeInfo = null;
    this.selectedPatients = [];
    this.addPatientMarkers();
  }
}
