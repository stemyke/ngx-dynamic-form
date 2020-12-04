import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChildren,
    EventEmitter,
    Inject,
    Input,
    Output,
    QueryList,
    ViewChildren
} from "@angular/core";
import {FormArray, FormGroup} from "@angular/forms";
import {Subscription} from "rxjs";
import {
    DynamicFormArrayModel,
    DynamicFormComponent,
    DynamicFormComponentService,
    DynamicFormControlEvent,
    DynamicFormLayout,
    DynamicFormModel,
    DynamicTemplateDirective
} from "@ng-dynamic-forms/core";
import {ObservableUtils} from "@stemy/ngx-utils";
import {DynamicFormState, IDynamicForm, IDynamicFormBase} from "../../common-types";
import {DynamicFormService} from "../../services/dynamic-form.service";
import {Observable} from "rxjs/index";

@Component({
    selector: "dynamic-base-form",
    template: "",
    changeDetection: ChangeDetectionStrategy.Default
})
export class DynamicBaseFormComponent extends DynamicFormComponent implements AfterViewInit, IDynamicForm {

    @Input() group: FormGroup;
    @Input() model: DynamicFormModel;
    @Input() layout: DynamicFormLayout;

    @Output() blur: EventEmitter<DynamicFormControlEvent>;
    @Output() change: EventEmitter<DynamicFormControlEvent>;
    @Output() focus: EventEmitter<DynamicFormControlEvent>;

    @ContentChildren(DynamicTemplateDirective) contentTemplates: QueryList<DynamicTemplateDirective>;
    @ViewChildren(DynamicTemplateDirective) viewTemplates: QueryList<DynamicTemplateDirective>;

    get status(): DynamicFormState {
        return !this.group ? null : this.group.status as DynamicFormState;
    }

    @Output() readonly onStatusChange: EventEmitter<IDynamicFormBase>;
    @Output() readonly onSubmit: EventEmitter<IDynamicFormBase>;

    protected subscription: Subscription;

    constructor(@Inject(DynamicFormService) readonly formService: DynamicFormService,
                changeDetectorRef: ChangeDetectorRef,
                componentService: DynamicFormComponentService,) {
        super(changeDetectorRef, componentService);
        this.blur = new EventEmitter<DynamicFormControlEvent>();
        this.change = new EventEmitter<DynamicFormControlEvent>();
        this.focus = new EventEmitter<DynamicFormControlEvent>();
        this.onStatusChange = new EventEmitter<IDynamicFormBase>();
        this.onSubmit = new EventEmitter<IDynamicFormBase>();
        this.templates = new QueryList<DynamicTemplateDirective>();
    }

    ngAfterViewInit(): void {
        this.subscription = ObservableUtils.subscribe({
            subjects: [this.contentTemplates.changes, this.viewTemplates.changes],
            cb: () => {
                const templates = this.contentTemplates.toArray().concat(this.viewTemplates.toArray());
                this.templates.reset(templates);
            }
        });
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
        this.subscription.unsubscribe();
    }

    insertFormArrayGroup(index: number, formArray: FormArray, formArrayModel: DynamicFormArrayModel): void {
        this.formService.insertFormArrayGroup(index, formArray, formArrayModel);
        this.changeDetectorRef.detectChanges();
    }

    removeFormArrayGroup(index: number, formArray: FormArray, formArrayModel: DynamicFormArrayModel): void {
        this.formService.removeFormArrayGroup(index, formArray, formArrayModel);
        this.changeDetectorRef.detectChanges();
    }

    moveFormArrayGroup(index: number, step: number, formArray: FormArray, formArrayModel: DynamicFormArrayModel): void {
        this.formService.moveFormArrayGroup(index, step, formArray, formArrayModel);
        this.changeDetectorRef.detectChanges();
    }

    clearFormArray(formArray: FormArray, formArrayModel: DynamicFormArrayModel): void {
        this.formService.clearFormArray(formArray, formArrayModel);
        this.changeDetectorRef.detectChanges();
    }

    serialize(): Promise<any> {
        return this.formService.serialize(this.model, this.group);
    }
}
