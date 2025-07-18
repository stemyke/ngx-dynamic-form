import {Inject, Injectable, Injector, Type} from "@angular/core";
import {BehaviorSubject, combineLatestWith, Observable, switchMap} from "rxjs";
import {
    API_SERVICE,
    EventsService,
    IApiService,
    ILanguageService,
    LANGUAGE_SERVICE,
    MaybePromise,
    ObjectUtils,
    ReflectUtils
} from "@stemy/ngx-utils";

import {
    FormArrayData,
    FormBuilderOptions,
    FormFieldConfig,
    FormFieldData,
    FormFieldExpressions,
    FormFieldProps,
    FormGroupData,
    FormInputData,
    FormSelectData,
    FormSelectOption,
    FormUploadData
} from "../common-types";
import {addFieldValidators} from "../utils/validation";
import {controlValues, MAX_INPUT_NUM, MIN_INPUT_NUM, setFieldHooks, setFieldProp} from "../utils/misc";
import {arrayItemActionToExpression} from "../utils/internal";

export type FormFieldBuilder = (fb: DynamicFormBuilderService, parent: FormFieldConfig, options: FormBuilderOptions) => Partial<FormFieldConfig>;

@Injectable()
export class DynamicFormBuilderService {

    readonly language: Observable<string>;

    constructor(readonly injector: Injector,
                readonly events: EventsService,
                @Inject(API_SERVICE) readonly api: IApiService,
                @Inject(LANGUAGE_SERVICE) protected readonly languages: ILanguageService) {
        const lang = new BehaviorSubject(this.languages.currentLanguage);
        this.events.languageChanged.subscribe(value => lang.next(value));
        this.language = lang;
    }

    resolveFormFields(target: Type<any>, parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig[] {
        const prototype = target?.prototype || {};
        const fields: Set<string> = ReflectUtils.getMetadata("dynamicFormFields", target?.prototype || {}) || new Set();
        const result: FormFieldConfig[] = [];
        for (const key of fields) {
            const builder: FormFieldBuilder = ReflectUtils.getMetadata("dynamicFormField", prototype, key);
            const field = builder(this, parent, options) as FormFieldConfig;
            if (field) {
                result.push(field);
            }
        }
        return this.createFieldSets(result, parent, options);
    }

    resolveFormGroup(key: string, target: Type<any>, data: FormGroupData, parent: FormFieldConfig = null, options: FormBuilderOptions = {}): FormFieldConfig {
        return this.createFormGroup(key, sp => this.resolveFormFields(
            target, sp, options
        ), data, parent, options);
    }

    resolveFormArray(key: string, itemType: string | FormInputData | Type<any>, data: FormArrayData, parent: FormFieldConfig = null, options: FormBuilderOptions = {}): FormFieldConfig {
        return this.createFormArray(key, sp => {
            return typeof itemType === "function" ? this.resolveFormFields(
                itemType, sp, options
            ) : this.createFormInput("", typeof itemType === "string" ? {type: `${itemType}`} : itemType, sp, options);
        }, data, parent, options);
    }

    createFieldSets(fields: FormFieldConfig[], parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig[] {
        const others: FormFieldConfig[] = [];
        const groups: { [fs: string]: FormFieldConfig[] } = {};
        fields = fields.filter(f => {
            if (Array.isArray(f.fieldGroup) && Array.isArray(f.wrappers) && f.wrappers[0] === "form-fieldset") {
                // This field is an already existing set
                groups[f.id] = f.fieldGroup;
                return false;
            }
            return true;
        });

        for (const field of fields) {
            const fsName = String(field.fieldSet || "");
            // If we have a fieldset name defined, then push the property fields into a group
            if (fsName) {
                const fsId = !parent?.path ? fsName : `${parent.path}.${fsName}`;
                const group = groups[fsId] || [];
                groups[fsId] = group;
                group.push(field);
                continue;
            }
            // Otherwise, push the fields to the others
            others.push(field);
        }

        // Create a field-set wrapper for each group and concat the other fields to the end
        return Object.keys(groups).map(id => {
            const key = id.split(".").pop();
            const fieldSet: FormFieldConfig = {
                id,
                parent,
                fieldGroup: groups[id],
                wrappers: ["form-fieldset"],
                props: {
                    label: this.getLabel(key, key, parent, options),
                    hidden: false,
                    className: `dynamic-form-fieldset dynamic-form-fieldset-${id}`
                },
                hooks: {},
                expressions: {}
            };
            this.setExpressions(fieldSet, options);
            return fieldSet;
        }).concat(others);
    }

    createFormInput(key: string, data: FormInputData, parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig {
        data = data || {};
        const type = `${data.type || "text"}`;
        const autocomplete = data.autocomplete || (type === "password" ? "new-password" : "none");
        const props: FormFieldProps = {
            type,
            autocomplete,
            pattern: ObjectUtils.isString(data.pattern) ? data.pattern : "",
            step: data.step,
            cols: data.cols || null,
            rows: data.rows || 10,
            placeholder: data.placeholder || "",
            indeterminate: data.indeterminate || false,
            suffix: data.suffix || "",
            attributes: {
                autocomplete
            },
        };
        switch (type) {
            case "number":
            case "integer":
                props.min = isNaN(data.min) ? MIN_INPUT_NUM : data.min;
                props.max = isNaN(data.max) ? MAX_INPUT_NUM : data.max;
                break;
            case "string":
            case "text":
            case "textarea":
                props.minLength = isNaN(data.minLength) ? 0 : data.minLength;
                props.maxLength = isNaN(data.maxLength) ? MAX_INPUT_NUM : data.maxLength;
                break;
        }
        return this.createFormField(
            key, type === "checkbox" || type === "textarea" ? type : "input",
            data, props, parent, options
        );
    }

    createFormSelect(key: string, data: FormSelectData, parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig {
        data = data || {};
        const type = `${data.type || "select"}`;
        const field = this.createFormField(key, type === "radio" ? type : "select", data, {
            type,
            multiple: data.multiple === true,
            allowEmpty: data.allowEmpty === true,
            groupBy: data.groupBy,
            invert: data.invert === true
        }, parent, options);
        setFieldHooks(field, {
            onInit: target => {
                const options = data.options(target);
                const root = target.formControl.root;
                setFieldProp(target, "options", options instanceof Observable
                    ? options
                    : controlValues(root).pipe(
                        combineLatestWith(this.language),
                        switchMap(async () => {
                            const results: FormSelectOption[] = await (data.options(target) as any) || [];
                            return this.fixSelectOptions(target, results);
                        })
                    ));
            }
        });
        return field;
    }

    createFormUpload(key: string, data: FormUploadData, parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig {
        data = data || {};

        if (data.asFile) {
            data.inline = true;
            console.warn(`File upload property "asFile" is deprecated. Use "inline" instead.`);
        }

        if (data.multi) {
            data.multiple = true;
            console.warn(`File upload property "multi" is deprecated. Use "multiple" instead.`);
        }

        return this.createFormField(key, "upload", data, {
            inline: data.inline === true,
            multiple: data.multiple === true,
            accept: data.accept || [".png", ".jpg"],
            url: data.url?.startsWith("http") ? data.url : this.api.url(data.url || "assets"),
            maxSize: isNaN(data.maxSize) ? MAX_INPUT_NUM : data.maxSize,
            uploadOptions: data.uploadOptions || {},
            createUploadData: data.createUploadData
        }, parent, options);
    }

    createFormGroup(key: string, fields: (parent: FormFieldConfig) => FormFieldConfig[], data: FormGroupData, parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig
    createFormGroup(key: string, fields: (parent: FormFieldConfig) => Promise<FormFieldConfig[]>, data: FormGroupData, parent: FormFieldConfig, options: FormBuilderOptions): Promise<FormFieldConfig>
    createFormGroup(key: string, fields: (parent: FormFieldConfig) => any, data: FormGroupData, parent: FormFieldConfig, options: FormBuilderOptions): MaybePromise<FormFieldConfig> {
        data = data || {};
        const group = this.createFormField(key, undefined, data, {
            useTabs: data.useTabs === true,
        }, parent, options);
        group.defaultValue = {};
        const result = fields(group);
        const handleGroup = (fieldGroup: FormFieldConfig[]) => {
            group.fieldGroup = fieldGroup;
            return group;
        };
        return result instanceof Promise
            ? result.then(handleGroup)
            : handleGroup(result);
    }

    createFormArray(key: string, fields: (parent: FormFieldConfig) => FormFieldConfig | FormFieldConfig[], data: FormArrayData, parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig
    createFormArray(key: string, fields: (parent: FormFieldConfig) => Promise<FormFieldConfig | FormFieldConfig[]>, data: FormArrayData, parent: FormFieldConfig, options: FormBuilderOptions): Promise<FormFieldConfig>
    createFormArray(key: string, fields: (parent: FormFieldConfig) => any, data: FormArrayData, parent: FormFieldConfig, options: FormBuilderOptions): MaybePromise<FormFieldConfig> {
        data = data || {};
        const array = this.createFormField(key, "array", data, {
            // initialCount: data.initialCount || 0,
            // sortable: data.sortable || false,
            useTabs: data.useTabs === true,
            tabsLabel: `${data.tabsLabel || "label"}`,
            insertItem: data.insertItem,
            cloneItem: data.cloneItem,
            moveItem: data.moveItem,
            removeItem: data.removeItem,
            addItem: data.addItem !== false,
            clearItems: data.clearItems !== false
        }, parent, options);
        const result = fields(array);
        const handleItems = (items: FormFieldConfig | FormFieldConfig[]) => {
            const expressions: FormFieldExpressions = {
                insertItem: arrayItemActionToExpression("insertItem"),
                cloneItem: arrayItemActionToExpression("cloneItem"),
                moveItem: arrayItemActionToExpression("moveItem"),
                removeItem: arrayItemActionToExpression("removeItem")
            };
            if (Array.isArray(items)) {
                array.fieldArray = {
                    wrappers: ["form-group"],
                    fieldGroup: items,
                    className: "dynamic-form-field dynamic-form-group",
                    defaultValue: [],
                    hooks: {},
                    expressions
                };
                this.setExpressions(array.fieldArray, options);
                return array;
            }
            const props = items.props || {};
            if (props.type === "text" || props.type === "number") {
                array.type = "chips";
                array.wrappers = ["form-field"];
                array.props = {
                    ...props,
                    ...array.props,
                    multiple: true
                };
                return array;
            }
            array.fieldArray = {
                ...items,
                props: {
                    ...items.props,
                    label: "",
                },
                defaultValue: [],
                hooks: {},
                expressions
            };
            return array;
        };
        return result instanceof Promise
            ? result.then(handleItems)
            : handleItems(result);
    }

    async fixSelectOptions(field: FormFieldConfig, options: FormSelectOption[]): Promise<FormSelectOption[]> {
        if (!Array.isArray(options)) return [];
        options = await Promise.all(options.map(async option => {
            const classes = Array.isArray(option.classes) ? option.classes : [`${option.classes}`];
            option = Object.assign({}, option);
            option.className = classes.filter(ObjectUtils.isStringWithValue).join(" ");
            option.label = await this.languages.getTranslation(option.label);
            option.value = option.value ?? option.id;
            option.id = option.id ?? option.value;
            return option;
        }));
        const control = field.formControl;
        const multiple = field.props.multiple;
        field.defaultValue = multiple ? [] : options[0]?.value ?? null;
        if (multiple || options.length === 0 || options.findIndex(o => o.value === control.value) >= 0) return options;
        control.setValue(field.defaultValue);
        return options;
    }

    protected getLabel(key: string, label: string, parent: FormFieldConfig, options: FormBuilderOptions): string {
        const labelPrefix = !ObjectUtils.isString(options.labelPrefix) ? `` : options.labelPrefix;
        const pathPrefix = `${parent?.props?.label || labelPrefix}`;
        const labelItems = ObjectUtils.isString(label)
            ? (!label ? [] : [labelPrefix, label])
            : [pathPrefix, `${key || ""}`]
        return labelItems.filter(l => l.length > 0).join(".");
    }

    protected createFormField(key: string, type: string, data: FormFieldData, props: FormFieldProps, parent: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig {
        const wrappers = Array.isArray(data.wrappers) ? Array.from(data.wrappers) : [];
        if (type !== "array") {
            wrappers.unshift(!type ? "form-group" : "form-field");
        }
        const field: FormFieldConfig = {
            key,
            wrappers,
            type: data.componentType || type,
            fieldSet: String(data.fieldSet || ""),
            resetOnHide: false,
            validators: {},
            validation: {},
            props: {
                ...(data.props || {}),
                ...props,
                disabled: data.disabled === true,
                hidden: data.hidden === true,
                label: options.labelCustomizer?.(key, data.label, parent, options.labelPrefix)
                    ?? this.getLabel(key, data.label, parent, options),
                hideLabel: data.hideLabel === true,
                classes: data.classes || [],
                layout: data.layout || [],
                className: data.className || "",
                hideRequiredMarker: data.hideRequiredMarker === true,
                formCheck: "nolabel",
                labelPosition: "before"
            },
            modelOptions: {
                updateOn: "change"
            },
            hooks: {},
            expressions: {
                serializer: () => data.serializer,
                serialize: () => data.serialize,
                "props.hideRequiredMarker": target => target.type === "checkbox",
                "props.required": target => !!target.validators?.required
            }
        };
        // Parent object will be available for customizers as a property, until it gets redefined by formly
        Object.defineProperty(field, "parent", {
            get: () => parent,
            configurable: true
        });
        // Set expressions
        addFieldValidators(field, data.validators);
        this.setExpressions(field, options);
        return field;
    }

    protected setExpressions(field: FormFieldConfig, options: FormBuilderOptions): void {
        const expressions: FormFieldExpressions = {
            display: target => {
                const display = target.props?.hidden !== true;
                if (Array.isArray(target.fieldGroup) && target.fieldGroup.length) {
                    return display && target.fieldGroup.some(f => f.display);
                }
                return display;
            },
            valid: target => {
                const control = target.formControl;
                const valid = target.key && control ? control.disabled || control.valid : true;
                if (Array.isArray(target.fieldGroup) && target.fieldGroup.length) {
                    return valid && target.fieldGroup.every(f => f.valid);
                }
                return valid;
            },
            className: (target: FormFieldConfig) => {
                if (!target.display) {
                    return `dynamic-form-field dynamic-form-hidden`;
                }
                const {classes, layout, className} = target.props || {};
                if (className) {
                    return className;
                }
                const type = String(target.type || "group").replace("formly-", "");
                const typeName = ObjectUtils.isConstructor(type)
                    ? `${(target.type as any).name}`.toLowerCase().replace("component", "")
                    : type;
                return [`dynamic-form-field`, `dynamic-form-field-${target.key}`, `dynamic-form-${typeName}`].concat(
                    Array.isArray(classes) ? classes : [classes || ""],
                    (Array.isArray(layout) ? layout : [layout || ""]).map(layout => `dynamic-form-layout-${layout}`)
                ).filter(c => c?.length > 0).join(" ");
            },
            path: target => {
                const tp = target.parent;
                const prefix = tp?.path || "";
                const key = !target.key ? `` : `.${target.key}`;
                return !prefix ? String(target.key ?? "") : `${prefix}${key}`;
            },
            testId: target => {
                const tp = target.parent;
                const prefix = !tp?.testId ? options.testId || "" : tp.testId;
                const key = !target.key ? `` : `-${target.key}`;
                return !prefix ? String(target.key ?? "") : `${prefix}${key}`;
            }
        };
        Object.entries(expressions).forEach(([key, expression]) => {
            field.expressions = field.expressions ?? {};
            field.expressions[key] = expression;
            if (ObjectUtils.isFunction(expression)) {
                field[key] = expression(field);
            }
        });
    }
}
