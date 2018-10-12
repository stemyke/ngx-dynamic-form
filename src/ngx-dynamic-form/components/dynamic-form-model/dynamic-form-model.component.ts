import {Component} from "@angular/core";
import {FormControlComponent, IDynamicForm, IFormControl, IFormModelData} from "../../common-types";

@Component({
    moduleId: module.id,
    selector: "dynamic-form-model",
    templateUrl: "./dynamic-form-model.component.html"
})
export class DynamicFormModelComponent extends FormControlComponent<IFormModelData> {

    // Acceptor for provider
    static acceptor(control: IFormControl): boolean {
        return control.type == "model";
    }

    // Loader for provider
    static loader(control: IFormControl, form: IDynamicForm, meta: any): Promise<any> {
        return Promise.resolve();
    }
}
