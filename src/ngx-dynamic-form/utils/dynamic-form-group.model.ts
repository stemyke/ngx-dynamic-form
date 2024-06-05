import {
    DynamicFormControlLayout,
    DynamicFormControlModel,
    DynamicFormGroupModel as Base,
    DynamicFormGroupModelConfig as BaseConfig,
} from "@ng-dynamic-forms/core";

export interface DynamicFormFieldSet<T> {
    id: string;
    legend: string;
    fields: T[];
}

export type DynamicFormFieldSets<T> = ReadonlyArray<DynamicFormFieldSet<T>>;

export interface DynamicFormGroupModelConfig extends BaseConfig {
    fieldSets?: DynamicFormFieldSets<string>;
}

export class DynamicFormGroupModel extends Base {

    readonly groups: DynamicFormFieldSets<DynamicFormControlModel>;

    constructor(config: DynamicFormGroupModelConfig, layout?: DynamicFormControlLayout) {
        super(config, layout);
        const controls = [...config.group];
        const groups: DynamicFormFieldSet<DynamicFormControlModel>[] = [];
        const sets = config.fieldSets || [];
        for (const fs of sets) {
            const fields: DynamicFormControlModel[] = [];
            for (const f of fs.fields) {
                const ix = controls.findIndex(c => c.id === f);
                if (ix < 0) continue;
                fields.push(controls.splice(ix, 1)[0]);
            }
            if (fields.length === 0) continue;
            groups.push({id: fs.id, legend: fs.legend, fields});
        }
        if (controls.length > 0) {
            groups.unshift({id: "root-controls", legend: config.legend, fields: controls});
        }
        this.groups = groups;
    }
}
