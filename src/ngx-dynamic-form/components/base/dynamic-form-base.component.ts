import {
    AfterContentInit,
    ChangeDetectorRef,
    ContentChild,
    ContentChildren,
    EventEmitter,
    Injector,
    Input,
    Output,
    QueryList,
    TemplateRef
} from "@angular/core";
import {ITimer, ObjectUtils, TimerUtils} from "@stemy/ngx-utils";
import {DynamicFormControl, DynamicFormStatus, IDynamicFormBase, IDynamicFormTemplates} from "../../common-types";
import {DynamicFormTemplateDirective} from "../../directives/dynamic-form-template.directive";

export abstract class DynamicFormBaseComponent implements IDynamicFormBase, AfterContentInit {

    @Input() name: string;
    @Input() readonly: boolean;
    @Input() validateOn: "change" | "blur" | "submit";
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

    @Output() onChange: EventEmitter<DynamicFormControl>;
    @Output() onStatusChange: EventEmitter<IDynamicFormBase>;
    @Output() onInit: EventEmitter<IDynamicFormBase>;
    @Output() onSubmit: EventEmitter<IDynamicFormBase>;

    @ContentChild("prefixTemplate")
    prefixTemplate: TemplateRef<any>;

    @ContentChild("suffixTemplate")
    suffixTemplate: TemplateRef<any>;

    abstract status: DynamicFormStatus;
    readonly injector: Injector;

    @ContentChildren(DynamicFormTemplateDirective)
    protected templates: QueryList<DynamicFormTemplateDirective>;

    @ContentChild("wrapperTemplate")
    protected cWrapperTemplate: TemplateRef<any>;

    @ContentChild("fieldSetTemplate")
    protected cFieldSetTemplate: TemplateRef<any>;

    @ContentChild("controlTemplate")
    protected cControlTemplate: TemplateRef<any>;

    protected changeTimer: ITimer;

    protected constructor(public cdr: ChangeDetectorRef, injector: Injector) {
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
        this.injector = injector;
        this.changeTimer = TimerUtils.createTimeout();
    }

    // --- IDynamicFormBase

    abstract emitChange(handler: DynamicFormControl): void;

    abstract getControl(id: string): DynamicFormControl;

    abstract serialize(validate?: boolean): Promise<any>;

    abstract validate(showErrors?: boolean): Promise<any>;

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
    }

    protected filterTemplates(templates: IDynamicFormTemplates, type: string): IDynamicFormTemplates {
        if (ObjectUtils.isObject(templates) && Object.keys(templates).length > 0) return templates;
        return this.templates.filter(t => !!t[type]).reduce((result, directive) => {
            result[directive[type]] = directive.template;
            return result;
        }, {});
    }
}
