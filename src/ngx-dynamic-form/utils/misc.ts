import {DynamicPathable} from "@ng-dynamic-forms/core";

export function isStringWithVal(val: any): boolean {
    return typeof val == "string" && val.length > 0;
}

export function collectPathAble<T extends DynamicPathable>(start: T, getter: (cur: T) => string): string[] {
    if (!start || !getter(start)) return [];
    const parts = [];
    let currentPath = start;
    while (currentPath) {
        const val = getter(currentPath);
        if (val) {
            parts.unshift(val);
        }
        currentPath = currentPath.parent as T;
    }
    return parts;
}
