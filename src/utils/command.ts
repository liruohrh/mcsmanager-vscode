// 右键菜单：(element, undefined)
// 选中+右键菜单：(rightClickElement, [element...rightClickElement])
// 选中：(lastSelectElement, [element...lastSelectElement])
// 快捷键: undefined, 但是view.selection=[element...]

import { GlobalVar } from "./global";

export function onlyOneItemCommandWrapper(
    wrappered: (arg: any) => any,
    includeSelection: boolean = false
) {
    return (...args: any[]) => {
        if (args.length !== 2) {
            if (
                includeSelection &&
                GlobalVar.mcsFileExplorer.selection.length === 1
            ) {
                return wrappered(GlobalVar.mcsFileExplorer.selection[0]);
            }
            throw new Error("You must right click or select a item.");
        }
        if (args[1] === undefined && args[0] === undefined) {
            throw new Error("You must right click or select a item.");
        }
        if (args[1] !== undefined && args[1].length !== 1) {
            throw new Error(
                "You must right click or select a item, but not multi items."
            );
        }
        return wrappered(args[0]);
    };
}
export function rightClickCommandWrapper(wrappered: (arg: any) => any) {
    return (...args: any[]) => {
        if (args.length === 0 || args[0] === undefined) {
            throw new Error("You must right click a item.");
        }
        if (args.length === 2 && args[1] !== undefined) {
            throw new Error(
                "You must right click a item but not select items."
            );
        }
        return wrappered(args[0]);
    };
}
export function selectMultiCommandWrapper(wrappered: (args: any[]) => any) {
    return (...args: any[]) => {
        if (args.length === 0) {
            throw new Error("You must select items.");
        }
        if (args.length !== 2 || args[1].length === 0) {
            throw new Error("You must select items.");
        }
        if (args[1] === undefined) {
            throw new Error(
                "You must select items but not right click a item."
            );
        }
        return wrappered(args[1]);
    };
}
