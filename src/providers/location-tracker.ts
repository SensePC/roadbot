import { Injectable, NgZone } from '@angular/core';
import { BackgroundGeolocation, BackgroundGeolocationConfig } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import { Http } from '@angular/http';
// import { Headers, RequestOptions } from '@angular/http';

@Injectable()
export class LocationTracker {

  public watch: any;
  public lat: number = 0;
  public lng: number = 0;
  public data: any = {};

  // Define ionic card's variables
  public info: string = '';
  public cause: string = '';
  public str_addr: string = '';
  public accid_num: number = 0;

  constructor(public zone: NgZone,
              public backgroundGeolocation: BackgroundGeolocation,
	      public geolocation:Geolocation,
              public http: Http
	     ) {
  
      this.http = http;
 
   }

  // Retrive accidents' data from the mobile_backend database
  getData(coords) {
    /*var headers = new Headers();
    headers.append('Access-Control-Allow-Origin' , '*');
    headers.append('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT');
    headers.append('Accept','application/json');
    headers.append('content-type','application/json');
    let options = new RequestOptions({ headers:headers,withCredentials: true}); */
    
    var link = 'http://192.168.1.4:8000/roadbot_b/data/';
    // We use .map function in order to be able to use json response
    // as a single array (data)
    this.http.get(link, {params: coords}).map(res => res.json())
         .subscribe(data=> {
         // assign card's variables to the responded array
         this.info = data[0];
         this.cause = data[1];
         this.str_addr = data[2];
         this.data.accid_num = data[3];
         console.log(this.cause);
         // Run update inside of Angular's zone in order to display on the screen
         this.zone.run(() => {
           this.info = data[0];
           this.cause = data[1];
           this.str_addr = data[2];
           this.accid_num = data[3];
         
         });
     
       }, err => {
           console.log(err);
          }
       );
 }
 startTracking() {
    // Background Tracking
 
    let config: BackgroundGeolocationConfig = {
      desiredAccuracy: 0,
      stationaryRadius: 20,
      distanceFilter: 10,
      debug: true,
      interval: 2000
    };
 
    this.backgroundGeolocation.configure(config).subscribe((location) => {
 
      console.log('BackgroundGeolocation:  ' + location.latitude + ',' + location.longitude);
 
      // Run update inside of Angular's zone
      this.zone.run(() => {
        this.lat = location.latitude;
        this.lng = location.longitude;
      });
 
    }, (err) => {
 
      console.log(err);
 
    });
 
    // Turn ON the background-geolocation system.
    this.backgroundGeolocation.start();
 
 
    // Foreground Tracking
 
    let options = {
      frequency: 3000,
      enableHighAccuracy: true
    };
 
    this.watch = this.geolocation.watchPosition(options).filter((p: any) => p.code === undefined).subscribe((position: Geoposition) => {
 
      console.log(position);
 
      this.zone.run(() => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
      });
 
      // send the data
      var latlng = {lat: this.lat, lng: this.lng}

      this.getData(latlng);
  
    });  


  }

  stopTracking() {

    console.log('stopTracking');
 
    this.backgroundGeolocation.finish();
    this.watch.unsubscribe();

  }

}
