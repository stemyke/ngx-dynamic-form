import {Injector} from "@angular/core";
import {IOpenApiSchema, IOpenApiSchemaProperty, MaybeArray, ObjectUtils, ForbiddenZone} from "@stemy/ngx-utils";
import {
    AllValidationErrors,
    ConfigForSchemaOptions,
    CustomizerOrSchemaOptions,
    FormBuilderOptions, FormFieldArrayItemsAction,
    FormFieldConfig,
    FormFieldCustomizer, FormFieldExpression
} from "../common-types";
import {AbstractControl, FormArray, FormGroup} from "@angular/forms";

export type ConfigForSchemaWrapMode = "wrap" | "customizer";

export interface ConfigForSchemaWrapOptions extends Required<FormBuilderOptions> {
    readonly injector: Injector;
    readonly schema: IOpenApiSchema;
    customize(field: FormFieldConfig, property: IOpenApiSchemaProperty, schema: IOpenApiSchema): Promise<FormFieldConfig[]>;
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
        readonly schema: IOpenApiSchema
    ) {
        this.fieldCustomizer = this.mode !== "wrap" || !ObjectUtils.isFunction(this.opts.fieldCustomizer)
            ? field => field
            : this.opts.fieldCustomizer;
    }

    async customize(field: FormFieldConfig, property: IOpenApiSchemaProperty, schema: IOpenApiSchema) {
        field.defaultValue = `${field.props?.type}`.startsWith("date")
            ? convertToDate(property.default) : property.default;
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

    forSchema(schema: IOpenApiSchema): ConfigForSchemaWrapOptions {
        return new ConfigForSchemaWrap(this.opts,  this.mode, this.injector, schema);
    }
}

export async function toWrapOptions(customizeOrOptions: CustomizerOrSchemaOptions | ConfigForSchemaWrapOptions,
                                    injector: Injector,
                                    schema: IOpenApiSchema,
                                    errorMsg?: string): Promise<ConfigForSchemaWrapOptions> {
    if (errorMsg && ForbiddenZone.isForbidden("customizer")) {
        throw new Error(errorMsg);
    }
    if (customizeOrOptions instanceof ConfigForSchemaWrap) {
        return customizeOrOptions;
    }
    let schemaOptions = customizeOrOptions as ConfigForSchemaOptions;
    if (!ObjectUtils.isObject(schemaOptions)) {
        schemaOptions = {
            fieldCustomizer: customizeOrOptions as FormFieldCustomizer
        };
    }
    return new ConfigForSchemaWrap(schemaOptions, "wrap", injector, schema);
}

export function convertToDate(value: any): any {
    if (ObjectUtils.isNullOrUndefined(value)) return null;
    const date = ObjectUtils.isDate(value)
        ? value
        : new Date(value);
    return isNaN(date as any) ? new Date() : date;
}

export function handleConfigs(configs: MaybeArray<FormFieldConfig>) {
    return Array.isArray(configs) ? configs : [configs];
}

export function isStringWithVal(val: any): boolean {
    return typeof val == "string" && val.length > 0;
}

export function findRefs(property: IOpenApiSchemaProperty): string[] {
    const refs = Array.isArray(property.allOf)
        ? property.allOf.map(o => o.$ref).filter(isStringWithVal)
        : [property.items?.$ref, property.$ref].filter(isStringWithVal);
    return refs.map(t => t.split("/").pop());
}

export function arrayItemActionToExpression(action: FormFieldArrayItemsAction): FormFieldExpression {
    const cb = action === false
        ? () => false
        : (ObjectUtils.isFunction(action) ? action : () => true)
    return (field: FormFieldConfig) => {
        // Needed to immediately reflect the changes on the view
        field.options.detectChanges(field);
        // Returns the actual calculated value
        return cb(field.formControl?.value, Number(field.key), field);
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
            return;
        }
        if (control instanceof FormArray) {
            control.controls.forEach((control: FormGroup, ix) => {
                getFormValidationErrors(control.controls, `${path}.${ix}`).forEach(error => errors.push(error));
            });
            return;
        }
        Object.entries(control.errors || {}).forEach(([errorKey, errorValue]) => {
            errors.push({control, path, errorKey, errorValue});
        });
    });
    return errors;
}
