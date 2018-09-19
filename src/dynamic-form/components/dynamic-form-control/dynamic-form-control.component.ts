import {Component, Injector, Input, SimpleChanges} from "@angular/core";
import {IDynamicForm, IDynamicFormControlHandler, IFormControl, IFormControlProvider} from "../../dynamic-form.types";
import {DynamicFormService} from "../../services/dynamic-form.service";

@Component({
    moduleId: module.id,
    selector: "[dynamic-form-control]",
    templateUrl: "./dynamic-form-control.component.html"
})
export class DynamicFormControlComponent implements IDynamicFormControlHandler {

    @Input("dynamic-form-control") control: IFormControl;
    @Input() form: IDynamicForm;

    provider: IFormControlProvider;
    meta: any;
    errors: string[];

    get hasErrors(): boolean {
        return this.errors.length > 0;
    }

    constructor(private injector: Injector, private forms: DynamicFormService) {
        this.meta = {};
        this.errors = [];
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.provider = this.forms.findProvider(this.control);
    }

    load(): Promise<any> {
        return !this.provider ? Promise.resolve() : this.provider.loader(this.control, this.form, this.meta);
    }

    onFocus(): void {
        this.errors.length = 0;
    }

    onBlur(): void {
        // if (!this.validateOnBlur) return;
        // this.validate().then(() => {
        //     this.valid = true;
        // }, () => {
        //     this.valid = false;
        // });
    }
}
