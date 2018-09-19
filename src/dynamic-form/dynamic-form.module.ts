import {ModuleWithProviders, NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgxUtilsModule} from "@stemy/ngx-utils";
import {provideFormControl} from "./dynamic-form.decorators";
import {DynamicFormService} from "./services/dynamic-form.service";
import {DynamicFormControlDirective} from "./directives/dynamic-form-control.directive";
import {DynamicFormTemplateDirective} from "./directives/dynamic-form-template.directive";
import {DynamicFormComponent} from "./components/dynamic-form/dynamic-form.component";
import {DynamicFormControlComponent} from "./components/dynamic-form-control/dynamic-form-control.component";
import {DynamicFormInputComponent} from "./components/dynamic-form-input/dynamic-form-input.component";

// --- Components ---
export const components = [
    DynamicFormComponent,
    DynamicFormControlComponent,
    DynamicFormInputComponent,
];

// --- Directives ---
export const directives = [
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
        NgxUtilsModule.forRoot()
    ],
    exports: [
        ...components,
        ...directives,
        ...pipes
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
                provideFormControl(DynamicFormInputComponent)
            ]
        }
    }
}
