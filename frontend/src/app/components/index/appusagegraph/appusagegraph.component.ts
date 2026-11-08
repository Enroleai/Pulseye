import { Chart } from 'chart.js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import 'chartjs-plugin-doughnutlabel';
import { DatePipe } from '@angular/common';
import { appservice } from '../../app.service';
import moment from 'moment';
@Component({
    selector: 'app-appusagegraph',
    templateUrl: './appusagegraph.component.html',
    styleUrls: ['./appusagegraph.component.css'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class AppusagegraphComponent implements OnInit {
  tooltiplabels: any[] = []
  text: any = [];
  loading: boolean = true;
  colors: any[] = [];
  arrayNum = ["#fbbf24", "#7bbaee", "#4f7fd1", "#f59e0b", "#69c3ed", "#f59e0b", "#8993ca", "#f59e0b", "#66cdda", "#a2ace3", "#69c3ed", "#f59e0b", "#a2ace3", "#f59e0b", "#1f50ba", "#2f64c8", "#4f7fd1", "#2f64c8", "#f59e0b", "#f59e0b", "#fbbf24", "#f59e0b", "#f59e0b", "#123998", "#4f7fd1"];
  ArrNoDupe = (a: any) => {
    var temp: any = {};
    for (var i = 0; i < a.length; i++)
      temp[a[i]] = true;
    return Object.keys(temp);
  }
  mychart!: Chart;

  getRandomValues = (arr: any, count: any) => {
    var _tmp = arr.slice();
    for (var i = 0; i < count; i++) {
      var index = Math.ceil(Math.random() * 10) % _tmp.length;
      this.colors.push(_tmp.splice(index, 1)[0]);
    }
    this.colors = this.ArrNoDupe(this.colors);
    return this.colors;
  }


  appUsaesarr: any[] = [];
  appusasespercentage: any[] = [];
  applablepercentage: any[] = [];
  startdate: string | null | undefined;
  enddate: string | null | undefined;

  constructor(private http: HttpClient, private datepipe: DatePipe, private service: appservice, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    let date: any = moment()
    this.startdate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.enddate = this.datepipe.transform(date._d, 'yyyy-MM-dd')

    this.service.daterange.subscribe((res: any) => {
      this.appUsaesarr = []
      this.applablepercentage = []
      this.loading = true
      console.log(res)
      this.startdate = res['startdate']
      this.enddate = res['enddate']
      this.appusagerequest(this.startdate, this.enddate)
    })

    this.appusagerequest(this.startdate, this.enddate)

  }
  appusagerequest(startdate: any, enddate: any) {
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
    }).subscribe(

      (res) => {
        if (this.mychart) {
          this.mychart.destroy()
        }

        let totalHoursApp = res.totalHoursApp > 0 ? res.totalHoursApp + " Hours" : " ";
        for (let value of res['appUses']) {
          this.appUsaesarr.push(value['app_name']);
          this.appusasespercentage.push(value['usagepercent']);
          this.applablepercentage.push("<li>" + value['usagepercent'] + "%</li>");

        }
        this.getRandomValues(this.arrayNum, this.appUsaesarr.length);
        if (this.appUsaesarr.length !== 0) {
          this.mychart = new Chart("app-doughnut-chart", {
            type: 'doughnut',
            data: {
              labels: this.appUsaesarr,
              datasets: [
                {
                  label: "",
                  backgroundColor: this.colors,
                  data: this.appusasespercentage

                }
              ]
            },
            options: {

              cutoutPercentage: 70,
              responsive: true,
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
              animation: {
                animateScale: true,
                animateRotate: true
              },
              tooltips: {
                titleFontSize: 12,
                bodyFontSize: 12
              },
              plugins: {
                doughnutlabel: {
                  labels: [
                    {
                      text: `${totalHoursApp}`,
                      font: {
                        size: '25',
                        units: 'px',
                      },
                    }
                  ]
                }
              }

            }

          });
          /****end app chart */

          this.text = this.mychart.generateLegend();
          console.log(this.text)
        }
        this.loading = false

      })

  }

}
