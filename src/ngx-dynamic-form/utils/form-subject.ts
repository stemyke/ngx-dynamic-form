import {Subject} from "rxjs";
import {FormControl} from "@angular/forms";
import {DynamicFormControlModel, DynamicFormModel, DynamicPathable} from "@ng-dynamic-forms/core";

const indexLabels = ["$ix", "$pix"];

export type NotifyCallback<M extends DynamicFormControlModel> = (controlModel: M, control: FormControl, root: DynamicFormModel, indexes: any) => any | Promise<any>;

export class FormSubject<M extends DynamicFormControlModel, T> extends Subject<T> {

    private readonly notifyCallback: NotifyCallback<M>;

    constructor(notifyCallback: NotifyCallback<M>) {
        super();
        this.notifyCallback = notifyCallback;
    }

    protected handleNotifiedValue(controlModel: M, control: FormControl, val: Promise<T>) {
        val.then(v => this.next(v));
    }

    notify(controlModel: M, control: FormControl, root: DynamicFormModel): void {
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
