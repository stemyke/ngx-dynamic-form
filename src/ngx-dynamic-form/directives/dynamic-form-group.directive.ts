import {Directive, Input, OnChanges, SimpleChanges, ViewContainerRef} from "@angular/core";
import {IDynamicForm, IDynamicFormControl, IFormControlComponent, IFormGroupComponent} from "../common-types";
import {DynamicFormService} from "../services/dynamic-form.service";

@Directive({
    selector: "[form-group]",
})
export class DynamicFormGroupDirective implements OnChanges {

    @Input("form-group") control: IDynamicFormControl;
    @Input() form: IDynamicForm;

    get component(): IFormControlComponent {
        return this.comp;
    }

    private comp: IFormGroupComponent;

    constructor(private vcr: ViewContainerRef, private forms: DynamicFormService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.control || changes.form) {
            this.comp = this.forms.createGroup(this.vcr);
        }
        if (!this.comp) return;
        this.comp.form = this.form;
        this.comp.control = this.control;
    }
}
