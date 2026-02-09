import server from "../database/connect.js";
import config from "../config/config.js";
import { view } from "./viewOne.js";

const { FAILED, ADD, NOT_FOUND, EDIT } = config.RESPONSE;

export const insertManyBulk = async (collection, body, callBack) => {
  try {
    const bulk = server.collection(collection).initializeOrderedBulkOp();
    body.forEach((item) => bulk.insert(item));

    const doc = await bulk.execute();
    if (doc) {
      callBack(true, ADD, doc);
    } else {
      callBack(false, NOT_FOUND, null);
    }
  } catch (err) {
    console.error(err);
    callBack(false, FAILED, err.message);
  }
};

export const updateManyBulk = async (collection, body, callBack) => {
  try {
    const bulk = server.collection(collection).initializeOrderedBulkOp();
    body.forEach((item) => bulk.find(item.filter).update(item.body));

    const doc = await bulk.execute();
    if (doc) {
      callBack(true, EDIT, doc);
    } else {
      callBack(false, NOT_FOUND, null);
    }
  } catch (err) {
    console.error(err);
    callBack(false, FAILED, err.message);
  }
};

export const insetIdBulk = async (
  collection1,
  collection2,
  body,
  key,
  callBack,
) => {
  try {
    const bulk = server.collection(collection2).initializeOrderedBulkOp();
    let processedCount = 0;

    if (body.length === 0) {
      return callBack(false, NOT_FOUND, null);
    }

    body.forEach((item, index) => {
      view(item.filter1, collection1, async (status, message, result) => {
        if (status) {
          bulk.find(item.filter2).update({ $push: { [key]: result._id } });
        }

        processedCount++;

        if (processedCount === body.length) {
          try {
            const doc = await bulk.execute();
            if (doc) {
              callBack(true, EDIT, doc);
            } else {
              callBack(false, NOT_FOUND, null);
            }
          } catch (err) {
            console.error(err);
            callBack(false, FAILED, err.message);
          }
        }
      });
    });
  } catch (err) {
    console.error(err);
    callBack(false, FAILED, err.message);
  }
};

export default {
  insertManyBulk,
  updateManyBulk,
  insetIdBulk,
};
