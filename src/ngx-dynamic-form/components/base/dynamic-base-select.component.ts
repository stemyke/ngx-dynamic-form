import {ChangeDetectionStrategy, Component} from "@angular/core";
import {DynamicBaseFormControlComponent} from "./dynamic-base-form-control.component";
import {DynamicFormOption, DynamicSelectModel} from "../../utils/dynamic-select.model";

@Component({
    selector: "dynamic-base-select",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicBaseSelectComponent extends DynamicBaseFormControlComponent<DynamicSelectModel<any>> {

    isSelected(option: DynamicFormOption<any>): boolean {
        if (this.model.multiple) {
            return this.control.value?.indexOf(option.value) >= 0;
        }
        return this.control.value == option.value;
    }

    selectToggle(option: DynamicFormOption<any>, state: boolean): void {
        if (this.model.multiple) {
            const value = Array.from(this.control.value || []);
            const index = value.indexOf(option.value);
            if (index >= 0) {
                value.splice(index, 1);
            }
            if (state) {
                value.push(option.value);
            }
            this.control.setValue(value);
            this.onChange(value);
            return;
        }
        this.control.setValue(option.value);
        this.onChange(option.value);
    }
}
