import { Chart } from 'chart.js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import moment from 'moment';
import { DatePipe } from '@angular/common';
import { appservice } from '../../app.service';
import { timeout } from 'rxjs/operators';
// import {Chart}

@Component({
    selector: 'app-productivitygraphpage',
    templateUrl: './productivitygraphpage.component.html',
    styleUrls: ['./productivitygraphpage.component.css'],
    standalone: false
})
export class ProductivitygraphpageComponent implements OnInit {
  productivityvalue: any[] = [];
  idletimevalue: any[] = [];
  violationvalue: any[] = [];
  monthvalue: any[] = [];
  loading: boolean = true;
  myChart!: Chart;
  startdate: any;
  enddate: any;

  constructor(private http: HttpClient, private datepipe: DatePipe, private service: appservice) { }

  ngOnInit(): void {
    let date: any = moment()
    this.startdate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.enddate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.productivityrequest(this.startdate, this.enddate)
    this.service.daterange.subscribe((res: any) => {
      this.productivityvalue = []
      this.idletimevalue = []
      this.monthvalue = []
      this.violationvalue = []
      this.loading = true
      console.log(res)
      this.startdate = res['startdate']
      this.enddate = res['enddate']
      this.productivityrequest(this.startdate, this.enddate)
    })



  }
  productivityrequest(startdate: any, enddate: any) {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<any[]>(`${url}/api/users/getProductivityGraph?startDate=${startdate}&endDate=${enddate}`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).pipe(timeout(8000)).subscribe((res) => {
      if (this.myChart) {
        this.myChart.destroy()
      }
      this.loading = false
      console.log(res)
      for (let value of res) {
        this.monthvalue.push(value['month']);
        this.productivityvalue.push(value['data']['productivity']);
        this.violationvalue.push(value['data']['violation']);
        this.idletimevalue.push(value['data']['idletime']);
      }
      if (!this.productivityvalue.length) return;
      this.myChart = new Chart("myChart", {
        type: 'bar',
        data: {
          labels: this.monthvalue,
          datasets: [
            {
              label: "Productivity",
              backgroundColor: "#f59e0b",
              borderWidth: 0,
              data: this.productivityvalue,
              barThickness: 15,
              barPercentage: 0.2,
            },
            {
              label: "Violation",
              backgroundColor: "#8993ca",
              borderWidth: 0,
              data: this.violationvalue,
              barThickness: 15,
              barPercentage: 0.2,
            },
            {
              label: " Ideal Time",
              backgroundColor: "#66cdda",
              borderWidth: 0,
              data: this.idletimevalue,
              barThickness: 15,
              barPercentage: 0.2,
            }
          ]
        },
        options: {
          tooltips: {
            callbacks: {
              label: function (tooltipItem, data) {
                return Number(tooltipItem.yLabel).toFixed(2) + "%";
              }
            }
          },
          legend: {
            position: "top"
          },
          title: {
            display: false,
          },
          // barValueSpacing: 20,
          scales: {
            yAxes: [{

              ticks: {
                min: 0,
                beginAtZero: true,
              },
              gridLines: {
                display: false
              },
              stacked: true
            }],
            xAxes: [{

              ticks: {
                min: 0,
                beginAtZero: true,
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
