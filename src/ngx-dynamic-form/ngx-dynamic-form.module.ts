import {ModuleWithProviders, NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, NG_VALIDATORS, ReactiveFormsModule} from "@angular/forms";
import {DYNAMIC_VALIDATORS, DynamicFormService as BaseDynamicFormService, Validator, ValidatorFactory} from "@ng-dynamic-forms/core";
import {NgxUtilsModule} from "@stemy/ngx-utils";

import {
    validateItemsMaxLength,
    validateItemsMaxValue,
    validateItemsMinLength, validateItemsMinValue,
    validateJSON,
    validatePhone, validateRequiredTranslation
} from "./utils/validators";
import {DynamicFormService} from "./services/dynamic-form.service";
import {components, directives, pipes} from "./ngx-dynamic-form.imports";

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
        {provide: NG_VALIDATORS, useValue: validateItemsMinLength, multi: true},
        {provide: NG_VALIDATORS, useValue: validateItemsMaxLength, multi: true},
        {provide: NG_VALIDATORS, useValue: validateItemsMinValue, multi: true},
        {provide: NG_VALIDATORS, useValue: validateItemsMaxValue, multi: true},
        {
            provide: DYNAMIC_VALIDATORS,
            useValue: new Map<string, Validator | ValidatorFactory>([
                ["json", validateJSON],
                ["requiredTranslation", validateRequiredTranslation],
                ["phone", validatePhone],
                ["itemsMinLength", validateItemsMinLength],
                ["itemsMaxLength", validateItemsMaxLength],
                ["itemsMinValue", validateItemsMinValue],
                ["itemsMaxValue", validateItemsMaxValue],
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
                {
                    provide: BaseDynamicFormService,
                    useExisting: DynamicFormService
                }
            ]
        }
    }
}
