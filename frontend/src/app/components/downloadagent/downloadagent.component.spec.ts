import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadagentComponent } from './downloadagent.component';

describe('DownloadagentComponent', () => {
  let component: DownloadagentComponent;
  let fixture: ComponentFixture<DownloadagentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DownloadagentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadagentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
