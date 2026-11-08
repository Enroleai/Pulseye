import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartementpageComponent } from './departementpage.component';

describe('DepartementpageComponent', () => {
  let component: DepartementpageComponent;
  let fixture: ComponentFixture<DepartementpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepartementpageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepartementpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
