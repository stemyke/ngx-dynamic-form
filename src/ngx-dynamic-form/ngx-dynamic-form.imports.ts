import {AsyncSubmitDirective} from "./directives/async-submit.directive";

import {DynamicFieldType} from "./components/base/dynamic-field-type";
import {DynamicFormComponent} from "./components/dynamic-form/dynamic-form.component";

import {DynamicFormArrayComponent} from "./components/dynamic-form-array/dynamic-form-array.component";
import {DynamicFormChipsComponent} from "./components/dynamic-form-chips/dynamic-form-chips.component";
import {DynamicFormStaticComponent} from "./components/dynamic-form-static/dynamic-form-static.component";
import {DynamicFormUploadComponent} from "./components/dynamic-form-upload/dynamic-form-upload.component";
import {DynamicFormWysiwygComponent} from "./components/dynamic-form-wysiwyg/dynamic-form-wysiwyg.component";

import {DynamicFormAlertComponent} from "./components/dynamic-form-alert/dynamic-form-alert.component";
import {DynamicFormFieldComponent} from "./components/dynamic-form-field/dynamic-form-field.component";
import {DynamicFormFieldsetComponent} from "./components/dynamic-form-fieldset/dynamic-form-fieldset.component";
import {DynamicFormGroupComponent} from "./components/dynamic-form-group/dynamic-form-group.component";

// --- Components ---
export const components = [
    DynamicFieldType,
    DynamicFormComponent,

    DynamicFormArrayComponent,
    DynamicFormChipsComponent,
    DynamicFormStaticComponent,
    DynamicFormUploadComponent,
    DynamicFormWysiwygComponent,

    DynamicFormAlertComponent,
    DynamicFormFieldComponent,
    DynamicFormFieldsetComponent,
    DynamicFormGroupComponent,
];

// --- Directives ---
export const directives = [
    AsyncSubmitDirective,
];

// --- Pipes ---
export const pipes = [];
