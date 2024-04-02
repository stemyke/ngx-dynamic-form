import {Component, HostBinding, Inject} from "@angular/core";
import {
    DYNAMIC_FORM,
    IDynamicForm,
    IDynamicFormBase,
    IDynamicFormControl,
    IFormGroupComponent
} from "../../common-types";

@Component({
    moduleId: module.id,
    selector: "div[dynamic-form-group]",
    templateUrl: "./dynamic-form-group.component.html"
})
export class DynamicFormGroupComponent implements IFormGroupComponent {

    control: IDynamicFormControl;

    constructor(@Inject(DYNAMIC_FORM) readonly form: IDynamicFormBase) {
    }

    @HostBinding("class")
    get classes(): string {
        if (!this.control) return "form-group";
        return ["form-group", "form-group-" + this.control.id, this.control.data.classes, this.control.errors && this.control.touched ? "form-group-invalid" : ""].join(" ");
    }
}
