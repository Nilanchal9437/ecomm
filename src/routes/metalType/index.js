const express = require("express");
const router = express.Router();

const config = require("../../config/config");
const validate = require("../../validation");
const { ensureAuthorisedAdmin } = require("../../auth");
const schema = require("../../schema/metalType");
const universal = require("../../schema/universal");
const { view } = require("../../mongo-qury/viewOne");
const { insert } = require("../../mongo-qury/insertOne");
const {
  viewInPaginationLookUp,
} = require("../../mongo-qury/aggregateFindAllinPagination");
const { viewAll } = require("../../mongo-qury/findAll");
const { ObjectId } = require("mongodb");
const { update } = require("../../mongo-qury/updateOne");
const { deleteOne } = require("../../mongo-qury/deleteOne");
const { updateMany } = require("../../mongo-qury/updateMany");

const { COLLECTION, RESPONSE } = config;

router.post("/add", validate(schema.add), ensureAuthorisedAdmin, (req, res) => {
  const { name, code, row, user_id } = req.body;

  const body = {
    name: name,
    code: code,
    status: 1,
    row: row,
    created_at: new Date(),
    created_by: user_id,
    updated_at: new Date(),
  };

  view({ name: name }, COLLECTION.METALTYPE, (status, message, result) => {
    if (status) {
      return res.json({ status: false, message: RESPONSE.DATA });
    } else {
      insert(body, COLLECTION.METALTYPE, (status1, message1, result1) => {
        return res.json({
          status: status1,
          message: message1,
          result: result1,
        });
      });
    }
  });
});

router.post(
  "/view",
  validate(universal.viewAdminSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { limit, startingAfter, searchKeyWord } = req.body;
    if (!searchKeyWord) {
      viewInPaginationLookUp(
        [
          { $sort: { row: 1 } },
          {
            $facet: {
              result: [
                { $skip: parseInt(startingAfter) },
                { $limit: parseInt(limit) },
              ],
              total: [{ $count: "total" }],
            },
          },
        ],
        COLLECTION.METALTYPE,
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
    } else {
      viewInPaginationLookUp(
        [
          {
            $match: {
              $or: [
                {
                  name: {
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
            $facet: {
              result: [
                { $skip: parseInt(startingAfter) },
                { $limit: parseInt(limit) },
              ],
              total: [{ $count: "total" }],
            },
          },
        ],
        COLLECTION.METALTYPE,
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
    }
  },
);

router.post(
  "/edit",
  validate(schema.edit),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { name, code, _id } = req.body;

    const body = {
      $set: {
        name: name,
        code: code,
        updated_at: new Date(),
      },
    };

    update(
      { _id: new ObjectId(_id) },
      body,
      COLLECTION.METALTYPE,
      (status, message, result) => {
        return res.json({ status: status, message: message, result: result });
      },
    );
  },
);

router.post(
  "/delete",
  validate(schema.delete),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { _id } = req.body;

    deleteOne(
      { _id: new ObjectId(_id) },
      COLLECTION.METALTYPE,
      (status1, message1, result1) => {
        return res.json({
          status: status1,
          message: message1,
          result: result1,
        });
      },
    );
  },
);

router.post(
  "/active",
  validate(universal.assigneUnassignedSchema),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { _id } = req.body;

    const metaltype_id = await _id.map((item) => new ObjectId(item));

    let filter = { _id: { $in: metaltype_id } };

    let body = {
      $set: { status: 1 },
    };

    updateMany(
      filter,
      body,
      COLLECTION.METALTYPE,
      (status, message, result) => {
        return res.json({ status: status, message: message, result: result });
      },
    );
  },
);

router.post(
  "/inactive",
  validate(universal.assigneUnassignedSchema),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { _id } = req.body;

    const metaltype_id = await _id.map((item) => new ObjectId(item));

    let filter = { _id: { $in: metaltype_id } };

    let body = {
      $set: { status: 0 },
    };

    updateMany(
      filter,
      body,
      COLLECTION.METALTYPE,
      (status, message, result) => {
        res.json({ status: status, message: message, result: result });
      },
    );
  },
);

router.get("/view-all-metal-type", (req, res) => {
  viewAll({ status: 1 }, COLLECTION.METALTYPE, (status, message, result) => {
    return res.json({ status, message, result });
  });
});
module.exports = router;
