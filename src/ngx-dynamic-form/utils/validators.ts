import {AbstractControl, ValidationErrors, ValidatorFn} from "@angular/forms";

export function validateJSON(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    try {
        JSON.parse(value);
        return null;
    } catch (e) {
        return {json: true};
    }
}

export function validateRequiredTranslation(control: AbstractControl): ValidationErrors | null {
    const value: any[] = control.value;
    if (!value || value.length == 0) return {requiredTranslation: true};
    return value.findIndex(t => (t.lang == "de" || t.lang == "en") && !t.translation) < 0
        ? null
        : {requiredTranslation: true};
}

export function validatePhone(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return Promise.resolve(null);
    const phoneRegexp = /^(?:\d){10,12}$/;
    return phoneRegexp.test(value) ? null : {phone: true};
}

export function validateItemsMinLength(minLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        return (Array.isArray(value) && value.every(v => typeof v == "string" && v.length >= minLength))
            ? null : {itemsMinLength: minLength}
    };
}

export function validateItemsMaxLength(maxLength: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        return (Array.isArray(value) && value.every(v => typeof v == "string" && v.length <= maxLength))
            ? null : {itemsMaxLength: maxLength}
    };
}

export function validateItemsMinValue(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        return (Array.isArray(value) && value.every(v => typeof v == "number" && v >= min))
            ? null : {itemsMinValue: min}
    };
}

export function validateItemsMaxValue(max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        return (Array.isArray(value) && value.every(v => typeof v == "number" && v <= max))
            ? null : {itemsMaxValue: max}
    };
}
