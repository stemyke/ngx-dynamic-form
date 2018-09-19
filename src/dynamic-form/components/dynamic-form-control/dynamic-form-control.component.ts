import {Component, Injector, Input, SimpleChanges} from "@angular/core";
import {IDynamicForm, IFormControl, IFormControlProvider} from "../../dynamic-form.types";
import {DynamicFormService} from "../../services/dynamic-form.service";
import {UniqueUtils} from "@stemy/ngx-utils";

@Component({
    moduleId: module.id,
    selector: "[dynamic-form-control]",
    templateUrl: "./dynamic-form-control.component.html"
})
export class DynamicFormControlComponent {

    @Input("dynamic-form-control") control: IFormControl;
    @Input() form: IDynamicForm;

    provider: IFormControlProvider;
    meta: any;

    constructor(private injector: Injector, private forms: DynamicFormService) {
        this.meta = {
            id: UniqueUtils.uuid()
        };
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.provider = this.forms.findProvider(this.control);
    }

    load(): Promise<any> {
        return !this.provider ? Promise.resolve() : this.provider.loader(this.control, this.form, this.meta);
    }

}
