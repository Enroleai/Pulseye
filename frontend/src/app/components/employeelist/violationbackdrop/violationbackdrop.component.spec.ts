import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViolationbackdropComponent } from './violationbackdrop.component';

describe('ViolationbackdropComponent', () => {
  let component: ViolationbackdropComponent;
  let fixture: ComponentFixture<ViolationbackdropComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViolationbackdropComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViolationbackdropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
