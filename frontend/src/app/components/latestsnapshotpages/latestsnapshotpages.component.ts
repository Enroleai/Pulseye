import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Latestsnapshot } from 'src/app/models/latestsnapshot.model';
import { map } from 'rxjs/operators'
import { appservice } from '../app.service';


@Component({
  selector: 'app-latestsnapshotpages',
  templateUrl: './latestsnapshotpages.component.html',
  styleUrls: ['./latestsnapshotpages.component.css']
})
export class LatestsnapshotpagesComponent implements OnInit {
  snapshotdata: Latestsnapshot[] = []
  snaphshotlessdata: Latestsnapshot[] = [];
  loading: boolean = false;

  constructor(private http: HttpClient, private service: appservice) { }


  ngOnInit(): void {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<any[]>(`${url}/api/manegers/getWorkerLatestScreenshots`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).pipe(
      map(
        res => {
          let resdata: Latestsnapshot[] = []
          for (let resp of res) {
            let _id = resp['worker']['_id'];
            let name = resp['worker']['name'];
            let employeeid = resp['worker']['employeeid']
            let activitystatus = resp['worker']['activeStatus']
            let latest = resp['latest']
            let date = latest !== '' ? new Date(parseInt(latest.split('?')[0].split('/')[latest.split('?')[0].split('/').length - 1].split('.')[0])) : '';
            let screen = new Latestsnapshot(_id, name, activitystatus, employeeid, latest, date)
            resdata.push(screen)  // let newdate=moment(date).format('YYYY-MM-DD HH:mm:ss')
          }
          return resdata

        })).subscribe((res) => {
          this.snapshotdata = res.filter((value) => value['latest'] !== '')
          this.snaphshotlessdata = res.filter((value) => value['latest'] === '')

          this.loading = true;
        })
  }

}
