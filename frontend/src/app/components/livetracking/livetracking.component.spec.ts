import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivetrackingComponent } from './livetracking.component';

describe('LivetrackingComponent', () => {
  let component: LivetrackingComponent;
  let fixture: ComponentFixture<LivetrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LivetrackingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LivetrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
