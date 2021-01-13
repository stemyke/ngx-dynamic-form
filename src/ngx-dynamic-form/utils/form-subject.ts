import {Subject} from "rxjs";
import {AbstractControl} from "@angular/forms";
import {DynamicFormControlModel} from "@ng-dynamic-forms/core";

export class FormSubject<T> extends Subject<T> {

    private readonly notifyCallback: (controlModel: DynamicFormControlModel, control: AbstractControl) => T;

    constructor(notifyCallback: (formModel: DynamicFormControlModel, control: AbstractControl) => T) {
        super();
        this.notifyCallback = notifyCallback;
    }

    notify(controlModel: DynamicFormControlModel, control: AbstractControl): void {
        this.next(this.notifyCallback(controlModel, control));
    }
}
