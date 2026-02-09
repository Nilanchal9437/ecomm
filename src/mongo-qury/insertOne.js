import server from "#@/database/connect.js";
import config from "#@/config/config.js";

const { FAILED, ADD } = config.RESPONSE;

const insertOne = async (body, collection) => {
  try {
    const result = await server.collection(collection).insertOne(body);
    if (result) {
      return { status: true, message: ADD, result: result };
    } else {
      return { status: false, message: FAILED, result: result };
    }
  } catch (err) {
    return { status: false, message: FAILED, result: err.message };
  }
};

export default insertOne;
