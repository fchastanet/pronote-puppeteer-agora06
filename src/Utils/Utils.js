import crypto from 'crypto';

export default class Utils {
  static delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
  }
  
  static base64encode(str) {
    return Buffer.from(str).toString('base64');
  }

  static md5sum(data) {
    const hash = crypto.createHash("md5");
    hash.update(JSON.stringify(data));
    return hash.digest("hex");
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

  static convertToJsonString(javascriptString) {
    return javascriptString
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .replace(/(\w+):/g, '"$1":') // Enclose property names in double quotes
  }

  static stripTags(html) {
    return html.replace(/<[^>]*>?/gm, '');
  }

}