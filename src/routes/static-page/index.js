const express = require("express");
const router = express.Router();

const config = require("../../config/config");
const validate = require("../../validation");
const { ensureAuthorisedAdmin } = require("../../auth");
const staticSchema = require("../../schema/aogproviderbe/static-page");
const universal = require("../../schema/universal");
const {
  viewInPaginationLookUp,
} = require("../../mongo-qury/aggregateFindAllinPagination");
const { view } = require("../../mongo-qury/viewOne");
const { insert } = require("../../mongo-qury/insertOne");
const { ObjectId } = require("mongodb");
const { update } = require("../../mongo-qury/updateOne");
const { deleteOne } = require("../../mongo-qury/deleteOne");

const { COLLECTION, RESPONSE } = config;

//Add new static-template
router.post(
  "/add",
  validate(staticSchema.add),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { title, code, left_side, right_side, category_ids, user_id } =
      req.body;

    const body = {
      title,
      code,
      left_side,
      right_side,
      category_ids: category_ids.map((item) => new ObjectId(item)),
      status: 1,
      created_at: new Date(),
      created_by: user_id,
    };

    view({ title: title }, COLLECTION.STATIC_TEMPLATE, (status) => {
      if (status) {
        res.json({ status: false, message: RESPONSE.DATA, result: null });
      } else {
        insert(
          body,
          COLLECTION.STATIC_TEMPLATE,
          (status1, message1, result1) => {
            res.json({
              status: status1,
              message: message1,
              result: result1,
            });
          },
        );
      }
    });
  },
);

//View all static-template in Pagination admin
router.post(
  "/view",
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
              from: COLLECTION.CATEGORY,
              let: { category_id: "$category_ids" },
              pipeline: [
                {
                  $match: {
                    $expr: { $in: ["$_id", "$$category_id"] },
                  },
                },
                {
                  $addFields: {
                    sort: {
                      $indexOfArray: ["$$category_id", "$_id"],
                    },
                  },
                },
                { $sort: { sort: 1 } },
                {
                  $project: {
                    _id: 1,
                    code: 1,
                  },
                },
              ],
              as: "categories",
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
        COLLECTION.STATIC_TEMPLATE,
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
          {
            $match: {
              $or: [
                {
                  title: {
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
              from: COLLECTION.CATEGORY,
              let: { category_id: "$category_ids" },
              pipeline: [
                {
                  $match: {
                    $expr: { $in: ["$_id", "$$category_id"] },
                  },
                },
                {
                  $addFields: {
                    sort: {
                      $indexOfArray: ["$$category_id", "$_id"],
                    },
                  },
                },
                { $sort: { sort: 1 } },
                {
                  $project: {
                    _id: 1,
                    code: 1,
                  },
                },
              ],
              as: "categories",
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
        COLLECTION.STATIC_TEMPLATE,
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

//Update old static-template
router.post(
  "/edit",
  validate(staticSchema.edit),
  ensureAuthorisedAdmin,
  (req, res) => {
    const {
      left_side,
      right_side,
      code,
      title,
      category_ids,
      static_id,
      user_id,
    } = req.body;

    const body = {
      $set: {
        title,
        code,
        left_side,
        right_side,
        category_ids: category_ids.map((item) => new ObjectId(item)),
        update_by: user_id,
        updated_at: new Date(),
      },
    };

    update(
      { _id: new ObjectId(static_id) },
      body,
      COLLECTION.STATIC_TEMPLATE,
      (status, message, result) => {
        return res.json({ status, message, result });
      },
    );
  },
);

//Delete old static-template
router.post(
  "/delete",
  validate(staticSchema.delete),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { static_id } = req.body;

    deleteOne(
      { _id: new ObjectId(static_id) },
      COLLECTION.STATIC_TEMPLATE,
      (status, message, result) => {
        return res.json({ status, message, result });
      },
    );
  },
);

module.exports = router;
