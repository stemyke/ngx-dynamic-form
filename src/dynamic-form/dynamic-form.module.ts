import {ModuleWithProviders, NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgxUtilsModule} from "@stemy/ngx-utils";
import {DynamicFormComponent, DynamicFormInputComponent} from "./components";
import {DynamicFormControlDirective, DynamicFormTemplateDirective} from "./directives";
import {DynamicFormService} from "./services";
import {provideFormControl} from "./dynamic-form.decorators";

// --- Components ---
export const components = [
    DynamicFormComponent,
    DynamicFormInputComponent
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
