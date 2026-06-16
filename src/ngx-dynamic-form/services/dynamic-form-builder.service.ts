import {Inject, Injectable, Injector, Type} from "@angular/core";
import {BehaviorSubject, combineLatestWith, Observable, switchMap} from "rxjs";
import {
    API_SERVICE,
    ArrayUtils,
    convertToDate,
    convertToDateFormat,
    EventsService,
    IApiService,
    ILanguageService,
    LANGUAGE_SERVICE,
    MaybePromise,
    ObjectUtils,
    ReflectUtils,
    SetUtils,
} from "@stemy/ngx-utils";

import {
    DEFAULT_NUMERIC_STEP,
    FormArrayData,
    FormBuilderOptions,
    FormDateData,
    FormFieldConfig,
    FormFieldData,
    FormFieldExpressions,
    FormFieldProps,
    FormFieldSerializer,
    FormFieldSetData,
    FormGroupData,
    FormInputData,
    FormSelectData,
    FormSelectOption,
    FormSerializerData,
    FormStaticData,
    FormUploadData,
    Validators
} from "../common-types";
import {addFieldValidators} from "../utils/validation";
import {
    controlValues,
    convertToNumber,
    CUSTOM_INPUT_TYPES,
    EDITOR_TYPES,
    isFieldHidden,
    isFieldVisible,
    MAX_INPUT_NUM,
    MIN_INPUT_NUM,
    setFieldHidden,
    setFieldHooks,
    setFieldProp,
    setFieldSerialize
} from "../utils/misc";
import {arrayItemActionToExpression, toStringArray} from "../utils/internal";

export type FormFieldBuilder = (fb: DynamicFormBuilderService, parent: FormFieldConfig, options: FormBuilderOptions) => Partial<FormFieldConfig>;

@Injectable()
export class DynamicFormBuilderService {

    readonly language: Observable<string>;

    constructor(readonly injector: Injector,
                readonly events: EventsService,
                @Inject(API_SERVICE) readonly api: IApiService,
                @Inject(LANGUAGE_SERVICE) protected readonly languages: ILanguageService,
                @Inject(DEFAULT_NUMERIC_STEP) protected readonly defaultNumericStep: number) {
        const lang = new BehaviorSubject(this.languages.currentLanguage);
        this.events.languageChanged.subscribe(value => lang.next(value));
        this.language = lang;
    }

    resolveFormFields(type: Type<any>, parent: FormFieldConfig, options?: FormBuilderOptions): FormFieldConfig[] {
        const target = type || {prototype: null};
        const prototype = target.prototype || target;
        const fields: Set<string> = ReflectUtils.getMetadata("dynamicFormFields", prototype) || new Set();
        const sets: Map<string, FormFieldSetData> = ReflectUtils.getMetadata("dynamicFormFieldSets", target) || new Map();
        const result: FormFieldConfig[] = [];
        for (const key of fields) {
            const builder: FormFieldBuilder = ReflectUtils.getMetadata("dynamicFormField", prototype, key);
            const field = builder(this, parent, options) as FormFieldConfig;
            if (field) {
                result.push(field);
            }
        }
        return this.createFieldSets(result, parent, options, Array.from(sets.values()));
    }

    resolveFormGroup(key: string, target: Type<any>, data: FormGroupData, parent: FormFieldConfig = null, options?: FormBuilderOptions): FormFieldConfig {
        return this.createFormGroup(key, sp => this.resolveFormFields(
            target, sp, options
        ), data, parent, options);
    }

    resolveFormArray(key: string, itemType: string | FormInputData | Type<any>, data: FormArrayData, parent: FormFieldConfig = null, options?: FormBuilderOptions): FormFieldConfig {
        return this.createFormArray(key, sp => {
            return typeof itemType === "function" ? this.resolveFormFields(
                itemType, sp, options
            ) : this.createFormInput("", typeof itemType === "string" ? {type: `${itemType}`} : itemType, sp, options);
        }, data, parent, options);
    }

    createFieldSet(set: FormFieldSetData, fields: FormFieldConfig[], parent: FormFieldConfig, options?: FormBuilderOptions): FormFieldConfig {
        const id = !parent?.path ? set.id : `${parent.path}.${set.id}`;
        return this.setExpressions({
            id,
            parent,
            schemas: new Set<string>(),
            discriminator: parent?.discriminator,
            fieldGroup: fields,
            wrappers: ["form-fieldset"],
            props: {
                label: this.getLabel(set.id, set.label, set.labelPrefix, parent, options, "title"),
                hidden: false,
                classes: toStringArray(set.classes),
                layout: toStringArray(set.layout),
            },
            hooks: {},
            expressions: {}
        }, options);
    }

    createFieldSets(fields: FormFieldConfig[], parent: FormFieldConfig, options?: FormBuilderOptions, data: FormFieldSetData[] = []): FormFieldConfig[] {
        const result: FormFieldConfig[] = [];
        const fieldSets: { [fs: string]: FormFieldConfig } = {};
        fields = Array.from(fields || [])
            .sort((a, b) => a.priority - b.priority);
        fields.forEach(field => {
            if (this.isFieldset(field)) {
                // This field is an already existing set
                fieldSets[field.id] = field;
            }
        });

        for (const field of fields) {
            const fsName = String(field.fieldSet || "");
            // If we have a fieldset name defined, then push the property fields into a group
            if (fsName) {
                const id = !parent?.path ? fsName : `${parent.path}.${fsName}`;
                const setData: FormFieldSetData = data.find(s => s.id === fsName) || {id: fsName, layout: ""};
                let fieldSet = fieldSets[id];
                if (!fieldSet) {
                    fieldSet = this.createFieldSet(setData, [], parent, options);
                    fieldSets[id] = fieldSet;
                    result.push(fieldSet);
                }
                SetUtils.merge(fieldSet.schemas, field.schemas);
                fieldSet.fieldGroup.push(field);
                continue;
            } else if (field.asFieldSet && !fieldSets[field.id]) {
                const fsName = String(field.key);
                const set = data.find(s => s.id === fsName);
                field.id = !parent?.path ? fsName : `${parent.path}.${fsName}`;
                field.wrappers = ["form-fieldset"];
                field.props = {
                    label: this.getLabel(fsName, set?.label, set?.labelPrefix, parent, options, "title"),
                    hidden: false,
                    classes: toStringArray(set?.classes),
                    layout: toStringArray(set?.layout),
                };
                field.expressions = {};
                this.setExpressions(field, options);
            }

            // Otherwise just push to result
            result.push(field);
        }

        return result;
    }

    createFormInput(key: string, data: FormInputData, parent: FormFieldConfig, options?: FormBuilderOptions): FormFieldConfig {
        data = data || {};
        const type = String(data.type || "text");
        const autocomplete = data.autocomplete || (type === "password" ? "new-password" : "none");
        const props: FormFieldProps = {
            type,
            autocomplete,
            pattern: ObjectUtils.isString(data.pattern) ? data.pattern : "",
            step: convertToNumber(data.step, this.defaultNumericStep),
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
            case "checkbox":
                data.defaultValue = data.defaultValue ?? false;
                break;
            case "number":
            case "integer":
                props.min = convertToNumber(data.min, MIN_INPUT_NUM);
                props.max = convertToNumber(data.max, MAX_INPUT_NUM);
                break;
            case "date":
            case "datetime-local":
                props.min = convertToDateFormat(data.min, type);
                props.max = convertToDateFormat(data.max, type);
                break;
            case "string":
            case "text":
            case "textarea":
                data.defaultValue = data.defaultValue ?? "";
                props.minLength = isNaN(data.minLength) ? 0 : data.minLength;
                props.maxLength = isNaN(data.maxLength) ? MAX_INPUT_NUM : data.maxLength;
                break;
        }
        const fieldType = CUSTOM_INPUT_TYPES.includes(type)
            ? type
            : (EDITOR_TYPES.includes(type) ? "editor" : "input")
        return this.createFormField(
            key, fieldType,
            data, props, parent, options
        );
    }

    createFormSelect(key: string, data: FormSelectData, parent: FormFieldConfig, options?: FormBuilderOptions): FormFieldConfig {
        data = data || {};
        const multiple = data.multiple === true;
        data.defaultValue = data.defaultValue ?? (multiple ? [] : null);
        const type = `${data.type || "select"}`;
        const fieldType = type === "radio" ? type : (data.strict === false ? "chips" : "select");
        const field = this.createFormField(key, fieldType, data, {
            type,
            multiple,
            strict: data.strict !== false,
            allowEmpty: data.allowEmpty === true,
            groupBy: data.groupBy,
            invert: data.invert === true
        }, parent, options);
        setFieldHooks(field, {
            onInit: target => {
                const factory = ReflectUtils.resolve(data.options, this.injector);
                const options = factory(target, this.injector);
                const root = target.formControl.root;
                setFieldProp(target, "options", options instanceof Observable
                    ? options
                    : controlValues(root).pipe(
                        combineLatestWith(this.language),
                        switchMap(async (a, b) => {
                            const results: FormSelectOption[] = await (factory(target, this.injector) as any) || [];
                            return this.fixSelectOptions(target, results);
                        })
                    ));
            }
        });
        return field;
    }

    createFormStatic(key: string, data: FormStaticData, parent: FormFieldConfig, options?: FormBuilderOptions): FormFieldConfig {
        data = data || {};

        return this.createFormField(key, "static", data, {
            properties: Array.isArray(data.properties) ? data.properties : null,
            style: data.style === "list" ? "list" : "table"
        }, parent, options);
    }

    createFormDate(key: string, data: FormDateData, parent: FormFieldConfig, options?: FormBuilderOptions): FormFieldConfig {
        data = data || {};
        return this.createFormField(key, "date", data, {
            min: convertToDateFormat(data.min),
            max: convertToDateFormat(data.max),
            disabledDays: Array.isArray(data.disabledDays)
                ? data.disabledDays.map(n => convertToNumber(n)) : [],
            disabledDates: Array.isArray(data.disabledDates)
                ? data.disabledDates.map(n => convertToDate(n)) : [],
            strict: data.strict !== false,
        }, parent, options);
    }

    createFormUpload(key: string, data: FormUploadData, parent: FormFieldConfig, options?: FormBuilderOptions): FormFieldConfig {
        data = data || {};
        const baseUrl = data.url?.startsWith("http") ? data.url : this.api.url(data.url || "assets");
        return this.createFormField(key, "upload", data, {
            inline: data.inline === true,
            multiple: data.multiple === true,
            accept: data.accept || [".png", ".jpg"],
            url: baseUrl,
            uploadUrl: data.url?.startsWith("http")
                ? data.uploadUrl
                : (data.uploadUrl ? this.api.url(data.uploadUrl || "assets") : baseUrl)
        }, parent, options);
    }

    createFormGroup(key: string, fields: (parent: FormFieldConfig) => FormFieldConfig[], data: FormGroupData, parent?: FormFieldConfig, options?: FormBuilderOptions): FormFieldConfig
    createFormGroup(key: string, fields: (parent: FormFieldConfig) => Promise<FormFieldConfig[]>, data: FormGroupData, parent?: FormFieldConfig, options?: FormBuilderOptions): Promise<FormFieldConfig>
    createFormGroup(key: string, fields: (parent: FormFieldConfig) => any, data: FormGroupData, parent?: FormFieldConfig, options?: FormBuilderOptions): MaybePromise<FormFieldConfig> {
        data = data || {};
        data.defaultValue = data.defaultValue ?? {};
        const group = this.createFormField(key, undefined, data, {
            useTabs: data.useTabs === true,
        }, parent, options);
        group.asFieldSet = data.asFieldSet === true;
        const result = fields(group.asFieldSet ? parent : group);
        const handleGroup = (fieldGroup: FormFieldConfig[]) => {
            group.fieldGroup = fieldGroup;
            return group;
        };
        return result instanceof Promise
            ? result.then(handleGroup)
            : handleGroup(result);
    }

    createFormArray(key: string, fields: (parent: FormFieldConfig) => FormFieldConfig | FormFieldConfig[], data: FormArrayData, parent: FormFieldConfig, options?: FormBuilderOptions): FormFieldConfig
    createFormArray(key: string, fields: (parent: FormFieldConfig) => Promise<FormFieldConfig | FormFieldConfig[]>, data: FormArrayData, parent: FormFieldConfig, options?: FormBuilderOptions): Promise<FormFieldConfig>
    createFormArray(key: string, fields: (parent: FormFieldConfig) => any, data: FormArrayData, parent: FormFieldConfig, options?: FormBuilderOptions): MaybePromise<FormFieldConfig> {
        data = data || {};
        data.defaultValue = data.defaultValue ?? [];
        const array = this.createFormField(key, "array", data, {
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
                    defaultValue: {},
                    hooks: {},
                    expressions
                };
                const lang = items.find(i => i.key === "lang");
                const translation = items.find(i => i.key === "translation");
                if (lang && translation) {
                    // Use translation component if the sub items are correct
                    array.type = "translation";
                    setFieldHidden(lang);
                    setFieldSerialize(lang);
                    setFieldProp(translation, "label", "");
                }
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
                defaultValue: props.type === "json" ? {} : "",
                hooks: {},
                expressions
            };
            return array;
        };
        return result instanceof Promise
            ? result.then(handleItems)
            : handleItems(result);
    }

    createFormSerializer(key: string, data: FormFieldSerializer | FormSerializerData): Partial<FormFieldConfig> {
        const options = ObjectUtils.isFunction(data) ? {
            serializer: data,
        } : data || {serialize: true};
        const serialize = ReflectUtils.resolve(options.serialize, this.injector);
        return {
            key,
            serialize: ObjectUtils.isFunction(serialize) ? serialize : () => {
                return serialize;
            },
            serializer: options.serializer
        };
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
        if (multiple) {
            if (Array.isArray(control.value)) return options;
            // Handle if current control value is not an array
            const value = String(control.value || "").split(",");
            control.setValue(value);
            return options;
        }
        if (options.length === 0 || options.findIndex(o => o.value === control.value) >= 0)
            return options;
        control.setValue(options[0].value);
        return options;
    }

    protected isFieldset(field: FormFieldConfig): boolean {
        return Array.isArray(field.fieldGroup) && Array.isArray(field.wrappers) && field.wrappers[0] === "form-fieldset";
    }

    protected getLabel(key: string, label: string, labelPrefix: string, parent: FormFieldConfig, options: FormBuilderOptions, legacyPrefix: string = ""): string {
        options = options || {labelPrefix: ""};
        labelPrefix = String(labelPrefix ?? options.labelPrefix ?? "");
        if (ObjectUtils.isFunction(options.labelCustomizer)) {
            const customLabel = options.labelCustomizer(key, label, parent, labelPrefix);
            if (ObjectUtils.isString(customLabel)) return customLabel;
        }
        // Exceptional case, to be able to have an "empty" label element in the HTML just to fill the space.
        if (label === " ") return "\u200B";
        const pathPrefix = options.legacyLabels
            ? String(legacyPrefix || labelPrefix)
            : String(parent?.props?.label || labelPrefix);
        const labelItems = ObjectUtils.isString(label)
            ? (!label ? [] : [labelPrefix, label])
            : [pathPrefix, `${key || ""}`]
        return labelItems.filter(l => l.length > 0).join(".");
    }

    protected createFormField(key: string, type: string, data: FormFieldData, props: FormFieldProps, parent: FormFieldConfig, options?: FormBuilderOptions): FormFieldConfig {
        let wrappers = Array.isArray(data.wrappers) ? Array.from(data.wrappers) : [];
        if (type !== "array") {
            wrappers = !type
                ? ArrayUtils.unique([wrappers.length === 0 ? "form-group" : undefined, ...wrappers])
                : ArrayUtils.unique(["form-field", ...wrappers]);
        }
        const disabled = ReflectUtils.resolve(data.disabled, this.injector);
        const hidden = ReflectUtils.resolve(data.hidden, this.injector);
        const prefix = data.labelPrefix ?? parent?.labelPrefix;
        const field: FormFieldConfig = {
            ...this.createFormSerializer(key, data as unknown as FormSerializerData),
            defaultValue: data.defaultValue ?? null,
            fieldSet: String(data.fieldSet || ""),
            labelPrefix: prefix,
            controlTemplateKey: String(data.controlTemplateKey || ""),
            labelTemplateKey: String(data.labelTemplateKey || ""),
            inputTemplateKey: String(data.inputTemplateKey || ""),
            prefixTemplateKey: String(data.prefixTemplateKey || ""),
            suffixTemplateKey: String(data.suffixTemplateKey || ""),
            purposes: toStringArray(data.purposes),
            schemas: new Set(toStringArray(data.schemas)),
            discriminator: data.discriminator,
            priority: isNaN(data.priority) ? Number.MAX_SAFE_INTEGER : Number(data.priority),
            wrappers: wrappers.filter(ObjectUtils.isDefined),
            type: data.componentType || type,
            resetOnHide: false,
            validators: {},
            validation: {},
            props: {
                ...(data.props || {}),
                ...props,
                label: this.getLabel(key, data.label, prefix, parent, options),
                labelAlign: data.labelAlign === "after" ? "after" : "before",
                description: String(data.description || ""),
                hideLabel: data.hideLabel === true,
                classes: toStringArray(data.classes),
                layout: toStringArray(data.layout),
                className: data.className || "",
                formCheck: "nolabel",
                __disabled: ObjectUtils.isFunction(disabled) ? disabled : () => disabled,
                __hidden: ObjectUtils.isFunction(hidden) ? hidden : () => hidden
            },
            modelOptions: {
                updateOn: "change"
            },
            hooks: {},
            expressions: {
                "props.markRequired": target => data.hideRequiredMarker !== true && !!target.validators?.required,
                "props.disabled": target => {
                    const disabled = target.props?.__disabled;
                    return !!disabled(target, this.injector);
                },
                "props.hidden": target => {
                    return isFieldHidden(target);
                }
            }
        };
        // Parent object will be available for customizers as a property, until it gets redefined by formly
        Object.defineProperty(field, "parent", {
            get: () => parent,
            configurable: true
        });
        // Set expressions
        const validators = ObjectUtils.isArray(data.validators)
            ? data.validators.map(v => ReflectUtils.resolve(v, this.injector))
            : data.validators as Validators;
        addFieldValidators(field, validators);
        this.setExpressions(field, options);
        return field;
    }

    protected isValid(field: FormFieldConfig): boolean {
        const control = field.formControl;
        const valid = field.key && control ? (control.disabled || control.valid) !== false : true;
        if (Array.isArray(field.fieldGroup) && field.fieldGroup.length) {
            return valid && field.fieldGroup.every(f => this.isValid(f));
        }
        return valid;
    }

    protected setExpressions(field: FormFieldConfig, options: FormBuilderOptions): FormFieldConfig {
        const expressions: FormFieldExpressions = {
            display: target => isFieldVisible(target),
            valid: target => this.isValid(target),
            className: (target: FormFieldConfig) => {
                if (!target.display) {
                    return `dynamic-form-field dynamic-form-hidden`;
                }
                const {classes, layout, className} = target.props || {};
                if (className) {
                    return className;
                }
                const idName = String(field.id || field.key || "").replace(/\./, "-");
                let baseName = `dynamic-form-fieldset dynamic-form-fieldset-${idName}`;
                if (!this.isFieldset(target)) {
                    const labelAlign = target.props?.labelAlign || "before";
                    const type = String(target.type || "group").replace("formly-", "");
                    const typeName = ObjectUtils.isConstructor(type)
                        ? `${(target.type as any).name}`.toLowerCase().replace("component", "")
                        : type;
                    baseName = `dynamic-form-field dynamic-form-field-${target.key} dynamic-form-label-${labelAlign} dynamic-form-${typeName}`;
                }
                const classesName = Array.isArray(classes) ? classes : [classes];
                const layoutName = Array.isArray(layout) ? layout : [layout];

                return [
                    baseName,
                    ...classesName,
                    ...layoutName.map(l => !l ? null : `dynamic-form-layout-${l}`)
                ].filter(ObjectUtils.isStringWithValue).join(" ");
            },
            path: target => {
                const tp = target.parent;
                const prefix = tp?.path || "";
                return [prefix, String(target.key ?? "")].filter(ObjectUtils.isStringWithValue).join("-");
            },
            testId: target => {
                const tp = target.parent;
                const prefix = !tp?.testId ? options?.testId : tp.testId;
                return [prefix, String(target.key ?? "")].filter(ObjectUtils.isStringWithValue).join("-");
            }
        };
        Object.entries(expressions).forEach(([key, expression]) => {
            field.expressions = field.expressions ?? {};
            field.expressions[key] = expression;
            if (ObjectUtils.isFunction(expression)) {
                field[key] = expression(field);
            }
        });
        return field;
    }
}
