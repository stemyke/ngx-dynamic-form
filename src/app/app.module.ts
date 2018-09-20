import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";

import {AppComponent} from "./app.component";
import {NgxDynamicFormModule} from "../public_api";


@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        NgxDynamicFormModule.forRoot()
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
