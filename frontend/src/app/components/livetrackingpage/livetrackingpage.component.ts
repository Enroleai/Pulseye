import { HttpClient } from '@angular/common/http';
import { appservice } from './../app.service';

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import * as moment from 'moment';
// import { Socket } from 'SocketIoModule';
import { SocketOne } from '../socket.service';
@Component({
  selector: 'app-livetrackingpage',
  templateUrl: './livetrackingpage.component.html',
  styleUrls: ['./livetrackingpage.component.css'],
  providers: [SocketOne]
})
export class LivetrackingpageComponent implements OnInit, OnDestroy {
  image: string = '';
  employeeid: string = '';
  name: String = '';
  systemid: String = '';
  date = moment().format('MMMM Do YYYY, h:mm:ss a');
  constructor(private socket: SocketOne, private router: ActivatedRoute, private service: appservice, private http: HttpClient) { }

  ngOnInit(): void {
    this.router.params.subscribe((params: Params) => {
      this.employeeid = params['empid']
    })
    this.socket.on("connect", () => {
      console.log("connected to the server");
    });
    this.socket.emit("subscribe", { data: 'data from angular' });
    this.socket.emit("interval is cleared") //connecting room also required valid token
    this.socket.on("image", (info: any) => {
      if (this.employeeid === info.workerID) {
        this.name = info.name;
        this.systemid = info.system_name;
        this.image = `data:image/jpeg;base64,${info.buffer}`
      }
    });
  }
  ngOnDestroy() {
    let url = this.service.url;
    this.http.post(`${url}/api/agent/removelisteners`, {}).subscribe(() => {
      console.log('component removed')
    })

  }
}
