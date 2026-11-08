import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductivitygraphComponent } from './productivitygraph.component';

describe('ProductivitygraphComponent', () => {
  let component: ProductivitygraphComponent;
  let fixture: ComponentFixture<ProductivitygraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductivitygraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductivitygraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
