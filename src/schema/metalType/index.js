const yup = require("yup");
const config = require("../../config/config");

const { SCHEMA_MESSAGE, REGEXP } = config;

module.exports = {
  add: yup.object({
    name: yup.string().trim().required("metal type name should not be empty!"),
    code: yup.string().trim().required("metal type code should not be empty!"),
    row: yup.string().trim(),
  }),

  edit: yup.object({
    name: yup.string().trim().required("metal type name should not be empty!"),
    code: yup.string().trim().required("metal type code should not be empty!"),
    _id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE._ID.INVALID)
      .required(SCHEMA_MESSAGE._ID.ID),
  }),

  delete: yup.object({
    _id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE._ID.INVALID)
      .required(SCHEMA_MESSAGE._ID.ID),
  }),
};
