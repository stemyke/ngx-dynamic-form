import {OnDestroy, OnInit, Pipe, PipeTransform, TemplateRef} from "@angular/core";
import {Subscription} from "rxjs";

import {DynamicFormTemplateService} from "../services/dynamic-form-template.service";
import {FormFieldConfig, FormTemplateType} from "../common-types";

@Pipe({
    standalone: false,
    pure: false,
    name: "dynamicFormTemplate"
})
export class DynamicFormTemplatePipe implements PipeTransform, OnInit, OnDestroy {


    protected templatesUpdated: Subscription;

    protected cachedKey: string;
    protected cachedType: FormTemplateType;
    protected cachedTemplate: TemplateRef<any>;

    constructor(readonly templates: DynamicFormTemplateService) {
        this.cachedKey = null;
        this.cachedType = null;
        this.cachedTemplate = null;
    }

    ngOnInit(): void {
        this.templatesUpdated = this.templates.templatesUpdated.subscribe(() => {
            this.cachedTemplate = null;
        });
    }

    ngOnDestroy(): void {
        if (this.templatesUpdated)
            this.templatesUpdated.unsubscribe();
    }

    transform(field: FormFieldConfig, type: FormTemplateType): TemplateRef<any> {
        const key = String(field.key || field.id);
        if (!field || !key) return null;
        if (this.cachedTemplate === null || this.cachedKey !== key || this.cachedType !== type) {
            this.cachedKey = key;
            this.cachedType = type;
            this.cachedTemplate = this.templates.get(type, key);
        }
        return this.cachedTemplate;
    }
}
