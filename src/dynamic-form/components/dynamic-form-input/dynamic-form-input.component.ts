import {Component, Injector} from "@angular/core";
import {FormControlComponent, IFormControl, IFormControlComponent, IFormInputData} from "../../dynamic-form.types";

@Component({
    moduleId: module.id,
    selector: "dynamic-form-input",
    templateUrl: "./dynamic-form-input.component.html"
})
export class DynamicFormInputComponent extends FormControlComponent<IFormInputData> {

    // Acceptor for provider
    static acceptor(control: IFormControl): boolean {
        return control.type == "input";
    }

    // Loader for provider
    static loader(control: IFormControl, injector: Injector, data: any): Promise<any> {
        return Promise.resolve();
    }
}
