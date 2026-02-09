const yup = require("yup");
const config = require("../../config/config");

const { SCHEMA_MESSAGE, REGEXP } = config;

const { _ID } = SCHEMA_MESSAGE;

module.exports = {
  addCategorySchema: yup.object({
    category_nm: yup
      .string()
      .trim()
      .required(SCHEMA_MESSAGE.CATEGORY.CATEGORY_NAME),
    code: yup.string().trim().required(SCHEMA_MESSAGE.CATEGORY.CATEGORY_CODE),
    category_path: yup.string().trim().required("category path is missing"),
  }),

  updateCategoryProduct: yup.object({
    product_ids: yup
      .array()
      .of(yup.string().trim().matches(REGEXP.OBJECT_ID, _ID.INVALID))
      .required(_ID.ID),
    category_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE.CATEGORY.CATEGORY_ID)
      .required(SCHEMA_MESSAGE.CATEGORY.CATEGORY_ID),
  }),

  editCategorySchema: yup.object({
    category_nm: yup
      .string()
      .trim()
      .required(SCHEMA_MESSAGE.CATEGORY.CATEGORY_NAME),
    code: yup.string().trim().required(SCHEMA_MESSAGE.CATEGORY.CATEGORY_CODE),
    category_path: yup.string().trim().required("category path is missing"),
    category_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE.CATEGORY.CATEGORY_ID)
      .required(SCHEMA_MESSAGE.CATEGORY.CATEGORY_ID),
  }),

  editHeaderFooterSchema: yup.object({
    category_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE.CATEGORY.CATEGORY_ID)
      .required(SCHEMA_MESSAGE.CATEGORY.CATEGORY_ID),
  }),

  deleteCategorySchema: yup.object({
    category_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE.CATEGORY.CATEGORY_ID)
      .required(SCHEMA_MESSAGE.CATEGORY.CATEGORY_ID),
  }),

  getCategoryDetailsSchema: yup.object({
    category_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE.CATEGORY.CATEGORY_ID)
      .required(SCHEMA_MESSAGE.CATEGORY.CATEGORY_ID),
  }),
};
