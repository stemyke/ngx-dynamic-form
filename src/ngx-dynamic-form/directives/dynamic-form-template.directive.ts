import {Directive, Optional, Input, OnChanges, OnDestroy, OnInit, TemplateRef} from "@angular/core";
import {ObjectUtils} from "@stemy/ngx-utils";

import {FormTemplateType} from "../common-types";
import {DynamicFormTemplateService} from "../services/dynamic-form-template.service";

@Directive({
    standalone: false,
    selector: `ng-template[control],
                ng-template[label],
                ng-template[input],
                ng-template[prefix],
                ng-template[suffix],
                ng-template[setPrefix],
                ng-template[setSuffix]`
})
export class DynamicFormTemplateDirective implements OnChanges, OnDestroy {

    @Input() control: string;
    @Input() label: string;
    @Input() input: string;
    @Input() prefix: string;
    @Input() suffix: string;
    @Input() setPrefix: string;
    @Input() setSuffix: string;

    protected setting: [string, FormTemplateType] = null;

    constructor(@Optional() readonly templates: DynamicFormTemplateService,
                readonly template: TemplateRef<any>) {
    }

    ngOnChanges(): void {
        this.ngOnDestroy();
        this.setting = this.selectType();
        if (!this.setting) return;
        this.templates.add(...this.setting, this.template);
    }

    ngOnDestroy(): void {
        if (!this.setting) return;
        this.templates.remove(...this.setting);
    }

    selectType(): [string, FormTemplateType] {
        if (!this.templates) return null;
        const inputs = Object.keys(this);
        for (const input of inputs) {
            const value = this[input] as string;
            if (this.templates.isValidType(input) && ObjectUtils.isStringWithValue(value)) {
                return [value, input as FormTemplateType];
            }
        }
        return null;
    }
}
