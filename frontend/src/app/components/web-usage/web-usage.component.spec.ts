import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebUsageComponent } from './web-usage.component';

describe('WebUsageComponent', () => {
  let component: WebUsageComponent;
  let fixture: ComponentFixture<WebUsageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WebUsageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WebUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
