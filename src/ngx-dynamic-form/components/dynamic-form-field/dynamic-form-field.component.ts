import {Component, ViewEncapsulation} from "@angular/core";
import {FieldWrapper} from "@ngx-formly/core";

@Component({
    standalone: false,
    selector: "dynamic-form-field",
    templateUrl: "./dynamic-form-field.component.html",
    encapsulation: ViewEncapsulation.None
})
export class DynamicFormFieldComponent extends FieldWrapper {

}
