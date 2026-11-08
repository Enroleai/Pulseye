import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import moment from 'moment';
import { saveAs } from 'file-saver'
import { appservice } from '../app.service';

@Component({
    selector: 'app-snapshotbyid',
    templateUrl: './snapshotbyid.component.html',
    styleUrls: ['./snapshotbyid.component.css'],
    standalone: false
})
export class SnapshotbyidComponent implements OnInit {
  employeeid: string = ''
  empname: string = '';
  images = []
  loading = true;
  openfoldertoday: boolean = false;
  openfolderyesterday: boolean = false;
  openfolderlastweek: boolean = false;
  constructor(private route: ActivatedRoute, private http: HttpClient, private datepipe: DatePipe, private service: appservice) { }

  ngOnInit(): void {
    // this.today()
    // this.loading = !this.loading
    this.route.params.subscribe((params: Params) => {
      this.employeeid = params['empid']
      this.empname = params['name']
      // console.log(this.employeeid)
    })
    this.today(true)

  }
  download(imageurl: any, name: any) {
    saveAs(imageurl, name)
  }
  snapshotrequest(startdate: any, enddate: any) {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<any[]>(`${url}/api/manegers/getWorkerScreenshotsByDate?startDate=${startdate}&endDate=${enddate}&employeeid=${this.employeeid}`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe(

      (res) => {
        if (res[0]['imagesUrlArr'][0]) {

          this.images = res[0]['imagesUrlArr'][0]['screenShot']
        } else {
          // this.images = res[0]['imagesUrlArr'][0]['screenShot']
        }
        this.loading = !this.loading;
        console.log(this.images)


      })


  }
  today(value: any) {
    this.openfoldertoday = value;
    this.openfolderlastweek = !value;
    this.openfolderyesterday = !value;
    let startdate: any = moment()
    let startdatetranform: any = this.datepipe.transform(startdate._d, 'yyyy-MM-dd')
    this.snapshotrequest(startdatetranform, startdatetranform)
    this.loading = true
    this.images = [];
  }
  yesterday(value: any) {
    this.openfolderyesterday = value;
    this.openfolderlastweek = !value;
    this.openfoldertoday = !value;
    this.loading = true
    let startdate: any = moment().subtract(1, 'days')
    let enddate: any = moment()
    let startdatetransform: any = this.datepipe.transform(startdate._d, 'yyyy-MM-dd')
    let enddatetransform: any = this.datepipe.transform(enddate._d, 'yyyy-MM-dd')
    this.snapshotrequest(startdatetransform, enddatetransform);
    this.images = [];
  }
  lastweek(value: any) {
    this.openfolderlastweek = value;
    this.openfoldertoday = !value;
    this.openfolderyesterday = !value
    this.loading = true
    let startdate: any = moment().subtract(6, 'days')
    let enddate: any = moment()
    let startdatetransform: any = this.datepipe.transform(startdate._d, 'yyyy-MM-dd')
    let enddatetransform: any = this.datepipe.transform(enddate._d, 'yyyy-MM-dd')
    this.snapshotrequest(startdatetransform, enddatetransform)
    this.images = []
  }

}
