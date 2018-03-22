import {Directive, Input, ViewContainerRef} from "@angular/core";
import {IDynamicForm, IFormControl} from "../dynamic-form.types";

@Directive({
    selector: "[control]",
})
export class FormControlDirective {

    @Input() control: IFormControl;
    @Input() form: IDynamicForm;

    constructor(private vcr: ViewContainerRef) {
    }


}
