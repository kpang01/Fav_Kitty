import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { CatSwipeComponent } from './cat-swipe/cat-swipe.component';

@NgModule({
  declarations: [
    AppComponent
    , CatSwipeComponent
  ],
  imports: [
    BrowserModule
    , HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
