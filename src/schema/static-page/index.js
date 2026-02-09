const yup = require("yup");
const config = require("../../config/config");

const { SCHEMA_MESSAGE, REGEXP } = config;

const { _ID } = SCHEMA_MESSAGE;

module.exports = {
  add: yup.object({
    title: yup.string().trim().required("template title should not be empty!"),
    code: yup.string().trim().required("template code should not be empty!"),
    left_side: yup
      .string()
      .trim()
      .required("template left side should not be empty!"),
    right_side: yup
      .string()
      .trim()
      .required("template right side should not be empty!"),
    category_ids: yup
      .array()
      .min(1, "add at least one category")
      .of(yup.string().trim().matches(REGEXP.OBJECT_ID, _ID.INVALID))
      .required(SCHEMA_MESSAGE._ID.ID),
  }),

  edit: yup.object({
    title: yup.string().trim().required("template title should not be empty!"),
    code: yup.string().trim().required("template code should not be empty!"),
    left_side: yup
      .string()
      .trim()
      .required("template left side should not be empty!"),
    right_side: yup
      .string()
      .trim()
      .required("template right side should not be empty!"),
    category_ids: yup
      .array()
      .min(1, "add at least one category")
      .of(yup.string().trim().matches(REGEXP.OBJECT_ID, _ID.INVALID))
      .required(SCHEMA_MESSAGE._ID.ID),
    static_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
  }),

  delete: yup.object({
    static_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
  }),
};
