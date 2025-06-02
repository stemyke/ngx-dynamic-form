import {Injectable, Injector, Type} from "@angular/core";
import {ObjectUtils, ReflectUtils} from "@stemy/ngx-utils";

import {
    FormBuilderOptions,
    FormFieldConfig,
    FormFieldData,
    FormFieldProps, FormGroupData,
    FormInputData, FormSelectData, FormUploadData,
    Validators
} from "../common-types";
import {validationMessage} from "../utils/validation";
import {MAX_INPUT_NUM, MIN_INPUT_NUM} from "../utils/misc";

export type FormFieldBuilder = (fb: DynamicFormBuilderService, path: string, options: FormBuilderOptions) => FormFieldConfig;

@Injectable()
export class DynamicFormBuilderService {

    constructor(readonly injector: Injector) {
    }

    protected getLabel(label: string, path: string, options: FormBuilderOptions): string {
        label = label || "";
        const pathPrefix = !path ? `` : `${path}.`;
        return !label || !options.labelPrefix
            ? `${label}`
            : `${options.labelPrefix}.${pathPrefix}${label}`;
    }

    protected createFormField(
        key: string, type: string, data: FormFieldData, props: FormFieldProps, path: string, options: FormBuilderOptions
    ): FormFieldConfig {
        const validators = Array.isArray(data.validators)
            ? data.validators.reduce((res, validator, ix) => {
                res[`validator_${ix}`] = validator;
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
            }
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
        console.log(result);
        return result;
    }

    createFormInput(key: string, data: FormInputData, path: string = "", options: FormBuilderOptions = {}): FormFieldConfig {
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
        return this.createFormField(key, "input", data, {
            type: data.type,
            step: data.step,
            min: isNaN(data.min) ? MIN_INPUT_NUM : data.min,
            max: isNaN(data.max) ? MAX_INPUT_NUM : data.max,
            minLength: isNaN(data.minLength) ? 0 : data.minLength,
            maxLength: isNaN(data.maxLength) ? MAX_INPUT_NUM : data.maxLength,
            placeholder: data.placeholder || "",
            attributes: {
                autocomplete: data.autocomplete || "off",
            },
        }, path, options);
    }

    createFormUpload(key: string, data: FormUploadData, path: string = "", options: FormBuilderOptions = {}): FormFieldConfig {
        return this.createFormField(key, "input", data, {
            type: data.type,
            step: data.step,
            min: isNaN(data.min) ? MIN_INPUT_NUM : data.min,
            max: isNaN(data.max) ? MAX_INPUT_NUM : data.max,
            minLength: isNaN(data.minLength) ? 0 : data.minLength,
            maxLength: isNaN(data.maxLength) ? MAX_INPUT_NUM : data.maxLength,
            placeholder: data.placeholder || "",
            attributes: {
                autocomplete: data.autocomplete || "off",
            },
        }, path, options);
    }
}
