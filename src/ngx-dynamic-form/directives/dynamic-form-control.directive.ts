import {Directive, Input, OnChanges, SimpleChanges, ViewContainerRef} from "@angular/core";
import {DynamicFormControl, IFormControlComponent} from "../common-types";
import {DynamicFormService} from "../services/dynamic-form.service";

@Directive({
    selector: "[form-control]",
})
export class DynamicFormControlDirective implements OnChanges {

    @Input("form-control") control: DynamicFormControl;

    get component(): IFormControlComponent {
        return this.comp;
    }

    private comp: IFormControlComponent;

    constructor(private vcr: ViewContainerRef, private forms: DynamicFormService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.control) {
            this.comp = this.forms.createComponent(this.vcr, this.control.provider);
        }
        if (!this.comp) return;
        this.comp.control = this.control;
    }
}
