import {EnvironmentProviders, makeEnvironmentProviders, ModuleWithProviders, NgModule, Provider} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {FormlyModule, provideFormlyConfig, provideFormlyCore} from "@ngx-formly/core";
import {NgxUtilsModule} from "@stemy/ngx-utils";

import {components, directives, pipes} from "./ngx-dynamic-form.imports";

import {IDynamicFormModuleConfig} from "./common-types";

import {DynamicFormService} from "./services/dynamic-form.service";
import {DynamicFormBuilderService} from "./services/dynamic-form-builder.service";
import {DynamicFormSchemaService} from "./services/dynamic-form-schema.service";

import {DynamicFormArrayComponent} from "./components/dynamic-form-array/dynamic-form-array.component";
import {DynamicFormChipsComponent} from "./components/dynamic-form-chips/dynamic-form-chips.component";
import {DynamicFormUploadComponent} from "./components/dynamic-form-upload/dynamic-form-upload.component";

import {DynamicFormAlertComponent} from "./components/dynamic-form-alert/dynamic-form-alert.component";
import {DynamicFormFieldComponent} from "./components/dynamic-form-field/dynamic-form-field.component";
import {DynamicFormFieldsetComponent} from "./components/dynamic-form-fieldset/dynamic-form-fieldset.component";
import {DynamicFormGroupComponent} from "./components/dynamic-form-group/dynamic-form-group.component";

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
        ...pipes
    ]
})
export class NgxDynamicFormModule {

    private static getProviders(config?: IDynamicFormModuleConfig): Provider[] {
        const formlyConfigs = (config?.options || []).map(provideFormlyConfig);
        return [
            provideFormlyCore({
                types: [
                    {name: "array", component: DynamicFormArrayComponent},
                    {name: "chips", component: DynamicFormChipsComponent},
                    {name: "upload", component: DynamicFormUploadComponent}
                ],
                wrappers: [
                    { name: "form-alert", component: DynamicFormAlertComponent },
                    { name: "form-field", component: DynamicFormFieldComponent },
                    { name: "form-fieldset", component: DynamicFormFieldsetComponent },
                    { name: "form-group", component: DynamicFormGroupComponent },
                ],
                extras: {
                    resetFieldOnHide: false,
                    renderFormlyFieldElement: false
                }
            }),
            ...formlyConfigs,
            DynamicFormService,
            DynamicFormBuilderService,
            DynamicFormSchemaService
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
