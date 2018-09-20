import {Component, Injector, Input, OnChanges, SimpleChanges} from "@angular/core";
import {
    FormControlValidator,
    IDynamicForm,
    IDynamicFormControlHandler,
    IFormControl,
    IFormControlData,
    IFormControlProvider
} from "../../dynamic-form.types";
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

    get isHidden(): boolean {
        return this.hidden;
    }

    get data(): IFormControlData {
        return this.control ? this.control.data : null;
    }

    private validator: () => Promise<string[]>;
    private readonly: boolean;
    private hidden: boolean;

    constructor(private injector: Injector, private forms: DynamicFormService) {
        this.meta = {};
        this.errors = [];
        this.validator = () => Promise.resolve([]);
    }

    // --- IDynamicFormControlHandler ---

    ngOnChanges(changes: SimpleChanges): void {
        this.provider = this.forms.findProvider(this.control);
        this.validator = this.createValidator();
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
        return Promise.resolve();
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
        return (): Promise<string[]> => {
            return new Promise<string[]>((resolve) => {
                const validate = validators.map(v => v(this.form, this.control));
                Promise.all(validate).then(results => {
                    resolve(results.filter(error => ObjectUtils.isString(error) && error.length > 0));
                });
            });
        }
    }
}
