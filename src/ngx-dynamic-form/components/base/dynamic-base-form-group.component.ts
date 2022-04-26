import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    forwardRef,
    Input,
    Output,
    QueryList,
    ViewChildren
} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {
    DynamicFormControlContainerComponent,
    DynamicFormControlCustomEvent,
    DynamicFormControlLayout,
    DynamicFormControlLayoutContext,
    DynamicFormControlLayoutPlace,
    DynamicFormControlModel,
    DynamicFormGroupComponent,
    DynamicFormGroupModel,
    DynamicFormLayout,
    DynamicFormLayoutService,
    DynamicFormValidationService,
    DynamicTemplateDirective
} from "@ng-dynamic-forms/core";
import {collectPathAble} from "../../utils/misc";

@Component({
    selector: "dynamic-base-form-group",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicBaseFormGroupComponent extends DynamicFormGroupComponent {

    @Input() formLayout: DynamicFormLayout;
    @Input() group: FormGroup;
    @Input() layout: DynamicFormControlLayout;
    @Input() model: DynamicFormGroupModel;
    @Input() templates: QueryList<DynamicTemplateDirective> | DynamicTemplateDirective[] | undefined;

    @Output() blur: EventEmitter<any> = new EventEmitter();
    @Output() change: EventEmitter<any> = new EventEmitter();
    @Output() customEvent: EventEmitter<DynamicFormControlCustomEvent> = new EventEmitter();
    @Output() focus: EventEmitter<any> = new EventEmitter();

    @ViewChildren(forwardRef(() => DynamicFormControlContainerComponent))
    components: QueryList<DynamicFormControlContainerComponent>;

    constructor(protected layoutService: DynamicFormLayoutService,
                protected validationService: DynamicFormValidationService) {
        super(layoutService, validationService);
    }

    getClass(context: DynamicFormControlLayoutContext, place: DynamicFormControlLayoutPlace, model?: DynamicFormControlModel): string {
        return [
            context == "element" ? this.getModelClass(model) : null,
            super.getClass(context, place, model)
        ].filter(cls => !!cls).join(" ");
    }

    protected getModelClass(model?: DynamicFormControlModel): string {
        const parts = collectPathAble(model, p => p.id);
        if (parts.length == 0) return "";
        if (model instanceof DynamicFormGroupModel) {
            return `form-group-${parts.join("-")}`;
        }
        return `form-control-${parts.join("-")}`;
    }
}
