import {Component, ViewEncapsulation} from "@angular/core";
import {FieldWrapper} from "@ngx-formly/core";
import {FormFieldConfig} from "../../common-types";

@Component({
    standalone: false,
    selector: "dynamic-form-group",
    templateUrl: "./dynamic-form-group.component.html",
    styleUrls: ["./dynamic-form-group.component.scss"],
    encapsulation: ViewEncapsulation.None
})
export class DynamicFormGroupComponent extends FieldWrapper<FormFieldConfig> {

}
