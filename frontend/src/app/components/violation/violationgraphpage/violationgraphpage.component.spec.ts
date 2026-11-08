import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViolationgraphpageComponent } from './violationgraphpage.component';

describe('ViolationgraphpageComponent', () => {
  let component: ViolationgraphpageComponent;
  let fixture: ComponentFixture<ViolationgraphpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViolationgraphpageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViolationgraphpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
