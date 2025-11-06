import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Filtersbar } from './filtersbar';

describe('Filtersbar', () => {
  let component: Filtersbar;
  let fixture: ComponentFixture<Filtersbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Filtersbar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Filtersbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
