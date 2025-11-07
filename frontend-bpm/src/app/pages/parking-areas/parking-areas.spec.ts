import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParkingAreas } from './parking-areas';

describe('ParkingAreas', () => {
  let component: ParkingAreas;
  let fixture: ComponentFixture<ParkingAreas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParkingAreas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParkingAreas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
