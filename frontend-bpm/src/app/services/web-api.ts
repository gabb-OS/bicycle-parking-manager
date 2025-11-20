import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebApi {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getHello(){
    this.http.get(`${this.baseUrl}/`, {
      responseType: 'text',
      mode: 'cors'
    }).subscribe(response => {
      return response;
    });
  }
  
}