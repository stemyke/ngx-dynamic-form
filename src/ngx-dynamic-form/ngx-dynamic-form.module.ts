import {ModuleWithProviders, NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {TextMaskModule} from "angular2-text-mask";
import {NgxUtilsModule} from "@stemy/ngx-utils";
import {FormControlProvider, FormGroupProvider, provideFormControl, provideFormGroup} from "./common-types";

import {DynamicFormService} from "./services/dynamic-form.service";
import {OpenApiService} from "./services/open-api.service";

import {AsyncSubmitDirective} from "./directives/async-submit.directive";
import {DynamicFormControlDirective} from "./directives/dynamic-form-control.directive";
import {DynamicFormGroupDirective} from "./directives/dynamic-form-group.directive";
import {DynamicFormTemplateDirective} from "./directives/dynamic-form-template.directive";
import {DynamicFormsComponent} from "./components/dynamic-forms/dynamic-forms.component";
import {DynamicFormComponent} from "./components/dynamic-form/dynamic-form.component";

import {DynamicFormGroupComponent} from "./components/dynamic-form-group/dynamic-form-group.component";
import {DynamicFormFileComponent} from "./components/dynamic-form-file/dynamic-form-file.component";
import {DynamicFormInputComponent} from "./components/dynamic-form-input/dynamic-form-input.component";
import {DynamicFormSelectComponent} from "./components/dynamic-form-select/dynamic-form-select.component";
import {DynamicFormStaticComponent} from "./components/dynamic-form-static/dynamic-form-static.component";
import {DynamicFormModelComponent} from "./components/dynamic-form-model/dynamic-form-model.component";

// --- Components ---
export const components = [
    DynamicFormsComponent,
    DynamicFormComponent,
    DynamicFormGroupComponent,
    DynamicFormFileComponent,
    DynamicFormInputComponent,
    DynamicFormSelectComponent,
    DynamicFormStaticComponent,
    DynamicFormModelComponent
];

// --- Directives ---
export const directives = [
    AsyncSubmitDirective,
    DynamicFormControlDirective,
    DynamicFormGroupDirective,
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
        ReactiveFormsModule,
        TextMaskModule,
        NgxUtilsModule
    ],
    exports: [
        ...components,
        ...directives,
        ...pipes,
        FormsModule,
        ReactiveFormsModule,
        NgxUtilsModule
    ],
    entryComponents: components,
    providers: pipes
})
export class NgxDynamicFormModule {

    static forRoot(controlProviders?: Array<FormControlProvider>, groupProvider?: FormGroupProvider): ModuleWithProviders<NgxDynamicFormModule> {
        return {
            ngModule: NgxDynamicFormModule,
            providers: [
                DynamicFormService,
                OpenApiService,
                provideFormControl(DynamicFormFileComponent, DynamicFormFileComponent.acceptor, DynamicFormFileComponent.loader),
                provideFormControl(DynamicFormInputComponent, DynamicFormInputComponent.acceptor, DynamicFormInputComponent.loader),
                provideFormControl(DynamicFormSelectComponent, DynamicFormSelectComponent.acceptor, DynamicFormSelectComponent.loader),
                provideFormControl(DynamicFormStaticComponent, DynamicFormStaticComponent.acceptor, DynamicFormStaticComponent.loader),
                provideFormControl(DynamicFormModelComponent, DynamicFormModelComponent.acceptor, DynamicFormModelComponent.loader),
                ...(controlProviders || []),
                groupProvider || provideFormGroup(DynamicFormGroupComponent)
            ]
        }
    }
}
