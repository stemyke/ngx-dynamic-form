import {ChangeDetectionStrategy, Component, ViewEncapsulation} from "@angular/core";
import {FieldType} from "@ngx-formly/core";
import {FormFieldType} from "../../common-types";

@Component({
    standalone: false,
    selector: "dynamic-form-chips",
    templateUrl: "./dynamic-form-chips.component.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormChipsComponent extends FieldType<FormFieldType> {

}
