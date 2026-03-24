import {Injectable, TemplateRef} from "@angular/core";
import {Subject} from "rxjs";
import {FormTemplateType} from "../common-types";

const templateTypes: FormTemplateType[] = ["control", "label", "input", "prefix", "suffix", "setPrefix", "setSuffix"];

@Injectable()
export class DynamicFormTemplateService {

    readonly templatesUpdated: Subject<void>;

    protected templates: Map<FormTemplateType, Map<string, TemplateRef<any>>>;

    constructor() {
        this.templatesUpdated = new Subject<any>();
        this.templates = new Map();
        templateTypes.forEach(templateType => {
            this.templates.set(templateType, new Map());
        });
    }

    isValidType(type: string): boolean {
        return templateTypes.includes(type as FormTemplateType);
    }

    get(type: FormTemplateType, key: string): TemplateRef<any> {
        if (!this.templates.has(type)) return null;
        const templates = this.templates.get(type);
        return templates.has(key) ? templates.get(key) : null;
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
