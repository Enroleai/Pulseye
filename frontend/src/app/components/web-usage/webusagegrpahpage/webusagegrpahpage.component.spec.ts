import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebusagegrpahpageComponent } from './webusagegrpahpage.component';

describe('WebusagegrpahpageComponent', () => {
  let component: WebusagegrpahpageComponent;
  let fixture: ComponentFixture<WebusagegrpahpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WebusagegrpahpageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WebusagegrpahpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
