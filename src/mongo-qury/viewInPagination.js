import server from "../database/connect.js";
import config from "../config/config.js";

const { FAILED, FOUND } = config.RESPONSE;

export const viewInPagination = async (
  filter,
  startingAfter,
  limit,
  collection,
  callBack,
) => {
  server
    .collection(collection)
    .aggregate([
      {
        $facet: {
          result: [
            { $match: filter },
            { $sort: { _id: -1 } },
            { $skip: parseInt(startingAfter) },
            { $limit: parseInt(limit) },
          ],
          total: [{ $count: "total" }],
        },
      },
    ])
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

export default {
  viewInPagination,
};
