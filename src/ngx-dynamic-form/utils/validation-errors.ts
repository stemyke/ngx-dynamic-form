import {AbstractControl, FormArray, FormGroup} from "@angular/forms";

export interface AllValidationErrors {
    control: AbstractControl;
    control_name: string;
    error_name: string;
    error_value: any;
}

export interface FormGroupControls {
    [key: string]: AbstractControl;
}

export function getFormValidationErrors(controls: FormGroupControls): AllValidationErrors[] {
    let errors: AllValidationErrors[] = [];
    Object.keys(controls).forEach(key => {
        const control = controls[key];
        if (control instanceof FormGroup) {
            errors = errors.concat(getFormValidationErrors(control.controls));
        }
        if (control instanceof FormArray) {
            control.controls.forEach((control: FormGroup) => {
                errors = errors.concat(getFormValidationErrors(control.controls));
            });
        }
        if (control.errors !== null) {
            Object.keys(control.errors).forEach(keyError => {
                errors.push({
                    control,
                    control_name: key,
                    error_name: keyError,
                    error_value: control.errors[keyError]
                });
            });
        }
    });
    return errors;
}
