import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnapshotbyidComponent } from './snapshotbyid.component';

describe('SnapshotbyidComponent', () => {
  let component: SnapshotbyidComponent;
  let fixture: ComponentFixture<SnapshotbyidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SnapshotbyidComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SnapshotbyidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
