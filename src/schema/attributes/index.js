const yup = require("yup");
const config = require("../../config/config");

const { SCHEMA_MESSAGE, REGEXP } = config;

const { _ID } = SCHEMA_MESSAGE;

module.exports = {
  addLocalAttributeSchema: yup.object({
    prompt: yup
      .string()
      .trim()
      .required(SCHEMA_MESSAGE.ATTRIBUTES.ATTRIBUTES_PROMPT),
    code: yup
      .string()
      .trim()
      .required(SCHEMA_MESSAGE.ATTRIBUTES.ATTRIBUTES_CODE),
  }),

  deleteLocalAttributeSchema: yup.object({
    product_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
    attribute_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
  }),

  addAttributeSchema: yup.object({
    template_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
    prompt: yup
      .string()
      .trim()
      .required(SCHEMA_MESSAGE.ATTRIBUTES.ATTRIBUTES_PROMPT),
    code: yup
      .string()
      .trim()
      .required(SCHEMA_MESSAGE.ATTRIBUTES.ATTRIBUTES_CODE),
  }),

  editAttributeSchema: yup.object({
    prompt: yup
      .string()
      .trim()
      .required(SCHEMA_MESSAGE.ATTRIBUTES.ATTRIBUTES_PROMPT),
    code: yup
      .string()
      .trim()
      .required(SCHEMA_MESSAGE.ATTRIBUTES.ATTRIBUTES_CODE),
    attribute_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE._ID.INVALID)
      .required(SCHEMA_MESSAGE._ID.ID),
  }),

  deleteAttributeSchema: yup.object({
    attribute_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
    template_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
  }),

  addAttributeOptionSchema: yup.object({
    attr_options: yup.array().of(
      yup.object({
        prompt: yup
          .string()
          .trim()
          .required(SCHEMA_MESSAGE.ATTRIBUTES.ATTRIBUTES_PROMPT),
        code: yup
          .string()
          .trim()
          .required(SCHEMA_MESSAGE.ATTRIBUTES.ATTRIBUTES_CODE),
      })
    ),
    attr_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE._ID.INVALID)
      .required(SCHEMA_MESSAGE._ID.ID),
  }),

  viewProductGlobalAttribute: yup.object({
    attribute_ids: yup
      .array()
      .of(
        yup
          .string()
          .trim()
          .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE._ID.INVALID)
      ),
  }),

  addProductGlobalAttribute: yup.object({
    product_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
    global_attribute_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
  }),
};
