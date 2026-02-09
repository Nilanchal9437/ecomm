const yup = require("yup");
const config = require("../../config/config");

const { SCHEMA_MESSAGE, REGEXP } = config;

module.exports = {
  addCategoryMetaSchema: yup.object({
    cat_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE._ID.INVALID)
      .required(SCHEMA_MESSAGE.CATEGORY_META.CATEGORY_ID),
    meta_keyword: yup
      .string()
      .trim()
      .required(SCHEMA_MESSAGE.META.META_KEYWORD),
    meta_desc: yup.string().trim().required(SCHEMA_MESSAGE.META.META_DESC),
    meta_title: yup.string().trim().required(SCHEMA_MESSAGE.META.META_TITLE),
    meta_content: yup
      .string()
      .trim()
      .required(SCHEMA_MESSAGE.META.META_CONTENT),
  }),

  editCategoryMetaSchema: yup.object({
    cat_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE._ID.INVALID)
      .required(SCHEMA_MESSAGE.CATEGORY_META.CATEGORY_ID),
    meta_keyword: yup.string(),
    meta_desc: yup.string(),
    meta_title: yup.string(),
    meta_content: yup.string(),
    meta_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE._ID.INVALID)
      .required(SCHEMA_MESSAGE.META.META_ID),
  }),

  getCategoryDetailsSchema: yup.object({
    cat_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE._ID.INVALID)
      .required(SCHEMA_MESSAGE.CATEGORY_META.CATEGORY_ID),
  }),

  deleteCategoryMetaSchema: yup.object({
    meta_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE._ID.INVALID)
      .required(SCHEMA_MESSAGE.META.META_ID),
  }),
};
