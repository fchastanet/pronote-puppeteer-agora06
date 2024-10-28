export default class Utils {
  static formatDate(date) {
    const yy = ('0000' + date.getFullYear()).slice(-4);
    const MM = ('00' + (date.getMonth() + 1)).slice(-2);
    const dd = ('00' + date.getDate()).slice(-2);
    const hh = ('00' + date.getHours()).slice(-2);
    return `${yy}-${MM}-${dd}_${hh}`;
  }

  static formatFullDate(date) {
    const yy = ('0000' + date.getFullYear()).slice(-4);
    const MM = ('00' + (date.getMonth() + 1)).slice(-2);
    const dd = ('00' + date.getDate()).slice(-2);
    const hh = ('00' + date.getHours()).slice(-2);
    const mm = ('00' + date.getMinutes()).slice(-2);
    const ss = ('00' + date.getSeconds()).slice(-2);
    const ms = ('000' + date.getMilliseconds()).slice(-3);

    return `${yy}-${MM}-${dd} ${hh}:${mm}:${ss}.${ms}`;
  }


  /**
   * Parse a date string with the format "DD/MM/YYYY HH:mm:ss".
   * @param {string} dateString - The date string to parse.
   * @returns {Date} The parsed date object.
   */
  static parseFrenchDate(dateString) {
    if (dateString === null) {
      return null;
    }
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    if (typeof timePart === 'undefined') {
      return new Date(year, month - 1, day);
    }
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    // Note: Months are 0-based in JavaScript Date (0 = January, 11 = December)
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }


  static delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
  }
  
  static base64encode(str) {
    return Buffer.from(str).toString('base64');
  }

  /**
   * Recursively remove all keys named "keyName" from an object.
   * @param {Object} obj - The object from which to remove the keys.
   * @param {string} keyName - The name of the key to remove.
   * @returns {Object} The object with the keys removed.
   */
  static removeKey(obj, keyName) {
    if (Array.isArray(obj)) {
      return obj.map(item => Utils.removeKey(item, keyName));
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc, key) => {
        if (key !== keyName) {
          acc[key] = Utils.removeKey(obj[key], keyName);
        }
        return acc;
      }, {});
    }
    return obj;
  }

}