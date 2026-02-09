const express = require("express");
const router = express.Router();

const config = require("../../config/config");
const validate = require("../../validation");
const filesvalidate = require("../../validation/fileValidation");
const { ensureAuthorisedAdmin } = require("../../auth");
const templateSchema = require("../../schema/template");
const universal = require("../../schema/universal");
const {
  viewInPaginationLookUp,
} = require("../../mongo-qury/aggregateFindAllinPagination");
const {
  insertManyBulk,
  insetIdBulk,
} = require("../../mongo-qury/bulkOperation");
const { view } = require("../../mongo-qury/viewOne");
const { insert } = require("../../mongo-qury/insertOne");
const { ObjectId } = require("mongodb");
const { update } = require("../../mongo-qury/updateOne");
const { updateMany } = require("../../mongo-qury/updateMany");
const { deleteOne } = require("../../mongo-qury/deleteOne");
const { viewAll } = require("../../mongo-qury/findAll");
const csvtojson = require("csvtojson");

const { API, COLLECTION, RESPONSE } = config;

const { TEMPLATE } = API.ADMIN;

//Add new template
router.post(
  TEMPLATE.ADD_TEMPLATE,
  validate(templateSchema.addTemplateSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { prompt, code, user_id } = req.body;

    const body = {
      prompt: prompt,
      code: code,
      attribute_ids: [],
      status: 1,
      created_at: new Date(),
      created_by: user_id,
      updated_at: new Date(),
    };

    view({ prompt: prompt }, COLLECTION.TEMPLATE, (status, message, result) => {
      if (status) {
        res.json({ status: false, message: RESPONSE.DATA });
      } else {
        insert(body, COLLECTION.TEMPLATE, (status1, message1, result1) => {
          res.json({
            status: status1,
            message: message1,
            result: result1,
          });
        });
      }
    });
  },
);

//View all template in Pagination admin
router.post(
  TEMPLATE.VIEW_TEMPLATE,
  validate(universal.viewAdminSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { limit, startingAfter, searchKeyWord } = req.body;

    if (!searchKeyWord) {
      viewInPaginationLookUp(
        [
          { $sort: { _id: -1 } },
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
            $facet: {
              result: [
                { $skip: parseInt(startingAfter) },
                { $limit: parseInt(limit) },
              ],
              total: [{ $count: "total" }],
            },
          },
          { $unwind: "$total" },
        ],
        COLLECTION.TEMPLATE,
        (status, message, result) => {
          if (result.length) {
            if (result[0].result.length) {
              return res.json({
                status: status,
                message: message,
                result: result[0].result,
                total: result[0].total.total,
              });
            } else {
              return res.json({
                status: status,
                message: message,
                result: [],
                total: 0,
              });
            }
          } else {
            return res.json({
              status: status,
              message: message,
              result: [],
              total: 0,
            });
          }
        },
      );
    } else {
      viewInPaginationLookUp(
        [
          { $sort: { _id: -1 } },
          {
            $match: {
              $or: [
                {
                  prompt: {
                    $regex: searchKeyWord,
                    $options: "i",
                  },
                },
                {
                  code: {
                    $regex: searchKeyWord,
                    $options: "i",
                  },
                },
              ],
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
            $facet: {
              result: [
                { $skip: parseInt(startingAfter) },
                { $limit: parseInt(limit) },
              ],
              total: [{ $count: "total" }],
            },
          },
          { $unwind: "$total" },
        ],
        COLLECTION.TEMPLATE,
        (status, message, result) => {
          if (result.length) {
            if (result[0].result.length) {
              return res.json({
                status: status,
                message: message,
                result: result[0].result,
                total: result[0].total.total,
              });
            } else {
              return res.json({
                status: status,
                message: message,
                result: [],
                total: 0,
              });
            }
          } else {
            return res.json({
              status: status,
              message: message,
              result: [],
              total: 0,
            });
          }
        },
      );
    }
  },
);

router.post("/view-template-details", ensureAuthorisedAdmin, (req, res) => {
  const { template_id } = req.body;

  viewInPaginationLookUp(
    [
      {
        $match: { _id: new ObjectId(template_id) },
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
            {
              $project: {
                created_at: 0,
                created_by: 0,
                updated_at: 0,
              },
            },
          ],
          as: "attributes",
        },
      },
      {
        $project: {
          attribute_ids: 0,
          status: 0,
          created_at: 0,
          created_by: 0,
          updated_at: 0,
        },
      },
    ],
    COLLECTION.TEMPLATE,
    (status, message, result) => {
      if (result.length) {
        return res.json({
          status: status,
          message: message,
          result: result[0],
        });
      } else {
        return res.json({
          status: status,
          message: message,
          result: null,
        });
      }
    },
  );
});

//View product template
router.post(
  "/view_product_template",
  validate(universal.viewAdminSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { limit, startingAfter, searchKeyWord, status, template_ids } =
      req.body;

    let filter = [];

    let facet = {
      $facet: {
        result: [
          { $skip: parseInt(startingAfter) },
          { $limit: parseInt(limit) },
        ],
        total: [{ $count: "total" }],
      },
    };

    let project = {
      $project: {
        prompt: 1,
        code: 1,
      },
    };

    const string = searchKeyWord.split(" ").filter((item) => {
      return Boolean(item);
    });
    const path = string.length > 1 ? ["prompt"] : ["prompt", "code"];

    let search = {
      $search: {
        index: "attribute",
        compound: {
          must: [{ text: { query: string, path: path } }],
          should: [{ text: { query: string, path: path } }],
          filter: [
            {
              text: {
                query: string,
                path: ["prompt", "code"],
                fuzzy: {
                  maxEdits: 2,
                  prefixLength: 10,
                  maxExpansions: 100,
                },
              },
            },
          ],
        },
      },
    };

    if (status === 0) {
      if (!searchKeyWord) {
        filter = [
          {
            $match: {
              _id: { $in: template_ids.map((item) => new ObjectId(item)) },
            },
          },
          { $sort: { _id: -1 } },
          project,
          facet,
        ];
      } else {
        filter = [
          search,
          {
            $match: {
              _id: { $in: template_ids.map((item) => new ObjectId(item)) },
            },
          },
          project,
          facet,
        ];
      }
    } else if (status === 1) {
      if (!searchKeyWord) {
        filter = [
          {
            $match: {
              _id: { $nin: template_ids.map((item) => new ObjectId(item)) },
            },
          },
          { $sort: { _id: -1 } },
          project,
          facet,
        ];
      } else {
        filter = [
          search,
          {
            $match: {
              _id: { $nin: template_ids.map((item) => new ObjectId(item)) },
            },
          },
          project,
          facet,
        ];
      }
    } else {
      if (!searchKeyWord) {
        filter = [{ $sort: { _id: -1 } }, project, facet];
      } else {
        filter = [search, project, facet];
      }
    }

    viewInPaginationLookUp(
      filter,
      COLLECTION.TEMPLATE,
      (status, message, result) => {
        if (result.length) {
          if (result[0].result.length) {
            return res.json({
              status: status,
              message: message,
              result: result[0].result,
              total: result[0].total[0].total,
            });
          } else {
            return res.json({
              status: status,
              message: message,
              result: [],
              total: 0,
            });
          }
        } else {
          return res.json({
            status: status,
            message: message,
            result: [],
            total: 0,
          });
        }
      },
    );
  },
);

//Update old template
router.post(
  TEMPLATE.EDIT_TEMPLATE,
  validate(templateSchema.editTemplateSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { prompt, code, template_id } = req.body;

    const body = {
      $set: {
        prompt: prompt,
        code: code,
        updated_at: new Date(),
      },
    };

    update(
      { _id: new ObjectId(template_id) },
      body,
      COLLECTION.TEMPLATE,
      (status, message, result) => {
        res.json({ status: status, message: message, result: result });
      },
    );
  },
);

//Delete old template
router.post(
  TEMPLATE.DELETE_TEMPLATE,
  validate(templateSchema.deleteTemplateSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { template_id } = req.body;

    deleteOne(
      { _id: new ObjectId(template_id) },
      COLLECTION.TEMPLATE,
      (status, message, result) => {
        res.json({ status: status, message: message, result: result });
      },
    );
  },
);

//Assign and Unassign template
router.post(
  TEMPLATE.ASSGINED_UNASSIGNED_TEMPLATE,
  validate(universal.assigneUnassignedSchema),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { _id, status } = req.body;

    const template_id = await _id.map((item) => new ObjectId(item));

    let filter = { _id: { $in: template_id } };

    let body = {
      $set: { status: status },
    };

    updateMany(filter, body, COLLECTION.TEMPLATE, (status, message, result) => {
      res.json({ status: status, message: message, result: result });
    });
  },
);

//Add template from CSV
router.post(
  TEMPLATE.ADD_TEMPLATE_FROM_CSV,
  filesvalidate(universal.importAndExportCsv),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { user_id } = req.body;
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then((csvrow) => {
        async function insetEverything(row) {
          let body = row.map((items) => ({
            code: items.template_code,
            prompt: items.template_prompt,
            old_id: items.template_id,
            attribute_ids: [],
            status: 1,
            created_at: new Date(),
            created_by: user_id,
            updated_at: new Date(),
          }));

          insertManyBulk(
            COLLECTION.TEMPLATE,
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

//Add Template attribute from csv
router.post(
  TEMPLATE.ADD_TEMPLATE_ATTRIBUTE_FROM_CSV,
  filesvalidate(universal.importAndExportCsv),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then((csvrow) => {
        async function insetEverything(csvrow) {
          let body = await csvrow.map((item) => ({
            filter1: {
              old_id: item.ATTRIBUTE_ID,
            },
            filter2: {
              old_id: item.TEMPLATE_ID,
            },
          }));

          await insetIdBulk(
            COLLECTION.ATTRIBUTES,
            COLLECTION.TEMPLATE,
            body,
            "attribute_ids",
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

//View all template
router.post(TEMPLATE.VIEW_ALL_TEMPLATE, ensureAuthorisedAdmin, (req, res) => {
  viewAll(
    {
      status: 1,
    },
    COLLECTION.TEMPLATE,
    (status, message, result) => {
      if (result.length) {
        return res.json({
          status: status,
          message: message,
          result: result,
        });
      } else {
        return res.json({
          status: status,
          message: message,
          result: [],
        });
      }
    },
  );
});

module.exports = router;
