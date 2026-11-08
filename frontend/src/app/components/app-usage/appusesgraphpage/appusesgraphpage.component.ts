import { Chart } from 'chart.js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { appservice } from '../../app.service';
import moment from 'moment';
import { timeout } from 'rxjs/operators';

@Component({
    selector: 'app-appusesgraphpage',
    templateUrl: './appusesgraphpage.component.html',
    styleUrls: ['./appusesgraphpage.component.css'],
    standalone: false
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
    this.http.get<any>(`${url}/api/users/getWebAppUses?startDate=${startdate}&endDate=${enddate}`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).pipe(timeout(8000)).subscribe((res) => {
      this.loading = false
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
      if (!this.appUsaesarr1.length) return;
      // var ctx = document.getElementById("lineChart");
      new Chart("lineChart", {
        type: 'bar',
        data: {

          labels: this.appUsaesarr1,
          datasets: [
            {
              label: "",
              backgroundColor: ["#4f7fd1", "#7bbaee", "#f59e0b", "#86a9e8", "#91c794"],
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

    }, () => {
      this.loading = false;
    })

  }

}
