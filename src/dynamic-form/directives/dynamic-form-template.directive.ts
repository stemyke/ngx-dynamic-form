import {Directive, Input, TemplateRef} from "@angular/core";

@Directive({
    selector: "ng-template[field],ng-template[prefix],ng-template[suffix],ng-template[label]"
})
export class DynamicFormTemplateDirective {

    @Input() field: string;
    @Input() prefix: string;
    @Input() suffix: string;
    @Input() label: string;

    constructor(public template: TemplateRef<any>) {
    }
}
