import {Directive, Input, OnChanges, SimpleChanges, ViewContainerRef} from "@angular/core";
import {IDynamicFormControlHandler, IFormControlComponent, IFormControlProvider} from "../common-types";
import {DynamicFormService} from "../services/dynamic-form.service";

@Directive({
    selector: "[form-control]",
})
export class DynamicFormControlDirective implements OnChanges {

    @Input("form-control") handler: IDynamicFormControlHandler;

    get component(): IFormControlComponent {
        return this.comp;
    }

    private comp: IFormControlComponent;

    constructor(private vcr: ViewContainerRef, private forms: DynamicFormService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.handler) {
            this.comp = this.forms.createComponent(this.vcr, this.handler.control.provider);
        }
        if (!this.comp) return;
        this.comp.handler = this.handler;
    }
}
