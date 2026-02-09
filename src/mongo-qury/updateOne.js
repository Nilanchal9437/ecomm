import server from "#@/database/connect.js";
import config from "#@/config/config.js";

const { FAILED, EDIT, ERROR_VALIDATING_USER } = config.RESPONSE;

const updateOne = async (filter, body, collection) => {
  try {
    const response = await server
      .collection(collection)
      .updateOne(filter, body);

    if (response.matchedCount > 0) {
      const updatedDoc = await server.collection(collection).findOne(filter);
      return { status: true, message: EDIT, result: updatedDoc };
    } else {
      return {
        status: false,
        message: ERROR_VALIDATING_USER,
        result: null,
      };
    }
  } catch (err) {
    console.error(err);
    return { status: false, message: FAILED, result: err };
  }
};

export default updateOne;
