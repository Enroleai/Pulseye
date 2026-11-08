import { HttpClient } from '@angular/common/http';
import { appservice } from './../app.service';
import { SocketOne } from './../socket.service';
import { Router } from '@angular/router';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';
import $ from 'jquery';

@Component({
    selector: 'app-topnav',
    templateUrl: './topnav.component.html',
    styleUrls: ['./topnav.component.css'],
    providers: [SocketOne],
    standalone: false
})
export class TopnavComponent implements OnInit {
  images = [700, 800, 807].map((n) => `https://picsum.photos/id/${n}/900/500`);
  settings = false;
  closeResult: string | undefined;
  image: any = "../../../assets/user.png";
  constructor(private router: Router, private modalService: NgbModal, private config: NgbCarouselConfig, private socket: SocketOne, private service: appservice, private http: HttpClient) {

  }
  open(content: any) {
    this.image = "../../../assets/user.png"
    this.settings = false
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title', size: "lg" }).result.then((result) => {
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


  ngOnInit(): void {
    this.config.interval = 2000;
   
    $(".mobile-menu").click(function(){
     
      $(".wrapper").toggle();
    
    });
   
  }
  mblock:boolean=false
  navMobActive(){
   this.mblock=true;
  }
  isShown: boolean = true ;
  toggleShow() {

    this.isShown = ! this.isShown;
    
    }
  
  settingclicker() {
    this.settings = !this.settings;
  }
  logout() {
    localStorage.clear();
    this.router.navigate(['/']);
  }
  upload(element: HTMLInputElement) {
    element.click()

  }
  uploadfile(value: any) {
    let reader = new FileReader();
    reader.readAsDataURL(value.target.files[0])
    reader.onload = (event: any) => { // called once readAsDataURL is completed
      this.image = event.target.result;
    }
    console.log(this.image)
  }


}
