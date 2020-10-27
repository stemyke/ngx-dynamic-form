import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";
import {MatStepperModule} from "@angular/material/stepper";
import {MatInputModule} from "@angular/material/input";
import {MatFormFieldModule} from "@angular/material/form-field";

import {AppComponent} from "./app.component";
import {NgxDynamicFormModule, provideFormControl} from "../public_api";
import {MaterialFormInputComponent} from "./material-form-input.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {NgxUtilsModule} from "@stemy/ngx-utils";

@NgModule({
    declarations: [
        AppComponent,
        MaterialFormInputComponent
    ],
    entryComponents: [
        MaterialFormInputComponent
    ],
    imports: [
        BrowserModule,
        MatFormFieldModule,
        MatInputModule,
        MatStepperModule,
        BrowserAnimationsModule,
        NgxUtilsModule.forRoot(),
        NgxDynamicFormModule.forRoot()
    ],
    providers: [
        provideFormControl(MaterialFormInputComponent, MaterialFormInputComponent.acceptor, MaterialFormInputComponent.loader, -1)
    ],
    bootstrap: [AppComponent]
})
export class AppModule {

}
