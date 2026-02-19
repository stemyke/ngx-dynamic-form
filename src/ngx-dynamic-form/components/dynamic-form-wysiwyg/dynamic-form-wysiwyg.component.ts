import {ChangeDetectionStrategy, Component, ViewEncapsulation} from "@angular/core";
import {DynamicFieldType} from "../base/dynamic-field-type";

@Component({
    standalone: false,
    selector: "dynamic-form-wysiwyg",
    templateUrl: "./dynamic-form-wysiwyg.component.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormWysiwygComponent extends DynamicFieldType {

}
