import {ChangeDetectionStrategy, Component, ViewEncapsulation} from "@angular/core";
import {DynamicFieldType} from "../base/dynamic-field-type";

@Component({
    standalone: false,
    selector: "dynamic-form-editor",
    templateUrl: "./dynamic-form-editor.component.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormEditorComponent extends DynamicFieldType {

}
