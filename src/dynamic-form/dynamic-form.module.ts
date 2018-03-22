import {ModuleWithProviders, NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgxUtilsModule} from "@stemy/ngx-utils";
import {DynamicFormComponent, FormInputComponent} from "./components";
import {provideFormControl} from "./dynamic-form.decorators";

// --- Components ---
export const components = [
    DynamicFormComponent,
    FormInputComponent
];

// --- Directives ---
export const directives = [
];

// --- Pipes ---
export const pipes = [
];

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
    providers: [
        provideFormControl(FormInputComponent)
    ]
})
export class NgxDynamicFormModule {
    static forChild(): ModuleWithProviders {
        return {
            ngModule: NgxDynamicFormModule,
            providers: pipes
        };
    }

    static forRoot(): ModuleWithProviders {
        return {
            ngModule: NgxDynamicFormModule,
            providers: []
        }
    }
}
