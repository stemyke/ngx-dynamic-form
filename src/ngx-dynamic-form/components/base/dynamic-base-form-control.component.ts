import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    Output
} from "@angular/core";
import {FormGroup} from "@angular/forms";
import {debounceTime, Subscription} from "rxjs";
import {
    DynamicFormControlComponent,
    DynamicFormControlLayout,
    DynamicFormControlModel,
    DynamicFormLayout,
    DynamicFormLayoutService,
    DynamicFormValidationService
} from "@ng-dynamic-forms/core";

@Component({
    selector: "dynamic-base-form-control",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicBaseFormControlComponent<T extends DynamicFormControlModel> extends DynamicFormControlComponent implements AfterViewInit, OnDestroy {

    @Input() formLayout: DynamicFormLayout;
    @Input() group: FormGroup;
    @Input() layout: DynamicFormControlLayout;
    @Input() model: T;

    @Output() blur: EventEmitter<any>;
    @Output() change: EventEmitter<any>;
    @Output() focus: EventEmitter<any>;

    protected subscription: Subscription;

    constructor(readonly cdr: ChangeDetectorRef, layoutService: DynamicFormLayoutService, validationService: DynamicFormValidationService) {
        super(layoutService, validationService);
        this.blur = new EventEmitter<any>();
        this.change = new EventEmitter<any>();
        this.focus = new EventEmitter<any>();
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

    protected onValueChanged(value: any): void {

    }
}
