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
    DynamicFormLayout,
    DynamicFormLayoutService,
    DynamicFormValidationService,
    DynamicFormValueControlModel,
    DynamicTemplateDirective
} from "@ng-dynamic-forms/core";
import {collectPathAble} from "../../utils/misc";
import {DynamicFormArrayModel} from "../../utils/dynamic-form-array.model";
import {DynamicFormGroupModel} from "../../utils/dynamic-form-group.model";

@Component({
    standalone: false,
    selector: "dynamic-base-form-group",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicBaseFormGroupComponent extends DynamicFormGroupComponent {

    @Input() formLayout: DynamicFormLayout = null;
    @Input() group: FormGroup = null;
    @Input() layout: DynamicFormControlLayout = null;
    @Input() model: DynamicFormGroupModel = null;
    @Input() templates: QueryList<DynamicTemplateDirective> | DynamicTemplateDirective[] | undefined = [];

    @Output() blur: EventEmitter<any> = new EventEmitter();
    @Output() change: EventEmitter<any> = new EventEmitter();
    @Output() customEvent: EventEmitter<DynamicFormControlCustomEvent> = new EventEmitter();
    @Output() focus: EventEmitter<any> = new EventEmitter();

    @ViewChildren(forwardRef(() => DynamicFormControlContainerComponent))
    components: QueryList<DynamicFormControlContainerComponent> = null;

    constructor(protected layoutService: DynamicFormLayoutService,
                protected validationService: DynamicFormValidationService) {
        super(layoutService, validationService);
    }

    getClass(context: DynamicFormControlLayoutContext, place: DynamicFormControlLayoutPlace, model?: DynamicFormControlModel): string {
        return [
            context == "element" ? this.getModelClass(model) : null,
            context == "element" ? this.getAdditionalClass(model) : null,
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

    protected getAdditionalClass(model?: DynamicFormControlModel): string {
        if (model instanceof DynamicFormArrayModel) {
            return model.additional?.classes;
        }
        if (model instanceof DynamicFormValueControlModel) {
            return model.additional?.classes;
        }
        return null;
    }
}
