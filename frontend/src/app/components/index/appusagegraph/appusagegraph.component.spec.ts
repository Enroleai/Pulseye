import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppusagegraphComponent } from './appusagegraph.component';

describe('AppusagegraphComponent', () => {
  let component: AppusagegraphComponent;
  let fixture: ComponentFixture<AppusagegraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppusagegraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppusagegraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
