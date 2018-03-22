import {Component, Input, OnChanges, SimpleChanges} from "@angular/core";
import {getFormControl} from "../../dynamic-form.decorators";
import {IDynamicFormFieldSets, IFormControl, IFormFieldSet} from "../../dynamic-form.types";
import {isNullOrUndefined} from "util";
import {DynamicFormService} from "../../services/dynamic-form.service";

@Component({
    moduleId: module.id,
    selector: "dynamic-form",
    templateUrl: "./dynamic-form.component.html"
})
export class DynamicFormComponent implements OnChanges {

    @Input() name: string;
    @Input() controls: IFormControl[];
    @Input() data: any;
    @Input() readonly: boolean;
    @Input() validateOnBlur: boolean;

    prefix: string;
    formControls: IFormControl[];
    fieldSets: IDynamicFormFieldSets;
    defaultFieldSet: IFormFieldSet;

    constructor(private formService: DynamicFormService) {
        this.name = "label";
        this.prefix = "label.";
        this.fieldSets = {};
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
    }
}
