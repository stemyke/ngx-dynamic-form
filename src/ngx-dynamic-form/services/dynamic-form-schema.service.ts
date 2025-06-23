import {Injectable, Injector} from "@angular/core";
import {AbstractControl, FormArray, FormGroup} from "@angular/forms";
import {distinctUntilChanged, firstValueFrom, from, isObservable, startWith, switchMap} from "rxjs";
import {
    IApiService,
    ILanguageService, IOpenApiSchema,
    IOpenApiSchemaProperty,
    ObjectUtils,
    OpenApiService,
    StringUtils
} from "@stemy/ngx-utils";

import {
    CustomizerOrSchemaOptions,
    FormFieldConfig,
    FormFieldData,
    FormSelectOption,
    FormSelectOptions,
    Validators
} from "../common-types";

import {
    emailValidation,
    maxLengthValidation,
    maxValueValidation,
    minLengthValidation,
    minValueValidation,
    requiredValidation
} from "../utils/validation";
import {
    ConfigForSchemaWrapOptions,
    convertToDate,
    findRefs,
    isStringWithVal,
    mergeFormFields,
    toWrapOptions
} from "../utils/internal";

import {DynamicFormBuilderService} from "./dynamic-form-builder.service";

@Injectable()
export class DynamicFormSchemaService {

    get api(): IApiService {
        return this.openApi.api;
    }

    get language(): ILanguageService {
        return this.api.language;
    }

    constructor(protected readonly openApi: OpenApiService,
                protected readonly injector: Injector,
                protected readonly builder: DynamicFormBuilderService) {
    }

    async getSchema(name: string): Promise<IOpenApiSchema> {
        return this.openApi.getSchema(name);
    }

    async getFormFieldsForSchema(name: string,
                                 parent: FormFieldConfig,
                                 customizeOrOptions: CustomizerOrSchemaOptions): Promise<FormFieldConfig[]> {
        const schema = await this.getSchema(name);
        if (!schema) return [];
        const options = await toWrapOptions(customizeOrOptions, this.injector, schema);
        const keys = Object.keys(schema.properties || {});
        const fields: FormFieldConfig[] = [];
        // Collect all properties of this schema def
        for (const key of keys) {
            const property = schema.properties[key];
            const propFields = await this.getFormFieldsForProp(property, schema, options, parent);
            fields.push(...propFields);
        }
        return this.builder.createFieldSets(
            fields.filter(f => null !== f),
            parent, options
        );
    }

    protected async getFormFieldsForProp(property: IOpenApiSchemaProperty, schema: IOpenApiSchema, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): Promise<FormFieldConfig[]> {
        const field = await this.getFormFieldForProp(property, options, parent);
        return !field ? [] : options.customize(field, property, schema);
    }

    protected async getFormFieldForProp(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): Promise<FormFieldConfig> {
        const $enum = property.items?.enum || property.enum;
        if (Array.isArray($enum) || isStringWithVal(property.optionsPath) || isStringWithVal(property.endpoint)) {
            return this.getFormSelectConfig(property, options, parent);
        }
        switch (property.type) {
            case "string":
            case "number":
            case "integer":
            case "textarea":
                // if (this.checkIsEditorProperty(property)) {
                //     return this.getFormEditorConfig(property, options, parent);
                // }
                if (property.format == "textarea") {
                    return this.getFormTextareaConfig(property, options, parent);
                }
                if (property.format == "date" || property.format == "date-time") {
                    return this.getFormDatepickerConfig(property, options, parent);
                }
                return this.getFormInputConfig(property, options, parent);
            // case "object":
            //     return this.getFormEditorConfig(property, options, parent);
            case "boolean":
                return this.getFormCheckboxConfig(property, options, parent);
            case "array":
                return this.getFormArrayConfig(property, options, parent);
            case "file":
            case "upload":
                return this.getFormUploadConfig(property, options, parent);
        }
        if (findRefs(property).length > 0) {
            return this.getFormGroupConfig(property, options, parent);
        }
        return null;
    }

    protected getFormFieldData(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions): FormFieldData {
        const validators: Validators = {};
        const schema = options.schema;
        if (ObjectUtils.isArray(schema.required) && schema.required.indexOf(property.id) >= 0) {
            validators.required = requiredValidation();
        }
        this.addPropertyValidators(validators, property);
        this.addItemsValidators(validators, property.items);
        return {
            hidden: property.hidden === true,
            serialize: property.serialize === true,
            componentType: property.componentType,
            fieldSet: property.fieldSet,
            classes: property.classes,
            validators
        };
    }

    protected async getFormArrayConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): Promise<FormFieldConfig> {
        return this.builder.createFormArray(property.id, async sp => {
            const subSchemas = findRefs(property);
            if (subSchemas.length > 0) {
                const subModels = await Promise.all(
                    subSchemas.map(s => this.getFormFieldsForSchema(s, sp, options))
                );
                return mergeFormFields(ObjectUtils.copy(subModels));
            }
            return this.getFormFieldForProp(property.items, options, sp);
        }, {
            ...this.getFormFieldData(property, options),
            // initialCount: property.initialCount || 0,
            // sortable: property.sortable || false,
            useTabs: property.useTabs,
            tabsLabel: property.tabsLabel,
            addItem: property.addItem,
            insertItem: property.insertItem,
            cloneItem: property.cloneItem,
            moveItem: property.moveItem,
            removeItem: property.removeItem,
            clearItems: property.clearItems
        }, parent, options);
    }

    protected async getFormGroupConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): Promise<FormFieldConfig> {
        return this.builder.createFormGroup(property.id, async sp => {
            const subSchemas = findRefs(property);
            const subModels = await Promise.all(
                subSchemas.map(s => this.getFormFieldsForSchema(s, sp, options))
            );
            return mergeFormFields(subModels);
        }, {
            ...this.getFormFieldData(property, options),
        }, parent, options);
    }

    protected getFormInputConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): FormFieldConfig {
        let type = StringUtils.has(property.id || "", "password", "Password") ? "password" : (property.format || property.type);
        switch (type) {
            case "string":
                type = "text";
                break;
            case "boolean":
                type = "checkbox";
                break;
            case "textarea":
                type = "textarea";
                break;
            case "integer":
                type = "number";
                break;
        }
        const sub = property.type == "array" ? property.items || property : property;
        return this.builder.createFormInput(property.id, {
            ...this.getFormFieldData(property, options),
            type,
            autocomplete: property.autocomplete,
            pattern: property.pattern,
            step: isNaN(sub.step) ? property.step : sub.step,
            min: sub.minimum,
            max: sub.maximum,
            minLength: sub.minLength,
            maxLength: sub.maxLength,
            placeholder: property.placeholder,
            indeterminate: property.indeterminate,
            suffix: property.suffix
        }, parent, options);
    }

    protected getFormTextareaConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): FormFieldConfig {
        return this.builder.createFormInput(property.id, {
            ...this.getFormFieldData(property, options),
            type: "textarea",
            autocomplete: property.autoComplete,
            cols: property.cols || null,
            rows: property.rows || 10,
            minLength: property.minLength,
            maxLength: property.maxLength,
            placeholder: property.placeholder || ""
        }, parent, options);
    }

    // getFormEditorConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrap): DynamicEditorModelConfig {
    //     const sub = property.type == "array" ? property.items || property : property;
    //     return Object.assign(
    //         this.getFormControlConfig(property, options),
    //         {
    //             inputType: property.format || "json",
    //             convertObject: property.type !== "string",
    //             autoComplete: property.autoComplete || "off",
    //             multiple: property.type == "array",
    //             accept: ObjectUtils.isString(property.accept) ? property.accept : null,
    //             mask: ObjectUtils.isString(property.mask) ? property.mask : null,
    //             pattern: ObjectUtils.isString(property.pattern) ? property.pattern : null,
    //             step: isNaN(sub.step) ? (isNaN(property.step) ? 1 : property.step) : sub.step,
    //             minLength: isNaN(sub.minLength) ? 0 : sub.minLength,
    //             maxLength: isNaN(sub.maxLength) ? MAX_INPUT_NUM : sub.maxLength,
    //             placeholder: property.placeholder || ""
    //         }
    //     );
    // }

    protected getFormDatepickerConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): FormFieldConfig {
        return this.builder.createFormInput(property.id, {
            ...this.getFormFieldData(property, options),
            type: property.format == "date-time" ? "datetime-local" : "date",
            // format: property.dateFormat || "dd.MM.yyyy",
            min: convertToDate(property.min),
            max: convertToDate(property.max),
        }, parent, options);
    }

    protected getFormSelectConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): FormFieldConfig {
        return this.builder.createFormSelect(property.id, {
            ...this.getFormFieldData(property, options),
            options: field => this.getFormSelectOptions(property, options, field),
            type: property.format || "select",
            multiple: property.type == "array",
            groupBy: property.groupBy,
            allowEmpty: property.allowEmpty
        }, parent, options);
    }

    protected getFormUploadConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): FormFieldConfig {
        return this.builder.createFormUpload(property.id, {
            ...this.getFormFieldData(property, options),
            multiple: property.type === "array",
            inline: property.inline,
            accept: property.accept,
            url: property.url,
            maxSize: property.maxSize,
            uploadOptions: property.uploadOptions
        }, parent, options);
    }

    protected getFormCheckboxConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): FormFieldConfig {
        return this.builder.createFormInput(property.id, {
            ...this.getFormFieldData(property, options),
            type: "checkbox",
            indeterminate: property.indeterminate || false
        }, parent, options);
    }

    protected getFormSelectOptions(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, field: FormFieldConfig): FormSelectOptions {
        const $enum = property.items?.enum || property.enum;
        if (Array.isArray($enum)) {
            return from(this.builder.fixSelectOptions(field, $enum.map(value => {
                const label = options.labelPrefix
                    ? this.language.getTranslationSync(`${options.labelPrefix}.${property.id}.${value}`)
                    : `${property.id}.${value}`;
                return {value, label};
            })));
        }
        if (isStringWithVal(property.endpoint)) {
            const entries = Object.entries((field.formControl.root as FormGroup)?.controls || {});
            const endpoint = entries.reduce((res, [key, control]) => {
                return this.replaceOptionsEndpoint(res, key, control?.value);
            }, `${property.endpoint}`);
            this.api.cache[endpoint] = this.api.cache[endpoint] || this.api.list(endpoint, this.api.makeListParams(1, -1)).then(result => {
                const items = ObjectUtils.isArray(result)
                    ? result
                    : (ObjectUtils.isArray(result.items) ? result.items : []);
                return items.map(i => {
                    const item = ObjectUtils.isObject(i) ? i : {id: i};
                    return {
                        ...item,
                        value: item.id || item._id,
                        label: item[property.labelField] || item.label || item.id || item._id
                    };
                });
            });
            const options = this.api.cache[endpoint] as Promise<FormSelectOption[]>;
            return from(options.then(opts => {
                return this.builder.fixSelectOptions(field, opts.map(o => Object.assign({}, o)))
            }));
        }
        let path = property.optionsPath as string;
        let control = field.formControl;
        let current = field;
        if (path.startsWith("$root")) {
            path = path.substring(5);
            control = control.root || control;
            while (current.parent) {
                current = current.parent;
            }
        }
        while (path.startsWith(".")) {
            path = path.substring(1);
            control = control.parent || control;
            current = current.parent || current;
        }
        control = !path ? control : control.get(path);
        return control.valueChanges.pipe(
            startWith(control.value),
            distinctUntilChanged(),
            switchMap(async (controlVal) => {
                const currentOpts = current.props.options;
                const finalOpts = isObservable(currentOpts)
                    ? await firstValueFrom(currentOpts)
                    : (Array.isArray(currentOpts) ? currentOpts : []);
                return this.builder.fixSelectOptions(field, (!Array.isArray(controlVal) ? [] : controlVal).map(value => {
                    const modelOption = finalOpts.find(t => t.value == value);
                    return {value, label: modelOption?.label || value};
                }));
            })
        );
    }

    protected replaceOptionsEndpoint(endpoint: string, key: string, value: any): string {
        if (ObjectUtils.isObject(value)) {
            return Object.entries(value).reduce((res, [k, v]) => {
                return this.replaceOptionsEndpoint(res, `${key}.${k}`, v);
            }, endpoint)
        }
        if (ObjectUtils.isArray(value)) {
            return value.reduce((res, v, i) => {
                return this.replaceOptionsEndpoint(res, `${key}.${i}`, v);
            }, endpoint)
        }
        return endpoint.replace(new RegExp(`\\$${key}`, "gi"), `${value ?? ""}`);
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

    protected addPropertyValidators(validators: Validators, property: IOpenApiSchemaProperty): void {
        if (!property) return;
        if (!isNaN(property.minLength)) {
            validators.minLength = minLengthValidation(property.minLength);
        }
        if (!isNaN(property.maxLength)) {
            validators.maxLength = maxLengthValidation(property.maxLength);
        }
        if (!isNaN(property.minimum)) {
            validators.min = minValueValidation(property.minimum);
        }
        if (!isNaN(property.maximum)) {
            validators.max = maxValueValidation(property.maximum);
        }
        // if (isString(property.pattern) && property.pattern.length) {
        //     validators.pattern = property.pattern;
        // }
        switch (property.format) {
            case "email":
                validators.email = emailValidation();
                break;
        }
    }

    protected addItemsValidators(validators: Validators, items: IOpenApiSchemaProperty): void {
        if (!items) return;
        if (!isNaN(items.minLength)) {
            validators.itemsMinLength = minLengthValidation(items.minLength, true);
        }
        if (!isNaN(items.maxLength)) {
            validators.itemsMaxLength = maxLengthValidation(items.maxLength, true);
        }
        if (!isNaN(items.minimum)) {
            validators.itemsMinValue = minValueValidation(items.minimum, true);
        }
        if (!isNaN(items.maximum)) {
            validators.itemsMaxValue = maxValueValidation(items.maximum, true);
        }
    }
}
