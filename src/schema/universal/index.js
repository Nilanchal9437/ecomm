const yup = require("yup");
const config = require("../../config/config");

const { SCHEMA_MESSAGE, REGEXP } = config;

module.exports = {
  importAndExportCsv: yup.object({
    csv: yup
      .object()
      .shape({
        name: yup.string().trim().required(SCHEMA_MESSAGE.CSV.CSV_NAME),
        size: yup.number().required(SCHEMA_MESSAGE.CSV.CSV_SIZE),
      })
      .required(SCHEMA_MESSAGE.CSV.CSV_NAME),
  }),

  viewAdminSchema: yup.object({
    startingAfter: yup
      .number()
      .nullable()
      .required(SCHEMA_MESSAGE.PAGINATION.STARTING_AFTER),
    limit: yup.number().nullable().required(SCHEMA_MESSAGE.PAGINATION.LIMIT),
  }),

  assigneUnassignedSchema: yup.object({
    _id: yup
      .array()
      .min(1)
      .of(
        yup
          .string()
          .trim()
          .matches(REGEXP.OBJECT_ID, SCHEMA_MESSAGE._ID.INVALID)
      )
      .required(SCHEMA_MESSAGE._ID.ID),
  }),

  searchAll: yup.object({
    searchKeyWord: yup.string().trim().required(SCHEMA_MESSAGE.SEARCH),
  }),
};
