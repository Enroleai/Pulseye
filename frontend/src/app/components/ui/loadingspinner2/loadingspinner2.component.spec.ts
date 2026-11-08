import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Loadingspinner2Component } from './loadingspinner2.component';

describe('Loadingspinner2Component', () => {
  let component: Loadingspinner2Component;
  let fixture: ComponentFixture<Loadingspinner2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Loadingspinner2Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Loadingspinner2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
