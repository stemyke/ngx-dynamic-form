import {DatePipe} from "@angular/common";
import {FactoryDependencies, FileUtils, ObjectUtils} from "@stemy/ngx-utils";
import {FormControlTester, FormControlValidator, IDynamicFormControl, IFormControlSerializer} from "../common-types";

export class FormUtilities {

    static checkField(expression: string = `true`): FormControlTester {
        // @dynamic
        const lambda = (control: IDynamicFormControl): Promise<boolean> => {
            return Promise.resolve(ObjectUtils.evaluate(expression, {control: control}));
        };
        return lambda;
    }

    static checkReadonly(control: IDynamicFormControl): Promise<boolean> {
        return Promise.resolve(control.visible && !control.disabled);
    }

    static readonly(): Promise<boolean> {
        return Promise.resolve(true);
    }

    static validateJSON(control: IDynamicFormControl): Promise<string> {
        const value = control.value;
        if (!value) return Promise.resolve(null);
        try {
            JSON.parse(value);
            return Promise.resolve(null);
        } catch (e) {
            return Promise.resolve("error.not-valid-json")
        }
    }

    static validateRequired(control: IDynamicFormControl): Promise<string> {
        const value = control.value;
        return Promise.resolve(!ObjectUtils.isNumber(value) && !value ? "error.required" : null);
    }

    static validateMinLength(length: number): FormControlValidator {
        return (control: IDynamicFormControl) => {
            const value = control.value;
            if (!ObjectUtils.isString(value) || value.length < length) {
                return Promise.resolve({"error.min-length": {length: length}});
            }
            return Promise.resolve(null);
        }
    }

    static validateMaxLength(length: number): FormControlValidator {
        return (control: IDynamicFormControl) => {
            const value = control.value;
            if (!ObjectUtils.isString(value) || value.length > length) {
                return Promise.resolve({"error.max-length": {length: length}});
            }
            return Promise.resolve(null);
        }
    }

    static validateRequiredTranslation(control: IDynamicFormControl): Promise<string> {
        const value: any[] = control.value;
        if (!value || value.length == 0) return Promise.resolve("error.required");
        return Promise.resolve(value.findIndex(t => (t.lang == "de" || t.lang == "en") && !t.translation) < 0 ? null : "error.required");
    }

    static validateEmail(control: IDynamicFormControl): Promise<string> {
        const value = control.value;
        if (!value) return Promise.resolve(null);
        const emailRegexp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return Promise.resolve(emailRegexp.test(value) ? null : "error.invalid-email");
    }

    static validatePhone(control: IDynamicFormControl): Promise<string> {
        const value = control.value;
        if (!value) return Promise.resolve(null);
        const phoneRegexp = /^(?:\d){10,12}$/;
        return Promise.resolve(phoneRegexp.test(value) ? null : "error.invalid-phone");
    }

    static serializeLogo(id: string, parent: IDynamicFormControl): Promise<any> {
        const value: string = parent.model[id];
        return Promise.resolve(!value || value.length == 0 ? null : value);
    }

    static serializeFile(id: string, parent: IDynamicFormControl): Promise<any> {
        const value: any = parent.model[id];
        if (ObjectUtils.isBlob(value)) return Promise.resolve(value);
        return Promise.resolve(!ObjectUtils.isString(value) || !value.startsWith("data:") ? null : FileUtils.dataToBlob(value));
    }

    static serializeNumber(id: string, parent: IDynamicFormControl): Promise<any> {
        const value: string = parent.model[id];
        return Promise.resolve(!value || value.length == 0 ? 0 : parseFloat(value));
    }

    static serializeJSON(id: string, parent: IDynamicFormControl): Promise<any> {
        const value: string = parent.model[id];
        return Promise.resolve(!value ? {} : JSON.parse(value));
    }

    @FactoryDependencies(DatePipe)
    static serializeDate(date: DatePipe, format: string = "yyyy-MM-dd", defaultValue: string = ""): IFormControlSerializer {
        // @dynamic
        const lambda = (id: string, parent: IDynamicFormControl): Promise<any> => {
            const value: any = parent.model[id];
            if (!ObjectUtils.isDate(value)) return Promise.resolve(value || defaultValue);
            return Promise.resolve(!format ? value : date.transform(value, format));
        };
        return lambda;
    }
}
