import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgxDynamicFormModule} from "@stemy/ngx-dynamic-form";

import {components} from "./imports";

@NgModule({
    declarations: [
        ...components,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NgxDynamicFormModule
    ],
    exports: [
        ...components,
        NgxDynamicFormModule
    ],
    providers: [

    ]
})
export class NgxDynamicFormNebularModule {

}
