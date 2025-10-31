import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Loremipsum } from './loremipsum';

describe('Loremipsum', () => {
  let component: Loremipsum;
  let fixture: ComponentFixture<Loremipsum>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Loremipsum]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Loremipsum);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
