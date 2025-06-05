import {Inject, Injectable, Injector, Type} from "@angular/core";
import {distinctUntilChanged, startWith, switchMap} from "rxjs";
import {
    API_SERVICE,
    IApiService,
    ILanguageService,
    LANGUAGE_SERVICE,
    ObjectUtils,
    ReflectUtils
} from "@stemy/ngx-utils";

import {
    FormArrayData,
    FormBuilderOptions,
    FormFieldConfig,
    FormFieldData,
    FormFieldProps,
    FormGroupData,
    FormInputData,
    FormSelectData,
    FormSelectOption,
    FormUploadData,
    PromiseOrNot,
    Validators
} from "../common-types";
import {validationMessage} from "../utils/validation";
import {isStringWithVal, MAX_INPUT_NUM, MIN_INPUT_NUM} from "../utils/misc";

export type FormFieldBuilder = (fb: DynamicFormBuilderService, parent: FormFieldConfig, options: FormBuilderOptions) => FormFieldConfig;

@Injectable()
export class DynamicFormBuilderService {

    constructor(readonly injector: Injector,
                @Inject(API_SERVICE) readonly api: IApiService,
                @Inject(LANGUAGE_SERVICE) readonly language: ILanguageService) {
    }

    protected getLabel(key: string, label: string, parent: FormFieldConfig, options: FormBuilderOptions): string {
        const labelPrefix = !ObjectUtils.isString(options.labelPrefix) ? `` : options.labelPrefix;
        const pathPrefix = `${parent?.props?.label || labelPrefix}`;
        const labelItems = ObjectUtils.isString(label)
            ? (!label ? [] : [labelPrefix, label])
            : [pathPrefix, `${key || ""}`]
        return labelItems.filter(l => l.length > 0).join(".");
    }

    protected createFormField(key: string, type: string, data: FormFieldData, props: FormFieldProps, parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig {
        const validators = Array.isArray(data.validators)
            ? data.validators.reduce((res, validator, ix) => {
                res[validator.validatorName || `validator_${ix}`] = validator;
                return res;
            }, {} as Validators)
            : data.validators || {};
        return {
            key,
            type,
            validators,
            className: Array.isArray(data.classes) ? data.classes.join(" ") : data.classes || "",
            fieldSet: data.fieldSet,
            validation: {
                messages: Object.keys(validators).reduce((res, key) => {
                    res[key] = validationMessage(this.injector, key, options.labelPrefix);
                    return res;
                }, {})
            },
            props: {
                ...props,
                required: !!validators.required,
                label: this.getLabel(key, data.label, parent, options),
            }
        }
    }

    resolveFormFields(target: Type<any>, parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig[] {
        const prototype = target?.prototype || {};
        const fields: Set<string> = ReflectUtils.getMetadata("dynamicFormFields", target?.prototype || {}) || new Set();
        const result: FormFieldConfig[] = [];
        for (const key of fields) {
            const builder: FormFieldBuilder = ReflectUtils.getMetadata("dynamicFormField", prototype, key);
            const field = builder(this, parent, options);
            result.push(field);
        }
        return result;
    }

    resolveFormGroup(key: string, target: Type<any>, data: FormGroupData, parent: FormFieldConfig = null, options: FormBuilderOptions = {}): FormFieldConfig {
        return this.createFormGroup(key, sp => this.resolveFormFields(
            target, sp, options
        ), data, parent, options);
    }

    resolveFormArray(key: string, itemType: string | FormInputData | Type<any>, data: FormArrayData, parent: FormFieldConfig = null, options: FormBuilderOptions = {}): FormFieldConfig {
        return this.createFormArray(key, sp => {
            return typeof itemType === "function" ? this.resolveFormFields(
                itemType, sp, options
            ) : this.createFormInput("", typeof itemType === "string" ? {type: `${itemType}`} : itemType, sp, options);
        }, data, parent, options);
    }

    createFormInput(key: string, data: FormInputData, parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig {
        data = data || {};
        return this.createFormField(key, data.type === "checkbox" ? "checkbox" : "input", data, {
            type: `${data.type || "text"}`,
            pattern: ObjectUtils.isString(data.pattern) ? data.pattern : "",
            step: data.step,
            cols: data.cols || null,
            rows: data.rows || 10,
            min: isNaN(data.min) ? MIN_INPUT_NUM : data.min,
            max: isNaN(data.max) ? MAX_INPUT_NUM : data.max,
            minLength: isNaN(data.minLength) ? 0 : data.minLength,
            maxLength: isNaN(data.maxLength) ? MAX_INPUT_NUM : data.maxLength,
            placeholder: data.placeholder || "",
            attributes: {
                autocomplete: data.autocomplete || "off"
            },
        }, parent, options);
    }

    createFormSelect(key: string, data: FormSelectData, parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig {
        data = data || {options: () => []};
        const select = this.createFormField(key, data.type === "radio" ? "radio" : "select", data, {
            multiple: data.multiple,
            type: data.type,
            groupBy: data.groupBy,
            inline: data.inline,
            allowEmpty: data.allowEmpty
        }, parent, options);
        select.hooks = {
            onInit: field => {
                const options = data.options(field);
                const control = field.formControl.root;
                field.props.options = options instanceof Promise ? control.valueChanges.pipe(
                    startWith(control.value),
                    distinctUntilChanged(),
                    switchMap(async () => {
                        const results: FormSelectOption[] = await data.options(field) as any;
                        return this.fixSelectOptions(field, results);
                    })
                ) : options;
            }
        };
        return select;
    }

    createFormUpload(key: string, data: FormUploadData, parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig {
        data = data || {};

        if (data.asFile) {
            data.inline = true;
            console.warn(`File upload property "asFile" is deprecated. Use "inline" instead.`);
        }

        if (data.multi) {
            data.multiple = true;
            console.warn(`File upload property "multi" is deprecated. Use "multiple" instead.`);
        }

        return this.createFormField(key, "upload", data, {
            inline: data.inline === true,
            multiple: data.multiple === true,
            accept: data.accept || [".png", ".jpg"],
            url: data.url?.startsWith("http") ? data.url : this.api.url(data.url || "assets"),
            maxSize: isNaN(data.maxSize) ? MAX_INPUT_NUM : data.maxSize,
            uploadOptions: data.uploadOptions || {},
            createUploadData: data.createUploadData
        }, parent, options);
    }

    createFormGroup(key: string, fields: (parent: FormFieldConfig) => FormFieldConfig[], data: FormGroupData, parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig
    createFormGroup(key: string, fields: (parent: FormFieldConfig) => Promise<FormFieldConfig[]>, data: FormGroupData, parent: FormFieldConfig, options: FormBuilderOptions): Promise<FormFieldConfig>
    createFormGroup(key: string, fields: (parent: FormFieldConfig) => any, data: FormGroupData, parent: FormFieldConfig, options: FormBuilderOptions): PromiseOrNot<FormFieldConfig> {
        data = data || {};
        const group = this.createFormField(key, undefined, data, {

        }, parent, options);
        group.wrappers = ["form-group"];
        const result = fields(group);
        if (result instanceof Promise) {
            return result.then(fieldGroup => {
                group.fieldGroup = fieldGroup;
                return group;
            });
        }
        group.fieldGroup = result;
        return group;
    }

    createFormArray(key: string, fields: (parent: FormFieldConfig) => FormFieldConfig | FormFieldConfig[], data: FormArrayData, parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig
    createFormArray(key: string, fields: (parent: FormFieldConfig) => Promise<FormFieldConfig | FormFieldConfig[]>, data: FormArrayData, parent: FormFieldConfig, options: FormBuilderOptions): Promise<FormFieldConfig>
    createFormArray(key: string, fields: (parent: FormFieldConfig) => any, data: FormArrayData, parent: FormFieldConfig, options: FormBuilderOptions): PromiseOrNot<FormFieldConfig> {
        data = data || {};
        const array = this.createFormField(key, "array", data, {
            // initialCount: data.initialCount || 0,
            // sortable: data.sortable || false,
            useTabs: data.useTabs || false,
            tabsLabel: `${data.tabsLabel || "label"}`,
            addItem: data.addItem !== false,
            insertItem: data.insertItem !== false,
            cloneItem: data.cloneItem !== false,
            moveItem: data.moveItem !== false,
            removeItem: data.removeItem !== false,
            clearItems: data.clearItems !== false
        }, parent, options);
        const result = fields(array);
        if (result instanceof Promise) {
            return result.then(items => {
                array.fieldArray = Array.isArray(items) ? {
                    wrappers: ["form-group"],
                    fieldGroup: items,
                } : items;
                return array;
            });
        }
        array.fieldArray = Array.isArray(result) ? {
            wrappers: ["form-group"],
            fieldGroup: result,
        } : result;
        return array;
    }

    async fixSelectOptions(field: FormFieldConfig, options: FormSelectOption[]): Promise<FormSelectOption[]> {
        if (!options) return [];
        for (const option of options) {
            const classes = Array.isArray(option.classes) ? option.classes : [`${option.classes}`];
            option.className = classes.filter(isStringWithVal).join(" ");
            option.label = await this.language.getTranslation(option.label);
            option.value = option.value ?? option.id;
            option.id = option.id ?? option.value;
        }
        const control = field.formControl;
        if (field.props.multiple || options.length === 0 || options.findIndex(o => o.value === control.value) >= 0) return options;
        control.setValue(options[0].value);
        return options;
    }
}
