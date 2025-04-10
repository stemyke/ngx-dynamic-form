import {BrowserModule} from "@angular/platform-browser";
import {provideHttpClient} from "@angular/common/http";
import {NgModule} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {NgxUtilsModule} from "@stemy/ngx-utils";
import {NgxDynamicFormModule} from "../public_api";

import {AppComponent} from "./app.component";
import {FormlyBootstrapModule} from "@ngx-formly/bootstrap";

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        NgxUtilsModule.forRoot(),
        FormlyBootstrapModule,
        NgxDynamicFormModule.forRoot()
    ],
    providers: [
        provideHttpClient()
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
