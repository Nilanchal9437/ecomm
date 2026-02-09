import server from "#@/database/connect.js";
import config from "#@/config/config.js";

const {
  RESPONSE: { FAILED, DELETE, NOT_FOUND },
} = config;

const deleteOne = async (filter, collection) => {
  try {
    const deleteDoc = await server.collection(collection).deleteOne(filter);
    if (deleteDoc) {
      return { status: true, message: DELETE, result: deleteDoc };
    } else {
      return {
        status: false,
        message: NOT_FOUND,
        result: null,
      };
    }
  } catch (err) {
    console.error(err);
    return { status: false, message: FAILED, result: err };
  }
};

export default deleteOne;
