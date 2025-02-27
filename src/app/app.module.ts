import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";

import {AppComponent} from "./app.component";
import {NgxDynamicFormModule} from "@ng-dynamic-forms/core";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {NgxUtilsModule} from "@stemy/ngx-utils";

@NgModule({
    declarations: [
        AppComponent
    ],
    entryComponents: [
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        NgxUtilsModule.forRoot(),
        NgxDynamicFormModule.forRoot()
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {

}
