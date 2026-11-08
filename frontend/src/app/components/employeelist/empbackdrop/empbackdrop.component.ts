import { NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
// import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { appservice } from '../../app.service';
// import { from } from 'rxjs';

@Component({
  selector: 'app-empbackdrop',
  templateUrl: './empbackdrop.component.html',
  styleUrls: ['./empbackdrop.component.css']
})
export class EmpbackdropComponent implements OnInit {
  @ViewChild('form') form: NgForm | undefined


  closeResult: string | undefined;
  totallicenses: any[] = []


  constructor(private modalService: NgbModal, private http: HttpClient, private service: appservice) { }

  open(content: any) {
    this.getlicenses();
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
      this.totallicenses = [];
      this.getlicenses();
      return `with: ${reason}`;
    }
  }
  ngOnInit() {
    this.getlicenses();
  }

  getlicenses() {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<any[]>(`${url}/api/manegers/getLicenses`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((response) => {
      this.totallicenses = response.map(res => res['licenseKey'])
      console.log(this.totallicenses);


    })
  }
  submitted(value: any) {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    const body = {
      name: value.empname,
      licenseKey: value.emplicense,
      email: value.email,
    }

    console.log(body)
    if (value.emplicense === 'No licences found') return
    if (value.empname === '') return
    if (value.email === '') return
    this.http.post(`${url}/api/manegers/createWorker`, body, {
      headers: new HttpHeaders({
        'x-auth-token': t

      })
    }).subscribe(res => {
      this.service.submitted.next('submitted');

    })
    this.getlicenses();
  }


}
