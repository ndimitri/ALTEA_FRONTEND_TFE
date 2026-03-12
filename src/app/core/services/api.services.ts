import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {Patient, RendezVous, CalendarEvent, Soin, Module, SoinTemplate} from '../models/models';

@Injectable({providedIn: 'root'})
export class PatientService {
  private url = `${environment.apiUrl}/patients`;

  constructor(private http: HttpClient) {
  }

  getAll(q?: string): Observable<Patient[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<Patient[]>(this.url, {params});
  }

  getById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.url}/${id}`);
  }

  getForMap(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.url}/map`);
  }

  create(p: Patient): Observable<Patient> {
    return this.http.post<Patient>(this.url, p);
  }

  update(id: number, p: Patient): Observable<Patient> {
    return this.http.put<Patient>(`${this.url}/${id}`, p);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}


@Injectable({providedIn: 'root'})
export class RendezVousService {
  private url = `${environment.apiUrl}/rendezvous`;

  constructor(private http: HttpClient) {
  }

  getAll(): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(this.url);
  }

  getForCalendar(start?: string, end?: string): Observable<CalendarEvent[]> {
    let params = new HttpParams();
    if (start) params = params.set('start', start);
    if (end) params = params.set('end', end);
    return this.http.get<CalendarEvent[]>(`${this.url}/calendar`, {params});
  }

  getById(id: number): Observable<RendezVous> {
    return this.http.get<RendezVous>(`${this.url}/${id}`);
  }

  getByPatient(patientId: number): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.url}/patient/${patientId}`);
  }

  create(rdv: RendezVous): Observable<RendezVous> {
    return this.http.post<RendezVous>(this.url, rdv);
  }

  update(id: number, rdv: RendezVous): Observable<RendezVous> {
    return this.http.put<RendezVous>(`${this.url}/${id}`, rdv);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  addSoin(rdvId: number, soin: Partial<Soin>): Observable<Soin> {
    return this.http.post<Soin>(`${this.url}/${rdvId}/soins`, soin);
  }

  removeSoin(rdvId: number, soinId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${rdvId}/soins/${soinId}`);
  }
}


@Injectable({providedIn: 'root'})
export class SoinTemplateService {
  private url = `${environment.apiUrl}/soin-templates`;

  constructor(private http: HttpClient) {
  }

  getAll(moduleId?: number): Observable<SoinTemplate[]> {
    let params = new HttpParams();
    if (moduleId != null) params = params.set('moduleId', moduleId);
    return this.http.get<SoinTemplate[]>(this.url, {params});
  }

  /** Templates globaux du module (partagés — créés par l'admin) */
  getByModule(moduleId: number): Observable<SoinTemplate[]> {
    return this.http.get<SoinTemplate[]>(`${this.url}/module/${moduleId}`);
  }

  /** Templates globaux du module + templates personnels de l'user pour ce module ⭐ */
  getByModuleWithPersonnels(moduleId: number): Observable<SoinTemplate[]> {
    return this.http.get<SoinTemplate[]>(`${this.url}/module/${moduleId}/all`);
  }

  create(t: SoinTemplate): Observable<SoinTemplate> {
    return this.http.post<SoinTemplate>(this.url, t);
  }

  update(id: number, t: SoinTemplate): Observable<SoinTemplate> {
    return this.http.put<SoinTemplate>(`${this.url}/${id}`, t);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}


@Injectable({providedIn: 'root'})
export class SoinService {
  private url = `${environment.apiUrl}/soins`;

  constructor(private http: HttpClient) {
  }

  getByPatient(patientId: number): Observable<Soin[]> {
    return this.http.get<Soin[]>(`${this.url}/patient/${patientId}`);
  }

  getByRdv(rdvId: number): Observable<Soin[]> {
    return this.http.get<Soin[]>(`${this.url}/rdv/${rdvId}`);
  }

  create(soin: Soin): Observable<Soin> {
    return this.http.post<Soin>(this.url, soin);
  }

  update(id: number, soin: Partial<Soin>): Observable<Soin> {
    return this.http.put<Soin>(`${this.url}/${id}`, soin);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}


@Injectable({providedIn: 'root'})
export class ModuleService {
  private url = `${environment.apiUrl}/modules`;

  constructor(private http: HttpClient) {
  }

  getModules(): Observable<Module[]> {
    return this.http.get<Module[]>(this.url);
  }

  activer(id: number): Observable<void> {
    return this.http.post<void>(`${this.url}/${id}/activer`, {});
  }

  desactiver(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}/desactiver`);
  }
}


// OpenRouteService — calcul de trajets (gratuit)
@Injectable({providedIn: 'root'})
export class RouteService {
  private orsUrl = 'https://api.openrouteservice.org/v2/directions/driving-car';

  constructor(private http: HttpClient) {
  }

  /**
   * Calcule l'itinéraire entre deux points ou une liste de waypoints
   * @param waypoints [[lng, lat], [lng, lat], ...]
   */
  getRoute(waypoints: [number, number][]): Observable<any> {

    console.log("WAYPOINTS:", waypoints);

    // Endpoint GeoJSON → réponse avec features[0].geometry.coordinates
    return this.http.post(`${this.orsUrl}/geojson`, {
      coordinates: waypoints
    }, {
      headers: {
        'Authorization': environment.orsApiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Parse la réponse ORS pour extraire distance, durée et géométrie
   */
  // parseRouteResponse(response: any): {
  //   distance: number;
  //   duration: number;
  //   geometry: [number, number][]
  // } {
  //
  //   const feature = response.features[0];
  //   const props = feature.properties.segments[0];
  //   const coordinates = feature.geometry.coordinates as [number, number][];
  //   return {
  //     distance: Math.round(props.distance / 100) / 10, // km
  //     duration: Math.round(props.duration / 60), // minutes
  //     geometry: coordinates
  //   };
  // }

  parseRouteResponse(response: any): {
    distance: number;
    duration: number;
    geometry: [number, number][]
  } {
    // Réponse GeoJSON ORS : { type: "FeatureCollection", features: [...] }
    if (!response?.features || response.features.length === 0) {
      console.error("Réponse ORS invalide :", response);
      throw new Error("Impossible de calculer l'itinéraire");
    }

    const feature = response.features[0];
    const props = feature.properties.segments[0];
    const coordinates = feature.geometry.coordinates as [number, number][];

    return {
      distance: Math.round(props.distance / 100) / 10, // km
      duration: Math.round(props.duration / 60),        // minutes
      geometry: coordinates
    };
  }
}
