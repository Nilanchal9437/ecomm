const { S3 } = require("@aws-sdk/client-s3");
const { END_POINT, ACCESS_KEY_ID, SECRET_ACCESS_KEY, REGION } =
  require("../config/config").DIGITALOCEAN_IMAGE;

const doClient = new S3({
  forcePathStyle: false,
  endpoint: END_POINT,
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

module.exports = { doClient };
