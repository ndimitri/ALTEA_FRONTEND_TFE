import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AddressSuggestion} from "../models/models";

// export interface AddressSuggestion {
//   display_name: string;
//   lat: string;
//   lon: string;
//   address: {
//     house_number?: string;
//     road?: string;
//     town?: string;
//     county?: string;
//     region?: string;
//     postcode?: string;
//     country?: string;
//     country_code?: string;
//   }
// }

@Injectable({
  providedIn: 'root'
})
export class GeocodingService {

  private api = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) {
  }

  searchAddress(query: string): Observable<AddressSuggestion[]> {

    const params = new HttpParams()
        .set('q', query)
        .set('format', 'json')
        .set('addressdetails', '1')
        .set('limit', '5')
        .set('countrycodes', 'be'); // limite à la Belgique

    return this.http.get<AddressSuggestion[]>(this.api, {params});

  }
}