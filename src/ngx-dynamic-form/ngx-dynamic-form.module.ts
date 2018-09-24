import {ModuleWithProviders, NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {TextMaskModule} from "angular2-text-mask";
import {NgxUtilsModule} from "@stemy/ngx-utils";
import {provideFormControl} from "./common-types";

import {DynamicFormService} from "./services/dynamic-form.service";

import {AsyncSubmitDirective} from "./directives/async-submit.directive";
import {DynamicFormControlDirective} from "./directives/dynamic-form-control.directive";
import {DynamicFormTemplateDirective} from "./directives/dynamic-form-template.directive";
import {DynamicFormComponent} from "./components/dynamic-form/dynamic-form.component";

import {DynamicFormControlComponent} from "./components/dynamic-form-control/dynamic-form-control.component";
import {DynamicFormInputComponent} from "./components/dynamic-form-input/dynamic-form-input.component";
import {DynamicFormSelectComponent} from "./components/dynamic-form-select/dynamic-form-select.component";
import {DynamicFormStaticComponent} from "./components/dynamic-form-static/dynamic-form-static.component";

// --- Components ---
export const components = [
    DynamicFormComponent,
    DynamicFormControlComponent,
    DynamicFormInputComponent,
    DynamicFormSelectComponent,
    DynamicFormStaticComponent
];

// --- Directives ---
export const directives = [
    AsyncSubmitDirective,
    DynamicFormControlDirective,
    DynamicFormTemplateDirective
];

// --- Pipes ---
export const pipes = [];

@NgModule({
    declarations: [
        ...components,
        ...directives,
        ...pipes
    ],
    imports: [
        CommonModule,
        FormsModule,
        TextMaskModule,
        NgxUtilsModule.forRoot()
    ],
    exports: [
        ...components,
        ...directives,
        ...pipes,
        NgxUtilsModule
    ],
    entryComponents: components,
    providers: pipes
})
export class NgxDynamicFormModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: NgxDynamicFormModule,
            providers: [
                DynamicFormService,
                provideFormControl(DynamicFormInputComponent),
                provideFormControl(DynamicFormSelectComponent),
                provideFormControl(DynamicFormStaticComponent)
            ]
        }
    }
}
