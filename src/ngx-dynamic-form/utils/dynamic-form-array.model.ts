import {Injector} from "@angular/core";
import {FormArray} from "@angular/forms";
import {
    DynamicFormArrayModel as Base,
    DynamicFormArrayModelConfig as ConfigBase,
    DynamicFormControlLayout
} from "@ng-dynamic-forms/core";
import {ObjectUtils} from "@stemy/ngx-utils";

export type SaveTabFunc = (index: number, model: DynamicFormArrayModel, injector: Injector) => void;
export type RestoreTabFunc = (model: DynamicFormArrayModel, injector: Injector) => number;
export type TabLabelFunc = (index: number, model: DynamicFormArrayModel, array: FormArray, injector: Injector) => string;

export interface DynamicFormArrayModelConfig extends ConfigBase {
    useTabs?: boolean;
    saveTab?: SaveTabFunc;
    restoreTab?: RestoreTabFunc;
    getTabLabel?: TabLabelFunc;
    additional?: { [key: string]: any };
}

export class DynamicFormArrayModel extends Base {

    readonly useTabs: boolean;
    readonly saveTab: SaveTabFunc;
    readonly restoreTab: RestoreTabFunc;
    readonly getTabLabel: TabLabelFunc;
    readonly additional: { [key: string]: any };

    tabIndex: number

    constructor(config: DynamicFormArrayModelConfig, layout?: DynamicFormControlLayout) {
        super(config, layout);
        this.useTabs = config.useTabs || false;
        this.saveTab = ObjectUtils.isFunction(config.saveTab) ? config.saveTab : ((index, model) => {
            model.tabIndex = index;
        });
        this.restoreTab = ObjectUtils.isFunction(config.restoreTab) ? config.restoreTab : ((model) => {
            return model.tabIndex;
        });
        this.getTabLabel = ObjectUtils.isFunction(config.getTabLabel) ? config.getTabLabel : ((index) => {
            return `${index + 1}`;
        });
        this.additional = config.additional || {};
    }
}
