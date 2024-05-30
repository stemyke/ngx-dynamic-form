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

export function createFormConfig<T extends DynamicFormControlModelConfig>(id: string, config?: T): T {
    config = config || {id} as T;
    config.id = id;
    config.label = ObjectUtils.isNullOrUndefined(config.label) ? id : config.label;
    config.disabled = config.disabled || false;
    config.hidden = config.hidden || false;
    return config;
}

export function createFormCheckbox(id: string, config: DynamicCheckboxModelConfig, layout?: DynamicFormControlLayout): DynamicCheckboxModel {
    config = createFormConfig(id, config);
    config.indeterminate = config.indeterminate || false;
    return new DynamicCheckboxModel(config, layout);
}

export function createFormDate(id: string, config: DynamicDatePickerModel, layout?: DynamicFormControlLayout): DynamicDatePickerModel {
    config = createFormConfig(id, config);
    config.autoFocus = config.autoFocus || false;
    config.focusedDate = config.focusedDate || new Date();
    config.inline = config.inline || false;
    return new DynamicDatePickerModel(config, layout);
}

export function createFormEditor(id: string, config: DynamicEditorModelConfig, layout?: DynamicFormControlLayout): DynamicEditorModel {
    config = createFormConfig(id, config);
    return new DynamicEditorModel(config, layout);
}

export function createFormArray(id: string, config: DynamicFormArrayModelConfig, layout?: DynamicFormControlLayout): DynamicFormArrayModel {
    config = createFormConfig(id, config);
    return new DynamicFormArrayModel(config, layout);
}

export function createFormGroup(id: string, config: DynamicFormGroupModelConfig, layout?: DynamicFormControlLayout): DynamicFormGroupModel {
    config = createFormConfig(id, config);
    config.name = config.name || "";
    return new DynamicFormGroupModel(config, layout);
}

export function createFormInput(id: string, config: DynamicInputModelConfig, type: string = "text", layout?: DynamicFormControlLayout): DynamicInputModel {
    config = createFormConfig(id, config);
    config.inputType = config.inputType || type;
    config.placeholder = config.placeholder || (config.inputType == "mask" ? "_" : "");
    config.step = config.step || 1;
    config.mask = config.mask || null;
    return new DynamicInputModel(config, layout);
}

export function createFormSelect<T = any>(id: string, config: DynamicSelectModelConfig<T>, layout?: DynamicFormControlLayout): DynamicSelectModel<T> {
    config = createFormConfig(id, config);
    config.options = config.options || [];
    return new DynamicSelectModel(config, layout);
}

export function createFormTextarea(id: string, config: DynamicTextAreaModelConfig, layout?: DynamicFormControlLayout): DynamicTextAreaModel {
    config = createFormConfig(id, config);
    config.cols = config.cols || 10;
    config.rows = config.rows || 3;
    config.wrap = config.wrap || "soft";
    return new DynamicTextAreaModel(config, layout);
}

export function createFormFile(id: string, config: DynamicFileUploadModelConfig, layout?: DynamicFormControlLayout): DynamicFileUploadModel {
    config = createFormConfig(id, config);
    config.accept = config.accept || ["jpg", "jpeg", "png"];
    config.multiple = config.multiple || false;
    config.url = ObjectUtils.isString(config.url) ? config.url : "assets";
    return new DynamicFileUploadModel(config, layout);
}
