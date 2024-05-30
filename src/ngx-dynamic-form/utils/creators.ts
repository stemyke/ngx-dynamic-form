import {
    DynamicCheckboxModel,
    DynamicCheckboxModelConfig,
    DynamicDatePickerModel,
    DynamicFileUploadModel,
    DynamicFileUploadModelConfig,
    DynamicFormControlLayout,
    DynamicFormControlModelConfig,
    DynamicFormGroupModel,
    DynamicFormGroupModelConfig,
    DynamicInputModel,
    DynamicInputModelConfig,
    DynamicTextAreaModel,
    DynamicTextAreaModelConfig
} from "@ng-dynamic-forms/core";
import {ObjectUtils} from "@stemy/ngx-utils";
import {DynamicEditorModel, DynamicEditorModelConfig} from "./dynamic-editor.model";
import {DynamicFormArrayModel, DynamicFormArrayModelConfig} from "./dynamic-form-array.model";
import {DynamicSelectModelConfig, DynamicSelectModel} from "./dynamic-select.model";

export type OmitId<T extends DynamicFormControlModelConfig> = Omit<T, "id">;

export type AddId<T extends OmitId<DynamicFormControlModelConfig>> = T extends OmitId<(infer U)> ? U : never;

export function createFormConfig<T extends DynamicFormControlModelConfig, U extends OmitId<T>>(id: string, config?: U): AddId<U> {
    const res = (config || {id}) as AddId<U>;
    res.id = id;
    res.label = ObjectUtils.isNullOrUndefined(config.label) ? id : config.label;
    res.disabled = config.disabled || false;
    res.hidden = config.hidden || false;
    return res;
}

export function createFormCheckbox(id: string, config: OmitId<DynamicCheckboxModelConfig>, layout?: DynamicFormControlLayout): DynamicCheckboxModel {
    const res = createFormConfig(id, config);
    res.indeterminate = config.indeterminate || false;
    return new DynamicCheckboxModel(res, layout);
}

export function createFormDate(id: string, config: OmitId<DynamicDatePickerModel>, layout?: DynamicFormControlLayout): DynamicDatePickerModel {
    const res = createFormConfig(id, config);
    res.autoFocus = config.autoFocus || false;
    res.focusedDate = config.focusedDate || new Date();
    res.inline = config.inline || false;
    return new DynamicDatePickerModel(res, layout);
}

export function createFormEditor(id: string, config: OmitId<DynamicEditorModelConfig>, layout?: DynamicFormControlLayout): DynamicEditorModel {
    const res = createFormConfig(id, config);
    return new DynamicEditorModel(res, layout);
}

export function createFormArray(id: string, config: OmitId<DynamicFormArrayModelConfig>, layout?: DynamicFormControlLayout): DynamicFormArrayModel {
    const res = createFormConfig(id, config);
    return new DynamicFormArrayModel(res, layout);
}

export function createFormGroup(id: string, config: OmitId<DynamicFormGroupModelConfig>, layout?: DynamicFormControlLayout): DynamicFormGroupModel {
    const res = createFormConfig(id, config);
    res.name = config.name || "";
    return new DynamicFormGroupModel(res, layout);
}

export function createFormInput(id: string, config: OmitId<DynamicInputModelConfig>, type: string = "text", layout?: DynamicFormControlLayout): DynamicInputModel {
    const res = createFormConfig(id, config);
    res.inputType = config.inputType || type;
    res.placeholder = config.placeholder || (config.inputType == "mask" ? "_" : "");
    res.step = config.step || 1;
    res.mask = config.mask || null;
    return new DynamicInputModel(res, layout);
}

export function createFormSelect<T = any>(id: string, config: OmitId<DynamicSelectModelConfig<T>>, layout?: DynamicFormControlLayout): DynamicSelectModel<T> {
    const res = createFormConfig(id, config);
    res.options = config.options || [];
    return new DynamicSelectModel(res, layout);
}

export function createFormTextarea(id: string, config: OmitId<DynamicTextAreaModelConfig>, layout?: DynamicFormControlLayout): DynamicTextAreaModel {
    const res = createFormConfig(id, config);
    res.cols = config.cols || 10;
    res.rows = config.rows || 3;
    res.wrap = config.wrap || "soft";
    return new DynamicTextAreaModel(res, layout);
}

export function createFormFile(id: string, config: OmitId<DynamicFileUploadModelConfig>, layout?: DynamicFormControlLayout): DynamicFileUploadModel {
    const res = createFormConfig(id, config);
    res.accept = config.accept || ["jpg", "jpeg", "png"];
    res.multiple = config.multiple || false;
    res.url = ObjectUtils.isString(config.url) ? config.url : "assets";
    return new DynamicFileUploadModel(res, layout);
}
