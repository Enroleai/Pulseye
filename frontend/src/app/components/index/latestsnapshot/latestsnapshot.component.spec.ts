import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LatestsnapshotComponent } from './latestsnapshot.component';

describe('LatestsnapshotComponent', () => {
  let component: LatestsnapshotComponent;
  let fixture: ComponentFixture<LatestsnapshotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LatestsnapshotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LatestsnapshotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
