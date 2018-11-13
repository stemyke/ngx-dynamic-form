import {Component} from "@angular/core";
import {FormControlComponent, IFormControl, IFormInputData} from "../ngx-dynamic-form/common-types";

@Component({
    moduleId: module.id,
    selector: "material-form-input",
    templateUrl: "./material-form-input.component.html"
})
export class MaterialFormInputComponent extends FormControlComponent<IFormInputData> {

    // Acceptor for provider
    static acceptor(control: IFormControl): boolean {
        return control.type == "input" && (<any>control.data).type == "text";
    }

    // Loader for provider
    static loader(): Promise<any> {
        return Promise.resolve();
    }
}
