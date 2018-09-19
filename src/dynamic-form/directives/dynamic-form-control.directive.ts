import {Directive, Input, OnChanges, SimpleChanges, ViewContainerRef} from "@angular/core";
import {IDynamicForm, IFormControl, IFormControlComponent, IFormControlProvider} from "../dynamic-form.types";
import {DynamicFormService} from "../services/dynamic-form.service";

@Directive({
    selector: "[form-control]",
})
export class DynamicFormControlDirective implements OnChanges {

    @Input("form-control") control: IFormControl;
    @Input() form: IDynamicForm;
    @Input() provider: IFormControlProvider;
    @Input() meta: any;

    get component(): IFormControlComponent {
        return this.comp;
    }

    private comp: IFormControlComponent;

    constructor(private vcr: ViewContainerRef, private formService: DynamicFormService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.provider) {
            this.comp = this.formService.createComponent(this.vcr, this.provider);
        }
        if (!this.control || !this.comp) return;
        this.comp.form = this.form;
        this.comp.id = this.control.id;
        this.comp.data = this.control.data;
        this.comp.meta = this.meta;
    }
}
