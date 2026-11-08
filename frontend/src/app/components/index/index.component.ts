import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { map } from 'rxjs/internal/operators/map';
import { employeemodel } from 'src/app/models/employee.model';
import { appservice } from '../app.service';

@Component({
    selector: 'app-index',
    templateUrl: './index.component.html',
    styleUrls: ['./index.component.css'],
    standalone: false
})
export class IndexComponent implements OnInit, OnDestroy {
  online: number = 0;
  offline: number = 0;
  response: employeemodel[] = [];
  // token:string |null=''
  constructor(private service: appservice, private http: HttpClient) { }

  ngOnInit(): void {
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    let url = this.service.url;
    this.http.get<employeemodel[]>(`${url}/api/manegers/workers`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).pipe(map((res) => {
      let emp2: employeemodel[] = []
      for (let employee of res) {
        let _id = employee['_id']
        let name = employee['name']
        let email = employee['email']
        let lastLoginDate = employee['lastLoginDate']
        let employeeonboarddate = employee['employeeonboarddate']
        let employeeoffboarddate = employee['employeeoffboarddate']
        let licenseKey = employee['licenseKey']
        let activestatus = employee['activeStatus']
        let emp = new employeemodel(_id, name, email, lastLoginDate, employeeonboarddate, employeeoffboarddate, licenseKey, activestatus)
        emp2.push(emp)
      }
      return emp2
    })).subscribe((response) => {
      let offline = response.filter(val => val['activeStatus'] === 'offline');
      let online = response.filter(val => val['activeStatus'] === 'online');
      this.online = online.length;
      this.offline = offline.length;


    })

    // this.service.onlinenumber.subscribe((res) => {
    //   this.online = res
    // })
    // this.service.offlinenumber.subscribe((res) => {
    //   this.offline = res;
    // })
  }
  scroll() {
    window.scrollTo(0, document.body.scrollHeight)
  }
  ngOnDestroy() {
    let url = this.service.url;
    this.http.post(`${url}/api/agent/removelisteners`, {}).subscribe(() => {
      console.log('component removed')
    })
  }

}
