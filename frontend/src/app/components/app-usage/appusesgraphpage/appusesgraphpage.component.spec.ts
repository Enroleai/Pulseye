import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppusesgraphpageComponent } from './appusesgraphpage.component';

describe('AppusesgraphpageComponent', () => {
  let component: AppusesgraphpageComponent;
  let fixture: ComponentFixture<AppusesgraphpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppusesgraphpageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppusesgraphpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
