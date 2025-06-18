import {ChangeDetectionStrategy, Component, ViewEncapsulation} from "@angular/core";
import {DynamicFieldType} from "../base/dynamic-field-type";

@Component({
    standalone: false,
    selector: "dynamic-form-upload",
    templateUrl: "./dynamic-form-upload.component.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormUploadComponent extends DynamicFieldType {

}
