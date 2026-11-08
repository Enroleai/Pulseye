import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddviolationComponent } from './addviolation.component';

describe('AddviolationComponent', () => {
  let component: AddviolationComponent;
  let fixture: ComponentFixture<AddviolationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddviolationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddviolationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
