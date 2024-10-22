export default class Utils {
  static formatDate(date) {
    const yy = ('0000' + date.getFullYear()).slice(-4);
    const mm = ('00' + (date.getMonth() + 1)).slice(-2);
    const dd = ('00' + date.getDate()).slice(-2);
    const hh = ('00' + date.getHours()).slice(-2);
    return `${yy}-${mm}-${dd}_${hh}`;
  }

  static delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
  }
  
}