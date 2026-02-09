import server from "../database/connect.js";
import config from "../config/config.js";

const { FAILED, FOUND, NOT_FOUND } = config.RESPONSE;

export const viewAll = (filter, collection, callBack) => {
  server
    .collection(collection)
    .find(filter)
    .toArray()
    .then((doc) => {
      if (doc) {
        callBack(true, FOUND, doc);
      } else {
        callBack(false, NOT_FOUND, []);
      }
    })
    .catch((err) => {
      console.log(err);
      callBack(false, FAILED, []);
    });
};

export const AsyncViewAll = async (filter, collection) => {
  try {
    const response = await server.collection(collection).find(filter).toArray();

    if (response) {
      return { status: true, message: FOUND, result: response };
    } else {
      return { status: false, message: NOT_FOUND, result: [] };
    }
  } catch (err) {
    console.log(err);
    return { status: false, message: FAILED, result: [] };
  }
};

export default {
  viewAll,
  AsyncViewAll,
};
