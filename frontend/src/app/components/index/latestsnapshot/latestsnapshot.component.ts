import { appservice } from './../../app.service';
// import { Latestsnapshot } from './../../../models/latestsnapshot.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { Latestsnapshot } from 'src/app/models/latestsnapshot.model';

@Component({
  selector: 'app-latestsnapshot',
  templateUrl: './latestsnapshot.component.html',
  styleUrls: ['./latestsnapshot.component.css']
})
export class LatestsnapshotComponent implements OnInit {
  snapshotdata: Latestsnapshot[] = []
  loading: boolean = false;
  imgerror: boolean = false;

  constructor(private http: HttpClient, private service: appservice) { }

  ngOnInit(): void {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    // console.log(t)
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
            let date = latest !== '' ? new Date(parseInt(latest.split('?')[0].split('/')[latest.split('?')[0].split('/').length - 1].split('.')[0])).toString() : new Date();
            let screen = new Latestsnapshot(_id, name, activitystatus, employeeid, latest, date)
            resdata.push(screen)
          }
          return resdata

        })).subscribe((res) => {
          this.snapshotdata = res.slice(0, 7);
          console.log(this.snapshotdata)
          this.loading = true;
          let offline: number = 0
          let online: number = 0
          for (let snapshot of res) {
            if (snapshot['activeStatus'] === 'offline') {
              offline += 1;
            }
            if (snapshot['activeStatus'] === 'online') {
              online += 1;
            }
          }
          this.service.onlinenumber.next(online);
          this.service.offlinenumber.next(offline)

        })

  }

}


