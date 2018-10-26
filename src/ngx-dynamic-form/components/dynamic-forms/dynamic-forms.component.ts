import {
    AfterContentInit, ChangeDetectorRef,
    Component,
    ContentChild,
    ContentChildren,
    EventEmitter,
    Input,
    Output,
    QueryList,
    TemplateRef,
    ViewChildren
} from "@angular/core";
import {ITimer, ObjectUtils, TimerUtils} from "@stemy/ngx-utils";
import {
    IDynamicForm,
    IDynamicFormBase,
    IDynamicFormConfig,
    IDynamicFormControlHandler,
    IDynamicFormTemplates
} from "../../common-types";
import {DynamicFormTemplateDirective} from "../../directives/dynamic-form-template.directive";
import {DynamicFormComponent} from "../dynamic-form/dynamic-form.component";

@Component({
    moduleId: module.id,
    selector: "dynamic-forms",
    templateUrl: "./dynamic-forms.component.html"
})
export class DynamicFormsComponent implements IDynamicFormBase, AfterContentInit {

    @Input() name: string;
    @Input() readonly: boolean;
    @Input() validateOnBlur: boolean;
    @Input() parent: IDynamicFormBase;

    @Input() data: IDynamicFormConfig[];

    @Output() onChange: EventEmitter<IDynamicFormControlHandler>;
    @Output() onValidate: EventEmitter<Promise<IDynamicForm>>;
    @Output() onInit: EventEmitter<IDynamicForm>;
    @Output() onSubmit: EventEmitter<IDynamicForm>;

    @ContentChild("wrapperTemplate")
    wrapperTemplate: TemplateRef<any>;

    @ContentChild("fieldSetTemplate")
    fieldSetTemplate: TemplateRef<any>;

    @ContentChild("controlTemplate")
    controlTemplate: TemplateRef<any>;

    controlTemplates: IDynamicFormTemplates;
    labelTemplates: IDynamicFormTemplates;
    inputTemplates: IDynamicFormTemplates;
    prefixTemplates: IDynamicFormTemplates;
    suffixTemplates: IDynamicFormTemplates;

    get isLoading(): boolean {
        return this.checkForms(f => f.isLoading);
    }

    get isValid(): boolean {
        return !this.checkForms(f => !f.isValid);
    }

    get isValidating(): boolean {
        return this.checkForms(f => f.isValidating);
    }

    @ViewChildren(DynamicFormComponent)
    private forms: QueryList<IDynamicForm>;

    @ContentChildren(DynamicFormTemplateDirective)
    private templates: QueryList<DynamicFormTemplateDirective>;

    private changeTimer: ITimer;

    constructor(private cdr: ChangeDetectorRef) {

        this.onChange = new EventEmitter<IDynamicFormControlHandler>();
        this.onValidate = new EventEmitter<Promise<IDynamicForm>>();
        this.onInit = new EventEmitter<IDynamicForm>();
        this.onSubmit = new EventEmitter<IDynamicForm>();

        this.controlTemplates = {};
        this.labelTemplates = {};
        this.inputTemplates = {};
        this.prefixTemplates = {};
        this.suffixTemplates = {};

        this.changeTimer = TimerUtils.createTimeout();
    }

    // --- Lifecycle hooks

    ngAfterContentInit(): void {
        this.controlTemplates = this.filterTemplates("control");
        this.labelTemplates = this.filterTemplates("label");
        this.inputTemplates = this.filterTemplates("input");
        this.prefixTemplates = this.filterTemplates("prefix");
        this.suffixTemplates = this.filterTemplates("suffix");
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

    private filterTemplates(type: string): IDynamicFormTemplates {
        return this.templates.filter(t => !!t[type]).reduce((result, directive) => {
            result[directive[type]] = directive.template;
            return result;
        }, {});
    }

    private checkForms(check: (form: IDynamicForm) => boolean): boolean {
        if (!this.forms) return false;
        this.cdr.detectChanges();
        return ObjectUtils.isDefined(this.forms.find(check));
    }
}
