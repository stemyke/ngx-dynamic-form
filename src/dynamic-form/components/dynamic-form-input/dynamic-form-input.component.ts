import {Component} from "@angular/core";
import {FormControlComponent, IFormControl, IFormInputData} from "../../dynamic-form.types";

@Component({
    moduleId: module.id,
    selector: "dynamic-form-input",
    templateUrl: "./dynamic-form-input.component.html"
})
export class DynamicFormInputComponent extends FormControlComponent<IFormInputData> {

    // Acceptor for provider
    static accept(control: IFormControl): boolean {
        return control.type == "input";
    }
}
