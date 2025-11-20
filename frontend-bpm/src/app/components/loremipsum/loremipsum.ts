import { Component, inject } from '@angular/core';
import { WebApi } from '../../services/web-api';

@Component({
  selector: 'app-loremipsum',
  imports: [],
  templateUrl: './loremipsum.html',
  styleUrl: './loremipsum.css',
})
export class Loremipsum {
  private http = inject(WebApi);

  ngOnInit() {
    console.log("backend response ", this.http.getHello());
  }
}
