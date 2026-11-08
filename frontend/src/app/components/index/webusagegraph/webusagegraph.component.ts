
import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js'
import { ChartOptions, ChartType, ChartDataSets } from 'chart.js';
import 'chartjs-plugin-doughnutlabel';
import moment from 'moment';
import { appservice } from '../../app.service';

@Component({
    selector: 'app-webusagegraph',
    templateUrl: './webusagegraph.component.html',
    styleUrls: ['./webusagegraph.component.css'],
    standalone: false
})
export class WebusagegraphComponent implements OnInit {
  backgroundColor = ["#a2ace3", "#7bbaee", "#f59e0b", "#8993ca", "#4f7fd1", "#f59e0b", "#f59e0b", "#66cdda"]
  text: any = []
  totalHoursWeb: string = ''
  // public doughnutChartType: ChartType = 'doughnut';

  webUsescountgraph: any[] = [];
  // webuseagetitlecount = '';
  webUseslabel: any[] = []
  webUsescount: any[] = []
  loading: boolean = true;
  startdate: any;
  enddate: any;
  mychart!: Chart;
  constructor(private http: HttpClient, private service: appservice, private datepipe: DatePipe, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    let date: any = moment()
    this.startdate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.enddate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.service.daterange.subscribe((res: any) => {
      this.webUseslabel = []
      this.webUsescountgraph = []
      this.loading = true
      console.log(res)
      this.startdate = res['startdate']
      this.enddate = res['enddate']
      this.webusagerequest(this.startdate, this.enddate)
    })
    this.webusagerequest(this.startdate, this.enddate)
  }
  webusagerequest(startdate: any, enddate: any) {
    this.loading = false;
    this.cdr.detectChanges();
    setTimeout(() => { if (this.loading) { this.loading = false; this.cdr.detectChanges(); } }, 8000);
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)

    this.http.get<any>(`${url}/api/users/getDashboardInfo?startDate=${startdate}&endDate=${enddate}`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe(res => {
      if (this.mychart) {
        this.mychart.destroy()
      }
      this.loading = false
      this.totalHoursWeb = res['totalHoursWeb'] > 0 ? res['totalHoursWeb'] + " Hours" : " ";
      for (let value of res['webUses']) {
        this.webUseslabel.push(value['url']);
        this.webUsescount.push(value['usagepercent']);
        this.webUsescountgraph.push("<li>" + value['usagepercent'] + "%<li>");

      }
      console.log(this.webUsescount)
      if (this.webUsescount.length !== 0) {
        this.mychart = new Chart('web-doughnut-chart', {
          type: 'doughnut',
          data: {
            datasets: [{
              data: this.webUsescount,
              backgroundColor: ["#a2ace3", "#7bbaee", "#f59e0b", "#8993ca", "#4f7fd1", "#f59e0b", "#f59e0b", "#66cdda"],
              label: ''

            }],
            labels: this.webUseslabel,


          },
          options: {
            responsive: true,
            cutoutPercentage: 70,
            maintainAspectRatio: true,
            legend: {
              display: false
            },
            legendCallback: function (chart: any) {
              var text: any = [];
              for (var i = 0; i < chart.data.datasets[0].data.length; i++) {

                let obj: any = {}
                obj['color'] = chart.data.datasets[0].backgroundColor[i];
                obj['label'] = chart['data'].labels[i]
                obj['data'] = chart.data.datasets[0].data[i]
                text.push(obj)
              }
              return text;
            },
            plugins: {
              doughnutlabel: {
                labels: [
                  {
                    text: `${this.totalHoursWeb}`,
                    font: {
                      size: '30',
                      units: 'px',
                    },
                  }
                ]
              }


            },
          },
        })
        this.text = this.mychart.generateLegend()
      }


    })
  }

}
