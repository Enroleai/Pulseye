import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductivitygraphpageComponent } from './productivitygraphpage.component';

describe('ProductivitygraphpageComponent', () => {
  let component: ProductivitygraphpageComponent;
  let fixture: ComponentFixture<ProductivitygraphpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductivitygraphpageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductivitygraphpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
