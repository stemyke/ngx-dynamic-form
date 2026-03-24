import {Injectable, TemplateRef} from "@angular/core";
import {Subject} from "rxjs";
import {GlobalTemplateService} from "@stemy/ngx-utils";

import {FormTemplateType} from "../common-types";

const templateTypes: FormTemplateType[] = ["control", "label", "input", "prefix", "suffix"];

@Injectable()
export class DynamicFormTemplateService {

    readonly templatesUpdated: Subject<void>;

    protected templates: Map<FormTemplateType, Map<string, TemplateRef<any>>>;
    protected globalTemplatePrefix: string;

    get globalPrefix(): string {
        return this.globalTemplatePrefix;
    }

    set globalPrefix(value: string) {
        this.globalTemplatePrefix = value || "dynamic-form";
        this.templatesUpdated.next();
    }

    constructor(protected readonly globalTemplates: GlobalTemplateService) {
        this.templatesUpdated = new Subject<any>();
        this.templates = new Map();
        this.globalTemplates.templatesUpdated
            .subscribe(() => this.templatesUpdated.next());
        this.globalTemplatePrefix = "dynamic-form";
    }

    isValidType(type: string): boolean {
        return templateTypes.includes(type as FormTemplateType);
    }

    get(type: FormTemplateType, key: string): TemplateRef<any> {
        if (!this.templates.has(type)) return this.getGlobalTemplate(type, key);
        const templates = this.templates.get(type);
        return templates.has(key) ? templates.get(key) : this.getGlobalTemplate(type, key);
    }

    protected getGlobalTemplate(type: FormTemplateType, key: string): TemplateRef<any> {
        return this.globalTemplates.get(`${this.globalPrefix}-${type}-${key}`);
    }

    add(key: string, type: FormTemplateType, template: TemplateRef<any>): void {
        if (!this.templates.has(type)) {
            this.templates.set(type, new Map());
        }
        this.templates.get(type).set(key, template);
        this.templatesUpdated.next();
    }

    remove(key: string, type: FormTemplateType): void {
        if (!this.templates.has(type)) return;
        this.templates.get(type).delete(key);
        this.templatesUpdated.next();
    }
}
