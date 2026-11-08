import { Chart } from 'chart.js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import 'chartjs-plugin-doughnutlabel';
import { DatePipe } from '@angular/common';
import { appservice } from '../../app.service';
import * as moment from 'moment';
@Component({
  selector: 'app-appusagegraph',
  templateUrl: './appusagegraph.component.html',
  styleUrls: ['./appusagegraph.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AppusagegraphComponent implements OnInit {
  tooltiplabels: any[] = []
  text: any = [];
  loading: boolean = true;
  colors: any[] = [];
  arrayNum = ["#ffd281", "#7bbaee", "#f5997b", "#91c794", "#69c3ed", "#f3d16b", "#8993ca", "#d9e287", "#66cdda", "#64b5ae", "#69c3ed", "#f4b968", "#a2ace3", "#d7ff81", "#6167b0", "#a84ce6", "#fa435c", "#fa5843", "#f0fa69", "#51fcb8", "#ffbe81", "#c8ff81", "#38d657", "#4e3e7d", "#eb73c9"];
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

  constructor(private http: HttpClient, private datepipe: DatePipe, private service: appservice) { }

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
        this.loading = !this.loading

      })

  }

}
