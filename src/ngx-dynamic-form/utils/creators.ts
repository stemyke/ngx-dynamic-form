import {ConfigForSchemaWrapOptions, FormFieldConfig, FormFieldData, FormInputData} from "../common-types";
import {IOpenApiSchemaProperty, ObjectUtils} from "@stemy/ngx-utils";
import {FormlyFieldConfig} from "@ngx-formly/core";
import {validationMessage} from "./validation";
import {MAX_INPUT_NUM, MIN_INPUT_NUM} from "./misc";

export function createFormControl(id: string, type: string, data?: FormFieldData): FormFieldConfig {
    data = data || {componentType: "input"};
    data.label = ObjectUtils.isNullOrUndefined(data.label) ? id : data.label;
    data.fieldSet = data.fieldSet || UniqueUtils.uuid();
    data.classes = data.classes || "";
    data.readonly = data.readonly || emptyTester;
    data.hidden = data.hidden || emptyTester;
    data.validators = data.validators || emptyArray;
    return {
        id: id,
        type: type,
        data: data
    };
}

function createFormField(options: ConfigForSchemaWrapOptions, path: string, custom: FormFieldConfig): FormFieldConfig {
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
            appearance: "fill",
            required: !!validators.required,
            label: this.getLabel(label, options, path),
        }
    }, custom);
}

export function createFormField(id: string, data: FormInputData): FormFieldConfig {
    return createFormControl(
        property, options, path,
        {
            type: "input",
            props: {
                type,
                attributes: {
                    autocomplete: data.autocomplete || "off",
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

export function createFormSelect(id: string, data: IFormSelectData): IFormControl {
    const control = createFormControl(id, "select", data);
    data = control.data;
    data.options = data.options || (() => Promise.resolve([]));
    data.type = data.type || "select";
    const classType = data.type == "select" ? "select" : `select-${data.type}`;
    data.classes = !data.classes ? `form-group-${classType}` : `${data.classes} form-group-${classType}`;
    return control;
}

export function createFormStatic(id: string, data: IFormStaticData): IFormControl {
    const control = createFormControl(id, "static", data);
    data = control.data;
    data.style = data.style || "table";
    return control;
}

export function createFormModel(id: string, data: IFormModelData): IFormControl {
    const control = createFormControl(id, "model", data);
    data = control.data;
    data.name = data.name || "";
    return control;
}

export function createFormFile(id: string, data: IFormFileData): IFormControl {
    const control = createFormControl(id, "file", data);
    data = control.data;
    data.accept = data.accept || ".jpg,.jpeg,.png";
    data.multi = data.multi || false;
    data.baseUrl = ObjectUtils.isString(data.baseUrl) ? data.baseUrl : "assets/";
    data.uploadUrl = ObjectUtils.isString(data.uploadUrl) ? data.uploadUrl : "assets";
    data.createUploadData = data.createUploadData || ((file: File) => {
        const form = new FormData();
        form.append("file", file);
        return form;
    });
    return control;
}
