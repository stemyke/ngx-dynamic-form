import {Inject, Injectable, Injector, untracked} from "@angular/core";
import {AbstractControl, FormArray, FormGroup} from "@angular/forms";
import {first} from "rxjs";
import {API_SERVICE, IApiService, ObjectUtils} from "@stemy/ngx-utils";

import {
    CustomizerOrSchemaOptions,
    FORM_ROOT_ID,
    FormFieldConfig,
    FormSerializeResult,
    IDynamicForm
} from "../common-types";
import {getFormValidationErrors, toWrapOptions} from "../utils/internal";

import {DynamicFormSchemaService} from "./dynamic-form-schema.service";
import {DynamicFormBuilderService} from "./dynamic-form-builder.service";

@Injectable()
export class DynamicFormService {

    constructor(protected readonly fs: DynamicFormSchemaService,
                protected readonly fb: DynamicFormBuilderService,
                protected readonly injector: Injector,
                @Inject(API_SERVICE) protected readonly api: IApiService) {

    }

    async getFormFieldsForSchema(name: string, customizeOrOptions?: CustomizerOrSchemaOptions): Promise<FormFieldConfig[]> {
        const group = await this.getFormFieldGroupBySchemaName(name, customizeOrOptions, "getFormFieldsForSchema");
        return group.fieldGroup;
    }

    async getFormFieldGroupForSchema(name: string, customizeOrOptions?: CustomizerOrSchemaOptions): Promise<FormFieldConfig> {
        return this.getFormFieldGroupBySchemaName(name, customizeOrOptions, "getFormFieldsForSchema");
    }

    protected async getFormFieldGroupBySchemaName(name: string, customizeOrOptions: CustomizerOrSchemaOptions, restrictedMethod: string): Promise<FormFieldConfig> {
        const config = {
            id: FORM_ROOT_ID,
            path: "",
            wrappers: ["form-group"],
            props: {}
        } as FormFieldConfig;
        const schema = await this.fs.getSchema(name);
        const wrapOptions = await toWrapOptions(
            customizeOrOptions, this.injector, schema,
            `"DynamicFormService.${restrictedMethod}" is called from a customizer, which is not allowed. Please use DynamicFormSchemaService instead!`
        );
        const fields = await this.fs.getFormFieldsForSchema(name, config, wrapOptions);
        const fieldGroup = [...fields];

        config.fieldGroup = fieldGroup;

        // There are no actual fields in the schema, or no schema exists
        if (fields.length === 0) return config;

        // Add id fields if necessary
        const idFields: FormFieldConfig[] = [
            this.fb.createFormInput("id", {hidden: true}, null, wrapOptions),
            this.fb.createFormInput("_id", {hidden: true}, null, wrapOptions)
        ];

        fieldGroup.unshift(...idFields
            .filter(t => !fields.some(c => c.key == t.key))
        );

        const root = await wrapOptions.customize(config, {
            id: FORM_ROOT_ID,
            type: "object",
            properties: schema?.properties || {}
        }, schema);
        // Check if the customized root wrapper returned an array
        fields.length = 0;

        for (const model of root) {
            if (model.id === FORM_ROOT_ID) {
                return model;
            } else {
                fields.push(model);
            }
        }

        return {
            ...config,
            fieldGroup: fields
        };
    }

    async validateForm(form: IDynamicForm, showErrors: boolean = true): Promise<any> {
        const group = form.group();
        if (!group) return Promise.resolve();
        return new Promise<any>((resolve, reject) => {
            group.statusChanges
                .pipe(first(status => status == "VALID" || status == "INVALID"))
                .subscribe(status => {
                    if (showErrors) {
                        this.showErrorsForGroup(group);
                    }
                    if (status == "VALID") {
                        resolve(null);
                        return;
                    }
                    reject(getFormValidationErrors(group.controls));
                });
            group.updateValueAndValidity();
        });
    }

    async serializeForm(form: IDynamicForm, validate: boolean = true): Promise<FormSerializeResult> {
        const fields = untracked(() => form.config());
        if (!fields) return null;
        if (validate) {
            await this.validateForm(form);
        }
        return this.serialize(fields);
    }

    async serialize(fields: FormFieldConfig[]): Promise<FormSerializeResult> {
        const result = {};
        if (!fields) return result;
        for (const field of fields) {
            const serializer = field.serializer;
            const key = `${field.key}`;
            if (ObjectUtils.isFunction(serializer)) {
                result[key] = await serializer(field, this.injector);
                continue;
            }
            if (field.hide && !field.serialize) {
                continue;
            }
            const control = field.formControl;
            if (field.fieldGroup) {
                const group = await this.serialize(field.fieldGroup);
                if (field.key) {
                    result[key] = !field.fieldArray ? group : Object.values(group);
                    continue;
                }
                Object.assign(result, group);
                continue;
            }
            result[key] = control.value;
        }
        return result;
    }

    protected showErrorsForGroup(formGroup: FormGroup): void {
        if (!formGroup) return;
        formGroup.markAsTouched({onlySelf: true});
        const controls = Object.keys(formGroup.controls).map(id => formGroup.controls[id]);
        this.showErrorsForControls(controls);
    }

    protected showErrorsForControls(controls: AbstractControl[]): void {
        controls.forEach(control => {
            if (control instanceof FormGroup) {
                this.showErrorsForGroup(control);
                return;
            }
            control.markAsTouched({onlySelf: true});
            if (control instanceof FormArray) {
                this.showErrorsForControls(control.controls);
            }
        });
    }
}
