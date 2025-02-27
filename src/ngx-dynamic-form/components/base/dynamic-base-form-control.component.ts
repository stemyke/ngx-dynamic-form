import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Injector,
    Input,
    OnDestroy, Optional,
    Output
} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {Subscription} from "rxjs";
import {debounceTime} from "rxjs/operators";
import {
    DynamicFormControlComponent,
    DynamicFormControlLayout,
    DynamicFormControlModel,
    DynamicFormLayout,
    DynamicFormLayoutService,
    DynamicFormValidationService
} from "@ng-dynamic-forms/core";
import {DynamicFormComponent} from "../form/dynamic-form.component";

@Component({
    standalone: false,
    selector: "dynamic-base-form-control",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicBaseFormControlComponent<T extends DynamicFormControlModel> extends DynamicFormControlComponent implements AfterViewInit, OnDestroy {

    @Input() formLayout: DynamicFormLayout = null;
    @Input() group: FormGroup = null;
    @Input() layout: DynamicFormControlLayout = null;
    @Input() model: T = null;

    @Output() blur: EventEmitter<any> = new EventEmitter<any>();
    @Output() change: EventEmitter<any> = new EventEmitter<any>();
    @Output() focus: EventEmitter<any> = new EventEmitter<any>();

    protected subscription: Subscription;

    constructor(layoutService: DynamicFormLayoutService, validationService: DynamicFormValidationService,
                @Optional() readonly form: DynamicFormComponent,
                readonly injector: Injector,
                readonly cdr: ChangeDetectorRef) {
        super(layoutService, validationService);
    }

    ngAfterViewInit(): void {
        this.subscription = this.control.valueChanges.pipe(debounceTime(500)).subscribe(value => {
            this.onValueChanged(value);
        });
    }

    ngOnDestroy(): void {
        if (!this.subscription) return;
        this.subscription.unsubscribe();
    }

    submit(): void {
        this.form?.submit();
    }

    protected onValueChanged(value: any): void {

    }
}
