import {ModuleWithProviders, NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgxUtilsModule} from "@stemy/ngx-utils";
import {DynamicFormComponent} from "./components";

// --- Components ---
export const components = [
    DynamicFormComponent
];

// --- Directives ---
export const directives = [
];

// --- Pipes ---
export const pipes = [
];

@NgModule({
    declarations: [
        ...components,
        ...directives,
        ...pipes
    ],
    imports: [
        CommonModule,
        FormsModule,
        NgxUtilsModule.forRoot()
    ],
    exports: [
        ...components,
        ...directives,
        ...pipes
    ],
    providers: [

    ]
})
export class DynamicFormModule {
    static forChild(): ModuleWithProviders {
        return {
            ngModule: DynamicFormModule,
            providers: pipes
        };
    }

    static forRoot(): ModuleWithProviders {
        return {
            ngModule: DynamicFormModule,
            providers: []
        }
    }
}
