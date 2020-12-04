import {ModuleWithProviders, NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, NG_VALIDATORS, ReactiveFormsModule} from "@angular/forms";
import {
    DYNAMIC_VALIDATORS,
    DynamicFormService as BaseDynamicFormService,
    DynamicFormValidationService as BaseDynamicFormValidationService,
    Validator,
    ValidatorFactory
} from "@ng-dynamic-forms/core";
import {NgxUtilsModule} from "@stemy/ngx-utils";

import {DynamicFormService} from "./services/dynamic-form.service";

import {AsyncSubmitDirective} from "./directives/async-submit.directive";

import {validateJSON, validatePhone, validateRequiredTranslation} from "./utils/validators";

import {DynamicBaseFormComponent} from "./components/base/dynamic-base-form.component";
import {DynamicBaseFormControlContainerComponent} from "./components/base/dynamic-base-form-control-container.component";
import {DynamicFormValidationService} from "./services/dynamic-form-validation.service";

// --- Components ---
export const components = [
    DynamicBaseFormComponent,
    DynamicBaseFormControlContainerComponent
];

// --- Directives ---
export const directives = [
    AsyncSubmitDirective,
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
    providers: [
        ...pipes,
        {provide: NG_VALIDATORS, useValue: validateJSON, multi: true},
        {provide: NG_VALIDATORS, useValue: validateRequiredTranslation, multi: true},
        {provide: NG_VALIDATORS, useValue: validatePhone, multi: true},
        {
            provide: DYNAMIC_VALIDATORS,
            useValue: new Map<string, Validator | ValidatorFactory>([
                ["validateJSON", validateJSON],
                ["validateRequiredTranslation", validateRequiredTranslation],
                ["validatePhone", validatePhone],
            ])
        }
    ]
})
export class NgxDynamicFormModule {

    static forRoot(): ModuleWithProviders<NgxDynamicFormModule> {
        return {
            ngModule: NgxDynamicFormModule,
            providers: [
                DynamicFormService,
                DynamicFormValidationService,
                {
                    provide: BaseDynamicFormService,
                    useExisting: DynamicFormService
                },
                {
                    provide: BaseDynamicFormValidationService,
                    useExisting: DynamicFormValidationService
                }
            ]
        }
    }
}
