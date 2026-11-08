import { DesktopApp } from './models/desktop.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { map } from 'rxjs/operators';
import { employeemodel } from 'src/app/models/employee.model';
import { appservice } from '../app.service';
import { Website } from './models/website.model';

@Component({
  selector: 'app-addviolation',
  templateUrl: './addviolation.component.html',
  styleUrls: ['./addviolation.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AddviolationComponent implements OnInit {

  empnames: Array<string> = [];
  selectedemp: Array<string> = [];
  dropdownSettings: any;
  selectedWebsite: any;
  selectedApp: any;
  Webname: any[] = [];
  webNames: any[] = [];
  appNames: any[] = [];
  appName: any[] = [];
  violationsites: Website[] = [];
  violationapps: DesktopApp[] = [];
  message: string = '';
  isalert: boolean = false;
  alerttype: string = '';
  constructor(private http: HttpClient, private service: appservice) { }

  ngOnInit(): void {
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    let url = this.service.url;

    this.http.get<any[]>(`${url}/api/violations/websites`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((res) => {
      this.webNames = res;
      this.webNames.forEach((c, i) => {
        this.Webname.push({ id: i, name: c });
      });
    })

    this.http.get<any[]>(`${url}/api/violations/desktopapps`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((res) => {
      this.appNames = res;
      this.appNames.forEach((c, i) => {
        this.appName.push({ id: i, name: c });
      });
    })


    this.dropdownSettings = {
      singleSelection: true,
      selectAllText: "Select All",
      unSelectAllText: "UnSelect All",
      allowSearchFilter: true,
      closeDropDownOnSelection: true
    }


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
    })).subscribe((res) => {
      this.empnames = res.map((emp) => {
        return emp['name']
      })
    })


  }

  submitted(value: any) {
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    let url = this.service.url;
    console.log(value);
    // console.log(this.selectedApp);

    this.http.post<any>(`${url}/api/violations/createviolationweb`, {
      name: value.name[0],
      webname: this.selectedWebsite ? this.selectedWebsite : []
    }, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe(res => {
      if (res['status']) {
        this.alerttype = "warning";
        this.message = "website already exists for user!"
        this.isalert = true;
        return
      }
      console.log(res)
    }
    )
    this.http.post<any>(`${url}/api/violations/createviolationapp`, {
      name: value.name[0],
      appname: this.selectedApp ? this.selectedApp : []
    }, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe(res => {
      if (res['status']) {
        this.alerttype = "warning";
        this.message = "app already exists for user!"
        this.isalert = true;
        return
      }

      if (!this.isalert) {
        console.log(this.isalert)
        this.isalert = true;
        this.alerttype = "success"
        this.message = "successfully created !!"
      }
    }

    )
    setTimeout(() => {
      this.isalert = false;
      this.alerttype = '';
      this.message = ''
      this.getviolationdesktopapp(this.selectedemp[0]);
      this.getviolationwebsites(this.selectedemp[0]);
    }, 5000);

    this.updateDataAgent();

  }

  updateDataAgent() {
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    let url = this.service.url;
    this.http.post(`${url}/api/agent/violations`, { name: this.selectedemp[0] }, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe(res => { })
  }



  addTagFn(name: any) {
    return { name: name, tag: true };
  }

  getviolationwebsites(name: any) {
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    let url = this.service.url;
    this.http.get<Website[]>(`${url}/api/violations/getwebsite/${name}`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((res) => {
      this.violationsites = res;
      this.webNames = this.webNames.filter(val => !res.find(v => v['name'].includes(val)));
    })
  }


  getviolationdesktopapp(name: any) {
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    let url = this.service.url;
    this.http.get<DesktopApp[]>(`${url}/api/violations/getdesktop/${name}`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((res) => {
      console.log(res);

      this.violationapps = res;
      this.appNames = this.appNames.filter(val => !res.find(v => v['name'].includes(val)));
    })
  }
  onItemSelect(name: any) {
    this.getviolationdesktopapp(name);
    this.getviolationwebsites(name);
  }
  updateapp(id: string, status: boolean) {
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    let url = this.service.url;
    this.http.post(`${url}/api/violations/updateviolationapp`, { active: status, id: id }, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((res) => {
      console.log(res);
      this.getviolationdesktopapp(this.selectedemp[0]);
      this.updateDataAgent();
    })

  }

  updatesite(id: string, status: boolean) {

    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    let url = this.service.url;
    this.http.post(`${url}/api/violations/updateviolationsite`, { active: status, id: id }, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((res) => {
      console.log(res);
      this.getviolationwebsites(this.selectedemp[0]);
      this.updateDataAgent();
    })

  }

}
