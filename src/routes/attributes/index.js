const express = require("express");
const router = express.Router();

const config = require("../../config/config");
const validate = require("../../validation");
const filesvalidate = require("../../validation/fileValidation");
const { ensureAuthorisedAdmin } = require("../../auth");
const attributeSchema = require("../../schema/attributes");
const {
  insertManyBulk,
  updateManyBulk,
} = require("../../mongo-qury/bulkOperation");
const { view } = require("../../mongo-qury/viewOne");
const { insert } = require("../../mongo-qury/insertOne");
const { ObjectId } = require("mongodb");
const { update } = require("../../mongo-qury/updateOne");
const { deleteOne } = require("../../mongo-qury/deleteOne");
const { viewAll } = require("../../mongo-qury/findAll");
const csvtojson = require("csvtojson");
const { Parser } = require("json2csv");

const { API, COLLECTION, RESPONSE } = config;

const { ATTRIBUTES } = API.ADMIN;

//CRUD of the global attribute options
router.post(
  ATTRIBUTES.CRUD_ATTRIBUTES_OPTION,
  validate(attributeSchema.addAttributeOptionSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { attr_options, attr_id } = req.body;

    const body = {
      $set: {
        attr_options: attr_options,
      },
    };

    update(
      { _id: new ObjectId(attr_id) },
      body,
      COLLECTION.ATTRIBUTES,
      (status, message, result) => {
        res.json({ status: status, message: message, result: result });
      },
    );
  },
);

//Add new global attributes
router.post(
  ATTRIBUTES.ADD_ATTRIBUTES,
  validate(attributeSchema.addAttributeSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { prompt, code, image, attr_type, required, user_id, template_id } =
      req.body;

    const body = {
      prompt: prompt,
      code: code,
      image: image,
      attr_type: attr_type,
      required: required,
      attr_options: [],
      template_id: new ObjectId(template_id),
      created_at: new Date(),
      created_by: user_id,
      updated_at: new Date(),
    };

    view(
      { prompt: prompt, code: code, template_id: new ObjectId(template_id) },
      COLLECTION.ATTRIBUTES,
      (status, message, result) => {
        if (status) {
          return res.json({ status: false, message: RESPONSE.DATA });
        } else {
          insert(body, COLLECTION.ATTRIBUTES, (status1, message1, result1) => {
            if (status1) {
              let data = {
                $push: {
                  attribute_ids: result1.insertedId,
                },
              };

              update(
                { _id: new ObjectId(template_id) },
                data,
                COLLECTION.TEMPLATE,
                (status2, message2, result2) => {
                  return res.json({
                    status: status2,
                    message: message2,
                    result: result2,
                  });
                },
              );
            } else {
              return res.json({
                status: false,
                message: RESPONSE.FAILED,
              });
            }
          });
        }
      },
    );
  },
);

//Edit old global attributes
router.post(
  ATTRIBUTES.EDIT_ATTRIBUTES,
  validate(attributeSchema.editAttributeSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { prompt, code, image, attr_type, required, attribute_id } = req.body;

    const body = {
      $set: {
        prompt: prompt,
        code: code,
        image: image,
        attr_type: attr_type,
        required: required,
        updated_at: new Date(),
      },
    };

    update(
      { _id: new ObjectId(attribute_id) },
      body,
      COLLECTION.ATTRIBUTES,
      (status, message, result) => {
        return res.json({ status: status, message: message, result: result });
      },
    );
  },
);

//Delete old global attributes
router.post(
  ATTRIBUTES.DELETE_ATTRIBUTES,
  validate(attributeSchema.deleteAttributeSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { attribute_id, template_id } = req.body;

    deleteOne(
      { _id: new ObjectId(attribute_id) },
      COLLECTION.ATTRIBUTES,
      (status, message, result) => {
        if (status) {
          let body = {
            $pull: {
              attribute_ids: new ObjectId(attribute_id),
            },
          };

          update(
            { _id: new ObjectId(template_id) },
            body,
            COLLECTION.TEMPLATE,
            (status, message, result) => {
              return res.json({
                status: status,
                message: RESPONSE.DELETE,
                result: result,
              });
            },
          );
        } else {
          return res.json({ status: status, message: message, result: result });
        }
      },
    );
  },
);

//Add attributes from CSV
router.post(
  ATTRIBUTES.ADD_ATTRIBUTES_FROM_CSV,
  // filesvalidate(universal.importAndExportCsv),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { user_id } = req.body;
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then((csvrow) => {
        async function insetEverything(row) {
          let body = row.map((items) => ({
            prompt: items.prompt,
            code: items.code,
            image: items.image,
            old_id: items.ATTRIBUTE_ID,
            price: items.price,
            attr_type: items.attr_type,
            required: items.required === "FALSE" ? false : true,
            attr_options: [],
            status: 1,
            created_at: new Date(),
            created_by: user_id,
            updated_at: new Date(),
          }));

          insertManyBulk(
            COLLECTION.ATTRIBUTES,
            body,
            (status, message, result) => {
              return res.json({
                status: status,
                message: message,
                result: result,
              });
            },
          );
        }
        insetEverything(csvrow);
      });
  },
);

//Add attributes options from csv
router.post(
  API.ADMIN.ATTRIBUTES.ADD_ATTRIBUTES_OPTIONS_FROM_CSV,
  // filesvalidate(universal.importAndExportCsv),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { user_id } = req.body;
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then((csvrow) => {
        async function insetEverything(csvrow) {
          let body = await csvrow.map((item) => ({
            filter: {
              old_id: item.ATTRIBUTE_ID,
            },
            body: {
              $push: {
                attr_options: {
                  prompt: item.prompt,
                  code: item.code,
                  price: item.price,
                  defaults: false,
                },
              },
            },
          }));

          await updateManyBulk(
            COLLECTION.ATTRIBUTES,
            body,
            (status, message, result) => {
              return res.json({
                status: status,
                message: message,
                result: result,
              });
            },
          );
        }
        insetEverything(csvrow);
      });
  },
);

//Export all global attributes
router.post(
  ATTRIBUTES.SEND_ATTRIBUTES_TO_CSV,
  ensureAuthorisedAdmin,
  async (req, res) => {
    viewAll({}, COLLECTION.ATTRIBUTES, async (status, message, result) => {
      if (status && result.length > 0) {
        const json2csv = new Parser({
          fields: [
            "prompt",
            "code",
            "image",
            "attr_type",
            "label",
            "labelcode",
          ],
        });
        const csv = json2csv.parse(result);
        res.send(csv);
      } else {
        res.send(RESPONSE.NOT_FOUND);
      }
    });
  },
);

//Delete Global Attributes For Specific Product.
router.post(
  ATTRIBUTES.DELETE_GLOBAL_ATTRIBUTE_PRODUCT,
  ensureAuthorisedAdmin,
  (req, res) => {
    const { template_id, product_id } = req.body;

    let product_attr = {
      $pull: {
        global_attribute_ids: new ObjectId(template_id),
      },
    };
    update(
      { _id: new ObjectId(product_id) },
      product_attr,
      COLLECTION.PRODUCT,
      (status, message, result) => {
        res.json({
          status: status,
          message: RESPONSE.DELETE,
          result: result,
        });
      },
    );
  },
);

//Add Global Attributes For Specific Product.
router.post(
  ATTRIBUTES.ADD_PRODUCT_GLOBAL_ATTRIBUTES,
  validate(attributeSchema.addProductGlobalAttribute),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { global_attribute_id, product_id } = req.body;

    let product_global_attr = {
      $push: {
        global_attribute_ids: new ObjectId(global_attribute_id),
      },
    };

    update(
      { _id: new ObjectId(product_id) },
      product_global_attr,
      COLLECTION.PRODUCT,
      (status, message, result) => {
        res.json({
          status: status,
          message: message,
          result: result,
        });
      },
    );
  },
);

//view global attributes
router.post(
  ATTRIBUTES.VIEW_GLOBAL_ATTRIBUTE_PRODUCT,
  validate(attributeSchema.viewProductGlobalAttribute),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { attribute_ids } = req.body;

    const attribute = attribute_ids.map((item) => new ObjectId(item));

    if (attribute_ids.length) {
      viewInPaginationLookUp(
        [
          {
            $match: {
              _id: { $in: attribute },
            },
          },
          {
            $lookup: {
              from: COLLECTION.ATTRIBUTES,
              let: { attribute_id: "$attribute_ids" },
              pipeline: [
                {
                  $match: {
                    $expr: { $in: ["$_id", "$$attribute_id"] },
                  },
                },
                {
                  $addFields: {
                    sort: {
                      $indexOfArray: ["$$attribute_id", "$_id"],
                    },
                  },
                },
                { $sort: { sort: 1 } },
              ],
              as: "attributes",
            },
          },
          {
            $addFields: {
              sort: {
                $indexOfArray: [attribute, "$_id"],
              },
            },
          },
          { $sort: { sort: 1 } },
        ],
        COLLECTION.TEMPLATE,
        (status, message, result) => {
          if (status && result.length) {
            return res.json({
              status: status,
              message: message,
              result: result,
            });
          } else {
            return res.json({
              status: false,
              message: RESPONSE.NOT_FOUND,
              result: [],
            });
          }
        },
      );
    } else {
      return res.json({
        status: false,
        message: RESPONSE.NOT_FOUND,
        result: [],
      });
    }
  },
);

module.exports = router;
