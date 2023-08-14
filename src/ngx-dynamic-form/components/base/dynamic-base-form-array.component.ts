import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    forwardRef,
    Injector,
    Input,
    OnDestroy,
    Output,
    QueryList,
    ViewChildren
} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {Subscription} from "rxjs";
import {
    DynamicFormArrayComponent,
    DynamicFormControlCustomEvent,
    DynamicFormControlLayout,
    DynamicFormControlLayoutContext,
    DynamicFormControlLayoutPlace,
    DynamicFormControlModel,
    DynamicFormGroupModel,
    DynamicFormLayout,
    DynamicFormLayoutService,
    DynamicFormValidationService,
    DynamicFormValueControlModel,
    DynamicTemplateDirective
} from "@ng-dynamic-forms/core";
import {DynamicFormArrayGroupModel, DynamicFormArrayModel} from "../../utils/dynamic-form-array.model";
import {collectPathAble} from "../../utils/misc";
import {DynamicFormInitControl} from "../../common-types";
import {DynamicBaseFormComponent} from "./dynamic-base-form.component";
import {DynamicBaseFormControlContainerComponent} from "./dynamic-base-form-control-container.component";

@Component({
    selector: "dynamic-base-form-array",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicBaseFormArrayComponent extends DynamicFormArrayComponent implements DynamicFormInitControl, OnDestroy {

    @Input() formLayout: DynamicFormLayout;
    @Input() group: FormGroup;
    @Input() layout: DynamicFormControlLayout;
    @Input() model: DynamicFormArrayModel;
    @Input() templates: QueryList<DynamicTemplateDirective> | undefined;

    @Output() blur: EventEmitter<any> = new EventEmitter();
    @Output() change: EventEmitter<any> = new EventEmitter();
    @Output() customEvent: EventEmitter<DynamicFormControlCustomEvent> = new EventEmitter();
    @Output() focus: EventEmitter<any> = new EventEmitter();

    @ViewChildren(forwardRef(() => DynamicBaseFormControlContainerComponent))
    components: QueryList<DynamicBaseFormControlContainerComponent>;

    get useTabs(): boolean {
        return this.model?.useTabs;
    }

    protected subscription: Subscription;

    constructor(layoutService: DynamicFormLayoutService, validationService: DynamicFormValidationService,
                readonly form: DynamicBaseFormComponent, readonly injector: Injector, readonly cdr: ChangeDetectorRef) {
        super(layoutService, validationService);
    }

    initialize(cdr: ChangeDetectorRef): void {
        this.subscription = this.model.filteredGroups.subscribe(filteredGroups => {
            this.updateGroups(filteredGroups);
        });
        this.model.initialize(this.array);
    }

    ngOnDestroy(): void {
        if (this.subscription)
            this.subscription.unsubscribe();
    }

    saveTab(index: number): void {
        this.model.saveTab(index, this.model.getFiltered(index), this.model, this.injector);
    }

    restoreTab(): number {
        return this.model.restoreTab(this.model, this.injector);
    }

    getTabLabel(index: number, model: DynamicFormArrayGroupModel): string {
        return this.model.getTabLabel(index, model, this.model, this.array, this.injector);
    }

    getClass(context: DynamicFormControlLayoutContext, place: DynamicFormControlLayoutPlace, model?: DynamicFormControlModel): string {
        return [
            context == "element" ? this.getModelClass(model) : null,
            context == "element" ? this.getAdditionalClass(model) : null,
            super.getClass(context, place, model),
            model instanceof DynamicFormValueControlModel ? model.additional?.classes : null
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

    protected updateGroups(filteredGroups: ReadonlyArray<DynamicFormArrayGroupModel>): void {
        this.cdr.detectChanges();
        this.components.forEach(t => t.cdr.detectChanges());
    }
}
