import {
    DynamicFormArrayModel as Base,
    DynamicFormArrayModelConfig as ConfigBase,
    DynamicFormControlLayout
} from "@ng-dynamic-forms/core";

export interface DynamicFormArrayModelConfig extends ConfigBase {
    additional?: {[key: string]: any};
}

export class DynamicFormArrayModel extends Base {

    readonly additional: {[key: string]: any};

    constructor(config: DynamicFormArrayModelConfig, layout?: DynamicFormControlLayout) {
        super(config, layout);
        this.additional = config.additional || {};
    }
}
