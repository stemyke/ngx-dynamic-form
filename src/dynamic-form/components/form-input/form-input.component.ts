import {Component} from "@angular/core";
import {IDynamicForm, IFormControl, IFormControlComponent} from "../../dynamic-form.types";

@Component({
    moduleId: module.id,
    selector: "form-input",
    templateUrl: "./form-input.component.html"
})
export class FormInputComponent implements IFormControlComponent {

    control: IFormControl;
    form: IDynamicForm;

    /**
     * Acceptor for provider
     * @param {IFormControl} control
     * @returns {boolean}
     */
    static accept(control: IFormControl): boolean {
        console.log(control);
        return control.type == "input";
    }
}
