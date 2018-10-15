export const StringHelper = {
    // 字串前補0
    addZero: function (str: string, length: number) {
        if (str.length >= length) {
            return str;
        }
        return new Array(length - str.length + 1).join('0') + str;
    },
    toString: function (val: any) {
        return val.toString();
    },
    isNullOrEmpty(str: string): boolean {
        if (!str || str === '' || str === null) {
            return true;
        }
        return false;
    }
};
export default StringHelper;
