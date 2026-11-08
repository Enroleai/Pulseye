import { map } from 'rxjs/operators';
import { onlineemp } from './../../../models/onlineemp.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { appservice } from '../../app.service';

@Component({
  selector: 'app-employeonli',
  templateUrl: './employeonli.component.html',
  styleUrls: ['./employeonli.component.css']
})
export class EmployeonliComponent implements OnInit {
  loading: boolean = true;
  employeeonline: onlineemp[] = []
  addlivebutton = (num: string) => {
    var empid = num;
    localStorage.setItem('activeEmp', num);
    window.open('/live?empid=' + empid + '', 'window Name', "height=400,width=1200,top=200,left=300");
  }
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


  constructor(private http: HttpClient, private service: appservice) { }

  ngOnInit(): void {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<any[]>(`${url}/api/users/getOnlineUserInfo`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).pipe(map((emps) => {
      let arrayi: onlineemp[] = []
      for (let single of emps) {
        let empname = single['name']
        let activeStatus = single['activeStatus']
        let empid = single['employeeid']
        let computer = single['activitiesDetails']['system_name']
        let timework = this.converttime(+single['activitiesDetails']['entrytime'])
        let ram = single['activitiesDetails']['ram_info']
        let app_name = single['activitiesDetails']['app_name']
        let employee: onlineemp = new onlineemp(empname, empid, activeStatus, computer, timework, ram, app_name)
        // console.log(employee)
        arrayi.push(employee)
      }
      return arrayi


    })).subscribe((data) => {
      this.employeeonline = data
      this.loading = true;
      console.log(data)

    })

  }

}
