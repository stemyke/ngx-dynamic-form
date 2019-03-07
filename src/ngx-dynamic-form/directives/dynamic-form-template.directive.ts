import {Directive, Input, TemplateRef} from "@angular/core";

@Directive({
    selector: `ng-template[control],
                ng-template[label],
                ng-template[input],
                ng-template[prefix],
                ng-template[suffix],
                ng-template[setPrefix],
                ng-template[setSuffix],
                ng-template[formPrefix],
                ng-template[formSuffix],
                ng-template[innerFormPrefix],
                ng-template[innerFormSuffix]`
})
export class DynamicFormTemplateDirective {

    @Input() control: string;
    @Input() label: string;
    @Input() input: string;
    @Input() prefix: string;
    @Input() suffix: string;
    @Input() setPrefix: string;
    @Input() setSuffix: string;
    @Input() formPrefix: string;
    @Input() formSuffix: string;
    @Input() innerFormPrefix: string;
    @Input() innerFormSuffix: string;

    constructor(public template: TemplateRef<any>) {
    }
}
