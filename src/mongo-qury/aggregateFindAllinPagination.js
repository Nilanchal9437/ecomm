import server from "../database/connect.js";
import config from "../config/config.js";

const { FAILED, FOUND } = config.RESPONSE;

export const viewInPaginationLookUp = async (filter, collection, callBack) => {
  server
    .collection(collection)
    .aggregate(filter)
    .toArray()
    .then((doc) => {
      if (doc) {
        callBack(true, FOUND, doc);
      } else {
        callBack(false, FAILED, []);
      }
    })
    .catch((err) => {
      console.log(err);
      callBack(false, FAILED, []);
    });
};

export const viewAsyncPaginationLookUp = async (filter, collection) => {
  try {
    const doc = await server.collection(collection).aggregate(filter).toArray();

    if (doc) {
      return { status: true, message: FOUND, result: doc };
    } else {
      return { status: false, message: FAILED, result: [] };
    }
  } catch (err) {
    console.log(err);
    return { status: false, message: FAILED, result: [] };
  }
};

export default {
  viewInPaginationLookUp,
  viewAsyncPaginationLookUp,
};
