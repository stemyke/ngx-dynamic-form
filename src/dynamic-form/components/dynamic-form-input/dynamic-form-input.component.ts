import {Component, Injector} from "@angular/core";
import {FormControlComponent, IFormControl, IFormInputData} from "../../dynamic-form.types";
import {ObjectUtils} from "@stemy/ngx-utils";

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

    onDateChange(value: string): void {
        const date = new Date(value);
        const dateValue = <number>date.valueOf();
        if (isNaN(dateValue) || dateValue < -30610224000000) return;
        this.handler.onValueChange(date)
    }

    onInputChange(value: string): void {
        value = ObjectUtils.isFunction(this.data.unmask) ? this.data.unmask(value) : value;
        this.handler.onValueChange(value)
    }
}
