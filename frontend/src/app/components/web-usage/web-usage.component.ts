import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Appusage } from './../../models/appusage.model';
import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx'
import { DatePipe } from '@angular/common';
import { appservice } from '../app.service';
import * as moment from 'moment';
@Component({
  selector: 'app-web-usage',
  templateUrl: './web-usage.component.html',
  styleUrls: ['./web-usage.component.css']
})
export class WebUsageComponent implements OnInit {
  latestappdata: any = []
  loading: boolean = true;
  response: any[] = []
  startdate: any;
  enddate: any;
  paginatedata!: any[];
  pageSize: number = 10;
  page = 1;
  collectionSize!: number;

  constructor(private http: HttpClient, private datepipe: DatePipe, private service: appservice) { }

  ngOnInit(): void {
    let date: any = moment()
    this.startdate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.enddate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.webusesrequest(this.startdate, this.enddate)
    this.service.daterange.subscribe((res: any) => {
      this.latestappdata = []
      this.loading = true
      this.startdate = res['startdate']
      this.enddate = res['enddate']
      this.webusesrequest(this.startdate, this.enddate)
    })

  }

  refreshCountries() {
    this.paginatedata = this.latestappdata.slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
    console.log(this.latestappdata);
  }
  webusesrequest(startdate: any, enddate: any) {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<any[]>(`${url}/api/users/getWebUsesEmployeeList?startDate=${startdate}&endDate=${enddate}`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((response) => {
      this.response = response;
      this.latestappdata = response.map((data) => {
        let _id = data['_id']
        let empname = data['empname']
        let computer = data['system_name']
        let totalDuration = data['totalDuration']
        let usesPercentage = data['usesPercentage'] === null ? 0 : data['usesPercentage']
        let latestAppUsed = data['latestWebUsed']
        let activitydate = data['activitydate']
        let appuser = new Appusage(_id, latestAppUsed, empname, computer, activitydate, totalDuration, usesPercentage);
        return appuser
      })
      this.loading = false;
      this.collectionSize = this.latestappdata.length;
      this.paginatedata = this.latestappdata;
      this.refreshCountries();
      console.log(this.collectionSize);
    })

  }
  download(data: number) {
    let responce: any[] = this.response;
    var createXLSLFormatObj: any[] = [];
    // console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAA', (data));
    /* XLS Head Columns */
    var xlsHeader = ["Employee Name", "Web Application", 'Activity', "Usage Duration", "System Name", 'Activity Date'];
    createXLSLFormatObj.push(xlsHeader);
    // console.log(responce[data])
    // responce[data].forEach(data1 => {
    // let data:any[]=data1.activity
    responce[data]['activity'].forEach((value: { [x: string]: any; }) => {
      // console.log(value)
      let innerRowData: any[] = [];
      var exportData: any = {
        empname: responce[data]['empname'],
        app_name: value['app_name'],
        name: value['name'],
        duration: value['duration'],
        system_name: value['system_name'],
        activitydate: value['activitydate']
      }
      Object.values(exportData).forEach((val: any) => {
        // console.log(val)
        innerRowData.push(val);
      });
      createXLSLFormatObj.push(innerRowData);

    });
    var filename = `${responce[data]['empname']}_WebUsage.xlsx`;
    var ws_name = "EmployeeWebUsageSheet";
    if (typeof console !== 'undefined') console.log(new Date());
    var wb = XLSX.utils.book_new(),
      ws = XLSX.utils.aoa_to_sheet(createXLSLFormatObj);
    var wscols = [
      { width: 20 }, { width: 20 }, { width: 55 }, { width: 25 }, { width: 25 }, { width: 25 }, { width: 25 }
    ];

    ws['!cols'] = wscols;
    /* Add worksheet to workbook */
    XLSX.utils.book_append_sheet(wb, ws, ws_name);

    /* Write workbook and Download */
    if (typeof console !== 'undefined') console.log(new Date());
    XLSX.writeFile(wb, filename);
    if (typeof console !== 'undefined') console.log(new Date());

  }

}
