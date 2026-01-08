import {Component, signal, ViewEncapsulation} from "@angular/core";
import {FormArray} from "@angular/forms";
import {FieldArrayType} from "@ngx-formly/core";
import {FormFieldConfig} from "../../common-types";

@Component({
    standalone: false,
    selector: "dynamic-form-array",
    templateUrl: "./dynamic-form-array.component.html",
    styleUrls: ["./dynamic-form-array.component.scss"],
    encapsulation: ViewEncapsulation.None
})
export class DynamicFormArrayComponent extends FieldArrayType<FormFieldConfig> {

    currentTab = signal(0);

    clearItems(): void {
        const control = this.formControl as FormArray;
        while (control.length > 0) {
            this.remove(0);
        }
        this.currentTab.set(0);
    }

    addItem(i?: number): void {
        i = i == null ? this.field.fieldGroup.length : i;
        this.add(i);
        this.currentTab.set(i);
    }

    removeItem(i: number): void {
        this.remove(i);
        const length = this.field.fieldGroup.length;
        this.currentTab.set(Math.min(this.currentTab(), length - 1));
    }
}
