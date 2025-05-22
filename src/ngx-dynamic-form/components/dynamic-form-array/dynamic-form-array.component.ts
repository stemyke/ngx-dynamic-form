import {Component, ViewEncapsulation} from "@angular/core";
import { FieldArrayType } from "@ngx-formly/core";

@Component({
    standalone: false,
    selector: "dynamic-form-array",
    templateUrl: "./dynamic-form-array.component.html",
    encapsulation: ViewEncapsulation.None
})
export class DynamicFormArrayComponent extends FieldArrayType {

}
