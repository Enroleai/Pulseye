import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnlineempComponent } from './onlineemp.component';

describe('OnlineempComponent', () => {
  let component: OnlineempComponent;
  let fixture: ComponentFixture<OnlineempComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OnlineempComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OnlineempComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
