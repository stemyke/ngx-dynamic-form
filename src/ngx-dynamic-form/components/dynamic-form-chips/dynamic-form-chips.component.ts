import {ChangeDetectionStrategy, Component, ViewEncapsulation} from "@angular/core";
import {DynamicFieldType} from "../base/dynamic-field-type";

@Component({
    standalone: false,
    selector: "dynamic-form-chips",
    templateUrl: "./dynamic-form-chips.component.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormChipsComponent extends DynamicFieldType {

}
