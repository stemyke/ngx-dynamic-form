import {ObjectUtils, ReflectUtils} from "@stemy/ngx-utils";
import {
    FormArrayData,
    FormFieldSerializer,
    FormGroupData,
    FormInputData,
    FormSelectData,
    FormUploadData
} from "../common-types";
import {FormFieldBuilder} from "../services/dynamic-form-builder.service";
import {Type} from "@angular/core";

function defineFormControl(target: any, propertyKey: string, cb: FormFieldBuilder): void {
    const fields: Set<string> = ReflectUtils.getMetadata("dynamicFormFields", target) || new Set();
    const existing: FormFieldBuilder = ReflectUtils.getMetadata("dynamicFormField", target, propertyKey);
    const builder: FormFieldBuilder = !ObjectUtils.isFunction(existing) ? cb : ((fb, opts, path) => {
        const data = existing(fb, opts, path);
        return ObjectUtils.assign(data || {}, cb(fb, opts, path) || {});
    });
    fields.add(propertyKey);
    ReflectUtils.defineMetadata("dynamicFormField", builder, target, propertyKey);
    ReflectUtils.defineMetadata("dynamicFormFields", fields, target);
}

export function FormSerializable(serializer?: FormFieldSerializer): PropertyDecorator {
    return (target: any, key: string): void => {
        defineFormControl(target, key, () => ({key, serializer, serialize: true}));
    };
}

export function FormInput(data?: FormInputData): PropertyDecorator {
    return (target: any, key: string): void => {
        const meta = ReflectUtils.getOwnMetadata("design:type", target, key);
        const type = meta ? meta.name : "";
        let inputType = key.indexOf("password") < 0 ? "text" : "password";
        switch (type) {
            case "Number":
                inputType = "number";
                break;
            case "Boolean":
                inputType = "checkbox";
                break;
        }
        data.type = data.type || inputType;
        defineFormControl(
            target, key,
            (fb, path, options) =>
                fb.createFormInput(key, data, path, options)
        );
    };
}

export function FormSelect(data?: FormSelectData): PropertyDecorator {
    return (target: any, key: string): void => {
        defineFormControl(
            target, key,
            (fb, path, options) =>
                fb.createFormSelect(key, data, path, options)
        );
    };
}

export function FormUpload(data?: FormUploadData): PropertyDecorator {
    return (target: any, key: string): void => {
        defineFormControl(
            target, key,
            (fb, path, options) =>
                fb.createFormUpload(key, data, path, options)
        );
    };
}

export function FormFile(data?: FormUploadData): PropertyDecorator {
    console.warn(`@FormFile decorator is deprecated, use @FormUpload instead`);
    return FormUpload(data);
}

export function FormGroup(data?: FormGroupData): PropertyDecorator {
    return (target: any, key: string): void => {
        defineFormControl(
            target, key,
            (fb, path, options) => {
                const targetType = ReflectUtils.getOwnMetadata("design:type", target, key);
                return fb.resolveFormGroup(key, targetType, data, path, options);
            }
        );
    };
}

export function FormArray(itemType: string | FormInputData | Type<any>, data?: FormArrayData): PropertyDecorator {
    return (target: any, key: string): void => {
        defineFormControl(
            target, key,
            (fb, path, options) => {
                return fb.resolveFormArray(key, itemType, data, path, options);
            }
        );
    };
}

export function FormModel(data?: FormGroupData): PropertyDecorator {
    console.warn(`@FormModel decorator is deprecated, use @FormGroup instead`);
    return FormGroup(data);
}
