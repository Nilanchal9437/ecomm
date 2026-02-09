const yup = require("yup");
const config = require("../../config/config");

const { SCHEMA_MESSAGE, REGEXP } = config;

const { ATTRIBUTES } = SCHEMA_MESSAGE;

const { _ID } = SCHEMA_MESSAGE;

module.exports = {
  addTemplateSchema: yup.object({
    prompt: yup.string().trim().required(ATTRIBUTES.ATTRIBUTES_PROMPT),
    code: yup.string().trim().required(ATTRIBUTES.ATTRIBUTES_CODE),
  }),

  editTemplateSchema: yup.object({
    prompt: yup.string().trim().required(ATTRIBUTES.ATTRIBUTES_PROMPT),
    code: yup.string().trim().required(ATTRIBUTES.ATTRIBUTES_CODE),
    template_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
  }),

  deleteTemplateSchema: yup.object({
    template_id: yup
      .string()
      .trim()
      .matches(REGEXP.OBJECT_ID, _ID.INVALID)
      .required(_ID.ID),
  }),
};
