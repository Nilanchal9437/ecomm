const router = require("../../app");
const config = require("../../config/config");
const validate = require("../../validation");
const { ensureAuthorisedAdmin } = require("../../auth");
const filesvalidate = require("../../validation/fileValidation");
const productMeta = require("../../../schema/aogproviderbe/product_meta");
const universal = require("../../schema/universal");
const { view } = require("../../mongo-qury/viewOne");
const { insert } = require("../../mongo-qury/insertOne");
const {
  viewInPaginationLookUp,
} = require("../../mongo-qury/aggregateFindAllinPagination");
const { update } = require("../../mongo-qury/updateOne");
const { deleteOne } = require("../../mongo-qury/deleteOne");
const { viewAll } = require("../../mongo-qury/findAll");
const { insertManyBulk } = require("../../mongo-qury/bulkOperation");
const {
  findProduct,
  findAllProduct,
  findObjectId,
} = require("../../modules/csv_modules");
const csvtojson = require("csvtojson");
const { Parser } = require("json2csv");
const { ObjectId } = require("mongodb");

const { API, COLLECTION, RESPONSE } = config;

router.post(
  API.ADMIN.PRODUCT_META.ADD_PRODUCT_META,
  validate(productMeta.addProductMetaSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { prd_id, meta_keyword, meta_desc, meta_title, user_id } = req.body;

    const body = {
      prd_id: new ObjectId(prd_id),
      meta_keyword: meta_keyword,
      meta_desc: meta_desc,
      meta_title: meta_title,
      created_by: user_id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    view(
      { meta_title: meta_title },
      COLLECTION.PRODUCT_META,
      (status, message, result) => {
        if (status) {
          res.json({
            status: false,
            message: RESPONSE.DATA,
          });
        } else {
          insert(
            body,
            COLLECTION.PRODUCT_META,
            (status1, message1, result1) => {
              res.json({
                status: status1,
                message: message1,
                result: result1,
              });
            },
          );
        }
      },
    );
  },
);

router.post(
  API.ADMIN.PRODUCT_META.VIEW_PRODUCT_META,
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
              from: COLLECTION.PRODUCT,
              localField: "prd_id",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              sku: "$product.sku",
              meta_desc: 1,
              meta_keyword: 1,
              meta_title: 1,
              prd_id: 1,
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
        COLLECTION.PRODUCT_META,
        (status, message, result) => {
          if (result.length) {
            if (result[0].result.length > 0) {
              res.json({
                status: status,
                message: message,
                result: result[0].result,
                total: result[0].total[0].total,
              });
            } else {
              res.json({
                status: status,
                message: message,
                result: [],
                total: 0,
              });
            }
          } else {
            res.json({
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
                  meta_keyword: {
                    $regex: searchKeyWord,
                    $options: "i",
                  },
                },
                {
                  meta_desc: {
                    $regex: searchKeyWord,
                    $options: "i",
                  },
                },
                {
                  meta_title: {
                    $regex: searchKeyWord,
                    $options: "i",
                  },
                },
              ],
            },
          },
          { $sort: { _id: -1 } },
          {
            $lookup: {
              from: COLLECTION.PRODUCT,
              localField: "prd_id",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: "$product" },
          {
            $project: {
              sku: "$product.sku",
              meta_desc: 1,
              meta_keyword: 1,
              meta_title: 1,
              prd_id: 1,
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
        COLLECTION.PRODUCT_META,
        (status, message, result) => {
          if (result.length) {
            if (result[0].result.length > 0) {
              res.json({
                status: status,
                message: message,
                result: result[0].result,
                total: result[0].total[0].total,
              });
            } else {
              res.json({
                status: status,
                message: message,
                result: [],
                total: 0,
              });
            }
          } else {
            res.json({
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
  API.ADMIN.PRODUCT_META.EDIT_PRODUCT_META,
  validate(productMeta.editProductMetaSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { prd_id, meta_keyword, meta_desc, meta_title, meta_id } = req.body;

    const body = {
      $set: {
        prd_id: new ObjectId(prd_id),
        meta_keyword: meta_keyword,
        meta_desc: meta_desc,
        meta_title: meta_title,
        updated_at: new Date(),
      },
    };

    view(
      { _id: new ObjectId(meta_id) },
      COLLECTION.PRODUCT_META,
      (status, message, result) => {
        if (status) {
          update(
            { _id: new ObjectId(meta_id) },
            body,
            COLLECTION.PRODUCT_META,
            (status1, message1, result1) => {
              res.json({ status: status1, message: message1, result: result1 });
            },
          );
        } else {
          res.json({ status: status, message: message, result: result });
        }
      },
    );
  },
);

router.post(
  API.ADMIN.PRODUCT_META.DELETE_PRODUCT_META,
  validate(productMeta.deleteProductMetaSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { meta_id } = req.body;

    view(
      { _id: new ObjectId(meta_id) },
      COLLECTION.PRODUCT_META,
      (status, message, result) => {
        if (status) {
          deleteOne(
            { _id: new ObjectId(meta_id) },
            COLLECTION.PRODUCT_META,
            (status1, message1, result1) => {
              res.json({ status: status1, message: message1, result: result1 });
            },
          );
        } else {
          res.json({ status: status, message: message, result: result });
        }
      },
    );
  },
);

router.post(
  API.ADMIN.PRODUCT_META.ADD_PRODUCT_META_FROM_CSV,
  filesvalidate(universal.importAndExportCsv),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { user_id } = req.body;
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then((csvrow) => {
        async function insetEverything(row) {
          if (row !== undefined && row !== null && row.length) {
            let body = new Array();
            let i = 0;

            for (i; i < row.length; i++) {
              body.push({
                meta_keyword: row[i]?.meta_keyword,
                meta_desc: row[i]?.meta_desc,
                prd_id: await findObjectId(COLLECTION.PRODUCT, {
                  old_id: row[i]?.prd_id,
                }),
                meta_title: "",
                created_at: new Date(),
                created_by: user_id,
                updated_at: new Date(),
              });
            }

            await insertManyBulk(
              COLLECTION.PRODUCT_META,
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
        }
        insetEverything(csvrow);
      });

    // await csvtojson()
    //   .fromString(csv.data.toString("utf8"))
    //   .then((csvrow) => {
    //     if (csvrow.length > 0) {
    //       if (
    //         csvrow[0].hasOwnProperty("product_nm") &&
    //         csvrow[0].hasOwnProperty("meta_desc") &&
    //         csvrow[0].hasOwnProperty("meta_title") &&
    //         csvrow[0].hasOwnProperty("meta_keyword")
    //       ) {
    //         const valid = csvrow.find(
    //           (item) =>
    //             item.meta_title === "" ||
    //             item.meta_keyword === "" ||
    //             item.meta_desc === ""
    //         );

    //         const validIndex =
    //           csvrow.findIndex(
    //             (item) =>
    //               item.meta_title === "" ||
    //               item.meta_keyword === "" ||
    //               item.meta_desc === ""
    //           ) + 2;

    //         if (
    //           valid !== undefined &&
    //           valid !== null &&
    //           valid !== "" &&
    //           (valid.meta_title === "" ||
    //             valid.meta_keyword === "" ||
    //             valid.meta_desc === "")
    //         ) {
    //           res.json({
    //             status: false,
    //             message: `In line ${validIndex} some paramter is missing`,
    //             result: [],
    //           });
    //         } else {
    //           let row = [];

    //           let filter = {
    //             meta_title: {
    //               $in: csvrow.map((item) => item.meta_title),
    //             },
    //           };

    //           viewAll(
    //             filter,
    //             COLLECTION.PRODUCT_META,
    //             async (status, message, result) => {
    //               if (status && result.length > 0) {
    //                 row = csvrow.filter(
    //                   (item) =>
    //                     !result.find(
    //                       (item2) => item.meta_title === item2.meta_title
    //                     )
    //                 );

    //                 if (
    //                   row !== undefined &&
    //                   row !== null &&
    //                   row !== "" &&
    //                   row.length > 0
    //                 ) {
    //                   let filter = {
    //                     product_nm: {
    //                       $in: row.map((item) => item.product_nm),
    //                     },
    //                   };

    //                   findProduct(COLLECTION.PRODUCT, filter, row, (rows) => {
    //                     insetEverything(rows);
    //                   });
    //                 } else {
    //                   res.json({
    //                     status: false,
    //                     message: RESPONSE.DATA,
    //                     result: [],
    //                   });
    //                 }
    //               } else {
    //                 let filter = {
    //                   product_nm: {
    //                     $in: csvrow.map((item) => item.product_nm),
    //                   },
    //                 };

    //                 findProduct(COLLECTION.PRODUCT, filter, csvrow, (rows) => {
    //                   insetEverything(rows);
    //                 });
    //               }
    //             }
    //           );

    //           async function insetEverything(rows) {
    //             let body = rows.map((item) => ({
    //               meta_title: item.meta_title,
    //               meta_keyword: item.meta_keyword,
    //               meta_desc: item.meta_desc,
    //               prd_id: item.prd_id,
    //               created_at: new Date(),
    //               created_by: user_id,
    //               updated_at: new Date(),
    //             }));

    //             await insertManyBulk(
    //               COLLECTION.PRODUCT_META,
    //               body,
    //               (status, message, result) => {
    //                 res.json({
    //                   status: status,
    //                   message: message,
    //                   result: result,
    //                 });
    //               }
    //             );
    //           }
    //         }
    //       } else {
    //         res.json({
    //           status: false,
    //           message: RESPONSE.UPLOAD_ERROR,
    //           result: [],
    //         });
    //       }
    //     } else {
    //       res.json({ status: false, message: RESPONSE.NOT_FOUND, result: [] });
    //     }
    //   });
  },
);

router.post(
  API.ADMIN.PRODUCT_META.SEND_PRODUCT_META_TO_CSV,
  ensureAuthorisedAdmin,
  async (req, res) => {
    viewAll({}, COLLECTION.PRODUCT_META, async (status, message, result) => {
      if (status && result.length > 0) {
        let filter = {
          _id: {
            $in: result.map((item) => new ObjectId(item.prd_id)),
          },
        };

        findAllProduct(COLLECTION.PRODUCT, filter, result, (rows) => {
          if (rows !== undefined && rows !== null && rows.length) {
            const json2csv = new Parser({
              fields: ["product_nm", "meta_desc", "meta_title", "meta_keyword"],
            });
            const csv = json2csv.parse(rows);
            res.send(csv);
          } else {
            res.send(RESPONSE.NOT_FOUND);
          }
        });
      } else {
        res.send(RESPONSE.NOT_FOUND);
      }
    });
  },
);

router.post(
  API.ADMIN.PRODUCT_META.GET_PRODUCT_META_DETAILS,
  validate(productMeta.metaDetailsSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { product_id } = req.body;

    view(
      { prd_id: new ObjectId(product_id) },
      COLLECTION.PRODUCT_META,
      (status, message, result) => {
        return res.json({ status, message, result });
      },
    );
  },
);

module.exports = router;
