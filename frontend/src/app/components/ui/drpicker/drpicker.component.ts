import { Component, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { DaterangepickerComponent } from 'ng2-daterangepicker';
import { DatePipe } from '@angular/common';
import { appservice } from '../../app.service';

@Component({
  selector: 'app-drpicker',
  templateUrl: './drpicker.component.html',
  styleUrls: ['./drpicker.component.css']
})
export class DrpickerComponent implements OnInit {


  public daterange: any = {
    start: Date.now(),
    end: Date.now(),
    label: ''
  };

  @ViewChild(DaterangepickerComponent)
  private picker!: DaterangepickerComponent;

  public options: any = {
    locale: { format: 'YYYY-MM-DD' },
    alwaysShowCalendars: false,
    ranges: {
      'Yesterday': [moment().subtract(1, 'day'), moment()],
      'Last week': [moment().subtract(1, 'week'), moment()],
      'Last Month': [moment().subtract(1, 'month'), moment()],
      'Last 3 Months': [moment().subtract(4, 'month'), moment()],
      'Last 6 Months': [moment().subtract(6, 'month'), moment()],
      'Last 12 Months': [moment().subtract(12, 'month'), moment()],
    },
  }

  constructor(private service: appservice, private datepipe: DatePipe) { }

  ngOnInit(): void {

  }
  public selectedDate(value: any) {
    let enddate: any;
    let startdate: any;
    enddate = this.datepipe.transform(value.end._d, 'yyyy-MM-dd')
    startdate = this.datepipe.transform(value.start._d, 'yyyy-MM-dd')
    console.log(`${startdate} and ${enddate}`)
    let rangedate: object = { startdate: startdate, enddate: enddate }
    this.daterange['start'] = startdate;
    this.daterange['end'] = enddate;
    this.service.daterange.next(rangedate)
    return
  }

  public applyDate(e: any) {
    console.log(e)

  }

}
