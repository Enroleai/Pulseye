import { Departement } from './../../models/departement.model';
import { NgForm } from '@angular/forms';
import { Component, OnInit, ContentChild, ElementRef, TemplateRef, ViewChild, ViewContainerRef, ViewChildren, AfterViewInit } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { appservice } from '../app.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-departementpage',
  templateUrl: './departementpage.component.html',
  styleUrls: ['./departementpage.component.css']
})
export class DepartementpageComponent implements OnInit {
  @ViewChild('modalContentBody', { read: ViewContainerRef }) formc!: ElementRef;
  closeResult: string | undefined;
  managers: Array<String> = [];
  selectedItem: Array<String> = [];
  dropdownSettings: any = {};
  closeDropdownSelection = false;
  disabled = false;
  update = false;
  deptname: string = '';
  deptdesc: string = '';
  departmentsList: Departement[] = [];
  active!: Boolean;
  search: string = '';
  id: any;
  page = 1;
  pageSize = 8;
  collectionSize!: number;
  paginatedata: Departement[] = [];
  // countries: Country[];

  constructor(private modalService: NgbModal, private service: appservice, private http: HttpClient) {
    // this.refreshCountries();

  }
  refreshCountries() {
    this.paginatedata = this.departmentsList.slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
    console.log(this.departmentsList);
  }


  ngOnInit(): void {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)

    this.http.get<Array<string>>(`${url}/api/manegers/managernames`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((managers) => {
      this.managers = managers;
    })
    this.dropdownSettings = {
      "singleSelection": false,
      "defaultOpen": false,
      "idField": "item_id",
      "textField": "item_text",
      "selectAllText": "Select All",
      "unSelectAllText": "UnSelect All",
      "enableCheckAll": true,
      "itemsShowLimit": 3,
      "allowSearchFilter": true
    }
    this.fetchDepartements();
  }

  onItemSelect(item: any) {
    console.log('onItemSelect', item);
  }

  toggleCloseDropdownSelection() {
    this.closeDropdownSelection = !this.closeDropdownSelection;
    this.dropdownSettings = Object.assign({}, this.dropdownSettings, { closeDropDownOnSelection: this.closeDropdownSelection });
  }
  submitted(form: NgForm) {

    if (this.update) {
      this.updateDepartments(this.id, this.deptname, this.deptdesc, this.selectedItem, this.active)
      return
    }
    this.createDepartment(form.value.name, form.value.deptdesc, form.value.managers);
  }

  open(content: TemplateRef<ElementRef>) {
    // console.log(content);
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      this.update = false;
    });
  }

  private getDismissReason(reason: any): string {
    this.update = false;
    this.selectedItem = [];
    this.deptname = '';
    this.deptdesc = '';
    this.active = true;

    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }

  }
  populatedata(mymodal: any, departement: Departement) {
    this.update = true;
    this.open(mymodal)
    this.selectedItem = departement['MANAGERS'];
    this.deptname = departement['DEPT_NAME'];
    this.deptdesc = departement['DEPT_DESC'];
    this.active = departement['IS_DEPT_ACTIVE'];
    this.id = departement['_id']

  }
  fetchDepartements() {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<Departement[]>(`${url}/api/manegers/departements`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((res) => {
      this.departmentsList = res;
      // console.log(this.departmentsList);
      this.collectionSize = this.departmentsList.length;
      this.paginatedata = this.departmentsList;
      this.refreshCountries();
      console.log(this.collectionSize);
    })

  }
  updateDepartments(id: any, name: string, deptdesc: string, managers: Array<String>, active: Boolean) {
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    let url = this.service.url;
    this.http.post(`${url}/api/manegers/updatedepartement`, {
      id, name, deptdesc, managers, active
    }, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe(res => this.fetchDepartements());
  }
  createDepartment = async (name: string, deptdesc: string, managers: Array<String>) => {
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)

    let url = this.service.url;
    this.http.post(`${url}/api/manegers/createdepartement`, {
      name, deptdesc, managers
    }, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe(res =>
      this.fetchDepartements()
    );
    // this.fetchDepartements();
  }
}
