import {AfterContentInit, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges} from "@angular/core";
import {first} from "rxjs/operators";
import {ObjectUtils, UniqueUtils} from "@stemy/ngx-utils";
import {
    DynamicFormGroup, DynamicFormState, getFormFieldSets, IDynamicForm, IDynamicFormControl, IDynamicFormFieldSets,
    IFormControl, IFormFieldSet, IFormSerializers
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

    @Input() formGroup: DynamicFormGroup;
    @Input() serializers: IFormSerializers;
    @Input() controls: IFormControl[];
    @Input() fieldSets: IFormFieldSet[];
    @Input() data: any;

    id: any;
    prefix: string;

    formFieldSets: IDynamicFormFieldSets;
    defaultFieldSet: IFormFieldSet;

    get status(): DynamicFormState {
        return this.formGroup.state;
    }

    get formControls(): IDynamicFormControl[] {
        return this.formGroup.formControls;
    }

    constructor(cdr: ChangeDetectorRef, forms: DynamicFormService) {
        super(cdr, forms);
        this.id = UniqueUtils.uuid();
        this.prefix = "";
        this.formGroup = new DynamicFormGroup(this);
        this.formFieldSets = {};
        this.defaultFieldSet = {
            id: "",
            title: "",
            classes: ""
        };
    }

    // --- Lifecycle hooks

    ngOnChanges(changes: SimpleChanges): void {
        this.prefix = this.name ? `${this.name}.` : "";
        if (ObjectUtils.isObject(this.data) && (changes.data || changes.controls || changes.formGroup)) {
            this.formFieldSets = this.fieldSets ? this.fieldSets.reduce((result, fs) => {
                result[fs.id] = fs;
                return result;
            }, {}) : getFormFieldSets(Object.getPrototypeOf(this.data).constructor);
            if (this.formGroup.id) return;
            this.formGroup.setFormControls(this.data, this.controls, this.serializers);
            this.formGroup.reloadControls();
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
            this.formGroup.statusChanges.pipe(first(status => status == "VALID" || status == "INVALID")).subscribe(status => {
                if (showErrors) this.formGroup.showErrors();
                if (status == "VALID") {
                    resolve(null);
                    return;
                }
                reject(null);
            });
            this.formGroup.updateValueAndValidity();
        });
    }

    serialize(validate?: boolean): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const serialize = () => {
                this.formGroup.serialize().then(resolve);
            };
            if (validate) {
                this.validate().then(serialize, reject);
                return;
            }
            serialize();
        });
    }

    getControl(id: string): IDynamicFormControl {
        return this.formGroup.getControl(id);
    }
}
