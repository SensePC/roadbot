import { Injectable, NgZone } from '@angular/core';
import { BackgroundGeolocation, BackgroundGeolocationConfig } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';
import { Http } from '@angular/http';
// import { Headers, RequestOptions } from '@angular/http';
import {TextToSpeech} from '@ionic-native/text-to-speech';


@Injectable()
export class LocationTracker {

  public watch: any;
  public lat: number = 0;
  public lng: number = 0;
  public data: any = {};
  
  // text to speech var
  public text: string;
  public alert_executed: number;
  public safe_executed: number;

  // Define ionic card's variables
  public info: string = '';
  public cause: string = '';
  public str_addr: string = '';
  public accid_num: number = 0;

  constructor(public zone: NgZone,
              public backgroundGeolocation: BackgroundGeolocation,
	      public geolocation:Geolocation,
              private tts: TextToSpeech,
              public http: Http
	     ) {
  
      this.http = http;
 
      // setting tts var
      this.text = 'Initial text';
      this.alert_executed = 1;
      this.safe_executed = 1;
 
   }
 
  // Function to play Alert responded text (database results)
  playAlertText(info, cause, str_addr) {
      this.text = 'Alert. Many car accidents have been happened in ' + str_addr + ' area because of ' + cause;
      console.log(this.text);
      this.tts.speak({
      text: this.text
      })
        .then(() => console.log('Success'))
        .catch((reason: any) => console.log(reason));
      }

   // Function to play Safe responded text (database results)
   playSafeText() {
       this.text = 'You are driving in a safe area'
       console.log(this.text);
       this.tts.speak({
           text: this.text
        })
        .then(() => console.log('Success'))
        .catch((reason: any) => console.log(reason));
      }
         

  // Retrive accidents' data from the mobile_backend database
  getData(coords) {
    /*var headers = new Headers();
    headers.append('Access-Control-Allow-Origin' , '*');
    headers.append('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT');
    headers.append('Accept','application/json');
    headers.append('content-type','application/json');
    let options = new RequestOptions({ headers:headers,withCredentials: true}); */
    var link = 'http://147.27.31.219:81/roadbot_b/data/';
    
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
         // playText calls functionality
         if (this.info == 'Alert' && this.alert_executed == 1) {
             this.playAlertText(this.info, this.cause, this.str_addr)
             // convert alert_executed to 0 in order to not playAlertText
             // function be able to executed more than once
             this.alert_executed = 0;
             // convert safe_executed to 1 in order to be able
             // the playSafeText function to be executed after the driver
             // comes out from the danger zone
             this.safe_executed = 1;
             }
         if (this.info == 'You are safe' && this.safe_executed == 1) {
             this.playSafeText()
             this.safe_executed = 0;
             this.alert_executed = 1;
         }
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
