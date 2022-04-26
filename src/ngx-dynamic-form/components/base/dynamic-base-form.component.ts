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
    ViewChild,
    ViewChildren
} from "@angular/core";
import {FormArray, FormGroup, NgForm} from "@angular/forms";
import {Subscription} from "rxjs";
import {first} from "rxjs/operators";
import {
    DynamicFormArrayModel,
    DynamicFormComponent,
    DynamicFormComponentService,
    DynamicFormControlEvent,
    DynamicFormControlModel,
    DynamicFormGroupModel,
    DynamicFormLayout,
    DynamicFormModel,
    DynamicTemplateDirective
} from "@ng-dynamic-forms/core";
import {EventsService, ObservableUtils} from "@stemy/ngx-utils";
import {DynamicFormState, IDynamicForm, IDynamicFormBase} from "../../common-types";
import {DynamicFormService} from "../../services/dynamic-form.service";
import {collectPathAble} from "../../utils/misc";

@Component({
    selector: "dynamic-base-form",
    template: "",
    changeDetection: ChangeDetectionStrategy.Default
})
export class DynamicBaseFormComponent extends DynamicFormComponent implements OnChanges, AfterViewInit, IDynamicForm {

    @Input() group: FormGroup;
    @Input() model: DynamicFormModel;
    @Input() layout: DynamicFormLayout;
    @Input() labelPrefix: string;

    @Output() blur: EventEmitter<DynamicFormControlEvent>;
    @Output() change: EventEmitter<DynamicFormControlEvent>;
    @Output() focus: EventEmitter<DynamicFormControlEvent>;

    @ContentChildren(DynamicTemplateDirective) contentTemplates: QueryList<DynamicTemplateDirective>;
    @ViewChildren(DynamicTemplateDirective) viewTemplates: QueryList<DynamicTemplateDirective>;

    get status(): DynamicFormState {
        return !this.group ? null : this.group.status as DynamicFormState;
    }

    @Output() readonly onStatusChange: EventEmitter<IDynamicFormBase>;
    @Output() readonly onValueChange: EventEmitter<IDynamicFormBase>;
    @Output() readonly onSubmit: EventEmitter<IDynamicFormBase>;

    @ViewChild(NgForm)
    protected ngForm: NgForm;
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
        this.onStatusChange = new EventEmitter<IDynamicFormBase>();
        this.onValueChange = new EventEmitter<IDynamicFormBase>();
        this.onSubmit = new EventEmitter<IDynamicFormBase>();
        this.templates = new QueryList<DynamicTemplateDirective>();
        this.subscription = new Subscription();
        this.groupSubscription = new Subscription();
        this.labelPrefix = "label";
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.groupSubscription.unsubscribe();
        if (this.group) {
            this.groupSubscription = ObservableUtils.multiSubscription(
                this.group.statusChanges.subscribe(() => {
                    this.onStatusChange.emit(this);
                }),
                this.group.valueChanges.subscribe(() => {
                    this.onValueChange.emit(this);
                    this.formService.notifyChanges(this.model, this.group);
                })
            );
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
                this.formService.detectChanges(this)
            }),
            this.ngForm.ngSubmit.subscribe(() => {
                this.onSubmit.emit(this);
            })
        );
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
        this.subscription.unsubscribe();
        this.groupSubscription.unsubscribe();
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
