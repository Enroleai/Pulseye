import { appservice } from './../../app.service';
import { Component, OnInit } from '@angular/core';
import dayjs, { Dayjs } from 'dayjs';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-custom-ranges',
  templateUrl: './custom-ranges.component.html',
  styleUrls: ['./custom-ranges.component.css'],
  standalone: false
})
export class CustomRangesComponent implements OnInit {
  opens: boolean | undefined;
  selected: { startDate: Dayjs; endDate: Dayjs };
  alwaysShowCalendars: boolean;
  showRangeLabelOnInput: boolean;
  keepCalendarOpeningWithRange: boolean;
  maxDate: Dayjs;
  minDate: Dayjs;
  invalidDates: Dayjs[] = [];
  tooltips = [
    { date: dayjs(), text: 'Today is just unselectable' },
    { date: dayjs().add(2, 'days'), text: 'Yeeeees!!!' }
  ];
  inlineDateTime: unknown;
  ranges: Record<string, [Dayjs, Dayjs]> = {
    Today: [dayjs(), dayjs()],
    Yesterday: [dayjs().subtract(1, 'days'), dayjs().subtract(1, 'days')],
    'Last 7 Days': [dayjs().subtract(6, 'days'), dayjs()],
    'Last 30 Days': [dayjs().subtract(29, 'days'), dayjs()],
    'This Month': [dayjs().startOf('month'), dayjs().endOf('month')],
    'Last Month': [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')],
    'Last 3 Month': [dayjs().subtract(3, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')]
  };

  isInvalidDate = (date: Dayjs): boolean => this.invalidDates.some((item) => item.isSame(date, 'day'));

  isTooltipDate = (date: Dayjs): string | false => {
    const tooltip = this.tooltips.find((item) => item.date.isSame(date, 'day'));
    return tooltip?.text || false;
  };

  constructor(private datepipe: DatePipe, private service: appservice) {
    this.maxDate = dayjs().add(2, 'weeks');
    this.minDate = dayjs().subtract(3, 'days');
    this.alwaysShowCalendars = true;
    this.keepCalendarOpeningWithRange = true;
    this.showRangeLabelOnInput = true;
    this.selected = {
      startDate: dayjs().subtract(1, 'days').hour(0).minute(0),
      endDate: dayjs().subtract(1, 'days').hour(23).minute(59)
    };
  }

  rangeClicked(range: unknown): void {
    console.log('[rangeClicked] range is : ', range);
  }

  datesUpdated(range: unknown): void {
    console.log('[datesUpdated] range is : ', range);
  }

  ngOnInit(): void {}

  dateup(event: { startDate?: Dayjs | null; endDate?: Dayjs | null }): void {
    const start = event.startDate || dayjs();
    const end = event.endDate || start;
    const startdate = this.datepipe.transform(start.toDate(), 'yyyy-MM-dd');
    const enddate = this.datepipe.transform(end.toDate(), 'yyyy-MM-dd');
    this.service.daterange.next({ startdate, enddate });
  }

  choosedDateTime(event: unknown): void {
    this.inlineDateTime = event;
  }
}
