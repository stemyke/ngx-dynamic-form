import {Directive, Input, TemplateRef} from "@angular/core";

@Directive({
    selector: "ng-template[control],ng-template[label],ng-template[input],ng-template[prefix],ng-template[suffix]"
})
export class DynamicFormTemplateDirective {

    @Input() control: string;
    @Input() label: string;
    @Input() input: string;
    @Input() prefix: string;
    @Input() suffix: string;

    constructor(public template: TemplateRef<any>) {
    }
}
