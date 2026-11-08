import { Component, OnInit } from '@angular/core';
import dayjs, { Dayjs } from 'dayjs';
import { DatePipe } from '@angular/common';
import { appservice } from '../../app.service';

@Component({
    selector: 'app-drpicker',
    templateUrl: './drpicker.component.html',
    styleUrls: ['./drpicker.component.css'],
    standalone: false
})
export class DrpickerComponent implements OnInit {


  public selected: { start: Dayjs; end: Dayjs } = { start: dayjs(), end: dayjs() };
  public daterange: { start: string; end: string } = {
    start: dayjs().format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD')
  };
  public locale = { format: 'YYYY-MM-DD', firstDay: 1 };
  public ranges: Record<string, [Dayjs, Dayjs]> = {
    Yesterday: [dayjs().subtract(1, 'day'), dayjs()],
    'Last week': [dayjs().subtract(1, 'week'), dayjs()],
    'Last Month': [dayjs().subtract(1, 'month'), dayjs()],
    'Last 3 Months': [dayjs().subtract(3, 'month'), dayjs()],
    'Last 6 Months': [dayjs().subtract(6, 'month'), dayjs()],
    'Last 12 Months': [dayjs().subtract(12, 'month'), dayjs()]
  };

  constructor(private service: appservice, private datepipe: DatePipe) { }

  ngOnInit(): void {

  }
  public selectedDate(value: { startDate?: Dayjs; endDate?: Dayjs; start?: Dayjs; end?: Dayjs }) {
    const start = value.startDate || value.start || this.selected.start;
    const end = value.endDate || value.end || this.selected.end;
    const startdate = this.datepipe.transform(start.toDate(), 'yyyy-MM-dd') || '';
    const enddate = this.datepipe.transform(end.toDate(), 'yyyy-MM-dd') || '';
    this.daterange = { start: startdate, end: enddate };
    this.service.daterange.next({ startdate, enddate });
  }

  public applyDate(): void {}

}
