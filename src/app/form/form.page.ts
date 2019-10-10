import { Component, OnInit } from '@angular/core';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-form',
  templateUrl: './form.page.html',
  styleUrls: ['./form.page.scss'],
})
export class FormPage implements OnInit {
  data:any = {};


  constructor(private geolocation: Geolocation, 
              public http: HttpClient) { 
  
  this.data.title = '';
  this.data.desc = '';
  this.data.response = '';
  this.http = http;
  }

  ngOnInit() {
  }

}
