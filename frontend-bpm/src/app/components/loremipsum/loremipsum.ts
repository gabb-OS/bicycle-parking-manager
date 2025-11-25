import { Component, inject, OnInit, signal } from '@angular/core';
import { WebApi } from '../../services/web-api';

@Component({
  selector: 'app-loremipsum',
  imports: [],
  templateUrl: './loremipsum.html',
  styleUrl: './loremipsum.css',
})
export class Loremipsum implements OnInit {
  private webApi = inject(WebApi);

  public backendResponse = signal<string | null>('Caricamento prova...');

  ngOnInit() {
    this.webApi.getHello().subscribe((response: string) => {
      console.log('Response from backend:', response);
      this.backendResponse.set(response);
    });
  }
}
