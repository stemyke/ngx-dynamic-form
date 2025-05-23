import {Inject, Injectable, Injector} from "@angular/core";
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
    FormFieldConfig,
    FormFieldCustomizer,
    FormSelectOption,
    FormSelectOptions,
    FormSerializeResult,
    IDynamicForm,
    Validators
} from "../common-types";

import {EDITOR_FORMATS, findRefs, isStringWithVal, MAX_INPUT_NUM, mergeFormFields, MIN_INPUT_NUM} from "../utils/misc";
import {
    emailValidation,
    maxLengthValidation,
    maxValueValidation,
    minLengthValidation,
    minValueValidation,
    requiredValidation,
    validationMessage
} from "../utils/validator-fns";

@Injectable()
export class DynamicFormService {

    get api(): IApiService {
        return this.openApi.api;
    }

    get language(): ILanguageService {
        return this.api.language;
    }

    protected schemas: IOpenApiSchemas;

    constructor(@Inject(OpenApiService) readonly openApi: OpenApiService,
                @Inject(Injector) readonly injector: Injector) {
    }

    async getFormModelForSchema(name: string, customizeOrOptions?: FormFieldCustomizer | ConfigForSchemaOptions): Promise<FormlyFieldConfig[]> {
        const group = await this.getFormGroupModelForSchema(name, customizeOrOptions);
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
            if (props.hidden && !props.serialize) continue;
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
        // const result = {};
        // if (!field || !formGroup || !formGroup.value) return result;
        // for (const i in formModel) {
        //     const subModel = formModel[i] as DynamicFormValueControlModel<any>;
        //     const subControl = this.findControlByModel(subModel, formGroup);
        //     const serializer = subModel.additional?.serializer as FormControlSerializer;
        //     if (ObjectUtils.isFunction(serializer)) {
        //         result[subModel.id] = await serializer(subModel, subControl);
        //         continue;
        //     }
        //     if (subModel.hidden && !subModel.additional?.serialize) continue;
        //     if (subModel instanceof DynamicFormArrayModel) {
        //         const length = Array.isArray(subControl.value) ? subControl.value.length : 0;
        //         const subArray = subControl as FormArray;
        //         const resArray = [];
        //         for (let i = 0; i < length; i++) {
        //             const itemModel = subModel.get(i);
        //             resArray.push(
        //                 await this.serialize(itemModel.group, subArray.at(i) as FormGroup)
        //             );
        //         }
        //         result[subModel.id] = resArray;
        //         continue;
        //     }
        //     if (subModel instanceof DynamicInputModel && !ObjectUtils.isNullOrUndefined(subControl.value)) {
        //         result[subModel.id] = subModel.inputType == "number"
        //             ? parseFloat((`${subControl.value}` || "0").replace(/,/gi, ".")) ?? null
        //             : subControl.value;
        //         continue;
        //     }
        //     if (subModel instanceof DynamicFormGroupModel) {
        //         result[subModel.id] = await this.serialize(subModel.group, subControl as FormGroup);
        //         continue;
        //     }
        //     result[subModel.id] = subControl.value;
        // }
        // return result;
    }

    protected convertToDate(value: any): any {
        if (ObjectUtils.isNullOrUndefined(value)) return null;
        const date = ObjectUtils.isDate(value)
            ? value
            : new Date(value);
        return isNaN(date as any) ? new Date() : date;
    }

    async getFormGroupModelForSchema(name: string, customizeOrOptions?: FormFieldCustomizer | ConfigForSchemaOptions): Promise<FormlyFieldConfig> {
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
                const props = config.props || {};
                props.label = !props.label || !options.labelPrefix
                    ? props.label || ""
                    : await this.language.getTranslation(`${options.labelPrefix}.${pathPrefix}${props.label}`);
                config.defaultValue = `${config.type}`.startsWith("date")
                    ? this.convertToDate(property.default) : property.default;
                config.props = props;

                if (!ObjectUtils.isFunction(customizeConfig)) return [config];

                let res = customizeConfig(property, schema, config, `${pathPrefix}${config.key}`, this.injector);
                if (!res) return [config];
                if (res instanceof Promise) {
                    res = await res;
                }
                return Array.isArray(res) ? res : [res];
            }
        } as ConfigForSchemaWrapOptions;
        const fields = await this.getFormModelForSchemaDef(schema, wrapOptions, "");
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

    protected async getFormModelForSchemaDef(schema: IOpenApiSchema, options: ConfigForSchemaWrapOptions, path: string): Promise<FormlyFieldConfig[]> {
        if (!schema)
            return [];
        const keys = Object.keys(schema.properties || {});
        const fields: FormlyFieldConfig[] = [];
        for (const p of keys) {
            const property = schema.properties[p];
            // const fsName = property.hidden ? null : String(property.fieldSet || "");
            // if (fsName) {
            //     const fs = fieldSets.find(t => t.id === fsName);
            //     if (fs) {
            //         fs.fields.push(p);
            //     } else {
            //         fieldSets.push({id: fsName, legend: `legend.${fsName}`, fields: [p]});
            //     }
            // }
            const models = await this.getFormControlModels(property, options, path);
            fields.push(...models);
        }
        return fields.filter(t => null !== t);
    }

    protected checkIsEditorProperty(property: IOpenApiSchemaProperty): boolean {
        if (!property.format) return false;
        return EDITOR_FORMATS.indexOf(property.format) >= 0 || property.format.endsWith("script");
    }

    protected async getFormControlModels(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string): Promise<FormlyFieldConfig[]> {
        const $enum = property.items?.enum || property.enum;
        if (Array.isArray($enum) || isStringWithVal(property.optionsPath) || isStringWithVal(property.endpoint)) {
            if (property.format == "radio") {
                return options.customizer(property, options, this.getFormRadioConfig(property, options), path);
            }
            return options.customizer(property, options, this.getFormSelectConfig(property, options), path);
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
                    return options.customizer(property, options, this.getFormTextareaConfig(property, options), path);
                }
                if (property.format == "date" || property.format == "date-time") {
                    return options.customizer(property, options, this.getFormDatepickerConfig(property, options), path);
                }
                return options.customizer(property, options, this.getFormInputConfig(property, options), path);
            // case "object":
            //     return options.customizer(property, options, this.getFormEditorConfig(property, options), path);
            case "boolean":
                return options.customizer(property, options, this.getFormCheckboxConfig(property, options), path);
            case "array":
                if (findRefs(property).length > 0) {
                    return options.customizer(property, options, await this.getFormArrayConfig(property, options, path), path);
                } else {
                    return options.customizer(property, options, this.getFormInputConfig(property, options), path);
                }
            case "file":
                return options.customizer(property, options, this.getFormUploadConfig(property, options), path);
        }
        if (findRefs(property).length > 0) {
            return options.customizer(
                property, options,
                await this.getFormGroupConfig(property, options, !path ? property.id : `${path}.${property.id}`),
                path
            );
        }
        return [];
    }

    getFormControlConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, custom: FormlyFieldConfig): FormlyFieldConfig {
        const validators = this.getValidators(property, options);
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
                label: ObjectUtils.isString(property.label) ? property.label : property.id,
            }
        }, custom);
    }

    async getFormArrayConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string): Promise<FormlyFieldConfig> {
        const subSchemas = findRefs(property).map(ref => this.schemas[ref]);
        const subModels = await Promise.all(
            subSchemas.map(s => this.getFormModelForSchemaDef(s, options, path))
        );
        return this.getFormControlConfig(
            property, options,
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
                fieldArray: {
                    fieldGroup: mergeFormFields(ObjectUtils.copy(subModels))
                }
            }
        );
    }

    async getFormGroupConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string): Promise<FormlyFieldConfig> {
        const subSchemas = findRefs(property).map(ref => this.schemas[ref]);
        const subModels = await Promise.all(
            subSchemas.map(s => this.getFormModelForSchemaDef(s, options, path))
        );
        return this.getFormControlConfig(
            property, options,
            {
                wrappers: ["form-group"],
                fieldGroup: mergeFormFields(subModels)
            }
        );
    }

    getFormInputConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions): FormlyFieldConfig {
        let type = StringUtils.has(property.id, "password", "Password") ? "password" : (property.format || property.items?.type || property.type);
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
            property, options,
            {
                type: "input",
                props: {
                    type,
                    autoComplete: property.autoComplete || "off",
                    multiple: property.type == "array",
                    accept: ObjectUtils.isString(property.accept) ? property.accept : null,
                    mask: ObjectUtils.isString(property.mask) ? property.mask : null,
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

    getFormTextareaConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions): FormlyFieldConfig {
        return this.getFormControlConfig(
            property, options,
            {
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

    getFormDatepickerConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions): FormlyFieldConfig {
        return this.getFormControlConfig(
            property, options,
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

    getFormRadioConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions): FormlyFieldConfig {
        return this.getFormControlConfig(
            property, options,
            {
                hooks: {
                    onInit: field => {
                        field.props.options = this.getFormSelectOptions(property, options, field);
                    }
                }
            }
        );
    }

    getFormSelectConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions): FormlyFieldConfig {
        return this.getFormControlConfig(
            property, options,
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

    getFormUploadConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions): FormlyFieldConfig {
        const url = this.api.url(property.url || "assets");
        const {accept, autoUpload, maxSize, minSize, removeUrl, showFileList} = property;
        return this.getFormControlConfig(
            property, options,
            {
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

    getFormCheckboxConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions): FormlyFieldConfig {
        return this.getFormControlConfig(
            property, options,
            {
                props: {
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

    protected async fixSelectOptions(field: FormFieldConfig, options: any[]): Promise<FormSelectOption[]> {
        if (!options) return [];
        for (const option of options) {
            option.classes = [option.classes].filter(isStringWithVal).join(" ");
            option.label = await this.language.getTranslation(option.label);
        }
        if (field.props.multiple) {}
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
