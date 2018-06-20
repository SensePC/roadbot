import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { LocationTracker } from '../../providers/location-tracker';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';

 
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  public result: any;
  constructor(public navCtrl: NavController, public locationTracker: LocationTracker, public http: Http) {

 //this.http = http;

  }
  /* sendData() {
   this.http.get('http://192.168.1.4:8000/roadbot_b/data/').map(res => res.json())
         .subscribe(data=> {
         this.result = data.data.children;
         console.log(this.result);
       }, err => {
           console.log("Oops!");
          }
       );
   } */
 
  start(){
    this.locationTracker.startTracking();
  }
 
  stop(){
    this.locationTracker.stopTracking();
  }
 
}
