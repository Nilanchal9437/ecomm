const yup = require("yup");
const config = require("../../config/config");

const { SCHEMA_MESSAGE, REGEXP } = config;

const { PRODUCT, _ID, ATTRIBUTES } = SCHEMA_MESSAGE;

module.exports = {
  addProductSchema: yup.object({
    product_name: yup.string().trim().required(PRODUCT.NAME),
    sku: yup.string().trim().required(PRODUCT.SKU),
    msrp: yup.string(),
    price: yup.string().trim().required(PRODUCT.PRICE),
    description: yup.string(),
    thumbnail_image: yup.string(),
    closeup_image: yup.string(),
    gender: yup.string(),
    metaltype: yup.string(),
    weight: yup.string(),
    quantity: yup.string(),
    alternative_images: yup.array(),
    related_product_ids: yup.array(),
    category_ids: yup.array(),
    local_attribute: yup.array(),
    global_attribute_ids: yup.array(),
  }),

  editProductSchema: yup.object({
    product_name: yup.string().trim().required(PRODUCT.NAME),
    sku: yup.string().trim().required(PRODUCT.SKU),
    msrp: yup.string(),
    price: yup.string().trim().required(PRODUCT.PRICE),
    description: yup.string(),
    thumbnail_image: yup.string(),
    closeup_image: yup.string(),
    gender: yup.string(),
    metaltype: yup.string(),
    weight: yup.string(),
    quantity: yup.string(),
    alternative_images: yup.array(),
    product_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
    related_product_ids: yup.array(),
    category_ids: yup.array(),
  }),

  deleteProductSchema: yup.object({
    product_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
    local_attribute: yup.array(),
  }),

  viewProductAttribute: yup.object({
    product_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
  }),

  updateProductAttribute: yup.object({
    product_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
    local_attribute: yup
      .array()
      .of(yup.string().trim().matches(REGEXP.OBJECT_ID, _ID.INVALID))
      .required(PRODUCT.LOCAL_ATTRIBUTE),
  }),

  updateProductGlobalAttribute: yup.object({
    product_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
    global_attribute_ids: yup
      .array()
      .of(yup.string().trim().matches(REGEXP.OBJECT_ID, _ID.INVALID))
      .required(PRODUCT.LOCAL_ATTRIBUTE),
  }),
};
