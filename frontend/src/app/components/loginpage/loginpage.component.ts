import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { appservice } from '../app.service';

@Component({
  selector: 'app-loginpage',
  templateUrl: './loginpage.component.html',
  styleUrls: ['./loginpage.component.css']
})
export class LoginpageComponent implements OnInit {
  @ViewChild('login') login: NgForm | undefined;
  @ViewChild('resetpage') reset: NgForm | undefined;
  error = false;
  resetpage = false;
  message = '';
  token: any = '';
  check:boolean=false;
  constructor(private http: HttpClient, private router: Router, private service: appservice) {
    
   }

  ngOnInit(): void {
    localStorage.clear()
  }
  changingpages() {
    this.resetpage = !this.resetpage
    console.log(this.resetpage);
          this.check = true;
 
  }

  loginpage() {
    let url = this.service.url;
    let user = {
      email: this.login?.value.email,
      password: this.login?.value.password
    }
    console.log(user);

    fetch(`${url}/api/login/managerLogin`, {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },

      //make sure to serialize your JSON body
      body: JSON.stringify({ user }),
    }).then((a) => {
      if (a.status !== 200) {
        return
      };
      if (a.headers.get('x-auth-token')) {
        this.token = a.headers.get('x-auth-token')
        // console.log(this.token)
        localStorage.setItem('x-auth-token', JSON.stringify(a.headers.get('x-auth-token')))
        // this.service.logintoken.next(this.token)
        this.router.navigate(['/index'])
      }
      return a.json(); // call the json method on the response to get JSON
    }).then((response) => {
      console.log('AAAAAAAAAAAAAAAAAAAAAAAA', response)
      if (response.status === false) {
        this.error = !this.error
        this.message = response.msg;
        return;
      }
      console.log(response);
    }).catch((error) => {
      console.log('this', error)
      if (error) this.message = 'something went wrong '
    });


  }
  resetform() {
    let url = this.service.url;
    const email = this.reset?.value.email.trim()
    const oldpassword = this.reset?.value.oldpassword.trim();
    const newpassword = this.reset?.value.newpassword.trim();
    const confirmpassword = this.reset?.value.confirmpassword.trim();
    // if(email || email==='') this.message='please enter valid email'
    // if(!oldpassword || oldpassword=='') this.message='please enter password'
    // if (!email || email === '') {
    //     this.message = 'Please enter email';
    //     document.getElementById('erroremail').style.display = 'block';
    //     return;
    // } else {
    //     document.getElementById('erroremail').style.display = 'none';
    // }
    // if (!oldpassword || oldpassword === '') {
    //     document.getElementById('errorold').innerHTML = 'Please enter password';
    //     document.getElementById('errorold').style.display = 'block';
    //     return;
    // } else {
    //     document.getElementById('errornew').style.display = 'none';
    // }
    // if (!newpassword || newpassword === '') {
    //     document.getElementById('errornew').innerHTML = 'Please enter password';
    //     document.getElementById('errornew').style.display = 'block';
    //     return;
    // } else {
    //     document.getElementById('errornew').style.display = 'none';
    // }
    // if (!confirmpassword || confirmpassword === '') {
    //     document.getElementById('errorconfirm').innerHTML = 'Please enter password';
    //     document.getElementById('errorconfirm').style.display = 'block';
    //     return;
    // } else {
    //     document.getElementById('errorconfirm').style.display = 'none';
    // }
    // if (confirmpassword !== newpassword) {
    //     document.getElementById('errorconfirm').innerHTML = 'Confirm password not matched!';
    //     document.getElementById('errorconfirm').style.display = 'block';
    //     return;
    // } else {
    //     document.getElementById('errorconfirm').style.display = 'none';
    // }
    const user = {
      email,
      password: oldpassword,
      newpassword
    };

    fetch(`${url}/api/login/managerChangePassword`, {
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user }),
    }).then(function (a) {
      if (a.status !== 200) return
      return a.json(); // call the json method on the response to get JSON
    }).catch(() => {
      this.message = 'Invalid Email or Password'
    })
    // .then((response) => {
    //     if (response.status === true) {
    //         window.location.replace("/");
    //     }
    //     if (response.status === false) {
    //         error.innerHTML = response.msg;
    //     }
    //     // if (response.status) {
    //     //     window.location.replace("/");
    //     // }
    // });

    console.log(this.reset?.value)
  }
  cancel() {
    this.resetpage = !this.resetpage;
    this.check=false;
  }
}
