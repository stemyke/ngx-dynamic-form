import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from "@angular/core";
import {FormGroup} from "@angular/forms";
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
export class DynamicBaseFormControlComponent<T extends DynamicFormControlModel> extends DynamicFormControlComponent {

    @Input() formLayout: DynamicFormLayout;
    @Input() group: FormGroup;
    @Input() layout: DynamicFormControlLayout;
    @Input() model: T;

    @Output() blur: EventEmitter<any>;
    @Output() change: EventEmitter<any>;
    @Output() focus: EventEmitter<any>;

    constructor(layoutService: DynamicFormLayoutService, validationService: DynamicFormValidationService) {
        super(layoutService, validationService);
        this.blur = new EventEmitter<any>();
        this.change = new EventEmitter<any>();
        this.focus = new EventEmitter<any>();
    }
}
