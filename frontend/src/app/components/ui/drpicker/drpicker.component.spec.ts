import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrpickerComponent } from './drpicker.component';

describe('DrpickerComponent', () => {
  let component: DrpickerComponent;
  let fixture: ComponentFixture<DrpickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DrpickerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DrpickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
