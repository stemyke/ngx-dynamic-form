import {ChangeDetectorRef, Injector} from "@angular/core";
import {FormArray} from "@angular/forms";
import {BehaviorSubject} from "rxjs";
import {
    DynamicFormArrayGroupModel as GroupBase,
    DynamicFormArrayModel as Base,
    DynamicFormArrayModelConfig as ConfigBase,
    DynamicFormControlLayout,
    DynamicFormModel
} from "@ng-dynamic-forms/core";
import {ITimer, ObjectUtils, TimerUtils} from "@stemy/ngx-utils";

export type SaveTabFunc = (index: number, model: DynamicFormArrayGroupModel, arrayModel: DynamicFormArrayModel, injector: Injector) => void;
export type RestoreTabFunc = (arrayModel: DynamicFormArrayModel, injector: Injector) => number;
export type TabLabelFunc = (index: number, model: DynamicFormArrayGroupModel, arrayModel: DynamicFormArrayModel, array: FormArray, injector: Injector) => string;

export class DynamicFormArrayGroupModel extends GroupBase {

    get hidden(): boolean {
        return this.isHidden;
    }

    set hidden(value: boolean) {
        if (this.isHidden == value) return;
        this.isHidden = value || false;
        this.context?.filterGroups();
    }

    protected isHidden: boolean;

    constructor(readonly context: DynamicFormArrayModel, group: DynamicFormModel, index: number = -1) {
        super(context, group, index);
        this.isHidden = false;
    }
}

export interface DynamicFormArrayModelConfig extends ConfigBase {

    groups?: DynamicFormArrayGroupModel[] | null;
    sortable?: boolean;
    useTabs?: boolean;
    saveTab?: SaveTabFunc;
    restoreTab?: RestoreTabFunc;
    getTabLabel?: TabLabelFunc;
    additional?: { [key: string]: any };

    addItem?: boolean;
    insertItem?: boolean;
    cloneItem?: boolean;
    moveItem?: boolean;
    removeItem?: boolean;
    clearItems?: boolean;
}

export class DynamicFormArrayModel extends Base {

    readonly filteredGroups: BehaviorSubject<ReadonlyArray<DynamicFormArrayGroupModel>>;
    readonly sortable: boolean;
    readonly useTabs: boolean;
    readonly saveTab: SaveTabFunc;
    readonly restoreTab: RestoreTabFunc;
    readonly getTabLabel: TabLabelFunc;
    readonly additional: { [key: string]: any };

    groups: DynamicFormArrayGroupModel[];
    tabIndex: number

    protected _sortBy: string;
    protected _sortDescending: boolean;
    protected _formArray: FormArray;
    protected _filteredGroups: ReadonlyArray<DynamicFormArrayGroupModel>;
    protected _filterTimer: ITimer;

    get addItem(): boolean {
        return this.config.addItem !== false;
    }

    get insertItem(): boolean {
        return !this._sortBy && this.config.insertItem !== false;
    }

    get cloneItem(): boolean {
        return this.config.cloneItem !== false;
    }

    get moveItem(): boolean {
        return !this._sortBy && this.config.moveItem !== false;
    }

    get removeItem(): boolean {
        return this.config.removeItem !== false;
    }

    get clearItems(): boolean {
        return this.config.clearItems !== false;
    }

    get sortBy(): string {
        return this._sortBy;
    }

    set sortBy(value: string) {
        if (!this.sortable) return;
        value = value || null;
        if (this._sortBy !== value) {
            this._sortBy = value;
            this._sortDescending = false;
        } else if (this._sortDescending) {
            this._sortBy = null;
            this._sortDescending = false;
        } else {
            this._sortDescending = true;
        }
        this.filterGroups();
    }

    get sortDescending(): boolean {
        return this._sortDescending;
    }

    get sortOrder(): string {
        return this.sortDescending ? "desc" : "asc";
    }

    constructor(protected config: DynamicFormArrayModelConfig, layout?: DynamicFormControlLayout) {
        super(config, layout);
        this.filteredGroups = new BehaviorSubject<ReadonlyArray<DynamicFormArrayGroupModel>>([]);
        this.sortable = config.sortable || false;
        this.useTabs = config.useTabs || false;
        this.saveTab = ObjectUtils.isFunction(config.saveTab) ? config.saveTab : ((index, model, arrayModel) => {
            arrayModel.tabIndex = index;
        });
        this.restoreTab = ObjectUtils.isFunction(config.restoreTab) ? config.restoreTab : ((model) => {
            return model.tabIndex;
        });
        this.getTabLabel = ObjectUtils.isFunction(config.getTabLabel) ? config.getTabLabel : ((index) => {
            return `${index + 1}`;
        });
        this.additional = config.additional || {};
        this.tabIndex = 0;
        this._sortBy = null;
        this._sortDescending = false;
        this._formArray = null;
    }

    initialize(array?: FormArray): void {
        this._formArray = array || this._formArray;
        this.filterGroups();
    }

    filterGroups(): void {
        this._filterTimer = this._filterTimer || TimerUtils.createTimeout();
        this._filterTimer.set(() => {
            const filtered = this.groups.filter(g => !g.hidden);
            if (this._sortBy && this._formArray) {
                const compare: (a: any, b: any) => number = this._sortDescending
                    ? (a, b) => this.compareModels(b, a)
                    : (a, b) => this.compareModels(a, b);
                filtered.sort(compare);
            }
            this._filteredGroups = filtered;
            this.filteredGroups.next(filtered);
        }, 100);
    }

    getFiltered(index: number): DynamicFormArrayGroupModel {
        return !this._filteredGroups ? null : this._filteredGroups[index];
    }

    insertGroup(index: number): DynamicFormArrayGroupModel {
        const group = new DynamicFormArrayGroupModel(this, this.groupFactory());
        this.groups.splice(index, 0, group);
        this.groups.forEach((g, index) => g.index = index);
        this.filterGroups();
        return group;
    }

    protected compareModels(a: DynamicFormArrayGroupModel, b: DynamicFormArrayGroupModel): number {
        const aGroup = this._formArray.at(a.index).get(this._sortBy)?.value || null;
        const bGroup = this._formArray.at(b.index).get(this._sortBy)?.value || null;
        return ObjectUtils.compare(aGroup, bGroup);
    }
}
