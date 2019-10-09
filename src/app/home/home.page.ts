import { NgZone } from '@angular/core';
import { Component } from '@angular/core';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderOptions, NativeGeocoderResult } from '@ionic-native/native-geocoder/ngx';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { HttpClient } from '@angular/common/http';
// import leaflet from 'leaflet';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  geoLatitude: number;
  geoLongitude: number;
  geoAccuracy:number;
  geoAddress: string;

  watchLocationUpdates:any; 
  loading:any;
  isWatching:boolean;

  public pull: any;
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


  //Geocoder configuration
  geoencoderOptions: NativeGeocoderOptions = {
    useLocale: true,
    maxResults: 5
  };
  constructor(
    public zone: NgZone,
    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder,
    private tts: TextToSpeech,
    public http: HttpClient
  ) {
    
  }

  // Function to play Alert responded text (database results)
  playAlertText(info, cause, str_addr) {
    this.text = 'Alert. Many car accidents have happened in ' + str_addr + ' area because of ' + cause;
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
     this.pull = this.http.get(link, {params: coords})
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
    

    //Get current coordinates of device
    getGeolocation(){
      this.geolocation.getCurrentPosition().then((resp) => {
        this.geoLatitude = resp.coords.latitude;
        this.geoLongitude = resp.coords.longitude; 
        this.geoAccuracy = resp.coords.accuracy; 
        this.getGeoencoder(this.geoLatitude,this.geoLongitude);
       }).catch((error) => {
         alert('Error getting location'+ JSON.stringify(error));
       });
    }
  
    //geocoder method to fetch address from coordinates passed as arguments
    getGeoencoder(latitude,longitude){
      this.nativeGeocoder.reverseGeocode(latitude, longitude, this.geoencoderOptions)
      .then((result: NativeGeocoderResult[]) => {
        this.geoAddress = this.generateAddress(result[0]);
      })
      .catch((error: any) => {
        alert('Error getting location'+ JSON.stringify(error));
      });
    }
  
    //Return Comma saperated address
    generateAddress(addressObj){
        let obj = [];
        let address = "";
        for (let key in addressObj) {
          obj.push(addressObj[key]);
        }
        obj.reverse();
        for (let val in obj) {
          if(obj[val].length)
          address += obj[val]+', ';
        }
      return address.slice(0, -2);
    }
  
  
    //Start location update watch
    watchLocation(){
      this.isWatching = true;
      this.watchLocationUpdates = this.geolocation.watchPosition();
      this.watchLocationUpdates.subscribe((resp) => {
        this.geoLatitude = resp.coords.latitude;
        this.geoLongitude = resp.coords.longitude; 
        this.getGeoencoder(this.geoLatitude,this.geoLongitude);

        // send the data
       var latlng = {lat: this.lat, lng: this.lng}
       this.getData(latlng);
      });
    }
  
    //Stop location update watch
    stopLocationWatch(){
      this.isWatching = false;
      this.watchLocationUpdates.unsubscribe();
    }
}
