import {Subject} from "rxjs";
import {AbstractControl} from "@angular/forms";
import {DynamicFormControlModel} from "@ng-dynamic-forms/core";

export class FormSubject<T> extends Subject<T> {

    private readonly notifyCallback: (controlModel: DynamicFormControlModel, control: AbstractControl) => T | Promise<T>;

    constructor(notifyCallback: (formModel: DynamicFormControlModel, control: AbstractControl) => T | Promise<T>) {
        super();
        this.notifyCallback = notifyCallback;
    }

    async notify(controlModel: DynamicFormControlModel, control: AbstractControl): Promise<any> {
        let value = this.notifyCallback(controlModel, control);
        if (value instanceof Promise) {
            value = await value;
        }
        this.next(value);
    }
}
