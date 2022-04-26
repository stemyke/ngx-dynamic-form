export function isStringWithVal(val: any): boolean {
    return typeof val == "string" && val.length > 0;
}
