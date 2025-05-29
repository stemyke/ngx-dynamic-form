import {ObjectUtils, ReflectUtils} from "@stemy/ngx-utils";
import {
    FormFieldData,
    FormFieldSerializer,
    FormGroupData,
    FormInputData,
    FormSelectData,
    FormUploadData
} from "../common-types";

export function defineFormControl(target: any, propertyKey: string, data: FormFieldData): void {
    const fieldData: FormFieldData = ReflectUtils.getMetadata("dynamicFormField", target, propertyKey) || {
        type: "input"
    };
    ObjectUtils.assign(fieldData, data);
    ReflectUtils.defineMetadata("dynamicFormField", fieldData, target, propertyKey);
}

export function FormSerializable(serializer?: FormFieldSerializer): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        defineFormControl(target, propertyKey, {serializer});
    };
}

export function FormInput(data?: FormInputData): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        const meta = ReflectUtils.getOwnMetadata("design:type", target, propertyKey);
        const type = meta ? meta.name : "";
        let inputType = propertyKey.indexOf("password") < 0 ? "text" : "password";
        switch (type) {
            case "Number":
                inputType = "number";
                break;
            case "Boolean":
                inputType = "checkbox";
                break;
        }
        defineFormControl(target, propertyKey, createFormInput(propertyKey, data, inputType));
    };
}

export function FormSelect(data?: FormSelectData): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        defineFormControl(target, propertyKey, createFormSelect(propertyKey, data));
    };
}

export function FormUpload(data?: FormUploadData): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        defineFormControl(target, propertyKey, createFormFile(propertyKey, data));
    };
}

export function FormFile(data?: FormUploadData): PropertyDecorator {
    console.warn(`@FormFile decorator is deprecated, use @FormUpload instead`);
    return FormUpload(data);
}

export function FormGroup(data?: FormGroupData): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        defineFormControl(target, propertyKey, createFormModel(propertyKey, data));
    };
}

export function FormModel(data?: FormGroupData): PropertyDecorator {
    console.warn(`@FormModel decorator is deprecated, use @FormGroup instead`);
    return FormGroup(data);
}
