import {AfterViewInit, Component, OnDestroy, TemplateRef, Type} from "@angular/core";
import {FieldType as CoreFieldType, ɵobserve as observe} from "@ngx-formly/core";
import {Subject} from "rxjs";
import type {MatFormField, MatFormFieldControl} from "@angular/material/form-field";

import {FormFieldType} from "../../common-types";

@Component({
    standalone: false,
    selector: "dynamic-field-type",
    template: ""
})
export class DynamicFieldType<F extends FormFieldType = FormFieldType> extends CoreFieldType<F> implements AfterViewInit, OnDestroy, MatFormFieldControl<any> {

    stateChanges = new Subject<void>();
    _errorState = false;
    _focused = false;

    ngOnDestroy() {
        delete (this.formField as any)?._control;
        this.stateChanges.complete();
    }

    setDescribedByIds(_ids: string[]): void {
    }

    onContainerClick(_event: MouseEvent): void {
        this.field.focus = true;
        this.stateChanges.next();
    }

    get errorState() {
        const showError = this.options!.showError!(this);
        if (showError !== this._errorState) {
            this._errorState = showError;
            this.stateChanges.next();
        }

        return showError;
    }

    get controlType() {
        if (this.props.type) {
            return this.props.type;
        }

        const type = this.field.type!;
        return type instanceof Type ? type.prototype.constructor.name : type;
    }

    get focused() {
        const focused = !!this.field.focus && !this.disabled;
        if (focused !== this._focused) {
            this._focused = focused;
            this.stateChanges.next();
        }
        return focused;
    }

    get disabled() {
        return !!this.props.disabled;
    }

    get required() {
        return !!this.props.required;
    }

    get placeholder() {
        return this.props.placeholder || "";
    }

    get shouldPlaceholderFloat() {
        return this.shouldLabelFloat;
    }

    get value() {
        return this.formControl?.value;
    }

    set value(value) {
        this.formControl?.patchValue(value);
    }

    get ngControl() {
        return this.formControl as any;
    }

    get empty() {
        return this.value == null || this.value?.length === 0;
    }

    get shouldLabelFloat() {
        return this.focused || !this.empty;
    }

    get formField(): MatFormField {
        return (this.field as any)?.["_formField"];
    }

    ngAfterViewInit() {
        const control = this as MatFormFieldControl<any>;
        if (this.formField && control !== this.formField._control) {
            this.formField._control = control;

            // temporary fix for https://github.com/angular/material2/issues/6728
            const ngControl = control?.ngControl as any;
            if (ngControl?.valueAccessor?.hasOwnProperty("_formField")) {
                ngControl.valueAccessor["_formField"] = this.formField;
            }
            if (ngControl?.valueAccessor?.hasOwnProperty("_parentFormField")) {
                ngControl.valueAccessor["_parentFormField"] = this.formField;
            }

            ["prefix", "suffix", "textPrefix", "textSuffix"].forEach((type) =>
                observe<TemplateRef<any>>(
                    this.field,
                    ["props", type],
                    ({currentValue}) =>
                        currentValue &&
                        Promise.resolve().then(() => {
                            this.options.detectChanges!(this.field);
                        }),
                ),
            );

            // https://github.com/angular/components/issues/16209
            const setDescribedByIds = control.setDescribedByIds.bind(control);
            control.setDescribedByIds = (ids: string[]) => {
                setTimeout(() => setDescribedByIds(ids));
            };
        }
    }
}
