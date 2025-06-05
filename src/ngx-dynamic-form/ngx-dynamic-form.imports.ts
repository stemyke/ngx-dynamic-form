import {AsyncSubmitDirective} from "./directives/async-submit.directive";

import {DynamicFormComponent} from "./components/dynamic-form/dynamic-form.component";
import {DynamicFormArrayComponent} from "./components/dynamic-form-array/dynamic-form-array.component";
import {DynamicFormFieldComponent} from "./components/dynamic-form-field/dynamic-form-field.component";
import {DynamicFormFieldsetComponent} from "./components/dynamic-form-fieldset/dynamic-form-fieldset.component";
import {DynamicFormGroupComponent} from "./components/dynamic-form-group/dynamic-form-group.component";
import {DynamicFormUploadComponent} from "./components/dynamic-form-upload/dynamic-form-upload.component";

// --- Components ---
export const components = [
    DynamicFormComponent,
    DynamicFormArrayComponent,
    DynamicFormFieldComponent,
    DynamicFormFieldsetComponent,
    DynamicFormGroupComponent,
    DynamicFormUploadComponent
];

// --- Directives ---
export const directives = [
    AsyncSubmitDirective,
];

// --- Pipes ---
export const pipes = [];
