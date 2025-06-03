import {Inject, Injectable, Injector, Type} from "@angular/core";
import {from} from "rxjs";
import {ILanguageService, LANGUAGE_SERVICE, ObjectUtils, ReflectUtils} from "@stemy/ngx-utils";

import {
    FormArrayData,
    FormBuilderOptions,
    FormFieldConfig, FormFieldCustom,
    FormFieldData,
    FormFieldProps, FormGroupData,
    FormHookConfig,
    FormInputData,
    FormSelectData,
    FormSelectOption,
    FormUploadData,
    Validators
} from "../common-types";
import {validationMessage} from "../utils/validation";
import {isStringWithVal, MAX_INPUT_NUM, MIN_INPUT_NUM} from "../utils/misc";

export type FormFieldBuilder = (fb: DynamicFormBuilderService, path: string, options: FormBuilderOptions) => FormFieldConfig;

@Injectable()
export class DynamicFormBuilderService {

    constructor(readonly injector: Injector,
                @Inject(LANGUAGE_SERVICE) readonly language: ILanguageService) {
    }

    protected getLabel(label: string, path: string, options: FormBuilderOptions): string {
        label = label || "";
        const pathPrefix = !path ? `` : `${path}.`;
        return !label || !options.labelPrefix
            ? `${label}`
            : `${options.labelPrefix}.${pathPrefix}${label}`;
    }

    protected createFormField(
        key: string, type: string, data: FormFieldData, props: FormFieldProps, path: string, options: FormBuilderOptions,
        custom?: FormFieldCustom
    ): FormFieldConfig {
        const validators = Array.isArray(data.validators)
            ? data.validators.reduce((res, validator, ix) => {
                res[validator.validatorName || `validator_${ix}`] = validator;
                return res;
            }, {} as Validators)
            : data.validators || {};
        const label = !data.label? key : data.label;
        return {
            key,
            type,
            validators,
            validation: {
                messages: Object.keys(validators).reduce((res, key) => {
                    res[key] = validationMessage(this.injector, key, options.labelPrefix);
                    return res;
                }, {})
            },
            props: {
                ...props,
                required: !!validators.required,
                label: this.getLabel(label, path, options),
            },
            ...custom
        }
    }

    resolveFormFields(target: Type<any>, path: string = "", options: FormBuilderOptions = {}): FormFieldConfig[] {
        const prototype = target?.prototype || {};
        const fields: Set<string> = ReflectUtils.getMetadata("dynamicFormFields", target?.prototype || {});
        const result: FormFieldConfig[] = [];
        for (const key of fields) {
            const builder: FormFieldBuilder = ReflectUtils.getMetadata("dynamicFormField", prototype, key);
            const field = builder(this, path, options);
            result.push(field);
        }
        return result;
    }

    createFormInput(key: string, data: FormInputData, path: string = "", options: FormBuilderOptions = {}): FormFieldConfig {
        data = data || {};
        return this.createFormField(key, "input", data, {
            type: data.type,
            pattern: data.pattern,
            step: data.step,
            min: isNaN(data.min) ? MIN_INPUT_NUM : data.min,
            max: isNaN(data.max) ? MAX_INPUT_NUM : data.max,
            minLength: isNaN(data.minLength) ? 0 : data.minLength,
            maxLength: isNaN(data.maxLength) ? MAX_INPUT_NUM : data.maxLength,
            placeholder: data.placeholder || "",
            attributes: {
                autocomplete: data.autocomplete || "off",
                accept: ObjectUtils.isString(data.accept) ? data.accept : null,
            },
        }, path, options);
    }

    createFormSelect(key: string, data: FormSelectData, path: string = "", options: FormBuilderOptions = {}): FormFieldConfig {
        data = data || {options: () => []};
        return this.createFormField(key, "select", data, {
            multiple: data.multiple,
            groupBy: data.groupBy,
            inline: data.inline,
            allowEmpty: data.allowEmpty
        }, path, options, {
            hooks: {
                onInit: field => {
                    const options = data.options(field);
                    field.props.options = options instanceof Promise ? from(options.then(res => {
                        return this.fixSelectOptions(field, res);
                    })) : options;
                }
            }
        });
    }

    createFormUpload(key: string, data: FormUploadData, path: string = "", options: FormBuilderOptions = {}): FormFieldConfig {
        data = data || {};
        return this.createFormField(key, "upload", data, {
            // accept: data.type,
            // step: data.step,
            // min: isNaN(data.min) ? MIN_INPUT_NUM : data.min,
            // max: isNaN(data.max) ? MAX_INPUT_NUM : data.max,
            // minLength: isNaN(data.minLength) ? 0 : data.minLength,
            // maxLength: isNaN(data.maxLength) ? MAX_INPUT_NUM : data.maxLength,
            // placeholder: data.placeholder || "",
            // attributes: {
            //     autocomplete: data.autocomplete || "off",
            // },
        }, path, options);
    }

    createFormGroup(key: string, fields: FormFieldConfig[], data: FormGroupData, path: string = "", options: FormBuilderOptions = {}): FormFieldConfig {
        data = data || {};
        return this.createFormField(key, undefined, data, {

        }, path, options, {
            wrappers: ["form-group"],
            fieldGroup: fields
        });
    }

    createFormArray(key: string, array: FormFieldConfig | FormFieldConfig[], data: FormArrayData, path: string = "", options: FormBuilderOptions = {}): FormFieldConfig {
        data = data || {};
        return this.createFormField(key, "array", data, {
            // initialCount: data.initialCount || 0,
            // sortable: data.sortable || false,
            // useTabs: data.useTabs || false,
            addItem: data.addItem !== false,
            insertItem: data.insertItem !== false,
            cloneItem: data.cloneItem !== false,
            moveItem: data.moveItem !== false,
            removeItem: data.removeItem !== false,
            clearItems: data.clearItems !== false
        }, path, options, {
            fieldArray: Array.isArray(array) ? {
                fieldGroup: array,
            } : array
        });
    }

    async fixSelectOptions(field: FormFieldConfig, options: FormSelectOption[]): Promise<FormSelectOption[]> {
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
}
