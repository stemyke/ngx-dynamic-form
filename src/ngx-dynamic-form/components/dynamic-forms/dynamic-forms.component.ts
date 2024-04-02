import {
    AfterContentInit, ChangeDetectorRef, Component, ContentChild, Input, OnChanges, QueryList, SimpleChanges,
    TemplateRef, ViewChildren
} from "@angular/core";
import {ObjectUtils, UniqueUtils} from "@stemy/ngx-utils";
import {
    DYNAMIC_FORM,
    DynamicFormGroup, DynamicFormState, IDynamicFormBase, IDynamicFormControl, IDynamicFormsConfigs,
    IDynamicFormTemplates, IDynamicSingleFormConfig
} from "../../common-types";
import {DynamicFormBaseComponent} from "../base/dynamic-form-base.component";
import {DynamicFormService} from "../../services/dynamic-form.service";

const statusPriority: DynamicFormState[] = ["LOADING", "PENDING", "DISABLED", "INVALID"];

@Component({
    moduleId: module.id,
    selector: "dynamic-forms, [dynamic-forms]",
    templateUrl: "./dynamic-forms.component.html",
    providers: [
        {
            provide: DynamicFormBaseComponent,
            useExisting: DynamicFormsComponent
        },
        {
            provide: DYNAMIC_FORM,
            useExisting: DynamicFormsComponent
        }
    ]
})
export class DynamicFormsComponent extends DynamicFormBaseComponent implements IDynamicFormBase, AfterContentInit, OnChanges {

    @Input() data: IDynamicFormsConfigs;

    @Input() containerTemplate: TemplateRef<any>;

    @Input() formPrefixTemplates: IDynamicFormTemplates;
    @Input() formSuffixTemplates: IDynamicFormTemplates;
    @Input() innerFormPrefixTemplates: IDynamicFormTemplates;
    @Input() innerFormSuffixTemplates: IDynamicFormTemplates;

    get status(): DynamicFormState {
        for (let i = 0; i < statusPriority.length; i++) {
            const status = statusPriority[i];
            if (this.checkForms(f => f.status == status)) return status;
        }
        return "VALID";
    }

    public configs: IDynamicFormsConfigs;

    @ContentChild("containerTemplate")
    protected cContainerTemplate: TemplateRef<any>;

    @ViewChildren(DynamicFormBaseComponent)
    private forms: QueryList<IDynamicFormBase>;

    constructor(cdr: ChangeDetectorRef, formService: DynamicFormService) {
        super(cdr, formService);
        this.formPrefixTemplates = {};
        this.formSuffixTemplates = {};
        this.innerFormPrefixTemplates = {};
        this.innerFormSuffixTemplates = {};
    }

    // --- Lifecycle hooks

    ngAfterContentInit(): void {
        super.ngAfterContentInit();
        this.containerTemplate = this.containerTemplate || this.cContainerTemplate;
        this.formPrefixTemplates = this.filterTemplates(this.formPrefixTemplates, "formPrefix");
        this.formSuffixTemplates = this.filterTemplates(this.formSuffixTemplates, "formSuffix");
        this.innerFormPrefixTemplates = this.filterTemplates(this.innerFormPrefixTemplates, "innerFormPrefix");
        this.innerFormSuffixTemplates = this.filterTemplates(this.innerFormSuffixTemplates, "innerFormSuffix");
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.configs = this.createFormGroups(this.data);
    }

    // --- IDynamicFormBase ---

    validate(showErrors: boolean = true): Promise<any> {
        if (!this.forms) return Promise.reject(null);
        return Promise.all(this.forms.map(f => f.validate(showErrors)));
    }

    serialize(validate?: boolean): Promise<any> {
        if (!this.forms) return validate ? Promise.reject(null) : Promise.resolve({});
        return new Promise<any>((resolve, reject) => {
            const promises = this.forms.map(f => f.serialize(validate));
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

    check(): Promise<any> {
        if (!this.forms) return Promise.resolve(null);
        return Promise.all(this.forms.map(t => t.check()));
    }

    getControl(id: string): IDynamicFormControl {
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

    private createFormGroups(configs: IDynamicFormsConfigs): IDynamicFormsConfigs {
        return (configs || []).map((c: any) => {
            if (c.multi) return c;
            const config = <IDynamicSingleFormConfig>c;
            const group = new DynamicFormGroup(this, {
                id: config.id || UniqueUtils.uuid(),
                type: "model",
                data: config.controlData
            });
            config.group = group;
            config.name = config.name || this.name;
            group.setup(config.data, config);
            group.reloadControls();
            return config;
        });
    }
}
