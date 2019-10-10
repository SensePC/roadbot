import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';
import { AlertController } from '@ionic/angular';
import { MenuController } from '@ionic/angular';
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

  constructor(private geolocation: Geolocation, 
              public http: HttpClient,
              public alertCtrl: AlertController,
              private menu: MenuController)
 {

  this.data.title = '';
  this.data.desc = '';
  this.data.response = '';
  this.http = http;
    
  }

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

  loadmap() {
    this.map = leaflet.map("map").setView(new leaflet.LatLng(35.2551600,25.028161), 7);
    leaflet.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attributions: 'www.tphangout.com',
      maxZoom: 18
    }).addTo(this.map);
    this.map.locate({
      setView: true,
      maxZoom: 16
    }).on('locationfound', (e) => {
      let markerGroup = leaflet.featureGroup();
      let marker: any = leaflet.marker([e.latitude, e.longitude]).on('click', () => {
        alert('You are here !');
      })
      markerGroup.addLayer(marker);
      this.map.addLayer(markerGroup);
    }).on('locationerror', (err) => {
        alert(err.message);
    })
  }
    //this.map.setView(new leaflet.LatLng(35.2551600,25.028161), 7);
  
}
