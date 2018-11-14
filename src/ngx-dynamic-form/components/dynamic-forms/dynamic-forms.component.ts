import {AfterContentInit, ChangeDetectorRef, Component, Injector, Input, QueryList, ViewChildren} from "@angular/core";
import {ObjectUtils} from "@stemy/ngx-utils";
import {
    DynamicFormControl,
    DynamicFormStatus,
    IDynamicFormBase,
    IDynamicFormsConfigs,
    IDynamicFormTemplates
} from "../../common-types";
import {DynamicFormBaseComponent} from "../base/dynamic-form-base.component";

const statusPriority: DynamicFormStatus[] = ["LOADING", "PENDING", "DISABLED", "INVALID"];

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

    get status(): DynamicFormStatus {
        for (let i = 0; i < statusPriority.length; i++) {
            const status = statusPriority[i];
            if (this.checkForms(f => f.status == status)) return status;
        }
        return "VALID";
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
                    let path: Array<string | number> = null;
                    if (ObjectUtils.isArray(config.path) && config.path.length > 0) {
                        path = config.path;
                    } else if (ObjectUtils.isString(config.path) && config.path.length > 0) {
                        path = config.path.split(".");
                    } else if (ObjectUtils.isNumber(config.path)) {
                        path = [config.path];
                    }
                    if (!path) {
                        result = ObjectUtils.assign(result, data);
                        return;
                    }
                    result = ObjectUtils.mapToPath(result, data, path.map(p => `${p}`));
                });
                resolve(result);
            }, reject);
        });
    }

    emitChange(control: DynamicFormControl): void {
        this.changeTimer.clear();
        this.changeTimer.set(() => {
            const form = control.form;
            form.recheckControls().then(() => form.reloadControlsFrom(control, new Set<DynamicFormControl>()).then(() => {
                this.onChange.emit(control);
            }));
        }, 250);
    }

    getControl(id: string): DynamicFormControl {
        return this.getFromValue(f => f.getControl(id));
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
