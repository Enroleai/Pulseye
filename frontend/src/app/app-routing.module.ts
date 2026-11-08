import { LivetrackingpageComponent } from './components/livetrackingpage/livetrackingpage.component';
import { DownloadagentComponent } from './components/downloadagent/downloadagent.component';
import { TeamspageComponent } from './components/teamspage/teamspage.component';
import { DepartementpageComponent } from './components/departementpage/departementpage.component';
import { EmployeelistComponent } from './components/employeelist/employeelist.component';
import { IndexComponent } from './components/index/index.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ViolationComponent } from './components/violation/violation.component';
import { WebUsageComponent } from './components/web-usage/web-usage.component';
import { AppUsageComponent } from './components/app-usage/app-usage.component';
import { ProductivityComponent } from './components/productivity/productivity.component';
import { LoginpageComponent } from './components/loginpage/loginpage.component';
import { LatestsnapshotpagesComponent } from './components/latestsnapshotpages/latestsnapshotpages.component';
import { SnapshotbyidComponent } from './components/snapshotbyid/snapshotbyid.component';
import { MonitoringComponent } from './components/monitoring/monitoring.component';
import { LivetrackingComponent } from './components/livetracking/livetracking.component';
import { AddviolationComponent } from './components/addviolation/addviolation.component';
import { AuthGuard } from './auth.guard';

const routes: Routes = [
  { path: '', component: LoginpageComponent },
  {
    path: '',
    canActivateChild: [AuthGuard],
    children: [
      { path: 'productivity', component: ProductivityComponent },
      { path: 'appusage', component: AppUsageComponent },
      { path: 'latestsnapshots', component: LatestsnapshotpagesComponent },
      { path: 'webusage', component: WebUsageComponent },
      { path: 'violation', component: ViolationComponent },
      { path: 'index', component: IndexComponent },
      { path: 'latestsnap/:empid/:name', component: SnapshotbyidComponent },
      { path: 'employeelist', component: EmployeelistComponent },
      { path: 'departements', component: DepartementpageComponent },
      { path: 'teams', component: TeamspageComponent },
      { path: 'monitoring', component: MonitoringComponent },
      { path: 'downloadagent', component: DownloadagentComponent },
      { path: 'livetracking', component: LivetrackingComponent },
      { path: 'livetrackingpage/:empid', component: LivetrackingpageComponent },
      { path: 'addviolation', component: AddviolationComponent }
    ]
  }

];

@NgModule({
  declarations: [

  ],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
