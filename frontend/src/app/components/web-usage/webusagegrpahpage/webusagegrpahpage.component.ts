import { Chart } from 'chart.js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { appservice } from '../../app.service';
import { DatePipe } from '@angular/common';
// import {Chart}

@Component({
  selector: 'app-webusagegrpahpage',
  templateUrl: './webusagegrpahpage.component.html',
  styleUrls: ['./webusagegrpahpage.component.css']
})
export class WebusagegrpahpageComponent implements OnInit {
  loading: boolean = true
  webUseslabel: any[] = [];
  webUsescount: any[] = [];
  myChart!: Chart;
  startdate: any;
  enddate: any;


  constructor(private http: HttpClient, private service: appservice, private datepipe: DatePipe) { }

  ngOnInit(): void {
    let date: any = moment()
    this.startdate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.enddate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.webusesrequest(this.startdate, this.enddate)
    this.service.daterange.subscribe((res: any) => {
      this.webUsescount = []
      this.loading = true
      this.startdate = res['startdate']
      this.enddate = res['enddate']
      this.webusesrequest(this.startdate, this.enddate)
    })


  }
  webusesrequest(startdate: any, enddate: any) {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<any>(`${url}/api/users/getWebAppUses?startDate=${startdate}&endDate=${enddate}`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((res) => {
      this.loading = !this.loading
      for (let value of res['webUses']) {
        this.webUseslabel.push(value['url']);
        this.webUsescount.push(value['usagepercent']);
      }
      this.myChart = new Chart("weblineChart", {
        type: 'bar',
        data: {
          labels: this.webUseslabel,
          datasets: [
            {
              label: "",
              backgroundColor: ["#f5997b", "#7bbaee", "#f3d16b", "#64b5ae", "#91c794"],
              data: this.webUsescount,
              barPercentage: 0.2,
              // borderWidth: 0
            }
          ]
        },
        options: {
          responsive: true,
          legend: { display: false },
          title: {
            display: true,
          },
          scales: {
            xAxes: [{
              gridLines: {
                display: true
              },
              ticks: {

                beginAtZero: true,

              }
            }],
            yAxes: [{
              gridLines: {
                display: false
              },
              ticks: {

                beginAtZero: true,

              }
            }]
          },
        }
      });


    })
  }

}
