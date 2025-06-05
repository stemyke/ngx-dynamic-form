import {Injectable, Injector} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {distinctUntilChanged, firstValueFrom, from, isObservable, startWith, switchMap} from "rxjs";
import {FormlyFieldConfig} from "@ngx-formly/core";
import {
    IApiService,
    ILanguageService,
    IOpenApiSchema,
    IOpenApiSchemaProperty,
    IOpenApiSchemas,
    ObjectUtils,
    OpenApiService,
    StringUtils
} from "@stemy/ngx-utils";

import {
    ConfigForSchemaOptions,
    ConfigForSchemaWrapOptions,
    FORM_ROOT_KEY,
    FormFieldConfig,
    FormFieldCustomizer,
    FormFieldData,
    FormSelectOption,
    FormSelectOptions,
    FormSerializeResult,
    IDynamicForm,
    Validators
} from "../common-types";

import {findRefs, isStringWithVal, mergeFormFields} from "../utils/misc";
import {
    emailValidation,
    maxLengthValidation,
    maxValueValidation,
    minLengthValidation,
    minValueValidation,
    requiredValidation
} from "../utils/validation";

import {DynamicFormBuilderService} from "./dynamic-form-builder.service";

@Injectable()
export class DynamicFormService {

    get api(): IApiService {
        return this.openApi.api;
    }

    get language(): ILanguageService {
        return this.api.language;
    }

    protected schemas: IOpenApiSchemas;

    constructor(readonly openApi: OpenApiService,
                readonly injector: Injector,
                readonly builder: DynamicFormBuilderService) {
    }

    async getFormFieldsForSchema(name: string, customizeOrOptions?: FormFieldCustomizer | ConfigForSchemaOptions): Promise<FormlyFieldConfig[]> {
        const group = await this.getFormFieldGroupForSchema(name, customizeOrOptions);
        return group.fieldGroup;
    }

    async serializeForm(form: IDynamicForm, validate?: boolean): Promise<FormSerializeResult> {
        const fields = form.config();
        if (!fields) return null;
        if (validate) {
            // await this.validateForm(form);
        }
        return this.serialize(fields);
    }

    async serialize(fields: FormFieldConfig[]): Promise<FormSerializeResult> {
        const result = {};
        if (!fields) return result;
        for (const field of fields) {
            const serializer = field.serializer;
            const key = `${field.key}`;
            const props = field.props || {};
            if (ObjectUtils.isFunction(serializer)) {
                result[key] = await serializer(field, this.injector);
                continue;
            }
            if (props.hidden && !field.serialize) {
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

    protected convertToDate(value: any): any {
        if (ObjectUtils.isNullOrUndefined(value)) return null;
        const date = ObjectUtils.isDate(value)
            ? value
            : new Date(value);
        return isNaN(date as any) ? new Date() : date;
    }

    async getFormFieldGroupForSchema(name: string, customizeOrOptions?: FormFieldCustomizer | ConfigForSchemaOptions): Promise<FormlyFieldConfig> {
        this.schemas = await this.openApi.getSchemas();
        const schemaOptions = ObjectUtils.isObject(customizeOrOptions) ? customizeOrOptions as ConfigForSchemaOptions : {};
        const customizeConfig = ObjectUtils.isFunction(customizeOrOptions) ? customizeOrOptions : schemaOptions.customizer;
        const schema = this.schemas[name];
        const wrapOptions = {
            ...schemaOptions,
            schema,
            injector: this.injector,
            customizer: async (property, options, config, parent: FormFieldConfig) => {
                config.defaultValue = `${config.type}`.startsWith("date")
                    ? this.convertToDate(property.default) : property.default;
                if (!ObjectUtils.isFunction(customizeConfig)) return [config];
                let res = customizeConfig(
                    property, schema, config,
                    parent,
                    options,
                    this.injector
                );
                if (!res) return [config];
                if (res instanceof Promise) {
                    res = await res;
                }
                return Array.isArray(res) ? res : [res];
            }
        } as ConfigForSchemaWrapOptions;
        const config = {
            key: FORM_ROOT_KEY,
            wrappers: ["form-group"]
        } as FormFieldConfig;

        const fields = await this.getFormFieldsForSchemaDef(schema, wrapOptions, config);
        const fieldGroup = [...fields];

        // Add id fields if necessary
        if (fields.length > 0) {
            const idFields: FormFieldConfig[] = [
                {key: "id", props: {hidden: true}},
                {key: "_id", props: {hidden: true}},
            ];
            fieldGroup.unshift(...idFields
                .filter(t => !fields.some(c => c.key == t.key))
            );
        }
        config.fieldGroup = fieldGroup;

        const root = await wrapOptions.customizer({
            id: FORM_ROOT_KEY,
            type: "object",
            properties: schema?.properties || {}
        }, wrapOptions, config, null);
        // Check if the customized root wrapper returned an array
        fields.length = 0;

        for (const model of root) {
            if (model.key === FORM_ROOT_KEY) {
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

    protected async getFormFieldsForSchemaDef(schema: IOpenApiSchema, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): Promise<FormFieldConfig[]> {
        if (!schema)
            return [];
        const keys = Object.keys(schema.properties || {});
        const fields: FormFieldConfig[] = [];
        // Collect all properties of this schema def
        for (const key of keys) {
            const property = schema.properties[key];
            const propFields = await this.getFormFieldsForProp(property, options, parent);
            fields.push(...propFields);
        }
        return fields.filter(f => null !== f);
    }

    // protected async getFormFieldsForSchemaDef(schema: IOpenApiSchema, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): Promise<FormFieldConfig[]> {
    //     if (!schema)
    //         return [];
    //     const keys = Object.keys(schema.properties || {});
    //     const others: FormFieldConfig[] = [];
    //     const groups: { [fs: string]: FormFieldConfig[] } = {};
    //     // Collect all properties of this schema def
    //     for (const p of keys) {
    //         const property = schema.properties[p];
    //         const fsName = property.hidden ? null : String(property.fieldSet || "");
    //         const fields = (await this.getFormFieldsForProp(property, options, parent))
    //             .filter(f => null !== f);
    //         // If we have a fieldset name defined and have actual fields for it
    //         // then push the property fields into a group
    //         if (fsName && fields.length) {
    //             const group = groups[fsName] || [];
    //             groups[fsName] = group;
    //             group.push(...fields);
    //             continue;
    //         }
    //         // Otherwise just push the fields to the others
    //         others.push(...fields);
    //     }
    //     // Create a field-set wrapper for each group and concat the other fields to the end
    //     return Object.keys(groups).map(group => {
    //         return {
    //             fieldGroup: groups[group],
    //             wrappers: ["form-fieldset"],
    //             id: !path ? group : `${path}.${group}`,
    //             props: {
    //                 label: this.getLabel(group, options, path),
    //                 hidden: false
    //             }
    //         } as FormFieldConfig;
    //     }).concat(others);
    // }

    protected async getFormFieldsForProp(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): Promise<FormFieldConfig[]> {
        const $enum = property.items?.enum || property.enum;
        if (Array.isArray($enum) || isStringWithVal(property.optionsPath) || isStringWithVal(property.endpoint)) {
            if (property.format == "radio") {
                return options.customizer(property, options, this.getFormRadioConfig(property, options, parent), parent);
            }
            return options.customizer(property, options, this.getFormSelectConfig(property, options, parent), parent);
        }
        switch (property.type) {
            case "string":
            case "number":
            case "integer":
            case "textarea":
                // if (this.checkIsEditorProperty(property)) {
                //     return options.customizer(property, options, this.getFormEditorConfig(property, options, parent), parent);
                // }
                if (property.format == "textarea") {
                    return options.customizer(property, options, this.getFormTextareaConfig(property, options, parent), parent);
                }
                if (property.format == "date" || property.format == "date-time") {
                    return options.customizer(property, options, this.getFormDatepickerConfig(property, options, parent), parent);
                }
                return options.customizer(property, options, this.getFormInputConfig(property, options, parent), parent);
            // case "object":
            //     return options.customizer(property, options, this.getFormEditorConfig(property, options, parent), parent);
            case "boolean":
                return options.customizer(property, options, this.getFormCheckboxConfig(property, options, parent), parent);
            case "array":
                return options.customizer(property, options, await this.getFormArrayConfig(property, options, parent), parent);
            case "file":
            case "upload":
                return options.customizer(property, options, this.getFormUploadConfig(property, options, parent), parent);
        }
        if (findRefs(property).length > 0) {
            return options.customizer(
                property, options,
                await this.getFormGroupConfig(property, options, parent),
                parent
            );
        }
        return [];
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
            fieldSet: property.fieldSet || "",
            validators
        };
    }

    protected async getFormArrayConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): Promise<FormlyFieldConfig> {
        return this.builder.createFormArray(property.id, async sp => {
            const subSchemas = findRefs(property).map(ref => this.schemas[ref]);
            if (subSchemas.length > 0) {
                const subModels = await Promise.all(
                    subSchemas.map(s => this.getFormFieldsForSchemaDef(s, options, sp))
                );
                return mergeFormFields(ObjectUtils.copy(subModels));
            }
            const propFields = await this.getFormFieldsForProp(property.items, options, sp);
            return propFields.pop();
        }, {
            ...this.getFormFieldData(property, options),
            // initialCount: property.initialCount || 0,
            // sortable: property.sortable || false,
            // useTabs: property.useTabs || false,
            addItem: property.addItem !== false,
            insertItem: property.insertItem !== false,
            cloneItem: property.cloneItem !== false,
            moveItem: property.moveItem !== false,
            removeItem: property.removeItem !== false,
            clearItems: property.clearItems !== false
        }, parent, options);
    }

    protected async getFormGroupConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): Promise<FormlyFieldConfig> {
        const subSchemas = findRefs(property).map(ref => this.schemas[ref]);
        return this.builder.createFormGroup(property.id, async sp => {
            const subModels = await Promise.all(
                subSchemas.map(s => this.getFormFieldsForSchemaDef(s, options, sp))
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
            placeholder: property.placeholder
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

    // getFormEditorConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions): DynamicEditorModelConfig {
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
            min: this.convertToDate(property.min),
            max: this.convertToDate(property.max),
        }, parent, options);
    }

    protected getFormRadioConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): FormFieldConfig {
        return this.builder.createFormSelect(property.id, {
            ...this.getFormFieldData(property, options),
            options: field => this.getFormSelectOptions(property, options, field),
            type: "radio",
            multiple: property.type == "array",
            groupBy: property.groupBy,
            inline: property.inline,
            allowEmpty: property.allowEmpty
        }, parent, options);
    }

    protected getFormSelectConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, parent: FormFieldConfig): FormFieldConfig {
        return this.builder.createFormSelect(property.id, {
            ...this.getFormFieldData(property, options),
            options: field => this.getFormSelectOptions(property, options, field),
            type: "select",
            multiple: property.type == "array",
            groupBy: property.groupBy,
            inline: property.inline,
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
            formCheck: "nolabel",
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
