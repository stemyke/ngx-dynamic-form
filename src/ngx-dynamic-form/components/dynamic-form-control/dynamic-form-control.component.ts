import {Component, Injector, Input} from "@angular/core";
import {ObjectUtils} from "@stemy/ngx-utils";
import {
    DynamicFormControl,
    IDynamicForm,
    IDynamicFormBase,
    IDynamicFormControlHandler,
    IFormControlData
} from "../../common-types";

@Component({
    moduleId: module.id,
    selector: "[dynamic-form-control]",
    templateUrl: "./dynamic-form-control.component.html"
})
export class DynamicFormControlComponent implements IDynamicFormControlHandler {

    @Input("dynamic-form-control") control: DynamicFormControl;
    @Input() form: IDynamicForm;

    errors: string[];

    get handler(): IDynamicFormControlHandler {
        return this;
    }

    get data(): IFormControlData {
        return this.control ? this.control.data : null;
    }

    constructor(private injector: Injector) {
        this.errors = [];
    }
}
