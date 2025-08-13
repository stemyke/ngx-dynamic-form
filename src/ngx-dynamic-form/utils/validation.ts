import {Injector} from "@angular/core";
import {LANGUAGE_SERVICE, ObjectUtils} from "@stemy/ngx-utils";
import {FormFieldConfig, ValidationMessageFn, ValidatorFn, Validators} from "../common-types";

function validationMessage(errorKey: string): ValidationMessageFn {
    const key = `form.error.${errorKey}`;
    return (_, field) => {
        const injector = field.options.formState?.injector as Injector;
        const language = injector?.get(LANGUAGE_SERVICE);
        return !language ? key : language.getTranslationSync(key, field);
    }
}

function withName(fn: ValidatorFn, name: string): ValidatorFn {
    fn.validatorName = name;
    return fn;
}

function validateEach(each: boolean, cb: (value: any) => boolean, name: string): ValidatorFn {
    return withName((control) => {
        const value = control.value;
        return each ? Array.isArray(value) && value.every(cb) : cb(value);
    }, name);
}

export function addFieldValidators(field: FormFieldConfig, validators: Validators | ValidatorFn[]): void {
    field.validators = field.validators || {};
    const validation = field.validation || {};
    const messages = validation.messages || {};
    if (Array.isArray(validators)) {
        validators.forEach((validator, ix) => {
            const name = validator.validatorName || `validator_${ix}`;
            field.validators[name] = validator;
            messages[name] = validationMessage(name);
        });
    } else if (validators) {
        Object.keys(validators).forEach(name => {
            field.validators[name] = validators[name];
            messages[name] = validationMessage(name);
        });
    }
    field.validation = {
        ...validation,
        messages
    };
}

export function removeFieldValidators(field: FormFieldConfig, ...names: string[]): void {
    const validators = Object.assign({}, field.validators || {});
    const validation = field.validation || {};
    const messages = Object.assign({}, validation.messages || {});
    names.forEach(name => {
        delete validators[name];
        delete messages[name];
    });
    field.validators = validators;
    field.validation = {
        ...validation,
        messages
    };
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

export function minValueValidation(min: number | Date, each?: boolean): ValidatorFn {
    return validateEach(each, v => {
        if (min instanceof Date) {
            const date = new Date(v) as any;
            return isNaN(date) || date >= min;
        }
        return v == null || v >= min;
    }, "minValue");
}

export function maxValueValidation(max: number | Date, each?: boolean): ValidatorFn {
    return validateEach(each, v => {
        if (max instanceof Date) {
            const date = new Date(v) as any;
            return isNaN(date) || date <= max;
        }
        return v == null || v <= max;
    }, "maxValue");
}
