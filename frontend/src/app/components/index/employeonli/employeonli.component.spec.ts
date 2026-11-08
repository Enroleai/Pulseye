import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeonliComponent } from './employeonli.component';

describe('EmployeonliComponent', () => {
  let component: EmployeonliComponent;
  let fixture: ComponentFixture<EmployeonliComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmployeonliComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeonliComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
