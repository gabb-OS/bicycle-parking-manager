import { Routes } from '@angular/router';
import { App } from './app';
import { Loremipsum } from './components/loremipsum/loremipsum';
import { Home } from './pages/home/home';

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
    path: 'loremipsum',
    component: Loremipsum,
    title: 'Lorem Ipsum',
  },
];
