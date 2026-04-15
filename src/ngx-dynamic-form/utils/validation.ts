import {Injector} from "@angular/core";
import {LANGUAGE_SERVICE, ObjectUtils} from "@stemy/ngx-utils";
import {FormFieldConfig, ValidationMessageFn, ValidatorFn, Validators} from "../common-types";
import {AbstractControl} from "@angular/forms";
import {convertToDate, convertToDateFormat, isFieldHidden, setFieldDefault, setFieldProp, setFieldValue} from "./misc";

function validationMessage(errorKey: string): ValidationMessageFn {
    const key = `form.error.${errorKey}`;
    return (_, field) => {
        const injector = field.options.formState?.injector as Injector;
        const language = injector?.get(LANGUAGE_SERVICE);
        return !language ? key : language.getTranslationSync(key, field);
    }
}

function withName(fn: ValidatorFn, name: string): ValidatorFn {
    const mainFn: ValidatorFn = (control: AbstractControl, field: FormFieldConfig) => {
        return isFieldHidden(field) || fn(control, field);
    };
    mainFn.validatorName = name;
    return mainFn;
}

function validateEach(each: boolean, cb: (value: any, field: FormFieldConfig) => boolean, name: string): ValidatorFn {
    return withName((control, field) => {
        const value = control.value;
        return each ? Array.isArray(value) && value.every(v => cb(v, field)) : cb(value, field);
    }, name);
}

export function addFieldValidators(field: FormFieldConfig, validators: Validators | ReadonlyArray<ValidatorFn>): void {
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
    const validation = Object.assign({}, field.validation || {});
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

export function arrayLengthValidation(min: number = 1, max: number = Number.MAX_SAFE_INTEGER) {
    return withName((control) => {
        const value = control.value;
        return !Array.isArray(value) || (min <= value.length && value.length <= max);
    }, "arrayLength");
}

export function minLengthValidation(minLength: number, each?: boolean): ValidatorFn {
    return validateEach(each, v => typeof v == "string" && v.length >= minLength, "minLength");
}

export function maxLengthValidation(maxLength: number, each?: boolean): ValidatorFn {
    return validateEach(each, v => typeof v == "string" && v.length <= maxLength, "maxLength");
}

export function minValueValidation(each?: boolean): ValidatorFn {
    return validateEach(each, (v, f) => {
        const type = f.props.type || "number";
        const min = type.includes("date")
            ? convertToDate(f.props.min, type) : Number(f.props.min ?? 0);
        if (min instanceof Date) {
            const date = new Date(v) as any;
            return isNaN(date) || date >= min;
        }
        return v == null || v >= min;
    }, "minValue");
}

export function maxValueValidation(each?: boolean): ValidatorFn {
    return validateEach(each, (v, f) => {
        const type = f.props.type || "number";
        const max = type.includes("date")
            ? convertToDate(f.props.max, type) : Number(f.props.max ?? 0);
        if (max instanceof Date) {
            const date = new Date(v) as any;
            return isNaN(date) || date <= max;
        }
        return v == null || v <= max;
    }, "maxValue");
}

export function setFieldMinDate(field: FormFieldConfig, min: Date): void {
    setFieldDefault(field, min);
    setFieldProp(field, "min", min);
    setFieldValue(field, min);
    addFieldValidators(field, [minValueValidation(field.type === "array")]);
}
