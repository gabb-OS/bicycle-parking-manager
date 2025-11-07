import { Routes } from '@angular/router';
import { App } from './app';
import { Loremipsum } from './components/loremipsum/loremipsum';
import { Home } from './pages/home/home';
import { ParkingAreas } from './pages/parking-areas/parking-areas';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Home page',
  },
  {
    path: 'home',
    pathMatch: 'full',
    redirectTo: '',
  },
  {
    path: 'parkingareas',
    component: ParkingAreas,
    title: 'Aree Parcheggio',
  },
  {
    path: 'loremipsum',
    component: Loremipsum,
    title: 'Lorem Ipsum',
  },
];
