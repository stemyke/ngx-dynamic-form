import {Component, ViewEncapsulation} from "@angular/core";
import {FieldWrapper} from "@ngx-formly/core";

@Component({
    standalone: false,
    selector: "dynamic-form-group",
    templateUrl: "./dynamic-form-group.component.html",
    encapsulation: ViewEncapsulation.None
})
export class DynamicFormGroupComponent extends FieldWrapper {

}
