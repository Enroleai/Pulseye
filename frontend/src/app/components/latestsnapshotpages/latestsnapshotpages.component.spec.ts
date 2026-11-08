import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LatestsnapshotpagesComponent } from './latestsnapshotpages.component';

describe('LatestsnapshotpagesComponent', () => {
  let component: LatestsnapshotpagesComponent;
  let fixture: ComponentFixture<LatestsnapshotpagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LatestsnapshotpagesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LatestsnapshotpagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
