import {Component, inject, ViewEncapsulation} from "@angular/core";
import {FieldWrapper} from "@ngx-formly/core";
import {DynamicFormGroupComponent} from "../dynamic-form-group/dynamic-form-group.component";

@Component({
    standalone: false,
    selector: "dynamic-form-fieldset",
    templateUrl: "./dynamic-form-fieldset.component.html",
    encapsulation: ViewEncapsulation.None
})
export class DynamicFormFieldsetComponent extends FieldWrapper {

    ngOnInit(): void {
        // console.log(this.field.id, this.field.props?.label, this.options);
        // console.log(this.field.parent);
    }
}
