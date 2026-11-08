// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DatePipe } from '@angular/common';
import { getTestBed, TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { NgSelectModule } from '@ng-select/ng-select';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FilterPipe } from './app/filter.pipe';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false }
}
);

// Component smoke tests need the same HTTP test backend. Individual specs can
// still add narrower module imports or verify requests with HttpTestingController.
beforeEach(() => {
  TestBed.configureTestingModule({
    declarations: [FilterPipe],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [FormsModule,
        RouterTestingModule,
        NgbModule,
        NgxDaterangepickerMd.forRoot(),
        NgMultiSelectDropDownModule.forRoot(),
      NgSelectModule],
    providers: [DatePipe, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
});
