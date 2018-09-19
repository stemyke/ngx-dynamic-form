import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    Injector,
    Input,
    OnChanges,
    OnDestroy,
    QueryList,
    SimpleChanges,
    ViewChildren
} from "@angular/core";
import {Subscription} from "rxjs";
import {ObjectUtils, UniqueUtils} from "@stemy/ngx-utils";
import {getFormControl, getFormFieldSets} from "../../dynamic-form.decorators";
import {IDynamicForm, IDynamicFormFieldSets, IFormControl, IFormFieldSet} from "../../dynamic-form.types";
import {DynamicFormControlComponent} from "../dynamic-form-control/dynamic-form-control.component";

@Component({
    moduleId: module.id,
    selector: "dynamic-form",
    templateUrl: "./dynamic-form.component.html"
})
export class DynamicFormComponent implements IDynamicForm, AfterViewInit, OnChanges, OnDestroy {

    @Input() name: string;
    @Input() controls: IFormControl[];
    @Input() fieldSets: IFormFieldSet[];
    @Input() data: any;
    @Input() readonly: boolean;
    @Input() validateOnBlur: boolean;

    id: any;
    prefix: string;
    injector: Injector;
    formControls: IFormControl[];
    formFieldSets: IDynamicFormFieldSets;
    defaultFieldSet: IFormFieldSet;

    get isLoading(): boolean {
        return this.loading;
    }

    @ViewChildren(DynamicFormControlComponent)
    private controlComponents: QueryList<DynamicFormControlComponent>;
    private controlChanges: Subscription;

    private initialized: boolean;
    private loading: boolean;

    constructor(public cdr: ChangeDetectorRef, injector: Injector) {
        this.name = "label";
        this.id = UniqueUtils.uuid();
        this.prefix = "label.";
        this.injector = injector;
        this.formControls = [];
        this.formFieldSets = {};
        this.defaultFieldSet = {
            id: "",
            title: "",
            classes: ""
        };
        this.initialized = false;
        this.loading = true;
    }

    ngAfterViewInit(): void {
        this.controlChanges = this.controlComponents.changes.subscribe(() => this.reloadControls());
        this.reloadControls();
    }

    ngOnDestroy(): void {
        this.controlChanges.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.data || changes.controls) {
            this.initialized = false;
            this.formControls = this.controls || Object.keys(this.data).map(propertyKey => {
                return getFormControl(this.data, propertyKey);
            }).filter(c => !ObjectUtils.isNullOrUndefined(c));
            this.formFieldSets = this.fieldSets ? this.fieldSets.reduce((result, fs) => {
                result[fs.id] = fs;
                return result;
            }, {}) : getFormFieldSets(Object.getPrototypeOf(this.data).constructor);
        }
        this.prefix = this.name ? `${this.name}.` : "";
    }

    reloadControls(): void {
        if (!this.controlComponents) return;
        this.loading = true;
        const promises = this.controlComponents.map(t => t.load());
        Promise.all(promises).then(() => {
            this.initialized = true;
            this.loading = false;
            this.cdr.detectChanges();
        });
    }
}
