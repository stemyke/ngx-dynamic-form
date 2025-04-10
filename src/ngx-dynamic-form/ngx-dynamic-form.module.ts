import {
    EnvironmentProviders,
    Injector,
    makeEnvironmentProviders,
    ModuleWithProviders,
    NgModule,
    Provider
} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, NG_VALIDATORS, ReactiveFormsModule} from "@angular/forms";
import {
    DYNAMIC_FORM_CONTROL_MAP_FN,
    DYNAMIC_VALIDATORS,
    DynamicFormService as BaseDynamicFormService,
    Validator,
    ValidatorFactory
} from "@ng-dynamic-forms/core";
import {FormlyModule} from "@ngx-formly/core";
import {NgxUtilsModule} from "@stemy/ngx-utils";

import {
    validateItemsMaxLength,
    validateItemsMaxValue,
    validateItemsMinLength,
    validateItemsMinValue,
    validateJSON,
    validatePhone,
    validateRequiredTranslation
} from "./utils/validators";
import {DynamicFormService} from "./services/dynamic-form.service";
import {components, defaultFormControlProvider, directives, pipes} from "./ngx-dynamic-form.imports";

import {IDynamicFormModuleConfig} from "./common-types";
import {FormlyService} from "./services/formly.service";
import {FormlyArrayComponent} from "./components/formly-array/formly-array.component";
import {FormlyGroupComponent} from "./components/formly-group/formly-group.component";

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
        NgxUtilsModule,
        FormlyModule
    ],
    exports: [
        ...components,
        ...directives,
        ...pipes,
        FormsModule,
        ReactiveFormsModule,
        NgxUtilsModule,
        FormlyModule
    ],
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

    private static getProviders(config?: IDynamicFormModuleConfig): Provider[] {
        const {providers} = FormlyModule.forRoot({
            types: [
                {name: "array", component: FormlyArrayComponent},
            ],
            wrappers: [{ name: "form-group", component: FormlyGroupComponent }],
            validationMessages: [{name: "required", message: "This field is required"}],
        });
        return [
            ...(providers as Provider[]),
            DynamicFormService,
            FormlyService,
            {
                provide: BaseDynamicFormService,
                useExisting: DynamicFormService
            },
            {
                provide: DYNAMIC_FORM_CONTROL_MAP_FN,
                useFactory: (config?.controlProvider || defaultFormControlProvider),
                deps: [Injector]
            }
        ];
    }

    static forRoot(config?: IDynamicFormModuleConfig): ModuleWithProviders<NgxDynamicFormModule> {
        return {
            ngModule: NgxDynamicFormModule,
            providers: NgxDynamicFormModule.getProviders(config)
        }
    }

    static provideForms(config?: IDynamicFormModuleConfig): EnvironmentProviders {
        return makeEnvironmentProviders(NgxDynamicFormModule.getProviders(config));
    }
}
