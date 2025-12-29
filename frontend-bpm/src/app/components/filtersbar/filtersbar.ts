import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ParkingArea } from '@core/types/parking-area';
import { FiltersValue } from '@core/types/filters';

@Component({
  selector: 'app-filtersbar',
  imports: [ReactiveFormsModule],
  templateUrl: './filtersbar.html',
  styleUrl: './filtersbar.css',
})
export class Filtersbar {
  private formBuilder = inject(FormBuilder);

  /**
   * Input signal for parking areas to populate the zone dropdown.
   */
  parkingAreas = input<ParkingArea[] | null>(null);

  /**
   * Output event emitter to notify parent component when filters are applied.
   */
  filtersApplied = output<FiltersValue>();

  /**
   * Output event emitter to notify parent component when filters are reset.
   */
  filtersReset = output<void>();

  /**
   * Reactive form group for filter fields.
   */
  filtersForm = this.formBuilder.group({
    zone: [null as number | null, Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  /**
   * Handles form submission and emits the filter values to the parent component.
   */
  onSubmit(): void {
    const formValue = this.filtersForm.value;
    const filters: FiltersValue = {
      zone: formValue.zone ?? null,
      startDate: formValue.startDate || null,
      endDate: formValue.endDate || null,
    };
    this.filtersApplied.emit(filters);
  }

  /**
   * Resets the form to its initial state and notifies the parent component.
   */
  onReset(): void {
    this.filtersForm.reset({
      zone: null,
      startDate: '',
      endDate: '',
    });
    this.filtersReset.emit();
  }
}
