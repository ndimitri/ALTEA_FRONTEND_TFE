// src/app/core/models/models.ts

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
  modulesActifs: string[];
  telephone?: string;
  actif?: boolean;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  modulesActifs: string[];
  telephone?: string;
  actif?: boolean;
}

export interface UserProfileUpdatePayload {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
}

export interface Patient {
  id?: number;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  address?: Address;
  latitude?: number;
  longitude?: number;
  telephone?: string;
  email?: string;
  informationsMedicales?: string;
  notes?: string;
  numeroMutuelle?: string;
  nomMutuelle?: string;
  medecinReferent?: string;
  createdAt?: string;
}


export interface Address {
  houseNumber?: string;
  road?: string;
  town?: string;
  county?: string;
  region?: string;
  postcode?: string;
  country?: string;
  countryCode?: string;
}

export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    town?: string;
    county?: string;
    region?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export interface RendezVous {
  id?: number;
  dateHeureDebut: string;
  dateHeureFin: string;
  lieu?: string;
  commentaire?: string;
  statut?: 'PLANIFIE' | 'REALISE' | 'ANNULE';
  couleur?: string;
  patientId: number;
  patientNom?: string;
  patientPrenom?: string;
  patientAdresse?: string;
  soins?: Soin[];
  createdAt?: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  color: string;
  allDay: boolean;
  extendedProps: {
    patientId: number;
    patientNom: string;
    lieu: string;
    statut: string;
    commentaire: string;
  };
}

export interface SoinTemplate {
  id?: number;
  nom: string;
  type: string;
  description?: string;
  notes?: string;
  moduleSpecifique?: string;
  moduleId?: number;
  moduleNom?: string;
  global?: boolean;   // true = template partagé créé par l'admin, false/absent = template personnel
}

export interface Soin {
  id?: number;
  type: string;
  description?: string;
  dateSoin: string;
  notes?: string;
  moduleSpecifique?: string;
  patientId: number;
  patientNom?: string;
  moduleId?: number;
  moduleNom?: string;
  rendezVousId?: number;
  createdAt?: string;
}

export interface Module {
  id: number;
  nom: string;
  description: string;
  actif: boolean;
  activeForUser: boolean;
}

export interface RouteResult {
  distance: number; // km
  duration: number; // minutes
  geometry: [number, number][]; // [lng, lat]
}
