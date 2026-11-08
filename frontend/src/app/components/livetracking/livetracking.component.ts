import { SocketOne } from './../socket.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as Peer from 'peerjs';
import { appservice } from '../app.service';

const PeerClient: any = (Peer as any).default || Peer;
@Component({
  selector: 'app-livetracking',
  templateUrl: './livetracking.component.html',
  styleUrls: ['./livetracking.component.css'],
  providers: [SocketOne]
})
export class LivetrackingComponent implements OnInit, OnDestroy {
  // @ViewChild('video') el!: ElementRef;
  onlineemps: any[] = []
  mypeer: any = new PeerClient(undefined, {
    host: 'localhost',
    port: 3001,
  });
  data: any;


  constructor(private socket: SocketOne, private http: HttpClient, private service: appservice) { }

  async ngOnInit() {
    let url = this.service.url;
    this.socket.on("connect", () => {
      console.log("connected to the server");
    });
    // console.log(this.mypeer)
    this.socket.emit("subscribe");
    // const stream = await navigator.mediaDevices.getDisplayMedia({
    //   video: true,
    //   audio: true
    // })
    // const id = "22797d17-379d-4053-9179-a95814c64976";
    // const call = this.mypeer.call(id, stream);
    // console.log(call, 'connect')
    // call.on('stream', (data: any) => {
    //   this.data = data;
    //   let videel: any = document.getElementById('video');
    //   videel.srcObject = data;
    //   // videel.play()
    //   // console.log(videel);
    // })

    this.socket.on("image", (info: any) => {
      if (!(this.onlineemps.filter(e => e.workerid === info.workerID).length > 0)) {
        // console.log()
        this.onlineemps.push({ workerid: info.workerID, imageurl: `data:image/jpeg;base64,${info.buffer}`, workername: info.name, systemname: info.system_name })
        // console.log(this.onlineemps)
      }
      else {
        this.onlineemps.map((res) => {
          if (res.workerid === info.workerID) {
            res.imageurl = `data:image/jpeg;base64,${info.buffer}`
          }
        })
      }
      console.log(this.onlineemps)
    })
  }
  openlivetracking(workerid: any) {
    // let url = this.service.url;
    window.open(`/livetrackingpage/${workerid}`, 'window Name', "height=400,width=1200,location=no,toolbar=no,menubar=no,scrollbars=yes,resizable=yes")
  }
  ngOnDestroy() {
    this.socket.removeAllListeners();
    let url = this.service.url;
    this.http.post(`${url}/api/agent/removelisteners`, {}).subscribe(() => {
      console.log('component removed')
    })
  }


}
