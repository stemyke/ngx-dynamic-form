import {Injectable, Injector} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {distinctUntilChanged, firstValueFrom, from, isObservable, startWith, switchMap} from "rxjs";
import {FormlyFieldConfig, FormlyFormBuilder} from "@ngx-formly/core";
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
    FormFieldConfig,
    FormFieldCustomizer,
    FormSelectOption,
    FormSelectOptions,
    FormSerializeResult,
    IDynamicForm,
    Validators
} from "../common-types";

import {findRefs, isStringWithVal, MAX_INPUT_NUM, mergeFormFields, MIN_INPUT_NUM} from "../utils/misc";
import {
    emailValidation,
    maxLengthValidation,
    maxValueValidation,
    minLengthValidation,
    minValueValidation,
    requiredValidation,
    validationMessage
} from "../utils/validator-fns";
import * as path from "node:path";

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
                protected readonly builder: FormlyFormBuilder) {
    }

    async getFormFieldsForSchema(name: string, customizeOrOptions?: FormFieldCustomizer | ConfigForSchemaOptions): Promise<FormlyFieldConfig[]> {
        const group = await this.getFormFieldGroupForSchema(name, customizeOrOptions);
        return group.fieldGroup;
    }

    async serializeForm(form: IDynamicForm, validate?: boolean): Promise<FormSerializeResult> {
        const fields = form.fields();
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
                result[key] = await serializer(field);
                continue;
            }
            if (props.hidden && !props.serialize) {
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

    protected getLabel(label: string, options: ConfigForSchemaWrapOptions, path: string): string {
        label = label || "";
        const pathPrefix = !path ? `` : `${path}.`;
        return !label || !options.labelPrefix
            ? `${label}`
            : `${options.labelPrefix}.${pathPrefix}${label}`;
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
            customizer: async (property, options, config, path: string) => {
                const pathPrefix = !path ? `` : `${path}.`;
                config.defaultValue = `${config.type}`.startsWith("date")
                    ? this.convertToDate(property.default) : property.default;
                if (!ObjectUtils.isFunction(customizeConfig)) return [config];
                let res = customizeConfig(property, schema, config, `${pathPrefix}${config.key}`, this.injector);
                if (!res) return [config];
                if (res instanceof Promise) {
                    res = await res;
                }
                return Array.isArray(res) ? res : [res];
            }
        } as ConfigForSchemaWrapOptions;
        const fields = await this.getFormFieldsForSchemaDef(schema, wrapOptions, "");
        const fieldGroup = [...fields];
        // Add id fields if necessary
        if (fields.length > 0) {
            const idFields: FormlyFieldConfig[] = [
                {key: "id", props: {hidden: true}},
                {key: "_id", props: {hidden: true}},
            ];
            fieldGroup.unshift(...idFields
                .filter(t => !fields.some(c => c.key == t.key))
            );
        }
        const config = {
            key: "root",
            wrappers: ["form-group"],
            fieldGroup
        } as FormlyFieldConfig;

        const root = await wrapOptions.customizer({
            id: "root",
            type: "object",
            properties: schema?.properties || {}
        }, wrapOptions, config, "");
        // Check if the customized root wrapper returned an array
        fields.length = 0;
        for (const model of root) {
            if (model.key === "root") {
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

    protected async getFormFieldsForSchemaDef(schema: IOpenApiSchema, options: ConfigForSchemaWrapOptions, path: string): Promise<FormlyFieldConfig[]> {
        if (!schema)
            return [];
        const keys = Object.keys(schema.properties || {});
        const fields: FormFieldConfig[] = [];
        const groups: {[fs: string]: FormFieldConfig[]} = {};
        // Collect all properties of this schema def
        for (const p of keys) {
            const property = schema.properties[p];
            const fsName = property.hidden ? null : String(property.fieldSet || "");
            const propFields = await this.getFormFieldsForProp(property, options, path);
            // If we have a fieldset name defined then push the property fields into a group
            if (fsName) {
                let group = groups[fsName];
                // If the group does not exist we create it and then push it to the main fields
                if (!group) {
                    group = [];
                    groups[fsName] = group;
                    fields.push({
                        fieldGroup: group,
                        wrappers: ["form-fieldset"],
                        props: {
                            label: this.getLabel(fsName, options, path),
                        }
                    });
                }
                group.push(...propFields);
                continue;
            }
            fields.push(...propFields);
        }
        return fields.filter(t => null !== t);
    }

    protected async getFormFieldsForProp(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string): Promise<FormlyFieldConfig[]> {
        const $enum = property.items?.enum || property.enum;
        if (Array.isArray($enum) || isStringWithVal(property.optionsPath) || isStringWithVal(property.endpoint)) {
            if (property.format == "radio") {
                return options.customizer(property, options, this.getFormRadioConfig(property, options, path), path);
            }
            return options.customizer(property, options, this.getFormSelectConfig(property, options, path), path);
        }
        switch (property.type) {
            case "string":
            case "number":
            case "integer":
            case "textarea":
                // if (this.checkIsEditorProperty(property)) {
                //     return options.customizer(property, options, this.getFormEditorConfig(property, options), path);
                // }
                if (property.format == "textarea") {
                    return options.customizer(property, options, this.getFormTextareaConfig(property, options, path), path);
                }
                if (property.format == "date" || property.format == "date-time") {
                    return options.customizer(property, options, this.getFormDatepickerConfig(property, options, path), path);
                }
                return options.customizer(property, options, this.getFormInputConfig(property, options, path), path);
            // case "object":
            //     return options.customizer(property, options, this.getFormEditorConfig(property, options), path);
            case "boolean":
                return options.customizer(property, options, this.getFormCheckboxConfig(property, options, path), path);
            case "array":
                return options.customizer(property, options, await this.getFormArrayConfig(property, options, path), path);
            case "file":
                return options.customizer(property, options, this.getFormFileConfig(property, options, path), path);
        }
        if (findRefs(property).length > 0) {
            return options.customizer(
                property, options,
                await this.getFormGroupConfig(property, options, path),
                path
            );
        }
        return [];
    }

    getFormControlConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string, custom: FormlyFieldConfig): FormlyFieldConfig {
        const validators = this.getValidators(property, options);
        const label = !property.label? property.id : property.label;
        return ObjectUtils.assign({
            key: property.id,
            validators,
            validation: {
                messages: Object.keys(validators).reduce((res, key) => {
                    res[key] = validationMessage(this.injector, key, options.labelPrefix);
                    return res;
                }, {})
            },
            props: {
                ...property,
                // For material components
                appearance: "fill",
                required: !!validators.required,
                label: this.getLabel(label, options, path),
            }
        }, custom);
    }

    async getFormArrayConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string): Promise<FormlyFieldConfig> {
        let fieldArray: FormFieldConfig = null;
        const subPath = !path ? property.id : `${path}.${property.id}`;
        const subSchemas = findRefs(property).map(ref => this.schemas[ref]);
        if (subSchemas.length > 0) {
            const subModels = await Promise.all(
                subSchemas.map(s => this.getFormFieldsForSchemaDef(s, options, subPath))
            );
            fieldArray = {
                fieldGroup: mergeFormFields(ObjectUtils.copy(subModels))
            };
        } else {
            const propFields = await this.getFormFieldsForProp(property.items, options, subPath);
            fieldArray = propFields.pop();
        }

        return this.getFormControlConfig(
            property, options, path,
            {
                type: "array",
                props: {
                    initialCount: property.initialCount || 0,
                    sortable: property.sortable || false,
                    useTabs: property.useTabs || false,
                    addItem: property.addItem !== false,
                    insertItem: property.insertItem !== false,
                    cloneItem: property.cloneItem !== false,
                    moveItem: property.moveItem !== false,
                    removeItem: property.removeItem !== false,
                    clearItems: property.clearItems !== false
                },
                fieldArray
            }
        );
    }

    async getFormGroupConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string): Promise<FormlyFieldConfig> {
        const subSchemas = findRefs(property).map(ref => this.schemas[ref]);
        const subPath = !path ? property.id : `${path}.${property.id}`;
        const subModels = await Promise.all(
            subSchemas.map(s => this.getFormFieldsForSchemaDef(s, options, subPath))
        );
        return this.getFormControlConfig(
            property, options, path,
            {
                wrappers: ["form-group"],
                fieldGroup: mergeFormFields(subModels)
            }
        );
    }

    getFormInputConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string): FormlyFieldConfig {
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
        return this.getFormControlConfig(
            property, options, path,
            {
                type: "input",
                props: {
                    type,
                    attributes: {
                        autocomplete: property.autocomplete || "off",
                        accept: ObjectUtils.isString(property.accept) ? property.accept : null,
                    },
                    pattern: ObjectUtils.isString(property.pattern) ? property.pattern : null,
                    step: isNaN(sub.step) ? (isNaN(property.step) ? 1 : property.step) : sub.step,
                    min: isNaN(sub.minimum) ? MIN_INPUT_NUM : sub.minimum,
                    max: isNaN(sub.maximum) ? MAX_INPUT_NUM : sub.maximum,
                    minLength: isNaN(sub.minLength) ? 0 : sub.minLength,
                    maxLength: isNaN(sub.maxLength) ? MAX_INPUT_NUM : sub.maxLength,
                    placeholder: property.placeholder || ""
                }
            }
        );
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

    getFormTextareaConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string): FormlyFieldConfig {
        return this.getFormControlConfig(
            property, options, path,
            {
                type: "textarea",
                props: {
                    cols: property.cols || null,
                    rows: property.rows || 10,
                    wrap: property.wrap || false,
                    autoComplete: property.autoComplete || "off",
                    multiple: property.type == "array",
                    minLength: isNaN(property.minLength) ? 0 : property.minLength,
                    maxLength: isNaN(property.maxLength) ? MAX_INPUT_NUM : property.maxLength,
                    placeholder: property.placeholder || ""
                }
            }
        );
    }

    getFormDatepickerConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string): FormlyFieldConfig {
        return this.getFormControlConfig(
            property, options, path,
            {
                type: "input",
                props: {
                    type: property.format == "date-time" ? "datetime-local" : "date",
                    format: property.dateFormat || "dd.MM.yyyy",
                    min: this.convertToDate(property.min),
                    max: this.convertToDate(property.max),
                }
            }
        );
    }

    getFormSelectOptions(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, field: FormFieldConfig): FormSelectOptions {
        const $enum = property.items?.enum || property.enum;
        if (Array.isArray($enum)) {
            return from(this.fixSelectOptions(field, $enum.map(value => {
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
                return this.fixSelectOptions(field, opts.map(o => Object.assign({}, o)))
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
                return this.fixSelectOptions(field, (!Array.isArray(controlVal) ? [] : controlVal).map(value => {
                    const modelOption = finalOpts.find(t => t.value == value);
                    return {value, label: modelOption?.label || value};
                }));
            })
        );
    }

    getFormRadioConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string): FormlyFieldConfig {
        return this.getFormControlConfig(
            property, options, path,
            {
                type: "radio",
                hooks: {
                    onInit: field => {
                        field.props.options = this.getFormSelectOptions(property, options, field);
                    }
                }
            }
        );
    }

    getFormSelectConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string): FormlyFieldConfig {
        return this.getFormControlConfig(
            property, options, path,
            {
                type: "select",
                props: {
                    multiple: property.type == "array",
                    groupBy: property.groupBy,
                    inline: property.inline,
                    allowEmpty: property.allowEmpty,
                },
                hooks: {
                    onInit: field => {
                        field.props.options = this.getFormSelectOptions(property, options, field);
                    }
                }
            }
        );
    }

    getFormFileConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string): FormlyFieldConfig {
        const url = this.api.url(property.url || "assets");
        const {accept, autoUpload, maxSize, minSize, removeUrl, showFileList} = property;
        return this.getFormControlConfig(
            property, options, path,
            {
                type: "file",
                props: {
                    url: url,
                    accept,
                    autoUpload,
                    maxSize,
                    minSize,
                    removeUrl,
                    showFileList
                }
            }
        );
    }

    getFormCheckboxConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string): FormlyFieldConfig {
        return this.getFormControlConfig(
            property, options, path,
            {
                type: "checkbox",
                props: {
                    formCheck: "nolabel",
                    indeterminate: property.indeterminate || false
                }
            }
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

    protected async fixSelectOptions(field: FormFieldConfig, options: FormSelectOption[]): Promise<FormSelectOption[]> {
        if (!options) return [];
        for (const option of options) {
            const classes = Array.isArray(option.classes) ? option.classes : [`${option.classes}`];
            option.className = classes.filter(isStringWithVal).join(" ");
            option.label = await this.language.getTranslation(option.label);
        }
        const control = field.formControl;
        if (field.props.multiple || options.length === 0 || options.findIndex(o => o.value === control.value) >= 0) return options;
        control.setValue(options[0].value);
        return options;
    }

    protected getValidators(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions): Validators {
        const validators: Validators = {};
        const schema = options.schema;
        if (ObjectUtils.isArray(schema.required) && schema.required.indexOf(property.id) >= 0) {
            validators.required = requiredValidation();
        }
        this.addPropertyValidators(validators, property);
        this.addItemsValidators(validators, property.items);
        return validators;
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
