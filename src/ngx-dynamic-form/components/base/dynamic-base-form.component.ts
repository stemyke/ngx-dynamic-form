import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChildren,
    EventEmitter,
    Inject,
    Input,
    OnChanges,
    Output,
    QueryList,
    SimpleChanges,
    ViewChildren
} from "@angular/core";
import {FormArray, FormGroup} from "@angular/forms";
import {Subscription} from "rxjs";
import {debounceTime, groupBy, mergeMap} from "rxjs/operators";
import {first} from "rxjs/operators";
import {
    DynamicFormComponent,
    DynamicFormComponentService,
    DynamicFormControlEvent,
    DynamicFormControlModel,
    DynamicFormLayout,
    DynamicFormModel,
    DynamicTemplateDirective
} from "@ng-dynamic-forms/core";
import {EventsService, ObservableUtils} from "@stemy/ngx-utils";
import {DynamicFormState, GetFormControlComponentType, IDynamicForm, IDynamicFormEvent} from "../../common-types";
import {collectPathAble} from "../../utils/misc";
import {DynamicFormGroupModel} from "../../utils/dynamic-form-group.model";
import {DynamicFormArrayModel} from "../../utils/dynamic-form-array.model";
import {DynamicFormService} from "../../services/dynamic-form.service";

@Component({
    selector: "dynamic-base-form",
    template: "",
    changeDetection: ChangeDetectionStrategy.Default
})
export class DynamicBaseFormComponent extends DynamicFormComponent implements OnChanges, AfterViewInit, IDynamicForm {

    @Input() group: FormGroup;
    @Input() groupModel: DynamicFormGroupModel;
    @Input() model: DynamicFormModel;
    @Input() layout: DynamicFormLayout;
    @Input() labelPrefix: string;
    @Input() getComponentType: GetFormControlComponentType;

    @Output() blur: EventEmitter<DynamicFormControlEvent>;
    @Output() change: EventEmitter<DynamicFormControlEvent>;
    @Output() focus: EventEmitter<DynamicFormControlEvent>;

    @ContentChildren(DynamicTemplateDirective) contentTemplates: QueryList<DynamicTemplateDirective>;
    @ViewChildren(DynamicTemplateDirective) viewTemplates: QueryList<DynamicTemplateDirective>;

    get status(): DynamicFormState {
        return !this.group ? null : this.group.status as DynamicFormState;
    }

    @Output() readonly onValueChange: EventEmitter<IDynamicFormEvent>;
    @Output() readonly onStatusChange: EventEmitter<IDynamicForm>;
    @Output() readonly onSubmit: EventEmitter<IDynamicForm>;
    @Output() readonly onDetectChanges: EventEmitter<IDynamicForm>;

    protected subscription: Subscription;
    protected groupSubscription: Subscription;

    constructor(@Inject(DynamicFormService) readonly formService: DynamicFormService,
                @Inject(EventsService) readonly events: EventsService,
                changeDetectorRef: ChangeDetectorRef,
                componentService: DynamicFormComponentService,) {
        super(changeDetectorRef, componentService);
        this.blur = new EventEmitter<DynamicFormControlEvent>();
        this.change = new EventEmitter<DynamicFormControlEvent>();
        this.focus = new EventEmitter<DynamicFormControlEvent>();
        this.onValueChange = new EventEmitter<IDynamicFormEvent>();
        this.onStatusChange = new EventEmitter<IDynamicForm>();
        this.onSubmit = new EventEmitter<IDynamicForm>();
        this.onDetectChanges = new EventEmitter<IDynamicForm>();
        this.templates = new QueryList<DynamicTemplateDirective>();
        this.subscription = new Subscription();
        this.groupSubscription = new Subscription();
        this.labelPrefix = "label";
        this.getComponentType = () => null;
    }

    submit(): void {
        this.onSubmit.emit(this);
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.groupSubscription.unsubscribe();
        if (this.group) {
            this.groupSubscription = ObservableUtils.multiSubscription(
                this.group.statusChanges.subscribe(() => {
                    this.onStatusChange.emit(this);
                }),
                this.group.valueChanges.pipe(debounceTime(500)).subscribe(() => {
                    this.formService.notifyChanges(this.model, this.group);
                }),
                this.change.pipe(groupBy(ev => ev.model))
                    .pipe(mergeMap(t => t.pipe(debounceTime(500))))
                    .subscribe(ev => {
                        this.onValueChange.emit({...ev, form: this});
                    })
            );
        }
        if (changes.groupModel) {
            this.model = this.groupModel?.group;
        }
        if (changes.model) {
            this.groupModel = new DynamicFormGroupModel({id: "root", group: this.model});
        }
    }

    ngAfterViewInit(): void {
        this.subscription = ObservableUtils.multiSubscription(
            ObservableUtils.subscribe(
                {
                    subjects: [this.contentTemplates.changes, this.viewTemplates.changes],
                    cb: () => {
                        const templates = this.contentTemplates.toArray().concat(this.viewTemplates.toArray());
                        this.templates.reset(templates);
                    }
                }
            ),
            this.events.languageChanged.subscribe(() => {
                this.formService.notifyChanges(this.model, this.group);
                this.formService.detectChanges(this);
            })
        );
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
        this.subscription.unsubscribe();
        this.groupSubscription.unsubscribe();
    }

    detectChanges(): void {
        super.detectChanges();
        this.onDetectChanges.emit(this);
    }

    insertFormArrayGroup(index: number, formArray: FormArray, formArrayModel: DynamicFormArrayModel): void {
        this.formService.insertFormArrayGroup(index, formArray, formArrayModel);
        this.detectChanges();
    }

    cloneFormArrayGroup(index: number, formArray: FormArray, formArrayModel: DynamicFormArrayModel): void {
        this.formService.cloneFormArrayGroup(index, formArray, formArrayModel);
        this.detectChanges();
    }

    removeFormArrayGroup(index: number, formArray: FormArray, formArrayModel: DynamicFormArrayModel): void {
        this.formService.removeFormArrayGroup(index, formArray, formArrayModel);
        this.detectChanges();
    }

    moveFormArrayGroup(index: number, step: number, formArray: FormArray, formArrayModel: DynamicFormArrayModel): void {
        this.formService.moveFormArrayGroup(index, step, formArray, formArrayModel);
        this.detectChanges();
    }

    clearFormArray(formArray: FormArray, formArrayModel: DynamicFormArrayModel): void {
        this.formService.clearFormArray(formArray, formArrayModel);
        this.detectChanges();
    }

    getClass(model?: DynamicFormControlModel): string {
        const parts = collectPathAble(model, p => p.id);
        if (parts.length == 0) return "";
        if (model instanceof DynamicFormGroupModel) {
            return `form-group-${parts.join("-")}`;
        }
        return `form-control-${parts.join("-")}`;
    }

    validate(showErrors: boolean = true): Promise<any> {
        if (!this.group) return Promise.resolve();
        return new Promise<any>((resolve, reject) => {
            this.group.statusChanges.pipe(first(status => status == "VALID" || status == "INVALID")).subscribe(status => {
                if (showErrors) {
                    this.formService.showErrors(this);
                }
                if (status == "VALID") {
                    resolve(null);
                    return;
                }
                reject(null);
            });
            this.group.updateValueAndValidity();
        });
    }

    async serialize(validate?: boolean): Promise<any> {
        if (!this.group) return null;
        if (validate) {
            await this.validate();
        }
        return await this.formService.serialize(this.model, this.group);
    }
}
