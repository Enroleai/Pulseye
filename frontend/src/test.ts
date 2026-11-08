// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/dist/zone-testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DatePipe } from '@angular/common';
import { getTestBed, TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { Daterangepicker } from 'ng2-daterangepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    keys(): string[];
    <T>(id: string): T;
  };
};

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// Component smoke tests need the same HTTP test backend. Individual specs can
// still add narrower module imports or verify requests with HttpTestingController.
beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [
      FormsModule,
      HttpClientTestingModule,
      RouterTestingModule,
      NgbModule,
      Ng2SearchPipeModule,
      NgxDaterangepickerMd.forRoot(),
      NgMultiSelectDropDownModule.forRoot(),
      Daterangepicker,
      NgSelectModule,
      NgOptionHighlightModule
    ],
    providers: [DatePipe],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
  });
});

const context = require.context('./', true, /\.spec\.ts$/);
context.keys().map(context);
