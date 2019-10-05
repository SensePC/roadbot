import { Component } from '@angular/core';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  geoLatitude: number;
  geoLongitude: number;

  watchLocationUpdates:any;
  isWatching:boolean;

  constructor(private geolocation: Geolocation) {}

  //Get current coordinates of device
  getGeolocation(){
    this.geolocation.getCurrentPosition().then((resp) => {
      this.geoLatitude = resp.coords.latitude;
      this.geoLongitude = resp.coords.longitude; 
     }).catch((error) => {
       alert('Error getting location'+ JSON.stringify(error));
     });
  }

 //Start location update watch
 watchLocation(){
  this.isWatching = true;
  this.watchLocationUpdates = this.geolocation.watchPosition();
  this.watchLocationUpdates.subscribe((resp) => {
    this.geoLatitude = resp.coords.latitude;
    this.geoLongitude = resp.coords.longitude; 
  });
}

//Stop location update watch
stopLocationWatch(){
  this.isWatching = false;
  this.watchLocationUpdates.unsubscribe();
}

}
