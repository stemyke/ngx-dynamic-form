import {Component, Input} from "@angular/core";
import {IDynamicForm, IFormControl} from "../../dynamic-form.types";

@Component({
    moduleId: module.id,
    selector: "[dynamic-form-control]",
    templateUrl: "./dynamic-form-control.component.html"
})
export class DynamicFormControlComponent {

    @Input("dynamic-form-control") control: IFormControl;
    @Input() form: IDynamicForm;

}
