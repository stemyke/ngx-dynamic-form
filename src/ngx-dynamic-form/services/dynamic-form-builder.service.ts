import {Injectable, Injector} from "@angular/core";
import {ObjectUtils} from "@stemy/ngx-utils";

import {
    FormBuilderOptions,
    FormFieldConfig,
    FormFieldData,
    FormFieldProps,
    FormInputData,
    Validators
} from "../common-types";
import {validationMessage} from "../utils/validation";
import {MAX_INPUT_NUM, MIN_INPUT_NUM} from "../utils/misc";

@Injectable()
export class DynamicFormBuilderService {

    constructor(readonly injector: Injector) {
    }

    protected getLabel(label: string, options: FormBuilderOptions, path: string): string {
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
        const label = !data.label? data.key : data.label;
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
                label: this.getLabel(label, options, path),
            }
        }
    }

    createFormInput(key: string, data: FormInputData, path: string = "", options: FormBuilderOptions = {}): FormFieldConfig {
        return this.createFormField(key, "input", data, {
            type: data.type,
            pattern: data.pattern,
            step: isNaN(sub.step) ? (isNaN(property.step) ? 1 : property.step) : sub.step,
            min: isNaN(sub.minimum) ? MIN_INPUT_NUM : sub.minimum,
            max: isNaN(sub.maximum) ? MAX_INPUT_NUM : sub.maximum,
            minLength: isNaN(sub.minLength) ? 0 : sub.minLength,
            maxLength: isNaN(sub.maxLength) ? MAX_INPUT_NUM : sub.maxLength,
            placeholder: property.placeholder || "",
            attributes: {
                autocomplete: data.autocomplete || "off",
                accept: ObjectUtils.isString(data.accept) ? data.accept : null,
            },
        }, path, options);
    }
}
