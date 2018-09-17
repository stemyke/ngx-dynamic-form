import {Component, Input, OnChanges, SimpleChanges} from "@angular/core";
import {isNullOrUndefined} from "util";
import {getFormControl, getFormFieldSets} from "../../dynamic-form.decorators";
import {IDynamicForm, IDynamicFormFieldSets, IFormControl, IFormFieldSet} from "../../dynamic-form.types";
import {DynamicFormService} from "../../services/dynamic-form.service";

@Component({
    moduleId: module.id,
    selector: "dynamic-form",
    templateUrl: "./dynamic-form.component.html"
})
export class DynamicFormComponent implements IDynamicForm, OnChanges {

    @Input() name: string;
    @Input() controls: IFormControl[];
    @Input() fieldSets: IFormFieldSet[];
    @Input() data: any;
    @Input() readonly: boolean;
    @Input() validateOnBlur: boolean;

    prefix: string;
    formControls: IFormControl[];
    formFieldSets: IDynamicFormFieldSets;
    defaultFieldSet: IFormFieldSet;

    constructor(private formService: DynamicFormService) {
        this.name = "label";
        this.prefix = "label.";
        this.formControls = [];
        this.formFieldSets = {};
        this.defaultFieldSet = {
            id: "",
            title: "",
            classes: ""
        };
    }

    ngOnChanges(changes: SimpleChanges): void {
        if ((!changes.data && !changes.controls)) return;
        this.init();
    }

    private init(): void {
        this.prefix = this.name ? `${this.name}.` : "";
        if (!this.data) return;
        this.formControls = this.controls || Object.keys(this.data).map(propertyKey => {
            return getFormControl(this.data, propertyKey);
        }).filter(c => !isNullOrUndefined(c));
        this.formFieldSets = this.fieldSets ? this.fieldSets.reduce((result, fs) => {
            result[fs.id] = fs;
            return result;
        }, {}) : getFormFieldSets(Object.getPrototypeOf(this.data).constructor);
    }
}
