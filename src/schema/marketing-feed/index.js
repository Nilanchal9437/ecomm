const yup = require("yup");
const config = require("../../config/config");

const { REGEXP } = config;

module.exports = {
  add: yup.object({
    name: yup.string().trim().required("name should not be empty!"),
    code: yup.string().trim().required("code should not be empty!"),
    filename: yup.string().trim().required("file name should not be empty!"),
    feed: yup
      .string()
      .trim()
      .required("feed should not be empty! madetory required"),
    product_map: yup
      .array()
      .of(
        yup.object({
          prd_sku: yup
            .string()
            .trim()
            .required("product sku should not be empty!"),
          prd_map: yup
            .string()
            .trim()
            .required("product map should not be empty!"),
        })
      )
      .required("productMap should not be empty! madetory required"),
    assign_products: yup.array(
      yup
        .string()
        .trim()
        .matches(REGEXP.OBJECT_ID, "product _id should be an valid id!")
        .required("product_ids required")
    ),
  }),

  edit: yup.object({
    name: yup.string().trim().required("name should not be empty!"),
    code: yup.string().trim().required("code should not be empty!"),
    filename: yup.string().trim().required("file name should not be empty!"),
    feed: yup
      .string()
      .trim()
      .required("feed should not be empty! madetory required"),
    assign_products: yup.array(
      yup
        .string()
        .trim()
        .matches(REGEXP.OBJECT_ID, "product _id should be an valid id!")
        .required("product_ids required")
    ),
    product_map: yup
      .array()
      .of(
        yup.object({
          prd_sku: yup
            .string()
            .trim()
            .required("product sku should not be empty!"),
          prd_map: yup
            .string()
            .trim()
            .required("product map should not be empty!"),
        })
      )
      .required("productMap should not be empty! madetory required"),
    feed_id: yup
      .string()
      .trim()
      .required("feed _id required")
      .matches(REGEXP.OBJECT_ID, "feed _id should be an valid id!"),
  }),

  delete: yup.object({
    feed_id: yup
      .string()
      .trim()
      .required("feed _id required")
      .matches(REGEXP.OBJECT_ID, "feed _id should be an valid id!"),
  }),
};
