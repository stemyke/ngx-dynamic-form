import { AfterContentInit, ChangeDetectorRef, ContentChild, ContentChildren, EventEmitter, Injector, Input, Output, QueryList, TemplateRef, Directive } from "@angular/core";
import {ObjectUtils} from "@stemy/ngx-utils";
import {
    DynamicFormControl, DynamicFormState, IDynamicFormBase, IDynamicFormControl, IDynamicFormTemplates,
    IFormControlProvider
} from "../../common-types";
import {DynamicFormTemplateDirective} from "../../directives/dynamic-form-template.directive";
import {DynamicFormService} from "../../services/dynamic-form.service";

@Directive()
export abstract class DynamicFormBaseComponent implements IDynamicFormBase, AfterContentInit {

    @Input() name: string;
    @Input() readonly: boolean;
    @Input() updateOn: "change" | "blur" | "submit";
    @Input() classes: any;
    @Input() parent: IDynamicFormBase;

    @Input() wrapperTemplate: TemplateRef<any>;
    @Input() fieldSetTemplate: TemplateRef<any>;
    @Input() controlTemplate: TemplateRef<any>;

    @Input() controlTemplates: IDynamicFormTemplates;
    @Input() labelTemplates: IDynamicFormTemplates;
    @Input() inputTemplates: IDynamicFormTemplates;
    @Input() prefixTemplates: IDynamicFormTemplates;
    @Input() suffixTemplates: IDynamicFormTemplates;
    @Input() setPrefixTemplates: IDynamicFormTemplates;
    @Input() setSuffixTemplates: IDynamicFormTemplates;

    @Output() onChange: EventEmitter<IDynamicFormControl>;
    @Output() onStatusChange: EventEmitter<IDynamicFormBase>;
    @Output() onInit: EventEmitter<IDynamicFormBase>;
    @Output() onSubmit: EventEmitter<IDynamicFormBase>;

    @ContentChild("prefixTemplate")
    prefixTemplate: TemplateRef<any>;

    @ContentChild("suffixTemplate")
    suffixTemplate: TemplateRef<any>;

    get root(): IDynamicFormBase {
        let form: IDynamicFormBase = this;
        while (ObjectUtils.isDefined(form.parent)) {
            form = form.parent;
        }
        return form;
    }

    abstract status: DynamicFormState;
    readonly injector: Injector;
    readonly cdr: ChangeDetectorRef;

    @ContentChildren(DynamicFormTemplateDirective)
    protected templates: QueryList<DynamicFormTemplateDirective>;

    @ContentChild("wrapperTemplate")
    protected cWrapperTemplate: TemplateRef<any>;

    @ContentChild("fieldSetTemplate")
    protected cFieldSetTemplate: TemplateRef<any>;

    @ContentChild("controlTemplate")
    protected cControlTemplate: TemplateRef<any>;

    protected constructor(cdr: ChangeDetectorRef, private formService: DynamicFormService) {
        this.name = "";

        this.controlTemplates = {};
        this.labelTemplates = {};
        this.inputTemplates = {};
        this.prefixTemplates = {};
        this.suffixTemplates = {};

        this.onChange = new EventEmitter<DynamicFormControl>();
        this.onStatusChange = new EventEmitter<IDynamicFormBase>();
        this.onInit = new EventEmitter<IDynamicFormBase>();
        this.onSubmit = new EventEmitter<IDynamicFormBase>();
        this.injector = formService.injector;
        this.cdr = cdr;
    }

    // --- IDynamicFormBase

    abstract validate(showErrors?: boolean): Promise<any>;
    abstract serialize(validate?: boolean): Promise<any>;
    abstract check(): Promise<any>;
    abstract getControl(id: string): IDynamicFormControl;

    findProvider(control: IDynamicFormControl): IFormControlProvider {
        return this.formService.findProvider(control);
    }

    // --- Lifecycle hooks

    ngAfterContentInit(): void {
        this.wrapperTemplate = this.wrapperTemplate || this.cWrapperTemplate;
        this.fieldSetTemplate = this.fieldSetTemplate || this.cFieldSetTemplate;
        this.controlTemplate = this.controlTemplate || this.cControlTemplate;
        this.controlTemplates = this.filterTemplates(this.controlTemplates, "control");
        this.labelTemplates = this.filterTemplates(this.labelTemplates, "label");
        this.inputTemplates = this.filterTemplates(this.inputTemplates , "input");
        this.prefixTemplates = this.filterTemplates(this.prefixTemplates, "prefix");
        this.suffixTemplates =  this.filterTemplates(this.suffixTemplates, "suffix");
        this.setPrefixTemplates = this.filterTemplates(this.setPrefixTemplates, "setPrefix");
        this.setSuffixTemplates =  this.filterTemplates(this.setSuffixTemplates, "setSuffix");
    }

    protected filterTemplates(templates: IDynamicFormTemplates, type: string): IDynamicFormTemplates {
        if (ObjectUtils.isObject(templates) && Object.keys(templates).length > 0) return templates;
        return this.templates.filter(t => !!t[type]).reduce((result, directive) => {
            result[directive[type]] = directive.template;
            return result;
        }, {});
    }
}
