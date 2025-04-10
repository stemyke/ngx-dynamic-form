import {Component, ViewEncapsulation} from "@angular/core";
import { FieldArrayType } from "@ngx-formly/core";

@Component({
    standalone: false,
    selector: "dynamic-form-array",
    templateUrl: "./formly-array.component.html",
    encapsulation: ViewEncapsulation.None
})
export class FormlyArrayComponent extends FieldArrayType {

}
