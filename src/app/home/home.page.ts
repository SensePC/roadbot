import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';
import { AlertController } from '@ionic/angular';
import { MenuController } from '@ionic/angular';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { NgZone } from '@angular/core';
import { NativeGeocoder, NativeGeocoderOptions, NativeGeocoderResult } from '@ionic-native/native-geocoder/ngx';
import leaflet from 'leaflet';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  // Get 'map' from DOM
  @ViewChild('map', {static: true}) mapContainer: ElementRef;
  map: any;
  
  data:any = {};

  geoLatitude: number;
  geoLongitude: number;
  geoAccuracy:number;
  geoAddress: string;

  watchLocationUpdates:any; 
  subscription: any;
  loading:any;
  isWatching:boolean;

  public pull: any;
  public watch: any;
  public lat: number = 0;
  public lng: number = 0;
  
  // text to speech var
  public text: string;
  public alert_executed: number;
  public safe_executed: number;

  // OpenWeatherMap variables
  uv_URL = 'http://api.openweathermap.org/data/2.5/uvi?appid=';
  APIkey = '54ace90d7266d94e1843f7577f0aaf4e';
  UVData: any = {};

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


  constructor(public zone: NgZone,
              private geolocation: Geolocation, 
              public http: HttpClient,
              private tts: TextToSpeech,
              public alertCtrl: AlertController,
              private nativeGeocoder: NativeGeocoder,
              private menu: MenuController)
 {

  this.data.title = '';
  this.data.desc = '';
  this.data.response = '';
  this.http = http;
    
  }
  // popup window options
  openMenu() {
    this.menu.open();
  }

  closeMenu() {
    this.menu.close();
  }

  toggleMenu() {
    this.menu.toggle();
  }

  ionViewDidEnter() {
    this.loadmap();
  }

  // Open the popup form window
  async presentPrompt() {
    let alert = await this.alertCtrl.create({
      header: 'Add an event',
      inputs: [
        {
          name: 'title',
          placeholder: 'Title'
        },
        {
          name: 'desc',
          placeholder: 'Description',
        }
      ],
      buttons: [
        {
          text: 'Submit',
          handler: data => {
            this.geolocation.getCurrentPosition().then((position) => {
              let lat = position.coords.latitude;
              let lon = position.coords.longitude;
              let latLng = {lat: lat, lon:lon}
          
              var title = data.title;
              var desc = data.desc;
              var desc_loc = {lat: lat, lon: lon, title: title, desc: desc}
              var link = 'http://192.168.1.5:8000/results/';
              var myData = JSON.stringify(desc_loc);
       
       
          this.http.post(link, myData)
            .subscribe(data => {
            this.data.response = data["_body"]; 
            }, error => {
            console.log("Oooops!");
          });
        });
       } 
      }, {
        text: 'Cancel',
        role: 'cancel',
        handler: data => {
          console.log('Cancel clicked');
        }
      }
     ]
    });    
    await alert.present();
  }
  
  // Mapping
  loadmap() {
    this.map = leaflet.map("map").setView(new leaflet.LatLng(35,25), 3);
    leaflet.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attributions: 'www.tphangout.com',
      maxZoom: 20
    }).addTo(this.map);
    this.map.locate({
      watch: true,
      setView: true,
      maxZoom: 18
    }).on('locationfound', (e) => {
      // let markerGroup = leaflet.featureGroup();
      var radius = e.accuracy / 2;
      leaflet.marker(e.latlng).addTo(this.map);      
      leaflet.circle(e.latlng, radius).addTo(this.map);

    }).on('locationerror', (err) => {
        alert(err.message);
    })
  }
    //this.map.setView(new leaflet.LatLng(35.2551600,25.028161), 7);

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
     // UV index popup alert
     async presentAlert(uv: any) {
            const alert = await this.alertCtrl.create({
              header: 'Alert',
              subHeader: 'UV Index',
              message: 'UV index in your location is: ' + uv ,
              buttons: ['OK']
            });
        
            await alert.present();
          }
  
    // OpenWeatherMap API call
    getCurrentUVIndex(latitude: number, longitude: number) {
      let result = this.http.get(this.uv_URL + this.APIkey + '&lat=' + latitude + '&lon=' + longitude)
      .subscribe(UVData=> {
        if (UVData["value"] > 5) {
          console.log(UVData["value"]);
          this.presentAlert(UVData["value"]);
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
      this.subscription = this.watchLocationUpdates.subscribe((resp) => {
        this.geoLatitude = resp.coords.latitude;
        this.geoLongitude = resp.coords.longitude; 
        this.getGeoencoder(this.geoLatitude,this.geoLongitude);

       // Call OpenWeatherMap API
       this.getCurrentUVIndex(this.geoLatitude, this.geoLongitude);
       // send the data
       var latlng = {lat: this.geoLatitude, lng: this.geoLongitude} 
       this.getData(latlng);
      });
    }
  
    //Stop location update watch
    stopLocationWatch(){
      this.isWatching = false;
      // unsubscribe the subscription, not the obsevable
      this.subscription.unsubscribe();
    }
  
}
