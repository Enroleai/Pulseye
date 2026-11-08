import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabelsComponent } from './tabels.component';

describe('TabelsComponent', () => {
  let component: TabelsComponent;
  let fixture: ComponentFixture<TabelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TabelsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TabelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
