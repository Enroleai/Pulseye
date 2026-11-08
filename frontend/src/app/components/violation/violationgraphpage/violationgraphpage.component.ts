import { Chart } from 'chart.js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { appservice } from '../../app.service';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';
// import {Chart}

@Component({
  selector: 'app-violationgraphpage',
  templateUrl: './violationgraphpage.component.html',
  styleUrls: ['./violationgraphpage.component.css']
})
export class ViolationgraphpageComponent implements OnInit {
  usagepercentvalue: any[] = [];
  violationvalue: any[] = [];
  loading: boolean = true
  myChart!: Chart;
  startdate: any;
  enddate: any;

  constructor(private http: HttpClient, private service: appservice, private datepipe: DatePipe) { }

  ngOnInit(): void {
    let date: any = moment()
    this.startdate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.enddate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.viloationgraphdata(this.startdate, this.enddate)
    this.service.daterange.subscribe((res: any) => {
      this.usagepercentvalue = [];
      this.violationvalue = [];
      this.loading = true
      this.startdate = res['startdate']
      this.enddate = res['enddate']
      this.viloationgraphdata(this.startdate, this.enddate)
    })


  }

  viloationgraphdata(startdate: any, enddate: any) {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<any[]>(`${url}/api/users/getViolationGraph?startDate=${startdate}&endDate=${enddate}`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe(

      (res) => {
        this.loading = !this.loading;
        for (let value of res) {
          this.violationvalue.push(value.app_name);
          this.usagepercentvalue.push(value.usagepercent);
        }
        this.myChart = new Chart('bar-chart-horizontal', {
          type: 'bar',
          data: {
            labels: this.violationvalue,
            datasets: [{
              label: 'Violation',
              data: this.usagepercentvalue,
              backgroundColor: ["#f5997b", "#7bbaee", "#f3d16b", "#64b5ae", "#91c794"],
              barPercentage: 0.2
            }]
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
              position: "top",
              display: false
            },
            title: {
              display: false,
            },

            scales: {
              yAxes: [{

                ticks: {
                  beginAtZero: true
                },
                gridLines: {
                  drawOnChartArea: true,
                  display: false
                }
              }],
              xAxes: [{
                ticks: {
                  beginAtZero: true
                },
                gridLines: {
                  drawOnChartArea: true

                }
              }],
            }
          }
        });


      })

  }



}
