import {Injector} from "@angular/core";
import {LANGUAGE_SERVICE, ObjectUtils} from "@stemy/ngx-utils";
import {ValidationMessageFn, ValidatorFn} from "../common-types";

export function validationMessage(injector: Injector, key: string, labelPrefix?: string): ValidationMessageFn {
    const language = injector.get(LANGUAGE_SERVICE);
    return (_, field) => {
        return language.getTranslationSync(labelPrefix ? `${labelPrefix}.error.${key}` : `error.${key}`, field);
    }
}

export function withName(fn: ValidatorFn, name: string): ValidatorFn {
    fn.validatorName = name;
    return fn;
}

function validateEach(each: boolean, cb: (value: any) => boolean, name: string): ValidatorFn {
    return withName((control) => {
        const value = control.value;
        return each ? Array.isArray(value) && value.every(cb) : cb(value);
    }, name);
}

export function jsonValidation(): ValidatorFn {
    return withName((control) => {
        const value = control.value;
        if (!value) return false;
        try {
            JSON.parse(value);
            return true;
        } catch (e) {
            return false;
        }
    }, "json");
}

export function requiredValidation(): ValidatorFn {
    return withName((control) =>
            ObjectUtils.isString(control.value) ? control.value.length > 0 : ObjectUtils.isDefined(control.value),
        "required"
    )
}

export function translationValidation(langs: string[] = ["de", "en"]): ValidatorFn {
    return withName((control) => {
        const value: any[] = control.value;
        if (!value || value.length == 0) return false;
        return value.findIndex(t => langs.includes(t.lang) && !t.translation) < 0;
    }, "translation");
}

export function phoneValidation(): ValidatorFn {
    return withName((control) => {
        const value = control.value;
        if (!value) return true;
        const phoneRegexp = /^\d{10,12}$/;
        return phoneRegexp.test(value);
    }, "phone");
}

export function emailValidation(): ValidatorFn {
    return withName((control) => {
        const value = control.value;
        if (!value) return true;
        const emailRegexp = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/g;
        return emailRegexp.test(value);
    }, "email");
}

export function minLengthValidation(minLength: number, each?: boolean): ValidatorFn {
    return validateEach(each, v => typeof v == "string" && v.length >= minLength, "minLength");
}

export function maxLengthValidation(maxLength: number, each?: boolean): ValidatorFn {
    return validateEach(each, v => typeof v == "string" && v.length <= maxLength, "maxLength");
}

export function minValueValidation(min: number, each?: boolean): ValidatorFn {
    return validateEach(each, v => typeof v == "number" && v >= min, "minValue");
}

export function maxValueValidation(max: number, each?: boolean): ValidatorFn {
    return validateEach(each, v => typeof v == "number" && v <= max, "maxValue");
}
