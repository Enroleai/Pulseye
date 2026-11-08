import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivetrackingpageComponent } from './livetrackingpage.component';

describe('LivetrackingpageComponent', () => {
  let component: LivetrackingpageComponent;
  let fixture: ComponentFixture<LivetrackingpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LivetrackingpageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LivetrackingpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
