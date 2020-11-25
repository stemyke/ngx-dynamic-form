import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ComponentFactoryResolver,
    ContentChildren,
    EventEmitter,
    HostBinding,
    Input,
    Output,
    QueryList,
    Type,
    ViewChild,
    ViewContainerRef
} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {
    DYNAMIC_FORM_CONTROL_TYPE_ARRAY,
    DynamicFormArrayGroupModel,
    DynamicFormComponentService,
    DynamicFormControl,
    DynamicFormControlContainerComponent,
    DynamicFormControlEvent,
    DynamicFormControlModel,
    DynamicFormLayout,
    DynamicFormLayoutService,
    DynamicFormRelationService,
    DynamicFormValidationService,
    DynamicTemplateDirective
} from "@ng-dynamic-forms/core";

@Component({
    selector: "dynamic-base-form-control",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicBaseFormControlContainerComponent extends DynamicFormControlContainerComponent {

    @ContentChildren(DynamicTemplateDirective) contentTemplateList: QueryList<DynamicTemplateDirective>;

    @HostBinding("class") klass;

    @Input() context: DynamicFormArrayGroupModel | null = null;
    @Input() group: FormGroup;
    @Input() hostClass: string[];
    @Input("templates") inputTemplateList: QueryList<DynamicTemplateDirective>;
    @Input() layout: DynamicFormLayout;
    @Input() model: DynamicFormControlModel;

    @Output() blur: EventEmitter<DynamicFormControlEvent> = new EventEmitter<DynamicFormControlEvent>();
    @Output() change: EventEmitter<DynamicFormControlEvent> = new EventEmitter<DynamicFormControlEvent>();
    @Output() focus: EventEmitter<DynamicFormControlEvent> = new EventEmitter<DynamicFormControlEvent>();

    @ViewChild("componentViewContainer", {read: ViewContainerRef, static: true}) componentViewContainerRef: ViewContainerRef;

    constructor(readonly changeDetectorRef: ChangeDetectorRef,
                readonly componentFactoryResolver: ComponentFactoryResolver,
                readonly layoutService: DynamicFormLayoutService,
                readonly validationService: DynamicFormValidationService,
                readonly componentService: DynamicFormComponentService,
                readonly relationService: DynamicFormRelationService) {
        super(changeDetectorRef, componentFactoryResolver, layoutService, validationService, componentService, relationService);
    }

    get componentType(): Type<DynamicFormControl> | null {
        return this.componentService.getCustomComponentType(this.model) ?? this.getComponentType(this.model);
    }

    get startTemplate(): DynamicTemplateDirective {
        return (this.model.type == DYNAMIC_FORM_CONTROL_TYPE_ARRAY)
            ? this.layoutService.getAlignedTemplate(this.model, this.templates, "ARRAY_START" as any)
            : this.layoutService.getStartTemplate(this.model, this.templates);
    }

    get endTemplate(): DynamicTemplateDirective {
        return (this.model.type == DYNAMIC_FORM_CONTROL_TYPE_ARRAY)
            ? this.layoutService.getAlignedTemplate(this.model, this.templates, "ARRAY_END" as any)
            : this.layoutService.getEndTemplate(this.model, this.templates);
    }

    protected getComponentType(model: DynamicFormControlModel): Type<DynamicFormControl> | null {
        return null;
    }
}
