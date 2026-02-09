import server from "#@/database/connect.js";
import config from "#@/config/config.js";

const { FAILED, FOUND, NOT_FOUND } = config.RESPONSE;

const viewOne = async (filter, collection) => {
  try {
    const result = await server.collection(collection).findOne(filter);
    if (result) {
      return { status: true, message: FOUND, result: result };
    } else {
      return { status: false, message: NOT_FOUND, result: result };
    }
  } catch (err) {
    return { status: false, message: FAILED, result: err };
  }
};

export default viewOne;
