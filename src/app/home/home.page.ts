import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';
import { AlertController } from '@ionic/angular';
import { MenuController } from '@ionic/angular';
import { TextToSpeech } from '@ionic-native/text-to-speech/ngx';
import { NgZone } from '@angular/core';
import { Insomnia } from '@ionic-native/insomnia/ngx';
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
  crs: any;
  
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
  public lat: number = 0;
  public lng: number = 0;

  // text to speech var
  public text: string;
  public alert_executed: number;
  public safe_executed: number;

  // Temporary solution for not playing UVindex alert many times
  playUValert = 0;

  // CAMS and EMS variables
  coperLayers: any;

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
              private menu: MenuController,
              private insomnia: Insomnia,
              )
 {

  this.data.desc = '';
  this.data.dist = '';
  this.data.response = '';
  this.http = http;

  // setting tts var
  this.text = 'Initial text';
  this.alert_executed = 1;
  this.safe_executed = 1;
    
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
          name: 'desc',
          placeholder: 'Description'
        },
        {
          name: 'dist',
          placeholder: 'Alert Distance (meters)',
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
          
              var desc = data.desc;
              var dist = data.dist;
              var desc_loc = {lat: lat, lon: lon, desc: desc, dist: dist}
              var link = 'http://147.27.31.219:82/results/';
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

    this.map.locate({
      watch: false,
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
        // alert(err.message); 
        alert('Your location cannot be found, please enable your device location.');
    })

    // BaseLayer
    leaflet.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attributions: 'www.tphangout.com',
      maxZoom: 20,
    }).addTo(this.map);
    
    // CAMS and EMS Copernicus layers
    this.coperLayers = {
      "Empty": leaflet.tileLayer.wms(''),
      "CO": leaflet.tileLayer.wms('https://geoservices.meteofrance.fr/api/__GC1AokW964hWyGlMlK7zKf80QjQvmv3Xp4M2Py61zYtHLeh5mME1KA__/CAMS50-ENSEMBLE-FORECAST-01-EUROPE-WMS?', {
            layers: 'CO__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND',
            format: 'image/png',
            version: '1.3.0',
            crs: leaflet.CRS.EPSG4326,
            opacity: '0.5',
            //styles: 'CO_USI__HEIGHT__SHADING',
        }),
      "O3": leaflet.tileLayer.wms('https://geoservices.meteofrance.fr/api/__GC1AokW964hWyGlMlK7zKf80QjQvmv3Xp4M2Py61zYtHLeh5mME1KA__/CAMS50-ENSEMBLE-FORECAST-01-EUROPE-WMS?', {
            layers: 'O3__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND',
            format: 'image/png',
            version: '1.3.0',
            crs: leaflet.CRS.EPSG4326,
            opacity: '0.5',
         }),
      "NO2": leaflet.tileLayer.wms('https://geoservices.meteofrance.fr/api/__GC1AokW964hWyGlMlK7zKf80QjQvmv3Xp4M2Py61zYtHLeh5mME1KA__/CAMS50-ENSEMBLE-FORECAST-01-EUROPE-WMS?', {
          layers: 'NO2__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND',
          format: 'image/png',
          version: '1.3.0',
          crs: leaflet.CRS.EPSG4326,
          opacity: '0.5',
         }),
      "SO2": leaflet.tileLayer.wms('https://geoservices.meteofrance.fr/api/__GC1AokW964hWyGlMlK7zKf80QjQvmv3Xp4M2Py61zYtHLeh5mME1KA__/CAMS50-ENSEMBLE-FORECAST-01-EUROPE-WMS?', {
          layers: 'SO2__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND',
          format: 'image/png',
          version: '1.3.0',
          crs: leaflet.CRS.EPSG4326,
          opacity: '0.5',
         }),
      "PM25": leaflet.tileLayer.wms('https://geoservices.meteofrance.fr/api/__GC1AokW964hWyGlMlK7zKf80QjQvmv3Xp4M2Py61zYtHLeh5mME1KA__/CAMS50-ENSEMBLE-FORECAST-01-EUROPE-WMS?', {
          layers: 'PM25__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND',
          format: 'image/png',
          version: '1.3.0',
          crs: leaflet.CRS.EPSG4326,
          opacity: '0.5',
         }),
      "PM10": leaflet.tileLayer.wms('https://geoservices.meteofrance.fr/api/__GC1AokW964hWyGlMlK7zKf80QjQvmv3Xp4M2Py61zYtHLeh5mME1KA__/CAMS50-ENSEMBLE-FORECAST-01-EUROPE-WMS?', {
          layers: 'PM10__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND',
          format: 'image/png',
          version: '1.3.0',
          crs: leaflet.CRS.EPSG4326,
          opacity: '0.5',
         }),
      "Landslide Susceptibility": leaflet.tileLayer.wms('https://www.efas.eu/api/wms/', {
          layers: 'mapserver:LandSlide',
          format: 'image/png',
          version: '1.3.0',
          crs: leaflet.CRS.EPSG3857,
          opacity: '0.5',
         }),
      "Acc. Precip. Det. ECMWF": leaflet.tileLayer.wms('https://www.efas.eu/api/wms/', {
          layers: 'mapserver:rainEUD',
          format: 'image/png',
          version: '1.3.0',
          crs: leaflet.CRS.EPSG3857,
          opacity: '0.5',
         }),
      }

    leaflet.control.layers(this.coperLayers).addTo(this.map);
    // add CAMS data Legends
		var legendCO = leaflet.control({position: 'topright'});
		legendCO.onAdd = function(map) {
			var div = leaflet.DomUtil.create('div', 'info legend');
			div.innerHTML += '<img src="https://geoservices.meteofrance.fr/api/__GC1AokW964hWyGlMlK7zKf80QjQvmv3Xp4M2Py61zYtHLeh5mME1KA__/CAMS50-ENSEMBLE-FORECAST-01-EUROPE-WMS?service=WMS&version=1.3.0&sld_version=1.1.0&request=GetLegendGraphic&layer=CO__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND&style=CO_USI__HEIGHT__SHADING&format=image/png" alt="legend" width="100" height="300">'
			return div;
    };

    var legendO3 = leaflet.control({position: 'topright'});
		legendO3.onAdd = function(map) {
			var div = leaflet.DomUtil.create('div', 'info legend');
			div.innerHTML += '<img src="https://geoservices.meteofrance.fr/api/__GC1AokW964hWyGlMlK7zKf80QjQvmv3Xp4M2Py61zYtHLeh5mME1KA__/CAMS50-ENSEMBLE-FORECAST-01-EUROPE-WMS?service=WMS&version=1.3.0&sld_version=1.1.0&request=GetLegendGraphic&layer=O3__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND&style=O3_USI__HEIGHT__SHADING&format=image/png" alt="legend" width="100" height="300">'
			return div;
    };

    var legendNO2 = leaflet.control({position: 'topright'});
		legendNO2.onAdd = function(map) {
			var div = leaflet.DomUtil.create('div', 'info legend');
			div.innerHTML += '<img src="https://geoservices.meteofrance.fr/api/__GC1AokW964hWyGlMlK7zKf80QjQvmv3Xp4M2Py61zYtHLeh5mME1KA__/CAMS50-ENSEMBLE-FORECAST-01-EUROPE-WMS?service=WMS&version=1.3.0&sld_version=1.1.0&request=GetLegendGraphic&layer=NO2__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND&style=NO2_USI__HEIGHT__SHADING&format=image/png" alt="legend" width="100" height="300">'
			return div;
    };

    var legendSO2 = leaflet.control({position: 'topright'});
		legendSO2.onAdd = function(map) {
			var div = leaflet.DomUtil.create('div', 'info legend');
			div.innerHTML += '<img src="https://geoservices.meteofrance.fr/api/__GC1AokW964hWyGlMlK7zKf80QjQvmv3Xp4M2Py61zYtHLeh5mME1KA__/CAMS50-ENSEMBLE-FORECAST-01-EUROPE-WMS?service=WMS&version=1.3.0&sld_version=1.1.0&request=GetLegendGraphic&layer=SO2__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND&style=SO2_USI__HEIGHT__SHADING&format=image/png" alt="legend" width="100" height="300">'
			return div;
    };

    var legendPM25 = leaflet.control({position: 'topright'});
		legendPM25.onAdd = function(map) {
			var div = leaflet.DomUtil.create('div', 'info legend');
			div.innerHTML += '<img src="https://geoservices.meteofrance.fr/api/__GC1AokW964hWyGlMlK7zKf80QjQvmv3Xp4M2Py61zYtHLeh5mME1KA__/CAMS50-ENSEMBLE-FORECAST-01-EUROPE-WMS?service=WMS&version=1.3.0&sld_version=1.1.0&request=GetLegendGraphic&layer=PM25__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND&style=PM25_USI__HEIGHT__SHADING&format=image/png" alt="legend" width="100" height="300">'
			return div;
    };

    var legendPM10 = leaflet.control({position: 'topright'});
		legendPM10.onAdd = function(map) {
			var div = leaflet.DomUtil.create('div', 'info legend');
			div.innerHTML += '<img src="https://geoservices.meteofrance.fr/api/__GC1AokW964hWyGlMlK7zKf80QjQvmv3Xp4M2Py61zYtHLeh5mME1KA__/CAMS50-ENSEMBLE-FORECAST-01-EUROPE-WMS?service=WMS&version=1.3.0&sld_version=1.1.0&request=GetLegendGraphic&layer=PM10__SPECIFIC_HEIGHT_LEVEL_ABOVE_GROUND&style=PM10_USI__HEIGHT__SHADING&format=image/png" alt="legend" width="100" height="300">'
			return div;
    };

    // add EMS data legends
    var legendLandslide = leaflet.control({position: 'bottomleft'});
		legendLandslide.onAdd = function(map) {
			var div = leaflet.DomUtil.create('div', 'info legend');
			div.innerHTML += '<img src="https://www.efas.eu/api/wms/?request=GetLegend&layers=mapserver:LandSlide&styles=default&width=105&height=185&">'
			return div;
    };

    var rainEUD = leaflet.control({position: 'bottomleft'});
		rainEUD.onAdd = function(map) {
			var div = leaflet.DomUtil.create('div', 'info legend');
			div.innerHTML += '<img src="https://www.efas.eu/api/wms/?request=GetLegend&layers=mapserver:rainEUD&styles=default&width=35&height=5&">'
			return div;
    };

    // Switch the base layers
    this.map.on('baselayerchange', function (eventLayer) {
      if (eventLayer.name === 'Empty') {
        this.removeControl(legendCO);
        this.removeControl(legendO3);
        this.removeControl(legendNO2);
        this.removeControl(legendSO2);
        this.removeControl(legendPM25);
        this.removeControl(legendPM10);
        this.removeControl(legendLandslide);
        this.removeControl(rainEUD);
      }
      if (eventLayer.name === 'CO') {
          legendCO.addTo(this);
          this.removeControl(legendO3);
          this.removeControl(legendNO2);
          this.removeControl(legendSO2);
          this.removeControl(legendPM25);
          this.removeControl(legendPM10);
          this.removeControl(legendLandslide);
          this.removeControl(rainEUD);
      } 
      if (eventLayer.name === 'O3') {
        legendO3.addTo(this);
        this.removeControl(legendCO);
        this.removeControl(legendNO2);
        this.removeControl(legendSO2);
        this.removeControl(legendPM25);
        this.removeControl(legendPM10);
        this.removeControl(legendLandslide);
        this.removeControl(rainEUD);
      }
      if (eventLayer.name === 'NO2') {
        legendNO2.addTo(this);
        this.removeControl(legendCO);
        this.removeControl(legendO3);
        this.removeControl(legendSO2);
        this.removeControl(legendPM25);
        this.removeControl(legendPM10);
        this.removeControl(legendLandslide);
        this.removeControl(rainEUD);
      }
      if (eventLayer.name === 'SO2') {
        legendSO2.addTo(this);
        this.removeControl(legendCO);
        this.removeControl(legendO3);
        this.removeControl(legendNO2);
        this.removeControl(legendPM25);
        this.removeControl(legendPM10);
        this.removeControl(legendLandslide);
        this.removeControl(rainEUD);
      }
      if (eventLayer.name === 'PM25') {
        legendPM25.addTo(this);
        this.removeControl(legendCO);
        this.removeControl(legendO3);
        this.removeControl(legendNO2);
        this.removeControl(legendSO2);
        this.removeControl(legendPM10);
        this.removeControl(legendLandslide);
        this.removeControl(rainEUD);
      }
      if (eventLayer.name === 'PM10') {
        legendPM10.addTo(this);
        this.removeControl(legendCO);
        this.removeControl(legendO3);
        this.removeControl(legendNO2);
        this.removeControl(legendSO2);
        this.removeControl(legendPM25);
        this.removeControl(legendLandslide);
        this.removeControl(rainEUD);
      }
      if (eventLayer.name === 'Landslide Susceptibility') {
        legendLandslide.addTo(this);
        this.removeControl(legendCO);
        this.removeControl(legendO3);
        this.removeControl(legendNO2);
        this.removeControl(legendSO2);
        this.removeControl(legendPM25);
        this.removeControl(legendPM10);
        this.removeControl(rainEUD);
      }
      if (eventLayer.name === 'Acc. Precip. Det. ECMWF') {
        rainEUD.addTo(this);
        this.removeControl(legendCO);
        this.removeControl(legendO3);
        this.removeControl(legendNO2);
        this.removeControl(legendSO2);
        this.removeControl(legendPM25);
        this.removeControl(legendPM10);
        this.removeControl(legendLandslide);
      }
    });

  }
  
  // Function to play Alert responded text (database results)
  async playAlertText(data) {
    var causes = '';
    var causesForText = '';
    var i;
    // structure of the data list: [cause1, cause1Dist, cause2, cause2Dist]
    for (i=1; i < data.length; i += 2) {
        causes += data[i] + '- Distance:' + data[i + 1] + "<br>"      
      }

    // Build the text message for causes
    for (i=1; i < data.length; i += 2) {
        causesForText += data[i] + '. Distance:' + data[i + 1] + '. ';     
      }
    
    const alert = await this.alertCtrl.create({
      header: 'Alert !',
      subHeader: 'Car accidents info',
      message: 'Causes: ' + causes,
      buttons: ['OK']
    });
     console.log(causes);
     await alert.present();
     
    this.text = 'Alert. Car accidents have happened in this area. ' +
                'Related information. ' + 
                causesForText;
      
    console.log(this.text);
    this.tts.speak({
    text: this.text
    })
      .then(() => console.log('Success'))
      .catch((reason: any) => console.log(reason));
    }

 // Function to play Safe responded text (database results)
 async playSafeText() {
    const alert = await this.alertCtrl.create({
      header: 'You are safe !',
      // subHeader: '',
      message: 'You are driving in a safe area.',
      buttons: ['OK']
    });
     console.log(this.text);
     await alert.present();

     this.text = 'You are driving in a safe area';
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
     var link = 'http://147.27.31.219:82/data/';
     // We use .map function in order to be able to use json response
     // as a single array (data)
     this.pull = this.http.get(link, {params: coords})
         .subscribe(data=> {
         // assign card's variables to the responded array
         console.log(data);
         this.info = data[0];
         
         /*
         // Run update inside of Angular's zone in order to display on the screen
         this.zone.run(() => {
           this.info = data[0];
           this.cause = data[1];         
         });
        */  

         // playText calls functionality
         if (this.info == 'Alert' && this.alert_executed == 1) {
             this.playAlertText(data)
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
     async presentUVAlert(uv: any) {
            const alert = await this.alertCtrl.create({
              header: 'Alert',
              subHeader: 'UV Index',
              message: 'UV index in your location is: ' + uv ,
              buttons: ['OK']
            });
            if (uv >= 3 && this.playUValert == 0) {
              await alert.present();
              // play the audio message
              this.tts.speak('The UV index is ' + uv + 'which means moderate risk of harm from unprotected Sun exposure. ' +
                             'Stay in shade near midday when the Sun is strongest. If outdoors, wear Sun protective clothing, ' +
                             ' a wide-brimmed hat, and UV-blocking sunglasses.');
              this.playUValert = 1;
            }
            if (uv >= 8 && this.playUValert == 0) {
              await alert.present();
              // play the audio message
              this.tts.speak('The UV index in your area is '  + uv + 
                             '. It is a very high UV index. Take extra precautions' + 
                             'because unprotected skin and eyes will be damaged and can burn quickly.');
              this.playUValert = 1;
              }
            }

     // Weather popup
     async presentWeather(desc: any, temp: number, pressure: number, humidity: number, wind_speed: number, clouds: number) {
      let Ctemp = Math.floor(Number(temp) - 272.15);

      const alert = await this.alertCtrl.create({
        header: 'Current Weather',
        // subHeader: '',
        message: '<b>Description: </b>' + desc + '<br>' +
                  '<b>Temperature: </b>' + Ctemp + '<br>' +
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
       this.presentUVAlert(UVData["value"]);
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
         // alert('Error getting location'+ JSON.stringify(error));
         alert('Your location cannot be found, please enable your device location.');
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
                       '. Temperature ' + (Math.floor(Number(weatherData["main"]["temp"]) - 272.15)).toString() +
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
      this.insomnia.keepAwake()
      this.isWatching = true;
      this.watchLocationUpdates = this.geolocation.watchPosition(this.options2);
      this.subscription = this.watchLocationUpdates.subscribe((resp: Geoposition) => {
        this.geoLatitude = resp.coords.latitude;
        this.geoLongitude = resp.coords.longitude; 

      // start leaflet map watch
      this.map.locate({
        watch: true,
        setView: true,
        maxZoom: 18
      })

       // Call OpenWeatherMap API
       this.getCurrentUVIndex(this.geoLatitude, this.geoLongitude);

       // testing point
       // var latlng = {lat: 35.33553, lng: 25.14066} 
       // testing point
       // var latlng = {lat: 35.46830, lng: 23.76085}
       // send the data
       var latlng = {lat: this.geoLatitude, lng: this.geoLongitude}
       this.getData(latlng);
      });
    }
  
    //Stop location update watch
    stopLocationWatch(){
      this.insomnia.allowSleepAgain()
      this.isWatching = false;
      this.map.locate({
        watch: false
      }) 

      this.playUValert = 0;
      // setting tts var
      this.text = 'Initial text';
      this.alert_executed = 1;
      this.safe_executed = 1;
        
      // unsubscribe the subscription, not the obsevable
      this.subscription.unsubscribe();
    }
}
