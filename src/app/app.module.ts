import {BrowserModule} from "@angular/platform-browser";
import {NgModule} from "@angular/core";
import {MatFormFieldModule, MatInputModule, MatStepperModule} from "@angular/material";

import {AppComponent} from "./app.component";
import {NgxDynamicFormModule, provideFormControl} from "../public_api";
import {MaterialFormInputComponent} from "./material-form-input.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

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
        NgxDynamicFormModule.forRoot()
    ],
    providers: [
        provideFormControl(MaterialFormInputComponent, MaterialFormInputComponent.acceptor, MaterialFormInputComponent.loader, -1)
    ],
    bootstrap: [AppComponent]
})
export class AppModule {

}
