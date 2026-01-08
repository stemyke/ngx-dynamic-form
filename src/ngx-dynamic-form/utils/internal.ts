import {Injector} from "@angular/core";
import {
    ForbiddenZone,
    KeysOfType,
    MaybeArray,
    ObjectUtils,
    OpenApiSchema,
    OpenApiSchemaProperty
} from "@stemy/ngx-utils";
import {
    AllValidationErrors,
    ConfigForSchemaOptions,
    CustomizerOrSchemaOptions,
    FormBuilderOptions,
    FormFieldArrayItemsAction,
    FormFieldConfig,
    FormFieldCustomizer,
    FormFieldExpression,
    FormFieldProps
} from "../common-types";
import {AbstractControl, FormArray, FormGroup} from "@angular/forms";
import {convertToDateFormat} from "./misc";

export type ConfigForSchemaWrapMode = "wrap" | "customizer";

export interface ConfigForSchemaWrapOptions extends Required<FormBuilderOptions> {
    readonly injector: Injector;
    readonly schema: OpenApiSchema;
    customize(field: FormFieldConfig, property: OpenApiSchemaProperty, schema: OpenApiSchema): Promise<FormFieldConfig[]>;
}

class ConfigForSchemaWrap implements ConfigForSchemaWrapOptions {

    get labelPrefix() {
        return this.opts.labelPrefix;
    }

    get labelCustomizer() {
        return this.opts.labelCustomizer;
    }

    get testId() {
        return this.opts.testId;
    }

    get context() {
        return this.opts.context;
    }

    protected fieldCustomizer: FormFieldCustomizer;

    constructor(
        protected readonly opts: ConfigForSchemaOptions,
        protected readonly mode: ConfigForSchemaWrapMode,
        readonly injector: Injector,
        readonly schema: OpenApiSchema
    ) {
        this.fieldCustomizer = this.mode !== "wrap" || !ObjectUtils.isFunction(this.opts.fieldCustomizer)
            ? field => field
            : this.opts.fieldCustomizer;
    }

    async customize(field: FormFieldConfig, property: OpenApiSchemaProperty, schema: OpenApiSchema) {
        field.defaultValue = property.format?.startsWith("date")
            ? convertToDateFormat(property.default, property.format) : property.default;
        const res = await ForbiddenZone.run("customizer", () =>
            this.fieldCustomizer(
                field, this.forCustomizer(), this.injector,
                property, schema
            )
        );
        return !res ? [field] : handleConfigs(res);
    }

    forCustomizer(): FormBuilderOptions {
        return new ConfigForSchemaWrap(this.opts, "customizer", this.injector, this.schema);
    }

    forSchema(schema: OpenApiSchema): ConfigForSchemaWrapOptions {
        return new ConfigForSchemaWrap(this.opts,  this.mode, this.injector, schema);
    }
}

export async function toWrapOptions(customizeOrOptions: CustomizerOrSchemaOptions | ConfigForSchemaWrapOptions,
                                    injector: Injector,
                                    schema: OpenApiSchema,
                                    errorMsg?: string): Promise<ConfigForSchemaWrapOptions> {
    if (errorMsg && ForbiddenZone.isForbidden("customizer")) {
        throw new Error(errorMsg);
    }
    if (customizeOrOptions instanceof ConfigForSchemaWrap) {
        return customizeOrOptions.forSchema(schema);
    }
    let schemaOptions = customizeOrOptions as ConfigForSchemaOptions;
    if (!ObjectUtils.isObject(schemaOptions)) {
        schemaOptions = {
            fieldCustomizer: customizeOrOptions as FormFieldCustomizer
        };
    }
    return new ConfigForSchemaWrap(schemaOptions, "wrap", injector, schema);
}

export function handleConfigs(configs: MaybeArray<FormFieldConfig>) {
    return Array.isArray(configs) ? configs : [configs];
}

export function arrayItemActionToExpression(actionName: KeysOfType<FormFieldProps, FormFieldArrayItemsAction>): FormFieldExpression {
    return (field: FormFieldConfig) => {
        const action = field.parent?.props?.[actionName];
        // Needed to immediately reflect the changes on the view
        field.options.detectChanges(field);
        if (action === false) return false;
        // Returns the actual calculated value
        return ObjectUtils.isFunction(action)
            ? action(field.formControl?.value, Number(field.key), field)
            : true;
    };
}

export function mergeFormFields(formFields: FormFieldConfig[][]): FormFieldConfig[] {
    const res: FormFieldConfig[] = [];
    for (const formModel of formFields) {
        for (const subModel of formModel) {
            const index = res.findIndex(t => t.key == subModel.key);
            if (index >= 0) {
                res[index] = subModel;
                continue;
            }
            res.push(subModel);
        }
    }
    return res;
}

interface FormGroupControls {
    [key: string]: AbstractControl;
}

export function getFormValidationErrors(controls: FormGroupControls, parentPath: string = ""): AllValidationErrors[] {
    const errors: AllValidationErrors[] = [];
    Object.entries(controls).forEach(([name, control], ix) => {
        const path = !parentPath ? name : `${parentPath}.${name}`;
        if (control instanceof FormGroup) {
            getFormValidationErrors(control.controls, path).forEach(error => errors.push(error));
        } else if (control instanceof FormArray) {
            control.controls.forEach((control: FormGroup, ix) => {
                getFormValidationErrors(control.controls, `${path}.${ix}`).forEach(error => errors.push(error));
            });
        }
        Object.entries(control.errors || {}).forEach(([errorKey, errorValue]) => {
            errors.push({control, path, errorKey, errorValue});
        });
    });
    return errors;
}
