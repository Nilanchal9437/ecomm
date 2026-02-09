const express = require("express");
const router = express.Router();
const config = require("../../config/config");
const validate = require("../../validation");
const { ensureAuthorisedAdmin } = require("../../auth");
const marketing = require("../../../schema/aogproviderbe/marketing-feed");
const { viewAsync } = require("../../mongo-qury/viewOne");
const { insertAsync } = require("../../mongo-qury/insertOne");
const { updateAsync } = require("../../mongo-qury/updateOne");
const { deleteOne } = require("../../mongo-qury/deleteOne");
const { ObjectId } = require("mongodb");
const universal = require("../../schema/universal");
const {
  viewInPaginationLookUp,
} = require("../../mongo-qury/aggregateFindAllinPagination");
const { Parser } = require("json2csv");
const { COLLECTION } = config;

router.post(
  "/add",
  validate(marketing.add),
  ensureAuthorisedAdmin,
  async (req, res) => {
    try {
      const {
        name,
        code,
        feed,
        assign_products,
        user_id,
        product_map,
        filename,
      } = req.body;

      const { status: feedStatus } = await viewAsync(
        { name: name },
        COLLECTION.MARKETINGFEED,
      );

      if (feedStatus) {
        return res.json({
          status: false,
          message: "This marketing feed is already present please try again",
          result,
        });
      } else {
        const body = {
          name,
          code,
          feed,
          filename,
          assign_products: await assign_products.map(
            (item) => new ObjectId(item),
          ),
          product_map,
          created_at: new Date(),
          status: 1,
          created_by: new ObjectId(user_id),
        };

        const { status, message, result } = await insertAsync(
          body,
          COLLECTION.MARKETINGFEED,
        );

        return res.json({ status, message, result });
      }
    } catch (err) {
      return res.json({
        status: false,
        message: "Can't add marketing feed right now please try again later!",
        result: err,
      });
    }
  },
);

router.post(
  "/edit",
  validate(marketing.edit),
  ensureAuthorisedAdmin,
  async (req, res) => {
    try {
      const {
        name,
        code,
        feed,
        assign_products,
        user_id,
        feed_id,
        product_map,
        filename,
      } = req.body;

      const body = {
        $set: {
          name,
          code,
          feed,
          filename,
          assign_products: await assign_products.map(
            (item) => new ObjectId(item),
          ),
          product_map,
          updated_at: new Date(),
          updated_by: new ObjectId(user_id),
        },
      };

      const { status, message, result } = await updateAsync(
        { _id: new ObjectId(feed_id) },
        body,
        COLLECTION.MARKETINGFEED,
      );

      return res.json({ status, message, result });
    } catch (err) {
      return res.json({
        status: false,
        message: "Can't edit marketing feed right now please try again later!",
        result: err,
      });
    }
  },
);

router.post(
  "/delete",
  validate(marketing.delete),
  ensureAuthorisedAdmin,
  async (req, res) => {
    try {
      const { feed_id } = req.body;

      deleteOne(
        { _id: new ObjectId(feed_id) },
        COLLECTION.MARKETINGFEED,
        (status, message, result) => {
          return res.json({ status, message, result });
        },
      );
    } catch (err) {
      return res.json({
        status: false,
        message: "Can't delete marketing feed right now please try again!",
        result: err,
      });
    }
  },
);

router.post(
  "/view",
  validate(universal.viewAdminSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { limit, startingAfter, searchKeyWord } = req.body;

    let filter = [];
    if (!searchKeyWord) {
      filter = [
        { $sort: { _id: -1 } },
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
      ];
    } else {
      filter = [
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
          $facet: {
            result: [
              { $skip: parseInt(startingAfter) },
              { $limit: parseInt(limit) },
            ],
            total: [{ $count: "total" }],
          },
        },
        {
          $unwind: "$total",
        },
      ];
    }

    viewInPaginationLookUp(
      filter,
      COLLECTION.MARKETINGFEED,
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
  },
);

router.post(
  "/download",
  validate(marketing.delete),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { feed_id } = req.body;

    viewInPaginationLookUp(
      [
        {
          $match: {
            _id: new ObjectId(feed_id),
          },
        },
        {
          $lookup: {
            from: COLLECTION.PRODUCT,
            let: { assign_products_ids: "$assign_products" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$assign_products_ids"],
                  },
                },
              },
              {
                $addFields: {
                  sort: {
                    $indexOfArray: ["$$assign_products_ids", "$_id"],
                  },
                },
              },
              { $sort: { sort: 1 } },
            ],
            as: "products",
          },
        },
      ],
      COLLECTION.MARKETINGFEED,
      (status, message, result) => {
        if (result.length) {
          if (result[0]) {
            const feeds = result[0].feed
              .split(",")
              .reduce((object, string, index) => {
                let string__part = string.split("=");
                if (string__part[0] && string__part[1]) {
                  object[
                    string__part[1].replace(/[&\/\\#,+()$~%.'":*?<>{}\n]/g, "")
                  ] = string__part[0].replace(
                    /[&\/\\#,+()$~%.'":*?<>{}\n]/g,
                    "",
                  );
                }
                return object;
              }, {});

            const product = new Array();

            for (let i = 0; i < result[0].products.length; i++) {
              let final = [];
              Object.keys(feeds).filter((keys) => {
                if (keys === "product_map") {
                  result[0].product_map.map((item) => {
                    let string__part = item.prd_sku.split(/\W+/);

                    if (
                      Boolean(
                        string__part.find((data) =>
                          Boolean(result[0].products[i].sku.match(data)),
                        ),
                      )
                    ) {
                      final.push({
                        [feeds[keys]]: item.prd_map,
                      });
                    }
                  });
                } else {
                  if (
                    Boolean(result[0].products[i][keys]) ||
                    result[0].products[i][keys] === 0
                  ) {
                    let data = result[0].products[i][keys];
                    if (Boolean(keys === "description")) {
                      data = data.replace(/<(.|\n)*?>/g, "");
                      final.push({
                        [feeds[keys]]: data,
                      });
                    } else {
                      final.push({
                        [feeds[keys]]: data,
                      });
                    }
                  } else {
                    final.push({
                      [feeds[keys]]: keys,
                    });
                  }
                }
              });

              let main = {};
              final.map((item) => Object.assign(main, item));
              product.push({ ...main });
            }

            const json2csv = new Parser({
              fields: Object.keys(product[0]),
            });
            const csv = json2csv.parse(product);

            return res.send(csv);
          } else {
            return res.send("product may not be found");
          }
        } else {
          return res.send("product may not be found");
        }
      },
    );
  },
);

module.exports = router;
