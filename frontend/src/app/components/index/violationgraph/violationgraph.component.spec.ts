import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViolationgraphComponent } from './violationgraph.component';

describe('ViolationgraphComponent', () => {
  let component: ViolationgraphComponent;
  let fixture: ComponentFixture<ViolationgraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViolationgraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViolationgraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
