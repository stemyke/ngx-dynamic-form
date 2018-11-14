import {Component, HostBinding, Inject} from "@angular/core";
import {ILanguageService, ITranslation, LANGUAGE_SERVICE, ObjectUtils} from "@stemy/ngx-utils";
import {DynamicFormControl, FormControlComponent, IFormInputData} from "../../common-types";

@Component({
    moduleId: module.id,
    selector: "dynamic-form-input",
    templateUrl: "./dynamic-form-input.component.html"
})
export class DynamicFormInputComponent extends FormControlComponent<IFormInputData> {

    // Acceptor for provider
    static acceptor(control: DynamicFormControl): boolean {
        return control.type == "input";
    }

    // Loader for provider
    static loader(): Promise<any> {
        return Promise.resolve();
    }

    @HostBinding("class.checked")
    get isChecked(): boolean {
        return this.data.type == "checkbox" && this.value;
    }

    constructor(@Inject(LANGUAGE_SERVICE) private language: ILanguageService) {
        super();
    }

    onDateChange(value: string): void {
        const date = new Date(value);
        const dateValue = <number>date.valueOf();
        if (isNaN(dateValue) || dateValue < -30610224000000) return;
        this.control.setValue(date)
    }

    onMaskChange(value: string): void {
        value = ObjectUtils.isFunction(this.data.unmask) ? this.data.unmask(value) : value;
        this.control.setValue(value)
    }

    onTextChange(value: string): void {
        if (!this.data.useLanguage) {
            this.control.setValue(value);
            return;
        }
        const translations: ITranslation[] = ObjectUtils.isArray(this.value) ? Array.from(this.value) : [];
        const translation = translations.find(t => t.lang == this.language.editLanguage);
        if (translation) {
            translation.translation = value;
        } else {
            translations.push({
                lang: this.language.editLanguage,
                translation: value
            });
        }
        this.control.setValue(translations);
    }

    onNumberBlur(): void {
        const value = this.value;
        if (ObjectUtils.isNumber(this.data.max) && this.data.max < value) {
            this.control.setValue(this.data.max);
        } else if (ObjectUtils.isNumber(this.data.min) && this.data.min > value) {
            this.control.setValue(this.data.min);
        }
        this.control.onBlur();
    }
}
