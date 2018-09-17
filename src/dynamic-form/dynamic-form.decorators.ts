import {ReflectUtils, UniqueUtils} from "@stemy/ngx-utils";
import {
    FORM_CONTROL_PROVIDER, FormControlTester, IDynamicFormFieldSets, IFormControl, IFormControlComponent,
    IFormControlData, IFormFieldSet,
    IFormInputData
} from "./dynamic-form.types";
import {isNullOrUndefined} from "util";
import {Provider, Type} from "@angular/core";

const emptyArray: any = [];
const emptyTester: FormControlTester = () => {
    return Promise.resolve(false);
};

export function FormInput(data?: IFormInputData): PropertyDecorator {
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

export function FormFieldSet(data: IFormFieldSet): ClassDecorator {
    return (target: any): void => {
        const sets = getFormFieldSets(target);
        sets[data.id] = data;
        ReflectUtils.defineMetadata("dynamicFormFieldSets", sets, target);
    };
}

export function provideFormControl(component: Type<IFormControlComponent>, accept?: (control: IFormControl) => boolean): Provider {
    return {
        provide: FORM_CONTROL_PROVIDER,
        multi: true,
        useValue: {
            component: component,
            accept: accept || component["accept"]
        }
    };
}

export function defineFormControl(target: any, propertyKey: string, control: IFormControl) {
    ReflectUtils.defineMetadata("dynamicFormControl", control, target, propertyKey);
}

export function getFormControl(target: any, propertyKey: string): IFormControl {
    return ReflectUtils.getMetadata("dynamicFormControl", target, propertyKey);
}

export function getFormFieldSets(target: any): IDynamicFormFieldSets {
    return ReflectUtils.getMetadata("dynamicFormFieldSets", target) || {};
}

export function createFormControl(id: string, type: string, data?: IFormControlData): IFormControl {
    data = data || {};
    data.label = isNullOrUndefined(data.label) ? id : data.label;
    data.labelAlign = data.labelAlign || "left";
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

export function createFormInput(id: string, data?: IFormInputData, inputType: string = "text"): IFormControl {
    const control = createFormControl(id, "input", data);
    data = control.data;
    data.type = data.type || inputType;
    data.placeholder = data.placeholder || "";
    data.step = data.step || 1;
    return control;
}
