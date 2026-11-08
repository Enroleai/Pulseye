import { Chart } from 'chart.js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { appservice } from '../../app.service';
import * as moment from 'moment';

@Component({
  selector: 'app-appusesgraphpage',
  templateUrl: './appusesgraphpage.component.html',
  styleUrls: ['./appusesgraphpage.component.css']
})
export class AppusesgraphpageComponent implements OnInit {

  appUsaesarr1: any[] = [];
  appusasespercentage1: any[] = [];
  loading = true;
  startdate: any;
  enddate: any

  constructor(private http: HttpClient, private datepipe: DatePipe, private service: appservice) { }

  ngOnInit(): void {
    let date: any = moment()
    this.startdate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.enddate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.appusesrequest(this.startdate, this.enddate)
    this.service.daterange.subscribe((res: any) => {
      this.appusasespercentage1 = []
      this.loading = true
      this.startdate = res['startdate']
      this.enddate = res['enddate']
      this.appusesrequest(this.startdate, this.enddate)
    })


  }
  appusesrequest(startdate: any, enddate: any) {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<any>(`${url}/api/users/getWebAppUses?startDate=2020-12-29&endDate=2021-01-28`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((res) => {
      this.loading = !this.loading
      for (let value of res['appUses']) {
        this.appUsaesarr1.push(value['app_name']);
        this.appusasespercentage1.push(value['usagepercent']);

      }
      Chart.plugins.register({
        afterDraw: function (chart: any) {
          if (chart['data']['datasets'].length === 0) {
            var ctx = chart.chart.ctx;
            var width = chart.chart.width;
            var height = chart.chart.height
            chart.clear();
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = "16px normal 'Helvetica Nueue'";
            ctx.fillText('No data to display', width / 2, height / 2);
            ctx.restore();
          }
        }
      });
      // var ctx = document.getElementById("lineChart");
      new Chart("lineChart", {
        type: 'bar',
        data: {

          labels: this.appUsaesarr1,
          datasets: [
            {
              label: "",
              backgroundColor: ["#f5997b", "#7bbaee", "#f3d16b", "#64b5ae", "#91c794"],
              data: this.appusasespercentage1,
              borderWidth: 0
            }
          ]
        },
        options: {
          legend: { display: false },
          title: {
            display: true,
          },
          scales: {
            yAxes: [{

              ticks: {
                beginAtZero: true,
              },
              gridLines: {
                drawOnChartArea: false
              },
              stacked: true
            }],
            xAxes: [{

              ticks: {
                beginAtZero: true,
                fontSize: 10,
                autoSkip: true,
                maxRotation: 0,
                minRotation: 0
              },
              gridLines: {
                drawOnChartArea: false,

              },
              stacked: true,
            }],
          }
        }
      });

    })

  }

}
