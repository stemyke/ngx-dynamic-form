import {AsyncSubmitDirective} from "./directives/async-submit.directive";

import {DynamicBaseFormComponent} from "./components/base/dynamic-base-form.component";
import {DynamicBaseFormArrayComponent} from "./components/base/dynamic-base-form-array.component";
import {
    DynamicBaseFormControlContainerComponent
} from "./components/base/dynamic-base-form-control-container.component";
import {DynamicBaseFormGroupComponent} from "./components/base/dynamic-base-form-group.component";

// --- Components ---
export const components = [
    DynamicBaseFormComponent,
    DynamicBaseFormArrayComponent,
    DynamicBaseFormControlContainerComponent,
    DynamicBaseFormGroupComponent
];

// --- Directives ---
export const directives = [
    AsyncSubmitDirective,
];

// --- Pipes ---
export const pipes = [];
