import {Component, ViewEncapsulation} from "@angular/core";
import {FieldWrapper} from "@ngx-formly/core";

@Component({
    standalone: false,
    selector: "dynamic-form-field",
    templateUrl: "./dynamic-form-fieldset.component.html",
    encapsulation: ViewEncapsulation.None
})
export class DynamicFormFieldsetComponent extends FieldWrapper {

}
