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

  constructor(public zone: NgZone,
              public backgroundGeolocation: BackgroundGeolocation,
	      public geolocation:Geolocation,
              public http: Http
	     ) {
     
      this.data.response = '';
      this.http = http;
  
  }
  
  // GET data
  getData(coords) {
    /*var headers = new Headers();
    headers.append('Access-Control-Allow-Origin' , '*');
    headers.append('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT');
    headers.append('Accept','application/json');
    headers.append('content-type','application/json');
    let options = new RequestOptions({ headers:headers,withCredentials: true}); */
    
    var link = 'http://192.168.1.4:8000/roadbot_b/data/';
    this.http.get(link, coords).map(res => res.json())
         .subscribe(data=> {
         this.data.response = data;
         console.log(this.data.response);
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
        //this.data = this.data.response;
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
        //this.data = 'hello world';
      });
 
      // send the data
      var latlng = {lat: this.lat, lng: this.lng}
      var myData = JSON.stringify(latlng);

      this.getData(myData);
  
     /* this.http.post(link, myData)
        .subscribe(data => {
          this.data.response = data["_body"];
         // console.log(this.data.response);
        }, error => {
         console.log("Oooops!");
      });*/
   
    });  


  }

  stopTracking() {

    console.log('stopTracking');
 
    this.backgroundGeolocation.finish();
    this.watch.unsubscribe();

  }

}