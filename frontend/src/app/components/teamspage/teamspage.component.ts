import { NgForm } from '@angular/forms';
import { Team } from './../../models/team.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { appservice } from '../app.service';

@Component({
  selector: 'app-teamspage',
  templateUrl: './teamspage.component.html',
  styleUrls: ['./teamspage.component.css']
})
export class TeamspageComponent implements OnInit {

  closeResult: string | undefined;
  teams: Array<string> = [];
  departments: Array<string> = [];
  selectedTeam: Array<string> = [];
  selectedDepartment: Array<String> = [];
  dropdownSettings: any = {};
  closeDropdownSelection = false;
  disabled = false;
  teamsList: Team[] = [];
  isupdate: boolean = false;
  teamName = '';
  teamDesc = '';
  id = '';
  active!: boolean;
  deptid: string = '';
  search = '';

  constructor(private modalService: NgbModal, private service: appservice, private http: HttpClient) { }

  ngOnInit(): void {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<Array<string>>(`${url}/api/manegers/managernames`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((managers) => {
      this.teams = managers;
    });
    this.http.get<Array<string>>(`${url}/api/manegers/departementnames`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((departments) => {
      this.departments = departments;
    });
    this.dropdownSettings = {
      singleSelection: true,
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      allowSearchFilter: true,
      closeDropDownOnSelection: this.closeDropdownSelection
    };
    this.fetchTeams();
  }
  onItemSelect(item: any) {
    console.log('onItemSelect', item);
  }

  toggleCloseDropdownSelection() {
    this.closeDropdownSelection = !this.closeDropdownSelection;
    this.dropdownSettings = Object.assign({}, this.dropdownSettings, { closeDropDownOnSelection: this.closeDropdownSelection });
  }
  submitted(form: NgForm) {
    if (this.isupdate) {
      return this.updateTeams(this.id, this.teamName, this.teamDesc, this.teams[0], this.active)
    }

    this.createTeam(form.value.name, form.value.teamdesc, form.value.manager[0], form.value.deptname[0])
  }


  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }
  populateValues(content: any, team: Team) {
    this.isupdate = true;
    this.open(content);
    // this.selectedDepartment=team
    this.selectedTeam = [team['MANAGER']];
    this.teamName = team['TEAM_NAME'];
    this.teamDesc = team['TEAM_DESC'];
    this.active = team['IS_TEAM_ACTIVE'];
    this.id = team['_id'];
  }

  private getDismissReason(reason: any): string {
    this.isupdate = false;
    this.teamName = '';
    this.teamDesc = '';
    this.id = '';
    this.selectedTeam = [];
    this.selectedDepartment = [];
    // this.active;
    this.deptid = '';
    // search = '';
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }
  fetchTeams() {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.get<Team[]>(`${url}/api/manegers/teams`, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe((res) => {
      this.teamsList = res;
      console.log(this.teamsList);
    })

  }
  updateTeams(id: string, name: string, teamdesc: string, manager: string, active: boolean) {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.post(`${url}/api/manegers/updateteam`, {
      id, name, teamdesc, manager, active
    }, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe(res => this.fetchTeams());
  }
  createTeam(name: string, teamdesc: string, manager: string, deptname: string) {
    let url = this.service.url;
    let token = localStorage.getItem('x-auth-token')
    let t = JSON.parse(`${token}`)
    this.http.post(`${url}/api/manegers/createteam`, {
      name, teamdesc, manager, deptname
    }, {
      headers: new HttpHeaders({
        'x-auth-token': t
      })
    }).subscribe(res => this.fetchTeams());
  }



}
