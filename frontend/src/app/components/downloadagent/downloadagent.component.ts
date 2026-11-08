import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { appservice } from '../app.service';

@Component({
  selector: 'app-downloadagent',
  templateUrl: './downloadagent.component.html',
  styleUrls: ['./downloadagent.component.css']
})
export class DownloadagentComponent implements OnInit {
  linkwindows: any;
  linklinux: any;

  constructor(private http: HttpClient, private service: appservice) { }

  ngOnInit(): void {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<any>(`${url}/api/users/getAgentTool`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((res) => {
      this.linkwindows = res['linkWindows']
      this.linklinux = res['linkLinux']
    })
  }

}
