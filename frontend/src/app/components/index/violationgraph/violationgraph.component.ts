import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js'
import * as moment from 'moment';
import { appservice } from '../../app.service';

@Component({
  selector: 'app-violationgraph',
  templateUrl: './violationgraph.component.html',
  styleUrls: ['./violationgraph.component.css']
})
export class ViolationgraphComponent implements OnInit {
  violationlabelarr: any[] = [];
  violationamountarr: any[] = [];
  startdate: any;
  enddate: any;
  loading: boolean = true;
  myChart!: Chart;
  constructor(private http: HttpClient, private service: appservice, private serice: appservice, private datepipe: DatePipe) { }

  ngOnInit(): void {
    let date: any = moment()
    this.startdate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.enddate = this.datepipe.transform(date._d, 'yyyy-MM-dd')

    this.service.daterange.subscribe((res: any) => {
      this.violationlabelarr = []
      this.violationamountarr = []
      this.loading = true
      console.log(res)
      this.startdate = res['startdate']
      this.enddate = res['enddate']
      this.violationgraphrequest(this.startdate, this.enddate)
    })
    this.violationgraphrequest(this.startdate, this.enddate)
  }

  violationgraphrequest(startdate: any, enddate: any) {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<any[]>(`${url}/api/users/getViolationGraph?startDate=${startdate}&endDate=${enddate}`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((res) => {
      if (this.myChart) {
        this.myChart.destroy()
      }
      for (let value of res) {
        this.violationlabelarr.push(value['app_name']);
        this.violationamountarr.push(value['usagepercent']);
      }
      if (this.violationamountarr.length !== 0) {
        this.myChart = new Chart("bar-chart-horizontal", {
          type: 'horizontalBar',
          data: {

            labels: this.violationlabelarr,
            datasets: [
              {
                label: "",
                backgroundColor: ["#f5997b", "#7bbaee", "#f3d16b", "#64b5ae", "#91c794"],
                data: this.violationamountarr,
                borderWidth: 0,
                barPercentage: 0.2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            tooltips: {
              callbacks: {
                label: function (tooltipItem1: { xLabel: any; }, data: any) {
                  return Number(tooltipItem1.xLabel).toFixed(0).replace(/./g, function (c, i, a) {
                    return i > 0 && c !== "." && (a.length - i) % 3 === 0 ? "," + c : c;
                  }) + "%";
                }
              }
            },
            legend: { display: false },
            title: {
              display: true,
            },
            scales: {
              xAxes: [{
                //  barPercentage: 0.2,
                gridLines: {
                  drawOnChartArea: false,
                  // display: false
                },

                ticks: {
                  beginAtZero: true,

                },
              }],
              yAxes: [{
                //  barPercentage: 0.2,
                gridLines: {
                  // display: false,
                  drawOnChartArea: false
                },
                ticks: {
                  beginAtZero: true,

                },
              }]
            }
          }
        });



      }
      this.loading = false;

    })

  }

}
