import {Directive, Input, OnChanges, SimpleChanges, ViewContainerRef} from "@angular/core";
import {IDynamicFormControl, IFormControlComponent, IFormGroupComponent} from "../common-types";
import {DynamicFormService} from "../services/dynamic-form.service";

@Directive({
    selector: "[form-group]",
})
export class DynamicFormGroupDirective implements OnChanges {

    @Input("form-group") control: IDynamicFormControl;
    @Input() visible: boolean;

    get component(): IFormControlComponent {
        return this.comp;
    }

    private comp: IFormGroupComponent;

    constructor(private vcr: ViewContainerRef, private forms: DynamicFormService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.control || changes.form || changes.visible) {
            if (!this.visible) {
                this.vcr.clear();
                this.comp = null;
                return;
            }
            this.comp = this.forms.createGroup(this.vcr);
        }
        if (!this.comp) return;
        this.comp.control = this.control;
    }
}
