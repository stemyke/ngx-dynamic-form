import {Component, ViewEncapsulation} from "@angular/core";
import {FormArray} from "@angular/forms";
import {FieldArrayType} from "@ngx-formly/core";

@Component({
    standalone: false,
    selector: "dynamic-form-array",
    templateUrl: "./dynamic-form-array.component.html",
    encapsulation: ViewEncapsulation.None
})
export class DynamicFormArrayComponent extends FieldArrayType {
    clear(): void {
        const control = this.formControl as FormArray;
        while (control.length > 0) {
            this.remove(0);
        }
    }
}
