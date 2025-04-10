import {DynamicFormControlMapFn} from "@ng-dynamic-forms/core";

import {AsyncSubmitDirective} from "./directives/async-submit.directive";

// import {DynamicBaseFormArrayComponent} from "./components/base/dynamic-base-form-array.component";
// import {DynamicBaseFormControlComponent} from "./components/base/dynamic-base-form-control.component";
// import {
//     DynamicBaseFormControlContainerComponent
// } from "./components/base/dynamic-base-form-control-container.component";
// import {DynamicBaseSelectComponent} from "./components/base/dynamic-base-select.component";
// import {DynamicFormComponent} from "./components/form/dynamic-form.component";
// import {DynamicFormGroupComponent} from "./components/form-group/dynamic-form-group.component";
import {FormlyArrayComponent} from "./components/formly-array/formly-array.component";

// --- Components ---
export const components = [
    // DynamicFormComponent,
    // DynamicBaseFormArrayComponent,
    // DynamicBaseFormControlComponent,
    // DynamicBaseFormControlContainerComponent,
    // DynamicFormGroupComponent,
    // DynamicBaseSelectComponent,
    FormlyArrayComponent
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
