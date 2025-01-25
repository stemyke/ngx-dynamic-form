import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ComponentFactoryResolver,
    ContentChildren,
    EventEmitter,
    HostBinding,
    Injector,
    Input,
    Output,
    QueryList,
    Type,
    ViewChild,
    ViewContainerRef
} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {Subscription} from "rxjs";
import {
    DYNAMIC_FORM_CONTROL_TYPE_ARRAY,
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
import {ObjectUtils} from "@stemy/ngx-utils";

import {DynamicFormInitControl} from "../../common-types";
import {collectPathAble} from "../../utils/misc";
import {DynamicFormArrayGroupModel} from "../../utils/dynamic-form-array.model";
import {DynamicFormService} from "../../services/dynamic-form.service";
import {DynamicBaseFormComponent} from "./dynamic-base-form.component";

@Component({
    standalone: false,
    selector: "dynamic-base-form-control",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {provide: DynamicFormControlContainerComponent, useExisting: DynamicBaseFormControlContainerComponent}
    ]
})
export class DynamicBaseFormControlContainerComponent extends DynamicFormControlContainerComponent {

    @ContentChildren(DynamicTemplateDirective) contentTemplateList: QueryList<DynamicTemplateDirective> = null;

    @HostBinding("class") klass = null;

    @Input() context: DynamicFormArrayGroupModel | null = null;
    @Input() group: FormGroup = null;
    @Input() hostClass: string[] = null;
    @Input("templates") inputTemplateList: QueryList<DynamicTemplateDirective> = null;
    @Input() layout: DynamicFormLayout = null;
    @Input() model: DynamicFormControlModel = null;

    @Output() blur: EventEmitter<DynamicFormControlEvent> = new EventEmitter<DynamicFormControlEvent>();
    @Output() change: EventEmitter<DynamicFormControlEvent> = new EventEmitter<DynamicFormControlEvent>();
    @Output() focus: EventEmitter<DynamicFormControlEvent> = new EventEmitter<DynamicFormControlEvent>();

    @ViewChild("componentViewContainer", {
        read: ViewContainerRef,
        static: true
    }) componentViewContainerRef: ViewContainerRef = null;

    get componentType(): Type<DynamicFormControl> | null {
        return this.form.getComponentType?.(this.model, this.injector)
            ?? this.componentService.getCustomComponentType(this.model);
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

    get formService(): DynamicFormService {
        return this.form.formService;
    }

    protected onDetectChanges: Subscription;

    constructor(readonly form: DynamicBaseFormComponent,
                readonly cdr: ChangeDetectorRef,
                readonly injector: Injector,
                cfr: ComponentFactoryResolver,
                layoutService: DynamicFormLayoutService,
                validationService: DynamicFormValidationService,
                componentService: DynamicFormComponentService,
                relationService: DynamicFormRelationService) {
        super(cdr, cfr, layoutService, validationService, componentService, relationService);
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.onDetectChanges = this.form.onDetectChanges.subscribe(() => {
            this.changeDetectorRef.detectChanges();
        });
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
        this.onDetectChanges.unsubscribe();
    }

    getLabel(): string {
        if (this.form?.labelPrefix) {
            const label = collectPathAble(this.model, p => p.id);
            if (label.length == 0) {
                return this.model.label;
            }
            label.unshift(this.form.labelPrefix);
            return label.join(".");
        }
        return this.model.label;
    }

    getLabelIcon(): string {
        if (this.context instanceof DynamicFormArrayGroupModel) {
            const arrayModel = this.context.context;
            if (arrayModel && arrayModel.sortBy == this.model.id) {
                return arrayModel.sortOrder;
            }
        }
        return null;
    }

    clickLabel(): void {
        if (this.context instanceof DynamicFormArrayGroupModel) {
            const arrayModel = this.context.context;
            if (arrayModel) {
                arrayModel.sortBy = this.model.id;
            }
        }
    }

    protected createFormControlComponent() {
        super.createFormControlComponent();
        const component = this.componentRef?.instance as DynamicFormInitControl;
        if (!component || !ObjectUtils.isFunction(component.initialize)) return;
        component.initialize(this.changeDetectorRef);
    }
}
