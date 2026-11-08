import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class appservice {
  readonly url = environment.apiBaseUrl;

  submitted = new Subject<string>();
  offlinenumber = new Subject<number>();
  onlinenumber = new Subject<number>();
  daterange = new Subject<object>();
}
