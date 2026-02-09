import server from "../database/connect.js";
import config from "../config/config.js";

const { FAILED, EDIT, ERROR_VALIDATING_USER } = config.RESPONSE;

export const updateMany = (filter, body, collection, callBack) => {
  server
    .collection(collection)
    .updateMany(filter, body)
    .then((response) => {
      if (response) {
        callBack(true, EDIT, response);
      } else {
        callBack(false, ERROR_VALIDATING_USER, null);
      }
    })
    .catch((err) => {
      console.log(err);
      callBack(false, FAILED, err.message);
    });
};

export default {
  updateMany,
};
