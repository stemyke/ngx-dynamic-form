import {
    DYNAMIC_FORM_CONTROL_TYPE_EDITOR,
    DynamicFormControlLayout,
    DynamicInputControlModel,
    DynamicInputControlModelConfig,
    serializable
} from "@ng-dynamic-forms/core";

export interface DynamicEditorModelConfig extends DynamicInputControlModelConfig<string | Object> {
    inputType: string;
    convertObject?: boolean;
}

export class DynamicEditorModel extends DynamicInputControlModel<string | Object> {

    @serializable() readonly type: string = DYNAMIC_FORM_CONTROL_TYPE_EDITOR;

    readonly inputType: string;
    readonly convertObject: boolean;

    constructor(config: DynamicEditorModelConfig, layout?: DynamicFormControlLayout) {
        super(config, layout);
        this.inputType = config.inputType || "javascript";
        this.convertObject = config.convertObject !== false;
    }
}
