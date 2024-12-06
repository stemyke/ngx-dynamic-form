import {AbstractControl, FormArray, FormGroup} from "@angular/forms";

export interface AllValidationErrors {
    control: AbstractControl;
    path: string;
    errorKey: string;
    errorValue: any;
}

export interface FormGroupControls {
    [key: string]: AbstractControl;
}

export function getFormValidationErrors(controls: FormGroupControls, parentPath: string = ""): AllValidationErrors[] {
    const errors: AllValidationErrors[] = [];
    Object.entries(controls).forEach(([name, control], ix) => {
        const path = !parentPath ? name : `${parentPath}.${name}`;
        if (control instanceof FormGroup) {
            getFormValidationErrors(control.controls, path).forEach(error => errors.push(error));
            return;
        }
        if (control instanceof FormArray) {
            control.controls.forEach((control: FormGroup, ix) => {
                getFormValidationErrors(control.controls, `${path}.${ix}`).forEach(error => errors.push(error));
            });
            return;
        }
        Object.entries(control.errors || {}).forEach(([errorKey, errorValue]) => {
            errors.push({control, path, errorKey, errorValue});
        });
    });
    return errors;
}
