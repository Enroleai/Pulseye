import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidenavbar',
  templateUrl: './sidenavbar.component.html',
  styleUrls: ['./sidenavbar.component.css']
})
export class SidenavbarComponent implements OnInit {


  constructor() {
    
   }

  ngOnInit(): void {
  }
  isShown: boolean = true ;
  toggleShow() {

    this.isShown = ! this.isShown;
    
    }

  showDiv = {
    previous : false,
    
  }
}
