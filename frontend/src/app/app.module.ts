import { SocketOne } from './components/socket.service';
// import { from } from 'rxjs'; 
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { IndexComponent } from './components/index/index.component';
import { TopnavComponent } from './components/topnav/topnav.component';
import { SidenavbarComponent } from './components/sidenavbar/sidenavbar.component';
import { CardComponent } from './components/ui/card/card.component';
import { TabelsComponent } from './components/ui/tabels/tabels.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { LoginpageComponent } from './components/loginpage/loginpage.component'
import { FormsModule } from '@angular/forms';
import { AppUsageComponent } from './components/app-usage/app-usage.component';
import { LoadingspinnerComponent } from './components/ui/loadingspinner/loadingspinner.component';
import { LatestsnapshotComponent } from './components/index/latestsnapshot/latestsnapshot.component';
import { WebUsageComponent } from './components/web-usage/web-usage.component';
import { ViolationComponent } from './components/violation/violation.component';
import { LatestsnapshotpagesComponent } from './components/latestsnapshotpages/latestsnapshotpages.component';
import { ProductivityComponent } from './components/productivity/productivity.component';
import { EmployeelistComponent } from './components/employeelist/employeelist.component';
import { EmpbackdropComponent } from './components/employeelist/empbackdrop/empbackdrop.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { OnlineempComponent } from './components/index/onlineemp/onlineemp.component';
import { EmployeonliComponent } from './components/index/employeonli/employeonli.component';
import { ActivitylogComponent } from './components/index/activitylog/activitylog.component';
import { Loadingspinner2Component } from './components/ui/loadingspinner2/loadingspinner2.component';
import { ProductivitygraphComponent } from './components/index/productivitygraph/productivitygraph.component';
import { AppusagegraphComponent } from './components/index/appusagegraph/appusagegraph.component';
import { WebusagegraphComponent } from './components/index/webusagegraph/webusagegraph.component';
import { ViolationgraphComponent } from './components/index/violationgraph/violationgraph.component';
// import { ChartsModule } from 'ng2-charts';
import { ProductivitygraphpageComponent } from './components/productivity/productivitygraphpage/productivitygraphpage.component';
import { ViolationgraphpageComponent } from './components/violation/violationgraphpage/violationgraphpage.component';
import { WebusagegrpahpageComponent } from './components/web-usage/webusagegrpahpage/webusagegrpahpage.component';
import { AppusesgraphpageComponent } from './components/app-usage/appusesgraphpage/appusesgraphpage.component';
import { CustomRangesComponent } from './components/ui/custom-ranges/custom-ranges.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { DatePipe } from '@angular/common';
import { DepartementpageComponent } from './components/departementpage/departementpage.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { TeamspageComponent } from './components/teamspage/teamspage.component';
import { SnapshotbyidComponent } from './components/snapshotbyid/snapshotbyid.component';
import { MonitoringComponent } from './components/monitoring/monitoring.component';
import { DrpickerComponent } from './components/ui/drpicker/drpicker.component';
import { DownloadagentComponent } from './components/downloadagent/downloadagent.component';
import { LivetrackingComponent } from './components/livetracking/livetracking.component';
import { SocketIoModule } from 'ngx-socket-io';
import { LivetrackingpageComponent } from './components/livetrackingpage/livetrackingpage.component';
import { PluckPipe } from './pluck.pipe';
import { ViolationbackdropComponent } from './components/employeelist/violationbackdrop/violationbackdrop.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { AddviolationComponent } from './components/addviolation/addviolation.component';
import { FilterPipe } from './filter.pipe';

// localStorage.clear();


@NgModule({ declarations: [
        AppComponent,
        IndexComponent,
        TopnavComponent,
        SidenavbarComponent,
        CardComponent,
        TabelsComponent,
        LoginpageComponent,
        AppUsageComponent,
        LoadingspinnerComponent,
        LatestsnapshotComponent,
        WebUsageComponent,
        ViolationComponent,
        LatestsnapshotpagesComponent,
        ProductivityComponent,
        EmployeelistComponent,
        EmpbackdropComponent,
        OnlineempComponent,
        EmployeonliComponent,
        ActivitylogComponent,
        Loadingspinner2Component,
        ProductivitygraphComponent,
        AppusagegraphComponent,
        WebusagegraphComponent,
        ViolationgraphComponent,
        ProductivitygraphpageComponent,
        ViolationgraphpageComponent,
        WebusagegrpahpageComponent,
        AppusesgraphpageComponent,
        CustomRangesComponent,
        DepartementpageComponent,
        TeamspageComponent,
        SnapshotbyidComponent,
        MonitoringComponent,
        DrpickerComponent,
        DownloadagentComponent,
        LivetrackingComponent,
        LivetrackingpageComponent,
        PluckPipe,
        ViolationbackdropComponent,
        AddviolationComponent,
        FilterPipe
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        FormsModule,
        NgbModule,
        // ChartsModule,
        NgxDaterangepickerMd.forRoot(),
        NgMultiSelectDropDownModule.forRoot(),
        SocketIoModule,
        NgSelectModule], providers: [DatePipe, provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }
