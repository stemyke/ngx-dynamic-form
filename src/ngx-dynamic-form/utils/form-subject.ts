import {Subject} from "rxjs";
import {AbstractControl} from "@angular/forms";
import {DynamicFormControlModel, DynamicFormModel, DynamicPathable} from "@ng-dynamic-forms/core";

const indexLabels = ["$ix", "$pix"];

export type NotifyCallback = (controlModel: DynamicFormControlModel, control: AbstractControl, root: DynamicFormModel, indexes: any) => any | Promise<any>;

export class FormSubject<T> extends Subject<T> {

    private readonly notifyCallback: NotifyCallback;

    constructor(notifyCallback: NotifyCallback) {
        super();
        this.notifyCallback = notifyCallback;
    }

    protected handleNotifiedValue(controlModel: DynamicFormControlModel, control: AbstractControl, val: Promise<T>) {
        val.then(v => this.next(v));
    }

    notify(controlModel: DynamicFormControlModel, control: AbstractControl, root: DynamicFormModel): void {
        const indexes = {};
        let path = controlModel as DynamicPathable;
        let ix = 0;
        while (path) {
            if (!isNaN(path.index)) {
                const key = indexLabels[ix++] || `$pix${ix}`;
                indexes[key] = path.index;
            }
            path = path.parent;
        }
        let value = this.notifyCallback(controlModel, control, root, indexes);
        if (!(value instanceof Promise)) {
            value = Promise.resolve(value);
        }
        this.handleNotifiedValue(controlModel, control, value);
    }
}
