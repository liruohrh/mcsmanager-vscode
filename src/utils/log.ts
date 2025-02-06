export const logger = {
    info(message?: any, ...optionalParams: any[]): void{
        console.info("[mcsmanager]", ...arguments);
    },
    error(message?: any, ...optionalParams: any[]): void{
        console.error("[mcsmanager]",...arguments);
    }
}