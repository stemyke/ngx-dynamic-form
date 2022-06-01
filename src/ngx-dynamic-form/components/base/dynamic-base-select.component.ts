import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from "@angular/core";
import {BehaviorSubject, Subscription} from "rxjs";
import {DynamicBaseFormControlComponent} from "./dynamic-base-form-control.component";
import {DynamicFormOption, DynamicFormOptionGroup, DynamicSelectModel} from "../../utils/dynamic-select.model";
import {replaceSpecialChars} from "../../utils/misc";

@Component({
    selector: "dynamic-base-select",
    template: "",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicBaseSelectComponent extends DynamicBaseFormControlComponent<DynamicSelectModel<any>> implements OnInit, OnDestroy {

    groups$: BehaviorSubject<DynamicFormOptionGroup<any>[]>;
    hasOptions: boolean;

    protected subscription: Subscription;

    ngOnInit(): void {
        this.groups$ = new BehaviorSubject<DynamicFormOptionGroup<any>[]>([]);
        this.subscription = this.model.options$.subscribe(options => {
            const groupBy = this.model.inline || !this.model.multiple ? this.model.groupBy : null;
            const grouped = options.reduce((res, option) => {
                const key = replaceSpecialChars(groupBy ? option.props[this.model.groupBy] || "default" : "default", "-");
                res[key] = res[key] || [];
                res[key].push(option);
                return res;
            }, {});
            const groups = Object.keys(grouped).map(group => {
                return {
                    group,
                    options: grouped[group]
                };
            });
            this.hasOptions = groups.length > 0;
            this.groups$.next(groups);
            this.cdr.detectChanges();
        });
    }

    ngOnDestroy(): void {
        if (this.subscription)
            this.subscription.unsubscribe();
    }

    isSelected(option: DynamicFormOption<any>): boolean {
        if (this.model.multiple) {
            return this.control.value?.indexOf(option.value) >= 0;
        }
        return this.control.value == option.value;
    }

    selectToggle(option: DynamicFormOption<any>, state: boolean): void {
        if (this.model.multiple) {
            const value = Array.from(this.control.value || []);
            const index = value.indexOf(option.value);
            if (index >= 0) {
                value.splice(index, 1);
            }
            if (state) {
                value.push(option.value);
            }
            this.control.setValue(value);
            this.onChange(value);
            return;
        }
        this.control.setValue(option.value);
        this.onChange(option.value);
    }
}
