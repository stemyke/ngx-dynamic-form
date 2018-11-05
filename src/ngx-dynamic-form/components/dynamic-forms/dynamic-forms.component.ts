import {AfterContentInit, ChangeDetectorRef, Component, Injector, Input, QueryList, ViewChildren} from "@angular/core";
import {ObjectUtils} from "@stemy/ngx-utils";
import {
    IDynamicFormBase,
    IDynamicFormControlHandler,
    IDynamicFormsConfigs,
    IDynamicFormTemplates,
    IFormControl
} from "../../common-types";
import {DynamicFormBaseComponent} from "../base/dynamic-form-base.component";

@Component({
    moduleId: module.id,
    selector: "dynamic-forms, [dynamic-forms]",
    templateUrl: "./dynamic-forms.component.html",
    providers: [{provide: DynamicFormBaseComponent, useExisting: DynamicFormsComponent}]
})
export class DynamicFormsComponent extends DynamicFormBaseComponent implements IDynamicFormBase, AfterContentInit {

    @Input() data: IDynamicFormsConfigs;

    @Input() formPrefixTemplates: IDynamicFormTemplates;
    @Input() formSuffixTemplates: IDynamicFormTemplates;
    @Input() innerFormPrefixTemplates: IDynamicFormTemplates;
    @Input() innerFormSuffixTemplates: IDynamicFormTemplates;

    get isLoading(): boolean {
        return this.checkForms(f => f.isLoading);
    }

    get isValid(): boolean {
        return !this.checkForms(f => !f.isValid);
    }

    get isValidating(): boolean {
        return this.checkForms(f => f.isValidating);
    }

    @ViewChildren(DynamicFormBaseComponent)
    private forms: QueryList<IDynamicFormBase>;

    constructor(cdr: ChangeDetectorRef, injector: Injector) {
        super(cdr, injector);
        this.formPrefixTemplates = {};
        this.formSuffixTemplates = {};
        this.innerFormPrefixTemplates = {};
        this.innerFormSuffixTemplates = {};
    }

    // --- Lifecycle hooks

    ngAfterContentInit(): void {
        super.ngAfterContentInit();
        this.formPrefixTemplates = this.filterTemplates(this.formPrefixTemplates, "formPrefix");
        this.formSuffixTemplates = this.filterTemplates(this.formSuffixTemplates, "formSuffix");
        this.innerFormPrefixTemplates = this.filterTemplates(this.innerFormPrefixTemplates, "innerFormPrefix");
        this.innerFormSuffixTemplates = this.filterTemplates(this.innerFormSuffixTemplates, "innerFormSuffix");
    }

    // --- IDynamicFormBase ---

    validate(): Promise<any> {
        if (!this.forms) return Promise.reject(null);
        return Promise.all(this.forms.map(f => f.validate()));
    }

    serialize(validate?: boolean): Promise<any> {
        if (!this.forms) return validate ? Promise.reject(null) : Promise.resolve({});
        const promises = this.forms.map(f => f.serialize(validate));
        return new Promise<any>((resolve, reject) => {
            Promise.all(promises).then(results => {
                let result = {};
                results.forEach((data, ix) => {
                    const config = this.data[ix];
                    if (!config.path) {
                        result = ObjectUtils.assign(result, data);
                        return;
                    }
                    const parts = config.path.split(".");
                    const maxIndex = parts.length - 1;
                    let target = result;
                    parts.forEach((part, ix) => {
                        target[part] = target[part] || {};
                        if (ix == maxIndex) {
                            target[part] = ObjectUtils.assign(target[part], data);
                            return;
                        }
                        target = target[part];
                    });
                });
                resolve(result);
            }, reject);
        });
    }

    emitChange(handler: IDynamicFormControlHandler): void {
        this.changeTimer.clear();
        this.changeTimer.set(() => {
            const form = handler.form;
            form.recheckControls().then(() => form.reloadControlsFrom(handler, new Set<IDynamicFormControlHandler>()).then(() => {
                this.onChange.emit(handler);
            }));
        }, 250);
    }

    getControl(id: string): IFormControl {
        return this.getFromValue(f => f.getControl(id));
    }

    getControlHandler(id: string): IDynamicFormControlHandler {
        return this.getFromValue(f => f.getControlHandler(id));
    }

    private checkForms(check: (form: IDynamicFormBase) => boolean): boolean {
        this.cdr.detectChanges();
        if (!this.forms) return false;
        return ObjectUtils.isDefined(this.forms.find(check));
    }

    private getFromValue<T>(check: (form: IDynamicFormBase) => T): T {
        if (!this.forms) return null;
        let value: T = null;
        this.forms.find(f => {
            value = check(f);
            return ObjectUtils.isDefined(value);
        });
        return value;
    }
}
