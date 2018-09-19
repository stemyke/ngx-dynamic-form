import {Directive, Input, OnChanges, SimpleChanges, ViewContainerRef} from "@angular/core";
import {IDynamicForm, IFormControl, IFormControlComponent} from "../dynamic-form.types";
import {DynamicFormService} from "../services/dynamic-form.service";

@Directive({
    selector: "[form-control]",
})
export class DynamicFormControlDirective implements OnChanges {

    @Input("form-control") control: IFormControl;
    @Input() form: IDynamicForm;

    get component(): IFormControlComponent {
        return this.comp;
    }

    private comp: IFormControlComponent;

    constructor(private vcr: ViewContainerRef, private formService: DynamicFormService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.control) {
            this.comp = this.formService.createComponent(this.vcr, this.control);
        }
        if (!this.control) return;
        this.comp.id = this.control.id;
        this.comp.control = this.control.data;
        this.comp.form = this.form;
    }
}
