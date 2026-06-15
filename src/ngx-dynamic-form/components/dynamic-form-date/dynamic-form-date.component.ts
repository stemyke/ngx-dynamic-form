import {ChangeDetectionStrategy, Component, ViewEncapsulation} from "@angular/core";
import {DynamicFieldType} from "../base/dynamic-field-type";

@Component({
    standalone: false,
    selector: "dynamic-form-date",
    templateUrl: "./dynamic-form-date.component.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormDateComponent extends DynamicFieldType {

}
