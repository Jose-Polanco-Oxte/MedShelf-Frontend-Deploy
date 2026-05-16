import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTreatmentForm } from './add-treatment-form';

describe('AddTreatmentForm', () => {
  let component: AddTreatmentForm;
  let fixture: ComponentFixture<AddTreatmentForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTreatmentForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AddTreatmentForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
