import {DynamicFormControlMapFn} from "@ng-dynamic-forms/core";

import {AsyncSubmitDirective} from "./directives/async-submit.directive";

import {DynamicBaseFormComponent} from "./components/base/dynamic-base-form.component";
import {DynamicBaseFormArrayComponent} from "./components/base/dynamic-base-form-array.component";
import {DynamicBaseFormControlComponent} from "./components/base/dynamic-base-form-control.component";
import {
    DynamicBaseFormControlContainerComponent
} from "./components/base/dynamic-base-form-control-container.component";
import {DynamicBaseFormGroupComponent} from "./components/base/dynamic-base-form-group.component";
import {DynamicBaseSelectComponent} from "./components/base/dynamic-base-select.component";

// --- Components ---
export const components = [
    DynamicBaseFormComponent,
    DynamicBaseFormArrayComponent,
    DynamicBaseFormControlComponent,
    DynamicBaseFormControlContainerComponent,
    DynamicBaseFormGroupComponent,
    DynamicBaseSelectComponent
];

// --- Directives ---
export const directives = [
    AsyncSubmitDirective,
];

// --- Pipes ---
export const pipes = [];

export function defaultFormControlProvider(): DynamicFormControlMapFn {
    return () => null;
}
