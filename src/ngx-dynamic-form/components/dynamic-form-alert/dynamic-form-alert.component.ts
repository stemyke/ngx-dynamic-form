import {Component, ViewEncapsulation} from "@angular/core";
import {FieldWrapper} from "@ngx-formly/core";
import {FormFieldConfig} from "../../common-types";

/**
 * This is just a test wrapper component
 */
@Component({
    standalone: false,
    selector: "dynamic-form-alert",
    templateUrl: "./dynamic-form-alert.component.html",
    styleUrls: ["./dynamic-form-alert.component.scss"],
    encapsulation: ViewEncapsulation.None
})
export class DynamicFormAlertComponent extends FieldWrapper<FormFieldConfig> {

}
