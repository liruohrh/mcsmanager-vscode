export function removeCookie(
    cookiesStr: string,
    toRemoveNames: string[]
): string {
    const newCookieMap: { [key: string]: string } = {};
    const oldCookies = cookiesStr.split("; ");
    for (const cookieStr of oldCookies) {
        const [key, value] = splitCookie(cookieStr)!;
        if (!toRemoveNames.includes(key)) {
            newCookieMap[key] = value;
        }
    }
    return Object.entries(newCookieMap)
        .map(([key, value]) => `${key}=${value}`)
        .join("; ");
}
export function mergeCookie(
    newCookies: string[],
    oldCookiesStr: string
): string {
    const newCookieMap: { [key: string]: string } = {};

    if (oldCookiesStr) {
        const oldCookies = oldCookiesStr.split("; ");
        for (const cookieStr of oldCookies) {
            const [key, value] = splitCookie(cookieStr)!;
            newCookieMap[key] = value;
        }
    }
    for (const cookieStr of newCookies) {
        const cookieStr0 = cookieStr.split("; ")[0];
        const [key, value] = splitCookie(cookieStr0)!;
        newCookieMap[key] = value;
    }
    const entries = Object.entries(newCookieMap);
    if (entries.length === 0) {
        return "";
    }
    return entries.map(([key, value]) => `${key}=${value}`).join("; ");
}

export function splitCookie(cookieStr: string): string[] | undefined {
    if (!cookieStr) {
        return undefined;
    }
    const i = cookieStr.indexOf("=");
    return [cookieStr.substring(0, i), cookieStr.substring(i + 1)];
}
