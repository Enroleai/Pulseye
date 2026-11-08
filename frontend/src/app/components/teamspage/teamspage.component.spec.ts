import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamspageComponent } from './teamspage.component';

describe('TeamspageComponent', () => {
  let component: TeamspageComponent;
  let fixture: ComponentFixture<TeamspageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TeamspageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamspageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
