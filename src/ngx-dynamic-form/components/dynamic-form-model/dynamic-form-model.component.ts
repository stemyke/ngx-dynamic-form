import {Component, ViewChild, ViewEncapsulation} from "@angular/core";
import {DynamicFormControl, FormControlComponent, IDynamicForm, IFormModelData} from "../../common-types";

@Component({
    encapsulation: ViewEncapsulation.None,
    selector: "dynamic-form-model",
    templateUrl: "./dynamic-form-model.component.html"
})
export class DynamicFormModelComponent extends FormControlComponent<IFormModelData> {

    @ViewChild("subForm")
    private subForm: IDynamicForm;

    // Acceptor for provider
    static acceptor(control: DynamicFormControl): boolean {
        return control.type == "model";
    }

    // Loader for provider
    static loader(): Promise<any> {
        return Promise.resolve();
    }
}
