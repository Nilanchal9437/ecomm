import server from "../database/connect.js";
import config from "../config/config.js";

const { FAILED, FOUND, NOT_FOUND } = config.RESPONSE;

export const viewInPaginationCursor = async (
  filter,
  fields,
  startingAfter,
  limit,
  collection,
  callBack,
  sort,
) => {
  try {
    const result = await server
      .collection(collection)
      .find(filter)
      .project(fields)
      .sort(sort ? sort : { _id: -1 })
      .skip(parseInt(startingAfter))
      .limit(parseInt(limit))
      .toArray();

    if (result.length == 0) {
      callBack(false, NOT_FOUND, [], 0);
    } else {
      server
        .collection(collection)
        .countDocuments(filter)
        .then((count) => {
          callBack(true, FOUND, result, count);
        })
        .catch((countErr) => {
          console.log(countErr);
          callBack(false, NOT_FOUND, [], 0);
        });
    }
  } catch (err) {
    console.log(err);
    callBack(false, FAILED, [], 0);
  }
};

export default {
  viewInPaginationCursor,
};
