import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";


import {AppComponent} from "./app.component";
import {DynamicFormModule} from "../public_api";


@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        DynamicFormModule.forRoot()
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
