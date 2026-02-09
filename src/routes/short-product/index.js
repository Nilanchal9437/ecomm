const express = require("express");
const router = express.Router();

const { ObjectId } = require("mongodb");

const config = require("../../config/config");
const { ensureAuthorisedAdmin } = require("../../auth");
const {
  viewInPaginationLookUp,
  viewAsyncPaginationLookUp,
} = require("../../mongo-qury/aggregateFindAllinPagination");
const { updateAsync } = require("../../mongo-qury/updateOne");
const { viewAsync } = require("../../mongo-qury/viewOne");
const { AsyncViewAll } = require("../../mongo-qury/findAll");
const server = require("../../database/connect");
const { COLLECTION, RESPONSE } = config;

//Get short
router.post("/view", ensureAuthorisedAdmin, async (req, res) => {
  const { category_id, startingAfter, limit } = req.body;

  try {
    const filter = [
      {
        $match: {
          category_id: new ObjectId(category_id),
        },
      },
      {
        $lookup: {
          from: COLLECTION.PRODUCT,
          localField: "product_id",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                product_name: 1,
                sku: 1,
                price: 1,
                sold: 1,
              },
            },
          ],
          as: "products",
        },
      },
      {
        $unwind: {
          path: "$products",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $project: { _id: 1, products: 1, sort: 1 } },
      { $sort: { sort: 1 } },
      {
        $facet: {
          result: [
            {
              $project: {
                _id: 1,
                product_id: "$products._id",
                product_name: "$products.product_name",
                sku: "$products.sku",
                price: "$products.price",
                sold: "$products.sold",
                sort: 1,
              },
            },
            { $skip: parseInt(startingAfter) },
            { $limit: parseInt(limit) },
          ],
          total: [{ $count: "total" }],
        },
      },
      { $unwind: "$total" },
    ];

    viewInPaginationLookUp(
      filter,
      COLLECTION.PRODUCT_CATEGORY,
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
  } catch (err) {
    console.log(err);
    return res.json({
      status: false,
      message: RESPONSE.FAILED,
      result: [],
      total: 0,
    });
  }
});

router.post("/update-sort", ensureAuthorisedAdmin, async (req, res) => {
  const { category_id, sort_by } = req.body;

  try {
    let sort = {};
    if (sort_by === "code_descending") {
      sort = { sku: -1 };
    } else if (sort_by === "code_ascending") {
      sort = { sku: 1 };
    } else if (sort_by === "price_descending") {
      sort = { price: -1 };
    } else if (sort_by === "price_ascending") {
      sort = { price: 1 };
    } else if (sort_by === "quantity_sold_ascending") {
      sort = { sold: 1 };
    } else if (sort_by === "quantity_sold_descending") {
      sort = { sold: -1 };
    } else if (sort_by === "date_descending") {
      sort = { created_at: -1 };
    } else if (sort_by === "date_ascending") {
      sort = { created_at: 1 };
    } else {
      sort = { sort: 1 };
    }

    const updateFilter = [
      { $match: { category_id: new ObjectId(category_id) } },
      {
        $lookup: {
          from: COLLECTION.PRODUCT,
          localField: "product_id",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                product_name: 1,
                sku: 1,
                price: 1,
                sold: 1,
              },
            },
          ],
          as: "products",
        },
      },
      {
        $unwind: {
          path: "$products",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $project: { _id: 1, products: 1, sort: 1 } },
      {
        $facet: {
          result: [
            {
              $project: {
                _id: 1,
                product_id: "$products._id",
                product_name: "$products.product_name",
                sku: "$products.sku",
                price: "$products.price",
                sold: "$products.sold",
                sort: 1,
              },
            },
            { $sort: sort },
          ],
        },
      },
    ];

    const { result } = await viewAsyncPaginationLookUp(
      updateFilter,
      COLLECTION.PRODUCT_CATEGORY,
    );

    async function updateData(result) {
      if (result.length) {
        if (result[0]?.result?.length > 0) {
          let bulk = await server
            .collection(COLLECTION.PRODUCT_CATEGORY)
            .initializeOrderedBulkOp();

          await result[0]?.result?.map((item, index) =>
            bulk.find({ _id: item._id }).updateOne({ $set: { sort: index } }),
          );

          await bulk.execute((err, doc) => {
            if (err) {
              console.error(err);
              return res.json({
                status: false,
                message: RESPONSE.FAILED,
                result: err.message,
              });
            } else {
              if (doc) {
                return res.json({
                  status: true,
                  message: RESPONSE.EDIT,
                  result: doc,
                });
              } else {
                return res.json({
                  status: false,
                  message: RESPONSE.NOT_FOUND,
                  result: null,
                });
              }
            }
          });
        } else {
          return res.json({
            status: false,
            message: RESPONSE.FAILED,
            result: null,
          });
        }
      } else {
        return res.json({
          status: false,
          message: RESPONSE.FAILED,
          result: null,
        });
      }
    }

    await updateData(result);
  } catch (err) {
    console.log(err);
    return res.json({
      status: false,
      message: RESPONSE.FAILED,
      result: null,
    });
  }
});

router.post("/update-order", ensureAuthorisedAdmin, async (req, res) => {
  const { shorting } = req.body;

  let bulk = await server
    .collection(COLLECTION.PRODUCT_CATEGORY)
    .initializeOrderedBulkOp();

  await shorting?.map((item) =>
    bulk
      .find({ _id: ObjectId(item._id) })
      .updateOne({ $set: { sort: item.sort } }),
  );

  await bulk.execute((err, doc) => {
    if (err) {
      console.error(err);
      return res.json({
        status: false,
        message: RESPONSE.FAILED,
        result: err.message,
      });
    } else {
      if (doc) {
        return res.json({
          status: true,
          message: RESPONSE.EDIT,
          result: doc,
        });
      } else {
        return res.json({
          status: false,
          message: RESPONSE.NOT_FOUND,
          result: null,
        });
      }
    }
  });
});

module.exports = router;
