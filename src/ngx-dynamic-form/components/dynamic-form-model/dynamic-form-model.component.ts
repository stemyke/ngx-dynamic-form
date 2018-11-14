import {Component, OnInit, ViewChild} from "@angular/core";
import {DynamicFormControl, FormControlComponent, IDynamicForm, IFormControl, IFormModelData} from "../../common-types";

@Component({
    moduleId: module.id,
    selector: "dynamic-form-model",
    templateUrl: "./dynamic-form-model.component.html"
})
export class DynamicFormModelComponent extends FormControlComponent<IFormModelData> implements OnInit {

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

    ngOnInit(): void {
        this.control.meta.serializer = () => this.subForm.serialize();
        this.control.meta.validator = () => this.subForm.validate().then(() => true, () => false);
    }
}
