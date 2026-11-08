import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebusagegraphComponent } from './webusagegraph.component';

describe('WebusagegraphComponent', () => {
  let component: WebusagegraphComponent;
  let fixture: ComponentFixture<WebusagegraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WebusagegraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WebusagegraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
