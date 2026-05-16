import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMedicineForm } from './add-medicine-form';

describe('AddMedicineForm', () => {
  let component: AddMedicineForm;
  let fixture: ComponentFixture<AddMedicineForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMedicineForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddMedicineForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
