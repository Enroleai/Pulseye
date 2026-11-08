import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, } from '@angular/core';
import { Chart } from 'chart.js'
import moment from 'moment';
import { appservice } from '../../app.service';
import { DatePipe } from '@angular/common';
import { timeout } from 'rxjs/operators';
@Component({
    selector: 'app-productivitygraph',
    templateUrl: './productivitygraph.component.html',
    styleUrls: ['./productivitygraph.component.css'],
    standalone: false
})
export class ProductivitygraphComponent implements OnInit {
  productivityvalue: any[] = [];
  idletimevalue: any[] = [];
  violationvalue: any[] = [];
  monthvalue: any[] = [];
  startdate: any = moment();
  enddate: any = moment();
  loading: boolean = true;
  myChart!: Chart;

  constructor(private http: HttpClient, private service: appservice, private datepipe: DatePipe, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    let date: any = moment()
    this.startdate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.enddate = this.datepipe.transform(date._d, 'yyyy-MM-dd')

    this.service.daterange.subscribe((res: any) => {
      this.productivityvalue = []
      this.idletimevalue = []
      this.monthvalue = []
      this.violationvalue = []
      this.loading = true
      console.log(res)
      this.startdate = res['startdate']
      this.enddate = res['enddate']
      this.productivitydatafetch(this.startdate, this.enddate)
    })
    this.productivitydatafetch(this.startdate, this.enddate)
  }
  productivitydatafetch(startdate: any, enddate: any) {
    this.loading = false;
    this.cdr.detectChanges();
    setTimeout(() => { if (this.loading) { this.loading = false; this.cdr.detectChanges(); } }, 8000);
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
      for (let data of res) {
        let month = data['month']
        let productivity = data['data']['productivity']
        let viloation = data['data']['violation']
        let idletime = data['data']['idletime']
        this.productivityvalue.push(productivity)
        this.idletimevalue.push(idletime)
        this.violationvalue.push(viloation)
        this.monthvalue.push(month)  // idletimevalue.push(value.data.idletime
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
              data: this.productivityvalue,
              barThickness: 15,
              barPercentage: 0.2,

            },
            {
              label: "Violation",
              backgroundColor: "#8993ca",
              data: this.violationvalue,
              barThickness: 15,
              barPercentage: 0.2,


            },
            {
              label: " Ideal Time",
              backgroundColor: "#66cdda",
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

          responsive: true,
          maintainAspectRatio: false,
          legend: {
            position: "top"
          },
          title: {
            display: false,
          },
          scales: {

            yAxes: [{
              ticks: {

                min: 0,
                beginAtZero: true,
                stepSize: 20


              },
              gridLines: {
                drawBorder: true,
                display: false,
              },
              stacked: true
            }],
            xAxes: [
              {
                ticks: {
                  min: 0,
                  beginAtZero: true,
                },
                stacked: true,
                gridLines: {
                  display: true,
                  drawBorder: true
                }
              }],
          }
        }
      });
    }, () => {
      this.loading = false;
    })

  }

}
