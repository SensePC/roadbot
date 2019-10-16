import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';
import { AlertController } from '@ionic/angular';
import { MenuController } from '@ionic/angular';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { NgZone } from '@angular/core';
// import { NativeGeocoder, NativeGeocoderOptions, NativeGeocoderResult } from '@ionic-native/native-geocoder/ngx';
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
  options1: any = {};
  options2: any = {};

  geoLatitude: number;
  geoLongitude: number;
  geoAccuracy:number;

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

  // CAMS variables
  camsLayers: any;

  // OpenWeatherMap variables
  uv_URL = 'http://api.openweathermap.org/data/2.5/uvi?appid=';
  weatherURL = 'http://api.openweathermap.org/data/2.5/weather?appid=';
  APIkey = '54ace90d7266d94e1843f7577f0aaf4e';
  UVData: any = {};
  weatherData: any = {};

  // Marker and circle variable
  theMarker = {};
  theCircle = {};

  // Define ionic card's variables
  public info: string = '';
  public cause: string = '';
  public str_addr: string = '';
  public accid_num: number = 0;

  constructor(public zone: NgZone,
              private geolocation: Geolocation, 
              public http: HttpClient,
              private tts: TextToSpeech,
              public alertCtrl: AlertController,
              //private nativeGeocoder: NativeGeocoder,
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
    // The above 4 lines solves the problem of marker-shadow not found
    leaflet.Icon.Default.mergeOptions({
      iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
      iconUrl: require("leaflet/dist/images/marker-icon.png"),
      shadowUrl: require("leaflet/dist/images/marker-shadow.png")
    });
    this.map = leaflet.map("map").setView(new leaflet.LatLng(35,25), 3);
    leaflet.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attributions: 'www.tphangout.com',
      crs: leaflet.CRS.EPSG4326,
      maxZoom: 20
    }).addTo(this.map);
    this.camsLayers = {
      Empty: leaflet.tileLayer.wms(''),
      CO: leaflet.tileLayer.wms('https://geoservices.meteofrance.fr/api/__GC1AokW964hWyGlMlK7zKf80QjQvmv3Xp4M2Py61zYtHLeh5mME1KA__/CAMS50-ENSEMBLE-FORECAST-01-EUROPE-WMS?', {
            layers: 'CO__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND',
            format: 'image/png',
            version: '1.3.0',
            crs: leaflet.CRS.EPSG4326,
            opacity: '0.5',
            //styles: 'CO_USI__HEIGHT__SHADING',
       })
     }
     
     leaflet.control.layers(this.camsLayers).addTo(this.map);

     this.map.locate({
      watch: true,
      setView: true,
      maxZoom: 18
    }).on('locationfound', (e) => {
      // let markerGroup = leaflet.featureGroup();

      // Great trick to remove the old marker and add the new one !
      if (this.theMarker != undefined && this.theCircle != undefined) {
        this.map.removeLayer(this.theMarker);
        this.map.removeLayer(this.theCircle);
      }
      var radius = e.accuracy / 2;
      // theMarker and theCircle variables definition
      this.theMarker = leaflet.marker(e.latlng).addTo(this.map);      
      this.theCircle = leaflet.circle(e.latlng, radius).addTo(this.map);

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

     // Weather popup
     async presentWeather(desc: any, temp: number, pressure: number, humidity: number, wind_speed: number, clouds: number) {
      let Ctemp = Math.floor(Number(temp) - 273.15);

      const alert = await this.alertCtrl.create({
        header: 'Current Weather',
        // subHeader: '',
        message: '<b>Description: </b>' + desc + '<br>' +
                  '<b>Temprature: </b>' + Ctemp + '<br>' +
                  '<b>Pressure: </b>' + pressure + '<br>' +
                  '<b>Humidity: </b>' + humidity + '<br>' +
                  '<b>Wind speed: </b>' + wind_speed + '<br>' +
                  '<b>Clouds: </b>' + clouds,
        buttons: ['OK']
      });
  
      await alert.present();
    }
  
    // OpenWeatherMap API call for UV index
    getCurrentUVIndex(latitude: number, longitude: number) {
      let result = this.http.get(this.uv_URL + this.APIkey + '&lat=' + latitude + '&lon=' + longitude)
      .subscribe(UVData=> {
        // 8 - 10.9 is the correct very high UV index
        if (UVData["value"] > 8) {
          console.log(UVData["value"]);
          this.presentAlert(UVData["value"]);
          this.tts.speak('The UV index in your area is '  + UVData["value"] + 
                       '. It is a very high UV index. Take extra precautions' + 
                      'because unprotected skin and eyes will be damaged and can burn quickly.');
        }
      }, err => {
          console.log(err);
         }
      );
    }
    
    // Get current coordinates of device
    getGeolocation(){
      this.options1 = {
        timeout: 30000,
        enableHighAccuracy: true
        };
      this.geolocation.getCurrentPosition(this.options1).then((resp) => {
        this.geoLatitude = resp.coords.latitude;
        this.geoLongitude = resp.coords.longitude; 
        this.geoAccuracy = resp.coords.accuracy; 
        
        this.getCurrentWeather(this.geoLatitude, this.geoLongitude);
       }).catch((error) => {
         alert('Error getting location'+ JSON.stringify(error));
       });
    }

    // OpenWeatherMap API call for current weather data
    getCurrentWeather(latitude: number, longitude: number){
        let result = this.http.get(this.weatherURL + this.APIkey + '&lat=' + latitude + '&lon=' + longitude)
          .subscribe(weatherData => {
            // console.log(weatherData["weather"]["0"]["description"]);
            let description = weatherData["weather"]["0"]["description"];
            let temperature = weatherData["main"]["temp"];
            let pressure = weatherData["main"]["pressure"];
            let humidity = weatherData["main"]["humidity"];
            let wind_speed = weatherData["wind"]["speed"];
            let clouds = weatherData["clouds"]["all"];
            this.presentWeather(description, temperature, pressure, humidity, wind_speed, clouds);
            this.tts.speak('Current weather in your area. ' + 
                       'Description ' + weatherData["weather"]["0"]["description"] + 
                       '. Temperature ' + weatherData["main"]["temp"] +
                       '. Pressure ' + weatherData["main"]["pressure"] +
                       '. Humidity ' + weatherData["main"]["humidity"] +
                       '. Wind speed ' + weatherData["wind"]["speed"] +
                       '. Clouds ' + weatherData["clouds"]["all"]);
        }, err => {
        console.log(err);
       }
      )
    }
  
    //Start location update watch
    watchLocation(){
      // Geolocation options
      this.options2 = {
      frequency: 3000,
      enableHighAccuracy: true
      };
      this.isWatching = true;
      this.watchLocationUpdates = this.geolocation.watchPosition(this.options2);
      this.subscription = this.watchLocationUpdates.subscribe((resp: Geoposition) => {
        this.geoLatitude = resp.coords.latitude;
        this.geoLongitude = resp.coords.longitude; 

       // Call OpenWeatherMap API
       this.getCurrentUVIndex(this.geoLatitude, this.geoLongitude);

       // send the data
       var latlng = {lat: this.geoLatitude, lng: this.geoLongitude} 
       // this.getData(latlng);
      });
    }
  
    //Stop location update watch
    stopLocationWatch(){
      this.isWatching = false;
      // unsubscribe the subscription, not the obsevable
      this.subscription.unsubscribe();
    }
  
}
