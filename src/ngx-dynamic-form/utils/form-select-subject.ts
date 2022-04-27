import {AbstractControl} from "@angular/forms";
import {DynamicFormOptionConfig, DynamicSelectModel} from "@ng-dynamic-forms/core";
import {FormSubject} from "./form-subject";

export class FormSelectSubject<T extends DynamicFormOptionConfig<any>[]> extends FormSubject<T> {

    protected handleNotifiedValue(controlModel: DynamicSelectModel<any>, control: AbstractControl, val: Promise<T>) {
        val.then(options => {
            this.next(options);
            if (options.length == 0) return;
            const currentVal = control.value;
            if (controlModel.multiple) {
                const correctVal = (currentVal || []).filter(t => options.findIndex(o => o.value == t) >= 0);
                if (correctVal.length !== currentVal?.length) {
                    control.setValue(correctVal, {onlySelf: true, emitEvent: false});
                }
                return;
            }
            const option = options.find(t => t.value == currentVal);
            if (!option) {
                control.setValue(options[0]?.value ?? null, {onlySelf: true, emitEvent: false});
            }
        });
    }
}
