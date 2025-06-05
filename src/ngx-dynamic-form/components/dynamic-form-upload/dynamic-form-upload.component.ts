import {ChangeDetectionStrategy, Component, ViewEncapsulation} from "@angular/core";
import {FieldType} from "@ngx-formly/core";
import {FormFieldType} from "../../common-types";

@Component({
    standalone: false,
    selector: "dynamic-form-upload",
    templateUrl: "./dynamic-form-upload.component.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormUploadComponent extends FieldType<FormFieldType> {

}
