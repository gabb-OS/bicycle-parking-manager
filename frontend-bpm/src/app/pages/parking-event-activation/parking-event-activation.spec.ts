import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParkingEventActivation } from './parking-event-activation';

describe('ParkingEventActivation', () => {
  let component: ParkingEventActivation;
  let fixture: ComponentFixture<ParkingEventActivation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParkingEventActivation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParkingEventActivation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
