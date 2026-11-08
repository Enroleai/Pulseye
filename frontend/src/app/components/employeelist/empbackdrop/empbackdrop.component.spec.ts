import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpbackdropComponent } from './empbackdrop.component';

describe('EmpbackdropComponent', () => {
  let component: EmpbackdropComponent;
  let fixture: ComponentFixture<EmpbackdropComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmpbackdropComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EmpbackdropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
