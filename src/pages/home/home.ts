import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { Http } from '@angular/http';
 
declare var google;
 
@Component({
  selector: 'home-page',
  templateUrl: 'home.html'
})
export class HomePage {
  data:any = {};
 
  @ViewChild('map') mapElement: ElementRef;
  map: any;
 
  constructor(public navCtrl: NavController, public geolocation: Geolocation, public http: Http) {
    this.data.desc = '';
    this.data.response = '';

    this.http = http;
 
  }  

  ionViewDidLoad(){
    this.loadMap();
  }
 
  loadMap(){
 
    this.geolocation.getCurrentPosition().then((position) => {
 
      let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
 
      let mapOptions = {
        center: latLng,
        zoom: 18,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
 
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
 
    }, (err) => {
      console.log(err);
    });
 
  }

  addMarker(){
 
    let marker = new google.maps.Marker({
      map: this.map,
      animation: google.maps.Animation.DROP,
      position: this.map.getCenter()
    });
 
    let content = "<h4>Information!</h4>";         
 
    this.addInfoWindow(marker, content);
 
    }   
 
  addInfoWindow(marker, content) {
    
    let infoWindow = new google.maps.InfoWindow({
      content: content
    });

    google.maps.event.addListener(marker, 'click', () => {
      infoWindow.open(this.map, marker);
    });
  }
  
  submit() {
    this.geolocation.getCurrentPosition().then((position) => {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
	let latLng = {lat: lat, lon:lon}
    
    var title = this.data.title;
    var desc = this.data.desc;
    var desc_loc = {lat: lat, lon: lon, title: title, desc: desc}
    var link = 'http://192.168.1.6:8000/results/';
    var myData = JSON.stringify(desc_loc);
 
 
    this.http.post(link, myData)
      .subscribe(data => {
      this.data.response = data["_body"]; 
      }, error => {
      console.log("Oooops!");
    });
  });
 }

}


