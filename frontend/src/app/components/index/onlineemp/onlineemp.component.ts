import { map } from 'rxjs/operators';
import { onlineemp } from '../../../models/onlineemp.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { appservice } from '../../app.service';

@Component({
  selector: 'app-onlineemp',
  templateUrl: './onlineemp.component.html',
  styleUrls: ['./onlineemp.component.css']
})
export class OnlineempComponent implements OnInit {
  loading: boolean = true;
  arrayonlinemp: onlineemp[] = [];
  lengthi: boolean = false;


  addlivebutton = (num: string) => {
    var empid = num;
    localStorage.setItem('activeEmp', num);
    window.open('/live?empid=' + empid + '', 'window Name', "height=400,width=1200,top=200,left=300");
  }
  // empname:string="";


  converttime(duration: number) {
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    let hoursi = (hours < 10) ? "0" + hours : hours;
    let minutesi = (minutes < 10) ? "0" + minutes : minutes;
    let secondsi = (seconds < 10) ? "0" + seconds : seconds;
    var totaltime = hoursi + ":" + minutesi + ":" + secondsi;
    return totaltime;
  }
  // computer:string=''


  constructor(private http: HttpClient, private service: appservice) { }

  ngOnInit() {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.
      get<any[]>(`${url}/api/users/getOnlineUserInfo`, {
        headers: new HttpHeaders({
          'x-auth-token': t
        })
      }).
      pipe(map((emps) => {
        let arrayi: onlineemp[] = []
        for (let single of emps) {
          let empname = single['name']
          let activeStatus = single['activeStatus']
          let empid = single['_id']
          let computer = single['activitiesDetails']['system_name'];
          let timework = single['activitiesDetails']['activitydate'];
          let ram = single['activitiesDetails']['ram_info']
          let app_name = single['activitiesDetails']['app_name']
          let employee: onlineemp = new onlineemp(empname, empid, activeStatus, computer, timework, ram, app_name)
          arrayi.push(employee)
        }
        return arrayi
      })).subscribe((res) => {
        if (res.length === 0) this.lengthi = !this.lengthi
        this.arrayonlinemp = res
        console.log(this.arrayonlinemp);

        this.loading = !this.loading;
      })

  }
  openlivetracking(workerid: any) {
    // let url = this.service.url;
    window.open(`/livetrackingpage/${workerid}`, 'window Name', "height=400,width=1200,location=no,toolbar=no,menubar=no,scrollbars=yes,resizable=yes")
  }

}
