import { Component, inject, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-loremipsum',
  imports: [],
  templateUrl: './loremipsum.html',
  styleUrl: './loremipsum.css',
})
export class Loremipsum implements OnInit {
  public backendResponse = signal<string | null>('Caricamento prova...');

  ngOnInit() {

  }
}
