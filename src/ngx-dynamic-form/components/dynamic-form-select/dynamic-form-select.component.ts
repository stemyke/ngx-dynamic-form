import {Component, ViewEncapsulation} from "@angular/core";
import {ObjectUtils, ReflectUtils} from "@stemy/ngx-utils";
import {
    DynamicFormControl,
    FormControlComponent,
    IDynamicFormControl,
    IFormControlOption,
    IFormControlOptions,
    IFormSelectData
} from "../../common-types";

@Component({
    encapsulation: ViewEncapsulation.None,
    selector: "dynamic-form-select",
    templateUrl: "./dynamic-form-select.component.html"
})
export class DynamicFormSelectComponent extends FormControlComponent<IFormSelectData> {

    // Acceptor for provider
    static acceptor(control: DynamicFormControl): boolean {
        return control.type == "select";
    }

    // Loader for provider
    static loader(control: IDynamicFormControl): Promise<any> {
        const data = control.getData<IFormSelectData>();
        if (data.type == "radio" && data.multi) {
            return Promise.reject("Radio group doesn't support multi select!");
        }
        return new Promise<any>(resolve => {
            const getOptions = ReflectUtils.resolve<IFormControlOptions>(data.options, control.form.injector);
            getOptions(control).then(options => {
                if (data.emptyOption) options.unshift({id: null, label: ""});
                control.meta.options = options;
                DynamicFormSelectComponent.fillOptions(control, options);
                resolve(options);
            });
        });
    }

    static fillOptions(control: IDynamicFormControl, options: IFormControlOption[]): void {
        const data = control.getData<IFormSelectData>();
        const selected = control.value;
        if (data.multi || options.length == 0 || options.findIndex(t => t.id == selected) >= 0) return;
        control.setValue(options[0].id);
    }

    onSelectChange(value: any): void {
        const isArray = ObjectUtils.isArray(value);
        const current = this.value;
        if (this.data.multi) {
            if (isArray) {
                this.control.setValue(value);
                return;
            }
            if (ObjectUtils.isArray(current)) {
                this.control.setValue(
                    current.indexOf(value) < 0
                        ? current.concat([value])
                        : current.filter(c => c !== value)
                );
                return;
            }
            this.control.setValue([value]);
            return;
        }
        if (isArray) value = value[0];
        if (current == value) {
            const option = this.meta.options.find(o => o.id !== value);
            value = option ? option.id : null;
        }
        this.control.setValue(value);
    }

    checkValue(option: IFormControlOption): boolean {
        const value = this.value;
        return ObjectUtils.isArray(value) ? value.indexOf(option.id) >= 0 : option.id == value;
    }

    findOption(option: IFormControlOption, index: number, id: string): boolean {
        return option.id == id;
    }
}
