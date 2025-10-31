import { Routes } from '@angular/router';
import { App } from './app';
import { Loremipsum } from './components/loremipsum/loremipsum';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
    title: "Home Page"
  },
  {
    path: 'loremipsum',
    component: Loremipsum,
    title: 'Lorem Ipsum'
  }
];
