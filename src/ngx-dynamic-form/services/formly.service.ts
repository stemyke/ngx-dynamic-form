import {Inject, Injectable, Injector} from "@angular/core";
import {AbstractControl, FormControl, FormGroup, ValidatorFn} from "@angular/forms";
import {firstValueFrom} from "rxjs";
import {DynamicFormModel, DynamicPathable, DynamicValidatorsConfig, isString,} from "@ng-dynamic-forms/core";
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

import {ConfigForSchemaOptions, ConfigForSchemaWrapOptions, FormlyFieldCustomizer, Validators} from "../common-types";

import {EDITOR_FORMATS, findRefs, isStringWithVal, MAX_INPUT_NUM, mergeFormFields, MIN_INPUT_NUM} from "../utils/misc";
import {FormSelectSubject} from "../utils/form-select-subject";
import {DynamicFormArrayGroupModel, DynamicFormArrayModel} from "../utils/dynamic-form-array.model";
import {DynamicFormFieldSet, DynamicFormGroupModel} from "../utils/dynamic-form-group.model";
import {DynamicFormOptionConfig, DynamicSelectModel} from "../utils/dynamic-select.model";
import {
    validationMessage,
    maxLengthValidation,
    minLengthValidation,
    minValueValidation,
    maxValueValidation, emailValidation, requiredValidation
} from "../utils/validator-fns";

@Injectable()
export class FormlyService {

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

    async getFormModelForSchema(name: string, customizeOrOptions?: FormlyFieldCustomizer | ConfigForSchemaOptions): Promise<FormlyFieldConfig[]> {
        const group = await this.getFormGroupModelForSchema(name, customizeOrOptions);
        console.log(group);
        return group.fieldGroup;
    }

    protected convertToDate(value: any): any {
        if (ObjectUtils.isNullOrUndefined(value)) return null;
        const date = ObjectUtils.isDate(value)
            ? value
            : new Date(value);
        return isNaN(date as any) ? new Date() : date;
    }

    async getFormGroupModelForSchema(name: string, customizeOrOptions?: FormlyFieldCustomizer | ConfigForSchemaOptions): Promise<FormlyFieldConfig> {
        this.schemas = await this.openApi.getSchemas();
        const fieldSets: DynamicFormFieldSet<string>[] = [];
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
        const fields = await this.getFormModelForSchemaDef(schema, fieldSets, wrapOptions, "");
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
            fieldGroup,
            fieldSets
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

    protected async getFormModelForSchemaDef(schema: IOpenApiSchema, fieldSets: DynamicFormFieldSet<string>[], options: ConfigForSchemaWrapOptions, path: string): Promise<FormlyFieldConfig[]> {
        if (!schema)
            return [];
        const keys = Object.keys(schema.properties || {});
        const fields: FormlyFieldConfig[] = [];
        for (const p of keys) {
            const property = schema.properties[p];
            const fsName = property.hidden ? null : String(property.fieldSet || "");
            if (fsName) {
                const fs = fieldSets.find(t => t.id === fsName);
                if (fs) {
                    fs.fields.push(p);
                } else {
                    fieldSets.push({id: fsName, legend: `legend.${fsName}`, fields: [p]});
                }
            }
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

    findModelByPath(parent: DynamicPathable | DynamicFormModel, path: string[]): DynamicPathable {
        if (path.length == 0) return parent as DynamicPathable;
        const next = path.shift() as any;
        if (Array.isArray(parent)) {
            return this.findModelByPath(parent.find(t => t.id == next), path);
        }
        if (parent instanceof DynamicFormGroupModel || parent instanceof DynamicFormArrayGroupModel) {
            return this.findModelByPath(parent.group.find(t => t.id == next), path);
        }
        if (parent instanceof DynamicFormArrayModel) {
            return this.findModelByPath(parent.groups.find(t => t.index == next), path);
        }
        return parent;
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
            props: Object.assign({
                // For material components
                appearance: "fill",
                label: ObjectUtils.isString(property.label) ? property.label : property.id,
                hidden: property.hidden,
                disabled: property.disabled,
            }, property)
        }, custom);
    }

    async getFormArrayConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions, path: string): Promise<FormlyFieldConfig> {
        const fieldSets: DynamicFormFieldSet<string>[] = [];
        const subSchemas = findRefs(property).map(ref => this.schemas[ref]);
        const subModels = await Promise.all(
            subSchemas.map(s => this.getFormModelForSchemaDef(s, fieldSets, options, path))
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
        const fieldSets: DynamicFormFieldSet<string>[] = [];
        const subSchemas = findRefs(property).map(ref => this.schemas[ref]);
        const subModels = await Promise.all(
            subSchemas.map(s => this.getFormModelForSchemaDef(s, fieldSets, options, path))
        );
        return this.getFormControlConfig(
            property, options,
            {
                wrappers: ["form-group"],
                fieldGroup: mergeFormFields(ObjectUtils.copy(subModels))
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

    getFormSelectOptions(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions) {
        const $enum = property.items?.enum || property.enum;
        if (Array.isArray($enum)) {
            return new FormSelectSubject((selectModel, formControl) => {
                const selectOptions = $enum.map(value => {
                    const label = options.labelPrefix
                        ? this.language.getTranslationSync(`${options.labelPrefix}.${property.id}.${value}`)
                        : `${property.id}.${value}`;
                    return {value, label};
                });
                return this.fixSelectOptions(selectModel, formControl, selectOptions);
            });
        }
        if (isStringWithVal(property.optionsPath)) {
            return new FormSelectSubject(async (selectModel, control, root, indexes) => {
                let path = property.optionsPath as string;
                let target = control as AbstractControl;
                let model: DynamicPathable | DynamicFormModel = selectModel;
                if (path.startsWith("$root")) {
                    path = path.substring(5);
                    while (target.parent) {
                        target = target.parent;
                    }
                    model = root;
                }
                while (path.startsWith(".")) {
                    path = path.substring(1);
                    if (target.parent) {
                        target = target.parent;
                    }
                    model = (model as DynamicPathable).parent || root;
                }
                Object.keys(indexes).forEach(key => {
                    path = path.replace(key, indexes[key]);
                });
                model = this.findModelByPath(model, path.split("."));
                const modelOptions = model instanceof DynamicSelectModel
                    ? await firstValueFrom(model.options$) :
                    [];
                const value = ObjectUtils.getValue(target.value, path);
                const options = (!ObjectUtils.isArray(value) ? [] : value).map(value => {
                    const modelOption = modelOptions.find(t => t.value == value);
                    return {value, label: modelOption?.label || value};
                });
                return this.fixSelectOptions(selectModel, control, options);
            });
        }
        return new FormSelectSubject(async (selectModel, control) => {
            const entries = Object.entries((control.root as FormGroup)?.controls || {});
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
            const options = (await this.api.cache[endpoint]).map(t => Object.assign({}, t));
            return this.fixSelectOptions(selectModel, control, options);
        });
    }

    getFormRadioConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions): FormlyFieldConfig {
        return this.getFormControlConfig(
            property, options,
            {
                props: {
                    options: this.getFormSelectOptions(property, options)
                },
            }
        );
    }

    getFormSelectConfig(property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions): FormlyFieldConfig {
        return this.getFormControlConfig(
            property, options,
            {
                props: {
                    options: this.getFormSelectOptions(property, options),
                    multiple: property.type == "array",
                    groupBy: property.groupBy,
                    inline: property.inline,
                    allowEmpty: property.allowEmpty,
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

    protected async fixSelectOptions(model: DynamicSelectModel<any>, control: FormControl, options: DynamicFormOptionConfig<any>[]): Promise<DynamicFormOptionConfig<any>[]> {
        if (!options) return [];
        for (const option of options) {
            option.classes = [option.classes, model.getClasses(option, model, control, this.injector)].filter(isStringWithVal).join(" ");
            option.label = await this.language.getTranslation(option.label);
        }
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
