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

 this.http = http;

  }
  /* sendData() {
   this.http.get('https://www.reddit.com/r/gifs/new/.json?limit=10').map(res => res.json())
         .subscribe(data=> {
         this.result = data.data.children;
         console.log(this.result);
       }, err => {
           console.log("Oops!");
          }
       );
       } */
 
   start(){
   //this.sendData();
    this.locationTracker.startTracking();
  }
 
  stop(){
    this.locationTracker.stopTracking();
  }
 
}
