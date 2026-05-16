import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Meds } from './meds';

describe('Meds', () => {
  let component: Meds;
  let fixture: ComponentFixture<Meds>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Meds]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Meds);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
