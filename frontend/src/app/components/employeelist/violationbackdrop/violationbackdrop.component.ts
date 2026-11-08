import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { map } from 'rxjs/operators';
import { employeemodel } from 'src/app/models/employee.model';
import { appservice } from '../../app.service';

@Component({
  selector: 'app-violationbackdrop',
  templateUrl: './violationbackdrop.component.html',
  styleUrls: ['./violationbackdrop.component.css'],
  encapsulation: ViewEncapsulation.None

})
export class ViolationbackdropComponent implements OnInit {

  closeResult: string | undefined;
  empnames: Array<string> = [];
  selectedemp: Array<string> = [];
  dropdownSettings: any;
  selectedWebsite: any;
  selectedApp: any;
  Webname: any[] = [];
  webNames: any[] = [];
  appNames: any[] = [];
  appName: any[] = [];
  constructor(private modalService: NgbModal, private http: HttpClient, private service: appservice) { }

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

  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  submitted(value: any) {
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    let url = this.service.url;
    console.log(value);
    this.http.post(`${url}/api/violations/createviolationweb`, {
      name: value.name[0],
      webname: value.webname
    }, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe(res => console.log(res)
    )
    this.http.post(`${url}/api/violations/createviolationapp`, {
      name: value.name[0],
      appname: value.appname
    }, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe(res => console.log(res)
    )
  }
  addTagFn(name: any) {
    return { name: name, tag: true };
  }

}
