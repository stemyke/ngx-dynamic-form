import {ModuleWithProviders, NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgxUtilsModule} from "@stemy/ngx-utils";
import {DynamicFormComponent, FormInputComponent} from "./components";
import {FormControlDirective} from "./directives";
import {DynamicFormService} from "./services";
import {provideFormControl} from "./dynamic-form.decorators";

// --- Components ---
export const components = [
    DynamicFormComponent,
    FormInputComponent
];

// --- Directives ---
export const directives = [
    FormControlDirective
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
                provideFormControl(FormInputComponent)
            ]
        }
    }
}
