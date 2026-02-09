const yup = require("yup");
const config = require("../../config/config");

const { SCHEMA_MESSAGE, REGEXP } = config;

const { _ID } = SCHEMA_MESSAGE;

module.exports = {
  addProductMetaSchema: yup.object({
    prd_id: yup.string(),
    meta_keyword: yup.string(),
    meta_desc: yup.string(),
    meta_title: yup.string(),
  }),

  editProductMetaSchema: yup.object({
    prd_id: yup.string(),
    meta_keyword: yup.string(),
    meta_desc: yup.string(),
    meta_title: yup.string(),
    meta_id: yup.string(),
  }),

  deleteProductMetaSchema: yup.object({
    meta_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE._ID.INVALID)
      .required(SCHEMA_MESSAGE.META.META_ID),
  }),

  metaDetailsSchema: yup.object({
    product_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.ID)
      .required(_ID.INVALID),
  }),
};
