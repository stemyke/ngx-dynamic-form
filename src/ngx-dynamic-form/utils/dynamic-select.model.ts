import {Injector} from "@angular/core";
import {FormControl} from "@angular/forms";
import {isObservable, map, Observable, of} from "rxjs";
import {ObjectUtils} from "@stemy/ngx-utils";
import {
    DynamicFormControlLayout,
    DynamicFormOption as BaseOption,
    DynamicFormOptionConfig as BaseOptionConfig,
    DynamicSelectModel as Base,
    DynamicSelectModelConfig as BaseConfig,
} from "@ng-dynamic-forms/core";

const ignoredKeys = ["disabled", "label", "value", "classes"];

export interface DynamicFormOptionConfig<T> extends BaseOptionConfig<T> {
    classes?: string;

    [key: string]: any;
}

export class DynamicFormOption<T> extends BaseOption<T> {

    readonly classes: string;
    readonly props: any;

    constructor(config: DynamicFormOptionConfig<T>) {
        super(config);
        this.classes = config.classes || "";
        this.props = Object.keys(config).reduce((res, k) => {
            if (ignoredKeys.indexOf(k) >= 0) return res;
            res[k] = config[k];
            return res;
        }, {});
    }
}

export interface DynamicFormOptionGroup<T> {
    group: string;
    options: ReadonlyArray<DynamicFormOption<T>>;
}

export type OptionClassesFunc<T> = (option: DynamicFormOptionConfig<T>, model: DynamicSelectModel<T>, control: FormControl, injector: Injector) => string;

export interface DynamicSelectModelConfig<T> extends BaseConfig<T> {
    groupBy?: string;
    inline?: boolean;
    options?: DynamicFormOptionConfig<T>[] | Observable<DynamicFormOptionConfig<T>[]>;
    getClasses?: OptionClassesFunc<T>;
}

export class DynamicSelectModel<T> extends Base<T> {

    readonly groupBy: string;
    readonly inline: boolean;
    readonly getClasses: OptionClassesFunc<T>;

    options$: Observable<DynamicFormOption<T>[]>;

    protected mOptions: DynamicFormOption<T>[];

    constructor(config: DynamicSelectModelConfig<T>, layout?: DynamicFormControlLayout) {
        super(config, layout);
        this.groupBy = config.groupBy || null;
        this.inline = config.inline || false;
        this.getClasses = ObjectUtils.isFunction(config.getClasses) ? config.getClasses : (() => "");
        this.mOptions = this.mOptions || [];
    }

    protected updateOptions(): void {
        this.options$ = of(this.mOptions);
    }

    set options(options: any) {
        if (Array.isArray(options)) {
            this.mOptions = (options as DynamicFormOptionConfig<T>[]).map(optionConfig => new DynamicFormOption<T>(optionConfig));
            this.updateOptions();
        } else if (isObservable(options)) {
            this.options$ = (options as Observable<DynamicFormOptionConfig<T>[]>).pipe(
                map(optionsConfig => {
                    this.mOptions = optionsConfig.map(optionConfig => new DynamicFormOption<T>(optionConfig));
                    return this.mOptions;
                }));
        } else {
            this.updateOptions();
        }
    }

    get options(): ReadonlyArray<DynamicFormOption<T>> {
        return this.mOptions;
    }

    insert(index: number, optionConfig: DynamicFormOptionConfig<T>): DynamicFormOption<T> {
        const option = new DynamicFormOption(optionConfig);
        this.mOptions.splice(index, 0, option);
        this.updateOptions();
        return option;
    }

    remove(...indices: number[]): void {
        indices.forEach(index => this.mOptions.splice(index, 1));
        this.updateOptions();
    }
}
