import {Component, HostBinding, Injector, Input, OnChanges, SimpleChanges} from "@angular/core";
import {
    FormControlTester,
    FormControlValidator,
    IDynamicForm,
    IDynamicFormControlHandler,
    IFormControl,
    IFormControlData,
    IFormControlProvider
} from "../../common-types";
import {DynamicFormService} from "../../services/dynamic-form.service";
import {ObjectUtils, ReflectUtils} from "@stemy/ngx-utils";

@Component({
    moduleId: module.id,
    selector: "[dynamic-form-control]",
    templateUrl: "./dynamic-form-control.component.html"
})
export class DynamicFormControlComponent implements OnChanges, IDynamicFormControlHandler {

    @Input("dynamic-form-control") control: IFormControl;
    @Input() form: IDynamicForm;

    provider: IFormControlProvider;
    meta: any;
    errors: string[];

    get handler(): IDynamicFormControlHandler {
        return this;
    }

    get hasErrors(): boolean {
        return this.errors.length > 0;
    }

    get isValid(): boolean {
        return this.errors.length == 0;
    }

    get isReadOnly(): boolean {
        return this.readonly;
    }

    get isVisible(): boolean {
        return this.visible;
    }

    @HostBinding("class.hidden")
    get isHidden(): boolean {
        return !this.visible;
    }

    get data(): IFormControlData {
        return this.control ? this.control.data : null;
    }

    private validator: () => Promise<string[]>;
    private readonlyTester: () => Promise<boolean>;
    private hideTester: () => Promise<boolean>;

    private readonly: boolean;
    private visible: boolean;

    constructor(private injector: Injector, private forms: DynamicFormService) {
        this.meta = {};
        this.errors = [];
        this.validator = () => Promise.resolve([]);
    }

    // --- IDynamicFormControlHandler ---

    ngOnChanges(changes: SimpleChanges): void {
        this.provider = this.forms.findProvider(this.control);
        this.validator = this.createValidator();
        this.readonlyTester = this.createTester("readonly");
        this.hideTester = this.createTester("hidden");
    }

    onValueChange(value: any): void {
        this.form.data[this.control.id] = value;
        this.form.emitChange(this);
    }

    onFocus(): void {
        this.errors.length = 0;
    }

    onBlur(): void {
        if (!this.form.validateOnBlur) return;
        this.form.validate().catch(() => {
        });
    }

    // --- Custom ---

    load(): Promise<any> {
        return !this.provider ? Promise.resolve() : this.provider.loader(this.control, this.form, this.meta);
    }

    check(): Promise<any> {
        return new Promise<any>(resolve => {
            this.readonlyTester().then(readonly => {
                this.readonly = readonly;
                this.hideTester().then(hide => {
                    this.visible = !hide;
                    resolve();
                });
            });
        });
    }

    validate(clearErrors?: boolean): Promise<boolean> {
        return this.validator().then(errors => {
            this.errors = clearErrors ? [] : errors;
            return errors.length == 0;
        });
    }

    private createValidator(): () => Promise<string[]> {
        const validators = [this.data.validator].concat(this.data.validators).filter(ObjectUtils.isDefined).map(v => {
            return ReflectUtils.resolve<FormControlValidator>(v, this.injector);
        });
        return () => new Promise<string[]>((resolve) => {
            const validate = validators.map(v => v(this.control, this.form));
            Promise.all(validate).then(results => {
                resolve(results.filter(error => ObjectUtils.isString(error) && error.length > 0));
            });
        });
    }

    private createTester(test: string): () => Promise<boolean> {
        const tester = this.control.data[test]
            ? ReflectUtils.resolve<FormControlTester>(this.control.data[test], this.injector)
            : () => Promise.resolve(false);
        return (): Promise<boolean> => tester(this.control, this.form);
    }
}
