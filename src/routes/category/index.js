const express = require("express");
const router = express.Router();

const config = require("../../config/config");
const validate = require("../../validation");
const filesvalidate = require("../../validation/fileValidation");
const { ObjectId } = require("mongodb");
const { ensureAuthorisedAdmin } = require("../../auth");
const {
  addCategorySchema,
  editCategorySchema,
  deleteCategorySchema,
  updateCategoryProduct,
  editHeaderFooterSchema,
  getCategoryDetailsSchema,
} = require("../../schema/category");
const universal = require("../../schema/universal");
const {
  insertManyBulk,
  updateManyBulk,
} = require("../../mongo-qury/bulkOperation");
const {
  viewInPaginationLookUp,
} = require("../../mongo-qury/aggregateFindAllinPagination");
const { view } = require("../../mongo-qury/viewOne");
const { insert } = require("../../mongo-qury/insertOne");
const { update } = require("../../mongo-qury/updateOne");
const { deleteOne } = require("../../mongo-qury/deleteOne");
const { updateMany } = require("../../mongo-qury/updateMany");
const { viewAll } = require("../../mongo-qury/findAll");
const { deleteMany } = require("../../mongo-qury/deleteMany");
const csvtojson = require("csvtojson");
const { Parser } = require("json2csv");
const server = require("../../database/connect");

const { API, COLLECTION, RESPONSE } = config;

const { CATEGORY } = API.ADMIN;

//Add new categories
router.post(
  CATEGORY.ADD_CATEGORY,
  validate(addCategorySchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { category_nm, code, category_path, user_id } = req.body;

    const body = {
      category_nm: category_nm,
      category_header: "",
      category_footer: "",
      category_path: category_path,
      code: code,
      status: 1,
      created_at: new Date(),
      created_by: user_id,
      updated_at: new Date(),
    };

    view(
      { category_nm: category_nm, code: code },
      COLLECTION.CATEGORY,
      (status, message, result) => {
        if (status) {
          res.json({ status: false, message: RESPONSE.DATA });
        } else {
          insert(body, COLLECTION.CATEGORY, (status1, message1, result1) => {
            const metabody = {
              cat_id: result1.insertedId,
              meta_keyword: "",
              meta_desc: "",
              meta_title: category_nm,
              meta_content: "",
              created_by: user_id,
              created_at: new Date(),
              updated_at: new Date(),
            };
            insert(
              metabody,
              COLLECTION.CATEGORY_META,
              (status1, message1, result1) => {},
            );
            insert(
              {
                created_at: new Date(),
                created_by: user_id,
                updated_at: new Date(),
                category_id: result1.insertedId,
                products: [],
              },
              COLLECTION.PRODUCT_CATEGORY,
              (status2, message2, result2) => {
                res.json({
                  status: status1,
                  message: message1,
                  result: result1,
                });
              },
            );
          });
        }
      },
    );
  },
);

//View all categories in pagination
router.post(
  CATEGORY.VIEW_CATEGORY,
  validate(universal.viewAdminSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { limit, startingAfter, searchKeyWord } = req.body;
    if (!searchKeyWord) {
      viewInPaginationLookUp(
        [
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
        ],
        COLLECTION.CATEGORY,
        (status, message, result) => {
          if (result.length) {
            if (result[0].result.length) {
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
            $search: {
              index: "category",
              text: {
                query: `${searchKeyWord}`,
                path: ["category_nm", "code"],
                fuzzy: {
                  maxEdits: 2,
                  prefixLength: 2,
                  maxExpansions: 100,
                },
              },
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
        COLLECTION.CATEGORY,
        (status, message, result) => {
          if (result.length) {
            if (result[0].result.length) {
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

//Edit old categories
router.post(
  CATEGORY.EDIT_CATEGORY,
  validate(editCategorySchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { category_nm, code, category_path, category_id } = req.body;

    const body = {
      $set: {
        category_nm: category_nm,
        code: code,
        category_path: category_path,
        updated_at: new Date(),
      },
    };
    update(
      { _id: new ObjectId(category_id) },
      body,
      COLLECTION.CATEGORY,
      (status, message, result) => {
        res.json({ status: status, message: message, result: result });
      },
    );
  },
);

//Delete old categories
router.post(
  CATEGORY.DELETE_CATEGORY,
  validate(deleteCategorySchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { category_id } = req.body;

    deleteOne(
      { _id: new ObjectId(category_id) },
      COLLECTION.CATEGORY,
      (status, message, result) => {
        res.json({ status: status, message: message, result: result });
      },
    );
  },
);

//Assigned old categories
router.post(
  CATEGORY.ASSIGNED_CATEGORY,
  validate(universal.assigneUnassignedSchema),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { _id } = req.body;

    const category_id = await _id.map((item) => new ObjectId(item));

    let filter = { _id: { $in: category_id } };

    let body = {
      $set: { status: 1 },
    };

    updateMany(filter, body, COLLECTION.CATEGORY, (status, message, result) => {
      res.json({ status: status, message: message, result: result });
    });
  },
);

//Unassigned old categories
router.post(
  CATEGORY.UNASSIGNED_CATEGORY,
  validate(universal.assigneUnassignedSchema),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { _id } = req.body;

    const category_id = await _id.map((item) => new ObjectId(item));

    let filter = { _id: { $in: category_id } };

    let body = {
      $set: { status: 0 },
    };

    updateMany(filter, body, COLLECTION.CATEGORY, (status, message, result) => {
      res.json({ status: status, message: message, result: result });
    });
  },
);

router.post(
  API.ADMIN.CATEGORY.VIEW_ALL_CATEGORY,
  validate(universal.searchAll),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { searchKeyWord } = req.body;

    viewAll(
      {
        $or: [
          { category_nm: { $regex: searchKeyWord, $options: "i" } },
          { code: { $regex: searchKeyWord, $options: "i" } },
        ],
        status: 1,
      },
      COLLECTION.CATEGORY,
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

router.post(
  API.ADMIN.CATEGORY.ADD_CATEGORY_FROM_CSV,
  // filesvalidate(universal.importAndExportCsv),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { user_id } = req.body;
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then((csvrow) => {
        // if (csvrow.length > 0) {
        //   if (
        //     csvrow[0].hasOwnProperty("category_nm") &&
        //     csvrow[0].hasOwnProperty("code")
        //   ) {
        //     const valid = csvrow.find(
        //       (item) => item.category_nm === "" || item.code === ""
        //     );

        //     const validIndex =
        //       csvrow.findIndex(
        //         (item) => item.category_nm === "" || item.code === ""
        //       ) + 2;

        //     if (
        //       valid !== undefined &&
        //       valid !== null &&
        //       valid !== "" &&
        //       (valid.category_nm === "" || valid.code === "")
        //     ) {
        //       res.json({
        //         status: false,
        //         message: `In line ${validIndex} some paramter is missing`,
        //         result: [],
        //       });
        //     } else {
        //       let row = [];
        //       let filter = {
        //         category_nm: {
        //           $in: csvrow.map((item) => item.category_nm),
        //         },
        //       };

        //       viewAll(
        //         filter,
        //         COLLECTION.CATEGORY,
        //         (status, message, result) => {
        //           if (status && result.length > 0) {
        //             row = csvrow.filter(
        //               (item) =>
        //                 !result.find(
        //                   (item2) => item.category_nm === item2.category_nm
        //                 )
        //             );

        //             if (
        //               row !== undefined &&
        //               row !== null &&
        //               row !== "" &&
        //               row.length > 0
        //             ) {

        async function insetEverything(row) {
          let body = await row.map((items) => ({
            category_nm: items.category_nm,
            code: items.code,
            old_id: items.ID,
            status: 1,
            category_header: null,
            category_footer: null,
            category_path:
              (items.category_nm + "-" + items.code)
                .split(/[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/)
                .join("-") + ".html",
            created_at: new Date(),
            created_by: user_id,
            updated_at: new Date(),
          }));

          await insertManyBulk(
            COLLECTION.CATEGORY,
            body,
            (status, message, result) => {
              res.json({
                status: status,
                message: message,
                result: result,
              });
            },
          );
        }

        insetEverything(csvrow);

        //             } else {
        //               res.json({
        //                 status: false,
        //                 message: RESPONSE.DATA,
        //                 result: [],
        //               });
        //             }
        //           } else {
        //             let body = csvrow.map((items) => ({
        //               category_nm: items.category_nm,
        //               code: items.code,
        //               status: 0,
        //               category_path: (
        //                 items.category_nm +
        //                 "-" +
        //                 items.code +
        //                 ".html"
        //               )
        //                 .split(" ")
        //                 .join("-"),
        //               category_header: [],
        //               category_footer: [],
        //               created_at: new Date(),
        //               created_by: user_id,
        //               updated_at: new Date(),
        //             }));

        //             insertManyBulk(
        //               COLLECTION.CATEGORY,
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
        //       );
        //     }
        //   } else {
        //     res.json({
        //       status: false,
        //       message: RESPONSE.UPLOAD_ERROR,
        //       result: [],
        //     });
        //   }
        // } else {
        //   res.json({ status: false, message: RESPONSE.NOT_FOUND, result: [] });
        // }
      });
  },
);

//add category from csv
router.post(
  API.ADMIN.CATEGORY.ADD_CATEGORY_HEADER_FOOTER_FROM_CSV,
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { user_id } = req.body;
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then((csvrow) => {
        async function insetEverything(row) {
          let body = await row.map((items) => ({
            filter: {
              code: items.CAT_CODE,
            },
            body: {
              $set: {
                category_header: items.CAT_HEADER,
                category_footer: items.CAT_FOOTER,
                updated_at: new Date(),
              },
            },
          }));

          await updateManyBulk(
            COLLECTION.CATEGORY,
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

//update category footer
router.post(
  CATEGORY.UPDATE_HEADER_FOOTER,
  validate(editHeaderFooterSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { category_header, category_footer, category_id } = req.body;

    const body = {
      $set: {
        category_header: category_header,
        category_footer: category_footer,
        updated_at: new Date(),
      },
    };
    update(
      { _id: new ObjectId(category_id) },
      body,
      COLLECTION.CATEGORY,
      (status, message, result) => {
        return res.json({ status: status, message: message, result: result });
      },
    );
  },
);

router.post(
  API.ADMIN.CATEGORY.SEND_CATEGORY_DATA_TO_CSV,
  ensureAuthorisedAdmin,
  async (req, res) => {
    viewAll({}, COLLECTION.CATEGORY, async (status, message, result) => {
      let row = [];
      viewAll(
        { cat_id: { $in: result.map((item) => item._id) } },
        COLLECTION.CATEGORY_META,
        async (status1, message1, result1) => {
          if (Boolean(result1 && result1.length > 0)) {
            result.map((item) => {
              const data = result1.find(
                (item2) => item2.cat_id.toString() == item._id.toString(),
              );
              if (Boolean(data)) {
                row.push({
                  ...item,
                  meta_keyword: data.meta_keyword,
                  meta_desc: data.meta_desc,
                  meta_title: data.meta_title,
                });
              } else {
                row.push({
                  ...item,
                  meta_keyword: "",
                  meta_desc: "",
                  meta_title: "",
                });
              }
            });
            if (status && row.length > 0) {
              const json2csv = new Parser({
                fields: [
                  "category_nm",
                  "code",
                  "category_header",
                  "category_footer",
                  "category_path",
                  "meta_keyword",
                  "meta_desc",
                  "meta_title",
                ],
              });
              const csv = json2csv.parse(row);
              res.send(csv);
            } else {
              res.send(RESPONSE.NOT_FOUND);
            }
          } else {
            result.map((item) =>
              row.push({
                ...item,
                meta_keyword: "",
                meta_desc: "",
                meta_title: "",
              }),
            );
            if (status && row.length > 0) {
              const json2csv = new Parser({
                fields: [
                  "category_nm",
                  "code",
                  "category_header",
                  "category_footer",
                  "category_path",
                  "meta_keyword",
                  "meta_desc",
                  "meta_title",
                ],
              });
              const csv = json2csv.parse(row);
              res.send(csv);
            } else {
              res.send(RESPONSE.NOT_FOUND);
            }
          }
        },
      );
    });
  },
);

//View product category
router.post(
  CATEGORY.VIEW_PRODUCT_CATEGORY,
  validate(universal.viewAdminSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { limit, startingAfter, searchKeyWord, status, category_ids } =
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
        category_nm: 1,
        code: 1,
      },
    };

    let search = {
      $search: {
        index: "category",
        text: {
          query: `${searchKeyWord}`,
          path: ["category_nm", "code"],
          fuzzy: {
            maxEdits: 2,
            prefixLength: 2,
            maxExpansions: 100,
          },
        },
      },
    };

    if (status === 0) {
      if (!searchKeyWord) {
        filter = [
          {
            $match: {
              _id: { $in: category_ids.map((item) => new ObjectId(item)) },
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
              _id: { $in: category_ids.map((item) => new ObjectId(item)) },
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
              _id: { $nin: category_ids.map((item) => new ObjectId(item)) },
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
              _id: { $nin: category_ids.map((item) => new ObjectId(item)) },
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
      COLLECTION.CATEGORY,
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

//View  category product
router.post("/view-category-products", ensureAuthorisedAdmin, (req, res) => {
  const { category_id } = req.body;

  viewInPaginationLookUp(
    [
      { $match: { category_id: new ObjectId(category_id) } },
      { $project: { product_id: 1 } },
    ],
    COLLECTION.PRODUCT_CATEGORY,
    (status, message, result) => {
      if (status) {
        return res.json({ status, message, result });
      } else {
        return res.json({ status, message, result });
      }
    },
  );
});

router.post(
  CATEGORY.VIEW_CATEGORY_PRODUCT,
  validate(universal.viewAdminSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { limit, startingAfter, searchKeyWord, status, category_id } =
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
        product_name: 1,
        sku: 1,
      },
    };

    const string = searchKeyWord.split(" ").filter((item) => {
      return Boolean(item);
    });

    const path = string.length > 1 ? ["product_name"] : ["product_name", "sku"];

    let search = {
      $search: {
        index: "product",
        compound: {
          must: [{ text: { query: string, path: path } }],
          should: [{ text: { query: string, path: path } }],
          filter: [
            {
              text: {
                query: string,
                path: ["product_name", "sku"],
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

    var product_ids = [];

    viewAll(
      { category_id: new ObjectId(category_id) },
      COLLECTION.PRODUCT_CATEGORY,
      (status1, message, result) => {
        if (status1) {
          result.map((item) => {
            product_ids.push(item.product_id);
          });

          if (status === 0) {
            if (!searchKeyWord) {
              filter = [
                { $match: { _id: { $in: product_ids } } },
                { $sort: { _id: -1 } },
                project,
                facet,
              ];
            } else {
              filter = [
                search,
                { $match: { _id: { $in: product_ids } } },
                project,
                facet,
              ];
            }
          } else if (status === 1) {
            if (!searchKeyWord) {
              filter = [
                { $match: { _id: { $nin: product_ids } } },
                { $sort: { _id: -1 } },
                project,
                facet,
              ];
            } else {
              filter = [
                search,
                { $match: { _id: { $nin: product_ids } } },
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
            COLLECTION.PRODUCT,
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
          if (status === 0) {
            if (!searchKeyWord) {
              filter = [
                { $match: { _id: { $in: product_ids } } },
                { $sort: { _id: -1 } },
                project,
                facet,
              ];
            } else {
              filter = [
                search,
                { $match: { _id: { $in: product_ids } } },
                project,
                facet,
              ];
            }
          } else if (status === 1) {
            if (!searchKeyWord) {
              filter = [
                { $match: { _id: { $nin: product_ids } } },
                { $sort: { _id: -1 } },
                project,
                facet,
              ];
            } else {
              filter = [
                search,
                { $match: { _id: { $nin: product_ids } } },
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
            COLLECTION.PRODUCT,
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
  },
);

//Assign category to the product
router.post(
  CATEGORY.ASSIGN_PRODUCT_CATEGORY,
  validate(updateCategoryProduct),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { product_ids, category_id, user_id } = req.body;

    deleteMany(
      {
        category_id: new ObjectId(category_id),
        product_id: { $nin: product_ids.map((item) => new ObjectId(item)) },
      },
      COLLECTION.PRODUCT_CATEGORY,
      (status1, message1, result1) => {
        if (status1) {
          viewInPaginationLookUp(
            [
              {
                $match: {
                  category_id: new ObjectId(category_id),
                  product_id: {
                    $in: product_ids.map((item) => new ObjectId(item)),
                  },
                },
              },
              {
                $project: {
                  product_id: 1,
                  sort: 1,
                  _id: 1,
                },
              },
            ],
            COLLECTION.PRODUCT_CATEGORY,
            async (status2, message2, result2) => {
              if (status2) {
                const final_products = product_ids.filter(
                  (item) =>
                    !result2.find((cat) => `${item}` === `${cat.product_id}`),
                );

                if (final_products.length > 0) {
                  let bulk = await server
                    .collection(COLLECTION.PRODUCT_CATEGORY)
                    .initializeOrderedBulkOp();

                  await final_products.map((item) =>
                    bulk.insert({
                      sort: 0,
                      category_id: new ObjectId(category_id),
                      product_id: new ObjectId(item),
                      created_by: user_id,
                      created_at: new Date(),
                      updated_at: new Date(),
                    }),
                  );

                  await bulk.execute((err, doc) => {
                    if (err) {
                      console.error(err);
                      res.json({
                        status: false,
                        message: RESPONSE.FAILED,
                        result: err.message,
                      });
                    } else {
                      if (doc) {
                        res.json({
                          status: true,
                          message: RESPONSE.DATA,
                          result: doc,
                        });
                      } else {
                        res.json({
                          status: false,
                          message: RESPONSE.NOT_FOUND,
                          result: null,
                        });
                      }
                    }
                  });
                } else {
                  res.json({
                    status: status1,
                    message: message1,
                    result: result1,
                  });
                }
              } else {
                res.json({
                  status: status1,
                  message: message1,
                  result: result1,
                });
              }
            },
          );
        } else {
          viewInPaginationLookUp(
            [
              {
                $match: {
                  category_id: new ObjectId(category_id),
                  product_id: {
                    $in: product_ids.map((item) => new ObjectId(item)),
                  },
                },
              },
              {
                $project: {
                  product_id: 1,
                  sort: 1,
                  _id: 1,
                },
              },
            ],
            COLLECTION.PRODUCT_CATEGORY,
            async (status2, message2, result2) => {
              if (status2) {
                const final_products = product_ids.filter(
                  (item) =>
                    !result2.find((cat) => `${item}` === `${cat.product_id}`),
                );

                if (final_products.length > 0) {
                  let bulk = await server
                    .collection(COLLECTION.PRODUCT_CATEGORY)
                    .initializeOrderedBulkOp();

                  await final_products.map((item) =>
                    bulk.insert({
                      sort: 0,
                      category_id: new ObjectId(category_id),
                      product_id: new ObjectId(item),
                      created_by: user_id,
                      created_at: new Date(),
                      updated_at: new Date(),
                    }),
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
                          message: RESPONSE.DATA,
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
                    status: status1,
                    message: message1,
                    result: result1,
                  });
                }
              } else {
                return res.json({
                  status: status1,
                  message: message1,
                  result: result1,
                });
              }
            },
          );
        }
      },
    );
  },
);

//Unassign category to the product
router.post(
  CATEGORY.UNASSIGN_PRODUCT_CATEGORY,
  validate(updateCategoryProduct),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { product_ids, category_id } = req.body;

    const _id = await product_ids.map((item) => new ObjectId(item));

    let filter = { _id: { $in: _id } };

    let body = {
      $pull: { category_ids: new ObjectId(category_id) },
    };

    updateMany(filter, body, COLLECTION.PRODUCT, (status, message, result) => {
      return res.json({ status: status, message: message, result: result });
    });
  },
);

//Get category details.
router.post(
  CATEGORY.GET_CATEGORY_DETAILS,
  validate(getCategoryDetailsSchema),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { category_id } = req.body;

    viewInPaginationLookUp(
      [
        { $match: { _id: new ObjectId(category_id) } },
        {
          $lookup: {
            from: COLLECTION.CATEGORY_META,
            localField: "_id",
            foreignField: "cat_id",
            as: "meta",
          },
        },
        {
          $unwind: {
            path: "$meta",
            preserveNullAndEmptyArrays: true,
          },
        },
      ],
      COLLECTION.CATEGORY,
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
  },
);

module.exports = router;
