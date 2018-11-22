import {AfterContentInit, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges} from "@angular/core";
import {first} from "rxjs/operators";
import {
    DynamicFormGroup,
    DynamicFormState,
    IDynamicForm,
    IDynamicFormControl,
    IFormControl,
    IFormFieldSet,
    IFormSerializers
} from "../../common-types";
import {DynamicFormService} from "../../services/dynamic-form.service";
import {DynamicFormBaseComponent} from "../base/dynamic-form-base.component";

@Component({
    moduleId: module.id,
    selector: "dynamic-form, [dynamic-form]",
    templateUrl: "./dynamic-form.component.html",
    providers: [{provide: DynamicFormBaseComponent, useExisting: DynamicFormComponent}]
})
export class DynamicFormComponent extends DynamicFormBaseComponent implements IDynamicForm, AfterContentInit, OnChanges {

    @Input() group: DynamicFormGroup;
    @Input() controls: IFormControl[];
    @Input() serializers: IFormSerializers;
    @Input() fieldSets: IFormFieldSet[];
    @Input() data: any;

    defaultFieldSet: IFormFieldSet;

    get status(): DynamicFormState {
        return this.group.state;
    }

    get formControls(): IDynamicFormControl[] {
        return this.group.formControls;
    }

    constructor(cdr: ChangeDetectorRef, forms: DynamicFormService) {
        super(cdr, forms);
        this.group = new DynamicFormGroup(this);
        this.defaultFieldSet = {
            id: "",
            title: "",
            classes: ""
        };
    }

    // --- Lifecycle hooks

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.data) return;
        if (changes.data || changes.controls || changes.serializers || changes.formGroup) {
            if (this.group.id) return;
            this.group.setup(this.data, this);
            this.group.reloadControls();
        }
    }

    // --- Custom ---

    onFormSubmit(): void {
        const root = this.root;
        root.validate().then(() => root.onSubmit.emit(this), () => {});
    }

    // --- IDynamicForm ---

    validate(showErrors: boolean = true): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.group.statusChanges.pipe(first(status => status == "VALID" || status == "INVALID")).subscribe(status => {
                if (showErrors) this.group.showErrors();
                if (status == "VALID") {
                    resolve(null);
                    return;
                }
                reject(null);
            });
            this.group.updateValueAndValidity();
        });
    }

    serialize(validate?: boolean): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const serialize = () => {
                this.group.serialize().then(resolve);
            };
            if (validate) {
                this.validate().then(serialize, reject);
                return;
            }
            serialize();
        });
    }

    getControl(id: string): IDynamicFormControl {
        return this.group.getControl(id);
    }
}
