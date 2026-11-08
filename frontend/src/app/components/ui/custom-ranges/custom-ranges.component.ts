import { appservice } from './../../app.service';
import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as moment from 'moment';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-custom-ranges',
  templateUrl: './custom-ranges.component.html',
  styleUrls: ['./custom-ranges.component.css']
})
export class CustomRangesComponent implements OnInit{
  opens:boolean | undefined;
  selected: any;
  alwaysShowCalendars: boolean;
  showRangeLabelOnInput: boolean;
  keepCalendarOpeningWithRange: boolean;
  maxDate: moment.Moment;
  minDate: moment.Moment;
  invalidDates: moment.Moment[] = [];
  tooltips = [
    {date: moment(), text: 'Today is just unselectable'},
    {date:  moment().add(2, 'days'), text: 'Yeeeees!!!'}
  ];
  inlineDateTime:any;
  ranges: any = {
    Today: [moment(), moment()],
    Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [
      moment()
        .subtract(1, 'month')
        .startOf('month'),
      moment()
        .subtract(1, 'month')
        .endOf('month')
    ],
    'Last 3 Month': [
      moment()
        .subtract(3, 'month')
        .startOf('month'),
      moment()
        .subtract(1, 'month')
        .endOf('month')
    ]
  };

  isInvalidDate = (m: moment.Moment) =>  {
    return this.invalidDates.some(d => d.isSame(m, 'day') );
  }
  isTooltipDate = (m: moment.Moment) =>  {
    const tooltip = this.tooltips.find(tt => tt.date.isSame(m, 'day'));
    if (tooltip) {
      return tooltip.text;
    } else {
      return false;
    }
  }

  constructor(private datepipe: DatePipe,private service:appservice) {
    this.maxDate = moment().add(2,  'weeks');
    this.minDate = moment().subtract(3, 'days');

    this.alwaysShowCalendars = true;
    this.keepCalendarOpeningWithRange = true;
    this.showRangeLabelOnInput = true;
    this.selected = {
      startDate: moment().subtract(1, 'days').set({hours: 0, minutes: 0}),
      endDate: moment().subtract(1, 'days').set({hours: 23, minutes: 59})
    };
  }
  
  rangeClicked(range:any) {
    console.log('[rangeClicked] range is : ', range);
  }
  datesUpdated(range:any) {
    console.log('[datesUpdated] range is : ', range);
  }

  ngOnInit() {
    
        // console.log('ngonit')
    
  }
  dateup(event:any){
    let enddate:any;
    let startdate:any;
    if(event['startDate']===null){
      let todaydate:any=moment()
      enddate= this.datepipe.transform(todaydate['_d'],'yyyy-MM-dd')
      startdate=this.datepipe.transform(todaydate['_d'],'yyyy-MM-dd')
      console.log(`${startdate} and ${enddate}`)
      let rangedate:object={startdate:startdate,enddate:enddate}
     this.service.daterange.next(rangedate)
      return
    }
      startdate= this.datepipe.transform(event['startDate']['_d'],'yyyy-MM-dd')
      enddate=this.datepipe.transform(event['endDate']['_d'],'yyyy-MM-dd')
      let rangedate:object={startdate:startdate,enddate:enddate}
      this.service.daterange.next(rangedate)
    
  }
  choosedDateTime(e:any) {
    console.log(e)
    this.inlineDateTime = e;
  }

}
