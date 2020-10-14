import {AbstractControl, ValidationErrors} from "@angular/forms";

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
