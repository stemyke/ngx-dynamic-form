import {Subject} from "rxjs";
import {AbstractControl} from "@angular/forms";
import {DynamicFormControlModel} from "@ng-dynamic-forms/core";
import {DynamicPathable} from "@ng-dynamic-forms/core/lib/model/misc/dynamic-form-control-path.model";

export class FormSubject<T> extends Subject<T> {

    private readonly notifyCallback: (controlModel: DynamicFormControlModel, control: AbstractControl, index?: number) => T | Promise<T>;

    constructor(notifyCallback: (formModel: DynamicFormControlModel, control: AbstractControl, index?: number) => T | Promise<T>) {
        super();
        this.notifyCallback = notifyCallback;
    }

    protected handleNotifiedValue(controlModel: DynamicFormControlModel, control: AbstractControl, val: Promise<T>) {
        val.then(v => this.next(v));
    }

    notify(controlModel: DynamicFormControlModel, control: AbstractControl): void {
        let path = controlModel as DynamicPathable;
        while (path && isNaN(path.index)) {
            path = path.parent;
        }
        let value = this.notifyCallback(controlModel, control, path?.index);
        if (!(value instanceof Promise)) {
            value = Promise.resolve(value);
        }
        this.handleNotifiedValue(controlModel, control, value);
    }
}
