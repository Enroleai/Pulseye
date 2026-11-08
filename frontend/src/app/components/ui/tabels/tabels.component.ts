import { Productivity } from './../../../models/productivity.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { appservice } from '../../app.service';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-tabels',
  templateUrl: './tabels.component.html',
  styleUrls: ['./tabels.component.css']
})
export class TabelsComponent implements OnInit {
  loading = false;
  productivitydata: Productivity[] = [];
  startdate: any;
  enddate: any;
  response: any[] = [];
  paginatedata: any;
  page: number = 1;
  pageSize: number = 10;
  collectionSize!: number;
  constructor(private http: HttpClient, private service: appservice, private datepipe: DatePipe) { }

  refreshCountries() {
    this.paginatedata = this.productivitydata.slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
  }

  ngOnInit(): void {
    let date: any = moment()
    this.startdate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.enddate = this.datepipe.transform(date._d, 'yyyy-MM-dd')
    this.productivitydatarequest(this.startdate, this.enddate)
    this.service.daterange.subscribe((res: any) => {
      this.productivitydata = []
      this.loading = false
      console.log(res)
      this.startdate = res['startdate']
      this.enddate = res['enddate']
      this.productivitydatarequest(this.startdate, this.enddate)
    })


  }
  productivitydatarequest(startdate: any, enddate: any) {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<Productivity[]>(`${url}/api/users/getProductivityEmployeeList?startDate=${startdate}&endDate=${enddate}`, {
      headers: new HttpHeaders({

        'x-auth-token': t

      })
    }).subscribe((data) => {
      this.response = data;
      this.productivitydata = data.map(data => {
        let _id = data['_id']
        let empname = data['empname']
        let activitydata = data['activitydate']
        let system_name = data['system_name']
        let totalDuration = data['totalDuration']
        let productivityPercentage = data['productivityPercentage']
        let productivity = new Productivity(_id, activitydata, empname, system_name, totalDuration, productivityPercentage)
        return productivity
      })
      this.loading = true;
      this.collectionSize = this.productivitydata.length;
      this.paginatedata = this.productivitydata;
      this.refreshCountries();
    })

  }
  download(data: number) {
    let responce: any[] = this.response;
    var createXLSLFormatObj: any[] = [];
    // console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAA', (data));
    /* XLS Head Columns */
    var xlsHeader = ["Employee Name", " Application", 'Activity', "Usage Duration", "System Name", 'Activity Date'];
    createXLSLFormatObj.push(xlsHeader);
    console.log(responce[data])
    // responce[data].forEach(data1 => {
    // let data:any[]=data1.activity
    responce[data]['activity'].forEach((value: { [x: string]: any; }) => {
      console.log(value)
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
        console.log(val)
        innerRowData.push(val);
      });
      createXLSLFormatObj.push(innerRowData);

    });
    var filename = `${responce[data]['empname']}_Productivity.xlsx`;
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
