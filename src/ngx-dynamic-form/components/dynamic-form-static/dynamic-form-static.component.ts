import {Component} from "@angular/core";
import {FormControlComponent, IDynamicForm, IFormControl, IFormStaticData} from "../../common-types";

@Component({
    moduleId: module.id,
    selector: "dynamic-form-static",
    templateUrl: "./dynamic-form-static.component.html"
})
export class DynamicFormStaticComponent extends FormControlComponent<IFormStaticData> {

    // Acceptor for provider
    static acceptor(control: IFormControl): boolean {
        return control.type == "static";
    }

    // Loader for provider
    static loader(control: IFormControl, form: IDynamicForm, meta: any): Promise<any> {
        return Promise.resolve();
    }
}
