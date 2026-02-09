const express = require("express");
const router = express.Router();
const config = require("../../config/config");
const validate = require("../../validation");
const { ensureAuthorisedAdmin } = require("../../auth");
const filesvalidate = require("../../validation/fileValidation");
const {
  addProductSchema,
  editProductSchema,
  deleteProductSchema,
  updateProductAttribute,
  updateProductGlobalAttribute,
  viewProductAttribute,
} = require("../../schema/product");
const universal = require("../../schema/universal");
const { view } = require("../../mongo-qury/viewOne");
const { insert } = require("../../mongo-qury/insertOne");
const {
  viewInPaginationLookUp,
} = require("../../mongo-qury/aggregateFindAllinPagination");
const {
  viewInPaginationCursor,
} = require("../../mongo-qury/viewInPaginationCursor");
const { update } = require("../../mongo-qury/updateOne");
const { deleteOne } = require("../../mongo-qury/deleteOne");
const { deleteMany } = require("../../mongo-qury/deleteMany");
const { viewAll } = require("../../mongo-qury/findAll");
const {
  insertManyBulk,
  updateManyBulk,
  insetIdBulk,
} = require("../../mongo-qury/bulkOperation");
const { updateMany } = require("../../mongo-qury/updateMany");
const {
  findObjectId,
  findAllCategory,
  findAllObjectId,
} = require("../../modules/csv_modules");
const csvtojson = require("csvtojson");
const { Parser } = require("json2csv");
const { ObjectId } = require("mongodb");
const server = require("../../database/connect");

const { API, COLLECTION, RESPONSE } = config;

const { PRODUCT } = API.ADMIN;

//View local and global attribute from the product
router.post(
  PRODUCT.VIEW_GLOBAL_LOCAL_ATTRIBUTES,
  validate(viewProductAttribute),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { product_id } = req.body;

    viewInPaginationLookUp(
      [
        { $match: { product_id: new ObjectId(product_id) } },
        {
          $lookup: {
            from: COLLECTION.LOCAL_ATTRIBUTES,
            let: { local_attribute_ids: "$local_attribute" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$local_attribute_ids"],
                  },
                },
              },
              {
                $addFields: {
                  sort: {
                    $indexOfArray: ["$$local_attribute_ids", "$_id"],
                  },
                },
              },
              { $sort: { sort: 1 } },
            ],
            as: "local_attributes",
          },
        },
        {
          $lookup: {
            from: COLLECTION.TEMPLATE,
            let: { global_attribute_id: "$global_attribute_ids" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$global_attribute_id"],
                  },
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
                    $indexOfArray: ["$$global_attribute_id", "$_id"],
                  },
                },
              },
              { $sort: { sort: 1 } },
            ],
            as: "global_attribute",
          },
        },
        {
          $project: {
            local_attributes: 1,
            global_attribute: 1,
            _id: 0,
          },
        },
      ],
      COLLECTION.PRODUCT_ATTRIBUTE,
      (status, message, result) => {
        if (result.length) {
          return res.json({
            status: status,
            message: message,
            result: result[0],
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
  },
);

//view product attribute
router.post(
  "/view-product-attribute",
  validate(viewProductAttribute),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { product_id } = req.body;

    viewInPaginationLookUp(
      [
        {
          $match: {
            product_id: new ObjectId(product_id),
          },
        },
        {
          $lookup: {
            from: COLLECTION.LOCAL_ATTRIBUTES,
            let: { local_attribute_ids: "$attribute" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$local_attribute_ids._id"],
                  },
                },
              },
              {
                $project: {
                  prompt: 1,
                  code: 1,
                  attr_type: 1,
                },
              },
            ],
            as: "local_attributes",
          },
        },
        {
          $lookup: {
            from: COLLECTION.TEMPLATE,
            let: { global_attribute_id: "$attribute" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$global_attribute_id._id"],
                  },
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
                    {
                      $project: {
                        prompt: 1,
                        code: 1,
                        attr_type: 1,
                      },
                    },
                  ],
                  as: "attributes",
                },
              },
              {
                $project: {
                  prompt: 1,
                  code: 1,
                  attributes: 1,
                },
              },
            ],
            as: "global_attribute",
          },
        },
        {
          $project: {
            local_attributes: 1,
            global_attribute: 1,
            attribute: 1,
          },
        },
      ],
      COLLECTION.PRODUCT_ATTRIBUTE,
      (status, message, result) => {
        if (result.length) {
          return res.json({
            status: status,
            message: message,
            result: result[0],
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
  },
);

router.post(
  "/update-product-attribute",
  validate(viewProductAttribute),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { product_id, attribute } = req.body;

    const body = {
      $set: {
        attribute: attribute.map((item) => ({
          _id: new ObjectId(item._id),
          type: item.type,
        })),
        updated_at: new Date(),
      },
    };

    update(
      { product_id: new ObjectId(product_id) },
      body,
      COLLECTION.PRODUCT_ATTRIBUTE,
      (status, message, result) => {
        res.json({ status: status, message: message, result: result });
      },
    );
  },
);

//Add new product
router.post(
  API.ADMIN.PRODUCT.ADD_PRODUCT,
  validate(addProductSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const {
      user_id,
      product_name,
      sku,
      msrp,
      price,
      description,
      thumbnail_image,
      closeup_image,
      alternative_images,
      shipping_message_id,
      related_product_ids,
      category_ids,
      local_attribute,
      global_attribute_ids,
      gender,
      metaltype,
      weight,
      quantity,
      product_path,
      meta_keyword,
      meta_desc,
      meta_title,
    } = req.body;

    view(
      { product_name: product_name, sku: sku },
      COLLECTION.PRODUCT,
      (status4, message4, result4) => {
        if (status4) {
          res.json({ status: false, message: RESPONSE.DATA });
        } else {
          local_attribute.length > 0 &&
            local_attribute.map((item) => ({
              prompt: item.prompt,
              code: item.code,
              image: item.image,
              attr_type: item.attr_type,
              required: item.required,
              attr_options: item.attr_options,
              status: 1,
              created_at: new Date(),
              created_by: user_id,
              updated_at: new Date(),
            }));

          if (local_attribute.length > 0) {
            insertManyBulk(
              COLLECTION.LOCAL_ATTRIBUTES,
              local_attribute,
              (status, message, result) => {
                if (status) {
                  const body = {
                    product_name: product_name,
                    product_path: product_path,
                    sku: sku,
                    price: price,
                    msrp: msrp,
                    description: description,
                    thumbnail_image: thumbnail_image,
                    closeup_image: closeup_image,
                    alternative_images: alternative_images.filter((item) => {
                      return Boolean(item);
                    }),
                    shipping_message_id:
                      shipping_message_id === null
                        ? null
                        : new ObjectId(shipping_message_id),
                    gender: gender,
                    metaltype:
                      metaltype === "" ? null : new ObjectId(metaltype),
                    weight: weight,
                    quantity: quantity,
                    created_by: user_id,
                    status: 1,
                    sold: 0,
                    created_at: new Date(),
                    updated_at: new Date(),
                  };
                  insert(
                    body,
                    COLLECTION.PRODUCT,
                    (status1, message1, result1) => {
                      if (status1) {
                        const attribute = [];

                        result.result.insertedIds.map((item) =>
                          attribute.push({
                            type: "local",
                            _id: new ObjectId(item._id),
                          }),
                        );
                        global_attribute_ids.map((item) =>
                          attribute.push({
                            type: "global",
                            _id: new ObjectId(item),
                          }),
                        );

                        insert(
                          {
                            product_id: new ObjectId(result1?.insertedId),
                            status: 1,
                            created_at: new Date(),
                            updated_at: new Date(),
                            attribute: attribute,
                            local_attribute: result?.result?.insertedIds.map(
                              (item) => item._id,
                            ),
                            global_attribute_ids:
                              global_attribute_ids.length > 0
                                ? global_attribute_ids.map(
                                    (item) => new ObjectId(item),
                                  )
                                : [],
                          },
                          COLLECTION.PRODUCT_ATTRIBUTE,
                          (status2, message2, result2) => {
                            if (status2) {
                              const body = {
                                prd_id: result1?.insertedId,
                                meta_keyword: meta_keyword,
                                meta_desc: meta_desc,
                                meta_title: meta_title,
                                created_by: user_id,
                                created_at: new Date(),
                                updated_at: new Date(),
                              };
                              insert(
                                body,
                                COLLECTION.PRODUCT_META,
                                async (status3, message3, result3) => {
                                  if (status3) {
                                    insert(
                                      {
                                        product_id: result1?.insertedId,
                                        related_product_ids:
                                          related_product_ids.length > 0
                                            ? related_product_ids.map(
                                                (item) => new ObjectId(item),
                                              )
                                            : [],
                                        created_by: user_id,
                                        created_at: new Date(),
                                        updated_at: new Date(),
                                      },
                                      COLLECTION.RELATED_PRODUCTS,
                                      async (status5, message5, result5) => {
                                        if (status5) {
                                          if (category_ids.length > 0) {
                                            let bulk = await server
                                              .collection(
                                                COLLECTION.PRODUCT_CATEGORY,
                                              )
                                              .initializeOrderedBulkOp();

                                            await category_ids.map((item) =>
                                              bulk.insert({
                                                sort: 0,
                                                category_id: new ObjectId(item),
                                                product_id: result1?.insertedId,
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
                                                    status: status1,
                                                    message: message1,
                                                    result: result1,
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
                                            status: status5,
                                            message: message5,
                                            result: result5,
                                          });
                                        }
                                      },
                                    );
                                  } else {
                                    res.json({
                                      status: status3,
                                      message: message3,
                                      result: result3,
                                    });
                                  }
                                },
                              );
                            } else {
                              res.json({
                                status: status2,
                                message: message2,
                                result: result2,
                              });
                            }
                          },
                        );
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
                  res.json({ status, message, result });
                }
              },
            );
          } else {
            const body = {
              product_name: product_name,
              product_path: product_path,
              sku: sku,
              price: price,
              msrp: msrp,
              description: description,
              thumbnail_image: thumbnail_image,
              closeup_image: closeup_image,
              alternative_images: alternative_images.filter((item) => {
                return Boolean(item);
              }),
              shipping_message_id:
                shipping_message_id === null
                  ? null
                  : new ObjectId(shipping_message_id),
              gender: gender,
              metaltype: metaltype === "" ? null : new ObjectId(metaltype),
              weight: weight,
              quantity: quantity,
              created_by: user_id,
              status: 1,
              sold: 0,
              created_at: new Date(),
              updated_at: new Date(),
            };

            insert(body, COLLECTION.PRODUCT, (status1, message1, result1) => {
              if (status1) {
                const attribute = [];

                global_attribute_ids.map((item) =>
                  attribute.push({
                    type: "global",
                    _id: new ObjectId(item),
                  }),
                );

                insert(
                  {
                    product_id: new ObjectId(result1?.insertedId),
                    status: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                    attribute: attribute,
                    local_attribute: [],
                    global_attribute_ids:
                      global_attribute_ids.length > 0
                        ? global_attribute_ids.map((item) => new ObjectId(item))
                        : [],
                  },
                  COLLECTION.PRODUCT_ATTRIBUTE,
                  (status2, message2, result2) => {
                    if (status2) {
                      const body = {
                        prd_id: result1?.insertedId,
                        meta_keyword: meta_keyword,
                        meta_desc: meta_desc,
                        meta_title: meta_title,
                        created_by: user_id,
                        created_at: new Date(),
                        updated_at: new Date(),
                      };
                      insert(
                        body,
                        COLLECTION.PRODUCT_META,
                        async (status3, message3, result3) => {
                          if (status3) {
                            insert(
                              {
                                product_id: result1?.insertedId,
                                related_product_ids:
                                  related_product_ids.length > 0
                                    ? related_product_ids.map(
                                        (item) => new ObjectId(item),
                                      )
                                    : [],
                                created_by: user_id,
                                created_at: new Date(),
                                updated_at: new Date(),
                              },
                              COLLECTION.RELATED_PRODUCTS,
                              async (status4, message4, result4) => {
                                if (status4) {
                                  if (category_ids.length > 0) {
                                    let bulk = await server
                                      .collection(COLLECTION.PRODUCT_CATEGORY)
                                      .initializeOrderedBulkOp();

                                    await category_ids.map((item) =>
                                      bulk.insert({
                                        sort: 0,
                                        category_id: new ObjectId(item),
                                        product_id: result1?.insertedId,
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
                                            status: status1,
                                            message: message1,
                                            result: result1,
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
                                    status: status4,
                                    message: message4,
                                    result: result4,
                                  });
                                }
                              },
                            );
                          } else {
                            res.json({
                              status: status3,
                              message: message3,
                              result: result3,
                            });
                          }
                        },
                      );
                    } else {
                      res.json({
                        status: status2,
                        message: message2,
                        result: result2,
                      });
                    }
                  },
                );
              } else {
                res.json({
                  status: status1,
                  message: message1,
                  result: result1,
                });
              }
            });
          }
        }
      },
    );
  },
);

//view product using pagination in admin pannel
router.post(
  API.ADMIN.PRODUCT.VIEW_PRODUCT,
  validate(universal.viewAdminSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { limit, startingAfter, searchKeyWord } = req.body;

    let fields = {
      product_name: 1,
      sku: 1,
      price: 1,
      msrp: 1,
      local_attribute: 1,
      status: 1,
      sold: 1,
    };

    if (!searchKeyWord) {
      viewInPaginationCursor(
        {},
        fields,
        startingAfter,
        limit,
        COLLECTION.PRODUCT,
        (status, message, result, total) => {
          if (result.length) {
            return res.json({
              status: status,
              message: message,
              result: result,
              total: total,
            });
          } else {
            return res.json({
              status: false,
              message: RESPONSE.NOT_FOUND,
              result: result,
              total: total,
            });
          }
        },
        { _id: -1 },
      );
    } else {
      const string = searchKeyWord.split(" ").filter((item) => {
        return Boolean(item);
      });
      const path =
        string.length > 1 ? ["product_name"] : ["product_name", "sku"];
      viewInPaginationLookUp(
        [
          {
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
          },
          {
            $facet: {
              result: [
                {
                  $project: {
                    product_name: 1,
                    sku: 1,
                    price: 1,
                    msrp: 1,
                    local_attribute: 1,
                    status: 1,
                    sold: 1,
                  },
                },
                { $skip: parseInt(startingAfter) },
                { $limit: parseInt(limit) },
              ],
              total: [{ $count: "total" }],
            },
          },
        ],
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

//view related product
router.post(
  PRODUCT.VIEW_RELATED_PRODUCTS,
  validate(universal.viewAdminSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { limit, startingAfter, searchKeyWord, status, related_product_ids } =
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

    if (status === 0) {
      if (!searchKeyWord) {
        filter = [
          {
            $match: {
              _id: {
                $in: related_product_ids.map((item) => new ObjectId(item)),
              },
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
              _id: {
                $in: related_product_ids.map((item) => new ObjectId(item)),
              },
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
              _id: {
                $nin: related_product_ids.map((item) => new ObjectId(item)),
              },
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
              _id: {
                $nin: related_product_ids.map((item) => new ObjectId(item)),
              },
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
  },
);

//view product details
router.post(PRODUCT.VIEW_PRODUCT_DETAILS, ensureAuthorisedAdmin, (req, res) => {
  const { product_id } = req.body;

  viewInPaginationLookUp(
    [
      {
        $match: {
          _id: new ObjectId(product_id),
        },
      },
      {
        $lookup: {
          from: COLLECTION.PRODUCT_META,
          localField: "_id",
          foreignField: "prd_id",
          as: "product_meta",
        },
      },
      {
        $unwind: {
          path: "$product_meta",
          preserveNullAndEmptyArrays: true,
        },
      },
    ],
    COLLECTION.PRODUCT,
    (status, message, result) => {
      if (result.length) {
        if (result[0]) {
          return res.json({
            status: status,
            message: message,
            result: result[0],
          });
        } else {
          return res.json({
            status: status,
            message: message,
            result: [],
          });
        }
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

//view product details
router.post("/view-related-products", ensureAuthorisedAdmin, (req, res) => {
  const { product_id } = req.body;

  viewInPaginationLookUp(
    [
      {
        $match: {
          product_id: new ObjectId(product_id),
        },
      },
      {
        $project: {
          related_product_ids: 1,
          _id: 1,
        },
      },
    ],
    COLLECTION.RELATED_PRODUCTS,
    (status, message, result) => {
      if (result.length) {
        if (result[0]) {
          return res.json({
            status: status,
            message: message,
            result: result[0],
          });
        } else {
          return res.json({
            status: status,
            message: message,
            result: [],
          });
        }
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

router.post("/view-products-categories", ensureAuthorisedAdmin, (req, res) => {
  const { product_id } = req.body;

  viewInPaginationLookUp(
    [
      {
        $match: {
          product_id: new ObjectId(product_id),
        },
      },
      {
        $project: {
          category_id: 1,
          sort: 1,
          _id: 1,
        },
      },
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

router.post("/view-products-category", ensureAuthorisedAdmin, (req, res) => {
  const { limit, startingAfter, searchKeyWord, status, product_id } = req.body;

  let filter = [];

  let facet = {
    $facet: {
      result: [{ $skip: parseInt(startingAfter) }, { $limit: parseInt(limit) }],
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

  viewInPaginationLookUp(
    [
      {
        $match: {
          product_id: new ObjectId(product_id),
        },
      },
      {
        $project: {
          category_id: 1,
          sort: 1,
          _id: 1,
        },
      },
    ],
    COLLECTION.PRODUCT_CATEGORY,
    (status1, message1, result1) => {
      if (status1) {
        const category_ids = [];

        result1.map((item) => {
          category_ids.push(item.category_id);
        });

        if (status === 0) {
          if (!searchKeyWord) {
            filter = [
              {
                $match: {
                  _id: { $in: category_ids },
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
                  _id: { $in: category_ids },
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
                  _id: { $nin: category_ids },
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
                  _id: { $nin: category_ids },
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

        server
          .collection(COLLECTION.CATEGORY)
          .aggregate(filter)
          .toArray()
          .then((doc) => {
            if (doc) {
              if (doc.length) {
                if (doc[0].result.length) {
                  return res.json({
                    status: true,
                    message: RESPONSE.FOUND,
                    result: doc[0].result,
                    total: doc[0].total[0].total,
                  });
                } else {
                  return res.json({
                    status: true,
                    message: RESPONSE.FOUND,
                    result: [],
                    total: 0,
                  });
                }
              } else {
                return res.json({
                  status: true,
                  message: RESPONSE.FOUND,
                  result: [],
                  total: 0,
                });
              }
            } else {
              return res.json({
                status: false,
                message: RESPONSE.FAILED,
                result: [],
                total: 0,
              });
            }
          })
          .catch((err) => {
            console.log(err);
            return res.json({
              status: false,
              message: RESPONSE.FAILED,
              result: [],
              total: 0,
            });
          });
      } else {
        return res.json({
          status: status1,
          message: message1,
          result: [],
          total: 0,
        });
      }
    },
  );
});

router.post("/update-related-products", ensureAuthorisedAdmin, (req, res) => {
  const { product_id, related_product_ids } = req.body;

  update(
    { product_id: new ObjectId(product_id) },
    {
      $set: {
        related_product_ids: related_product_ids?.map(
          (item) => new ObjectId(item),
        ),
      },
    },
    COLLECTION.RELATED_PRODUCTS,
    (status, message, result) => {
      return res.json({ status, message, result });
    },
  );
});

router.post("/update-products-category", ensureAuthorisedAdmin, (req, res) => {
  const { product_id, category_ids, user_id } = req.body;

  deleteMany(
    {
      product_id: new ObjectId(product_id),
      category_id: { $nin: category_ids.map((item) => new ObjectId(item)) },
    },
    COLLECTION.PRODUCT_CATEGORY,
    (status1, message1, result1) => {
      if (status1) {
        viewInPaginationLookUp(
          [
            {
              $match: {
                product_id: new ObjectId(product_id),
                category_id: {
                  $in: category_ids.map((item) => new ObjectId(item)),
                },
              },
            },
            {
              $project: {
                category_id: 1,
                sort: 1,
                _id: 1,
              },
            },
          ],
          COLLECTION.PRODUCT_CATEGORY,
          async (status2, message2, result2) => {
            if (status2) {
              const final_categories = category_ids.filter(
                (item) =>
                  !result2.find((cat) => `${item}` === `${cat.category_id}`),
              );

              if (final_categories.length > 0) {
                let bulk = await server
                  .collection(COLLECTION.PRODUCT_CATEGORY)
                  .initializeOrderedBulkOp();

                await final_categories.map((item) =>
                  bulk.insert({
                    sort: 0,
                    category_id: new ObjectId(item),
                    product_id: new ObjectId(product_id),
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
                product_id: new ObjectId(product_id),
                category_id: {
                  $in: category_ids.map((item) => new ObjectId(item)),
                },
              },
            },
            {
              $project: {
                category_id: 1,
                sort: 1,
                _id: 1,
              },
            },
          ],
          COLLECTION.PRODUCT_CATEGORY,
          async (status2, message2, result2) => {
            if (status2) {
              const final_categories = category_ids.filter(
                (item) =>
                  !result2.find((cat) => `${item}` === `${cat.category_id}`),
              );

              if (final_categories.length > 0) {
                let bulk = await server
                  .collection(COLLECTION.PRODUCT_CATEGORY)
                  .initializeOrderedBulkOp();

                await final_categories.map((item) =>
                  bulk.insert({
                    sort: 0,
                    category_id: new ObjectId(item),
                    product_id: new ObjectId(product_id),
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
});

//view product details
router.post("/details", async (req, res) => {
  const { product_ids } = req.body;

  const _ids = await product_ids.map((item) => new ObjectId(item));

  viewAll(
    { _id: { $in: _ids } },
    COLLECTION.PRODUCT,
    (status, message, result) => {
      res.json({
        status: status,
        message: message,
        result: result,
      });
    },
  );
});

//update product global  template
router.post(
  PRODUCT.UPDATE_PRODUCT_GLOBAL_ATTRIBUTES,
  validate(updateProductGlobalAttribute),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { product_id, global_attribute_ids } = req.body;

    const body = {
      $set: {
        global_attribute_ids: global_attribute_ids.map(
          (item) => new ObjectId(item),
        ),
      },
    };

    view(
      { product_id: new ObjectId(product_id) },
      COLLECTION.PRODUCT_ATTRIBUTE,
      (status, message, result) => {
        if (status) {
          const attribute = [];
          global_attribute_ids.map((item) => {
            const dat = result.attribute.find(
              (items) => `${item}` === `${items._id}`,
            );
            if (!dat) {
              attribute.push({ type: "global", _id: new ObjectId(item) });
            }
          });
          let data = {
            $push: {
              attribute: { $each: attribute },
            },
          };

          if (attribute.length > 0) {
            update(
              { product_id: new ObjectId(product_id) },
              data,
              COLLECTION.PRODUCT_ATTRIBUTE,
              (status2, message2, result2) => {
                if (status2) {
                  update(
                    { _id: new ObjectId(product_id) },
                    body,
                    COLLECTION.PRODUCT,
                    (status1, message1, result1) => {
                      return res.json({
                        status: status1,
                        message: message1,
                        result: result1,
                      });
                    },
                  );
                } else {
                  return res.json({
                    status: status2,
                    message: message2,
                    result: result2,
                  });
                }
              },
            );
          } else {
            update(
              { _id: new ObjectId(product_id) },
              body,
              COLLECTION.PRODUCT,
              (status1, message1, result1) => {
                return res.json({
                  status: status1,
                  message: message1,
                  result: result1,
                });
              },
            );
          }
        } else {
          return res.json({ status, message, result });
        }
      },
    );
  },
);

//edit products
router.post(
  API.ADMIN.PRODUCT.EDIT_PRODUCT,
  validate(editProductSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const {
      product_name,
      sku,
      msrp,
      price,
      description,
      thumbnail_image,
      closeup_image,
      alternative_images,
      shipping_message_id,
      product_id,
      country_id,
      gender,
      metaltype,
      weight,
      quantity,
      product_path,
      meta_keyword,
      meta_desc,
      meta_title,
    } = req.body;

    const body = {
      $set: {
        product_name: product_name,
        price: price,
        sku: sku,
        product_path: product_path,
        msrp: msrp,
        description: description,
        thumbnail_image: thumbnail_image,
        closeup_image: closeup_image,
        alternative_images: alternative_images.filter((item) => {
          return Boolean(item);
        }),
        shipping_message_id: new ObjectId(shipping_message_id),
        country_id: new ObjectId(country_id),
        gender: gender,
        metaltype: metaltype === "" ? null : new ObjectId(metaltype),
        weight: weight,
        quantity: quantity,
        updated_at: new Date(),
      },
    };

    update(
      { _id: new ObjectId(product_id) },
      body,
      COLLECTION.PRODUCT,
      (status, message, result) => {
        if (status) {
          update(
            { prd_id: new ObjectId(product_id) },
            {
              $set: {
                meta_keyword: meta_keyword,
                meta_desc: meta_desc,
                meta_title: meta_title,
                updated_at: new Date(),
              },
            },
            COLLECTION.PRODUCT_META,
            (status1, message1, result1) => {
              if (status) {
                return res.json({ status, message, result });
              } else {
                return res.json({
                  status: status1,
                  message: message1,
                  result: result1,
                });
              }
            },
          );
        } else {
          return res.json({ status, message, result });
        }
      },
    );
  },
);

//delete products forever
router.post(
  PRODUCT.DELETE_PRODUCT,
  validate(deleteProductSchema),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { product_id, local_attribute } = req.body;

    deleteOne(
      { _id: new ObjectId(product_id) },
      COLLECTION.PRODUCT,
      (status, message, result) => {
        if (status && local_attribute.length) {
          deleteMany(
            {
              _id: {
                $in: [local_attribute.map((item) => new ObjectId(item))],
              },
            },
            COLLECTION.LOCAL_ATTRIBUTES,
            (status, message, result) => {
              res.json({ status: status, message: message, result: result });
            },
          );
        } else {
          res.json({ status: status, message: message, result: result });
        }
      },
    );
  },
);

//assign and unassigned products
router.post(
  PRODUCT.ASSIGNED_AND_UNASSIGNED_PRODUCT,
  validate(universal.assigneUnassignedSchema),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { _id, status } = req.body;

    const product_id = await _id.map((item) => new ObjectId(item));

    let filter = { _id: { $in: product_id } };

    let body = {
      $set: { status: status },
    };

    updateMany(filter, body, COLLECTION.PRODUCT, (status, message, result) => {
      res.json({ status: status, message: message, result: result });
    });
  },
);

//view all the products with searching operation.
router.post(
  API.ADMIN.PRODUCT.VIEW_ALL_PRODUCT,
  validate(universal.searchAll),
  ensureAuthorisedAdmin,
  (req, res) => {
    const { searchKeyWord } = req.body;

    viewAll(
      {
        sku: { $regex: searchKeyWord, $options: "i" },
      },
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

//Add new product from csv
router.post(
  PRODUCT.ADD_NEW_PRODUCT_FROM_CSV,
  filesvalidate(universal.importAndExportCsv),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { user_id } = req.body;
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then(async (csvrow) => {
        if (csvrow.length) {
          if (
            csvrow[0].hasOwnProperty("product_name") &&
            csvrow[0].hasOwnProperty("price") &&
            csvrow[0].hasOwnProperty("weight") &&
            csvrow[0].hasOwnProperty("description") &&
            csvrow[0].hasOwnProperty("sku") &&
            csvrow[0].hasOwnProperty("msrp") &&
            csvrow[0].hasOwnProperty("thumbnail_image") &&
            csvrow[0].hasOwnProperty("closeup_image") &&
            csvrow[0].hasOwnProperty("alternative_images") &&
            csvrow[0].hasOwnProperty("shipping_message_code") &&
            csvrow[0].hasOwnProperty("country_code") &&
            csvrow[0].hasOwnProperty("gender") &&
            csvrow[0].hasOwnProperty("metaltype") &&
            csvrow[0].hasOwnProperty("quantity") &&
            csvrow[0].hasOwnProperty("related_product_sku") &&
            csvrow[0].hasOwnProperty("category_code") &&
            csvrow[0].hasOwnProperty("template_code")
          ) {
            const valid = csvrow.find(
              (item) =>
                !item.product_name ||
                !item.sku ||
                !item.price ||
                !item.msrp ||
                !item.gender ||
                !item.metaltype,
            );

            const validIndex =
              csvrow.findIndex(
                (item) =>
                  !item.product_name ||
                  !item.sku ||
                  !item.price ||
                  !item.msrp ||
                  !item.gender ||
                  !item.metaltype,
              ) + 2;

            if (
              !valid &&
              (!valid.product_name ||
                !valid.sku ||
                !valid.price ||
                !valid.msrp ||
                !valid.gender ||
                !valid.metaltype)
            ) {
              return res.json({
                status: false,
                message: `In line ${validIndex} some paramter is missing`,
                result: [],
              });
            } else {
              let filter = {
                product_name: {
                  $in: csvrow.map((item) => item.product_name),
                },
              };

              viewAll(
                filter,
                COLLECTION.PRODUCT,
                async (status, message, result) => {
                  if (status && result.length) {
                    let row = [];

                    row = csvrow.filter(
                      (item) =>
                        !result.find(
                          (item2) => item.product_name === item2.product_name,
                        ),
                    );

                    if (row && row.length) {
                      await insetEverything(row);
                    } else {
                      return res.json({
                        status: false,
                        message: RESPONSE.DATA,
                        result: [],
                      });
                    }
                  } else {
                    await insetEverything(csvrow);
                  }
                },
              );

              async function insetEverything(row) {
                if (row !== undefined && row !== null && row.length) {
                  let body = new Array();
                  let i = 0;

                  for (i; i < row.length; i++) {
                    body.push({
                      product_name: row[i]?.product_name,
                      product_path:
                        (row[i]?.product_name + "-" + row[i]?.sku)
                          .split(/[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/)
                          .join("-") + ".html",
                      sku: row[i]?.sku,
                      price: row[i]?.price,
                      msrp: row[i]?.msrp,
                      description: row[i]?.description,
                      thumbnail_image: row[i]?.thumbnail_image,
                      closeup_image: row[i]?.closeup_image,
                      alternative_images: row[i]?.alternative_images.split(","),
                      shipping_message_id: await findObjectId(
                        COLLECTION.SHIPPING_MESSAGE,
                        {
                          code: row[i]?.shipping_message_code,
                        },
                      ),
                      country_id: await findObjectId(COLLECTION.COUNRTY, {
                        code: row[i]?.country_code,
                      }),
                      gender: row[i]?.gender,
                      metaltype: row[i]?.metaltype,
                      weight: row[i]?.weight,
                      quantity: row[i]?.quantity,
                      related_product_ids: await findAllObjectId(
                        COLLECTION.PRODUCT,
                        {
                          sku: {
                            $in: row[i]?.related_product_sku.split(","),
                          },
                        },
                      ),
                      category_ids: await findAllObjectId(COLLECTION.CATEGORY, {
                        code: {
                          $in: row[i]?.category_code.split(","),
                        },
                      }),
                      local_attribute: [],
                      global_attribute_ids: await findAllObjectId(
                        COLLECTION.TEMPLATE,
                        {
                          code: {
                            $in: row[i]?.template_code.split(","),
                          },
                        },
                      ),
                      created_by: user_id,
                      status: 1,
                      created_at: new Date(),
                      updated_at: new Date(),
                    });
                  }

                  await insertManyBulk(
                    COLLECTION.PRODUCT,
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
            }
          } else {
            res.json({
              status: false,
              message: RESPONSE.UPLOAD_ERROR,
              result: [],
            });
          }
        } else {
          res.json({ status: false, message: RESPONSE.NOT_FOUND, result: [] });
        }
      });
  },
);

//Add Old Product from csv
router.post(
  API.ADMIN.PRODUCT.ADD_PRODUCT_FROM_CSV,
  // filesvalidate(universal.importAndExportCsv),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { user_id } = req.body;
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then(async (csvrow) => {
        async function insetEverything(csvrow) {
          let body = csvrow.map((item) => ({
            product_name: item.product_name,
            old_id: item.ID,
            product_path: "",
            sku: item.sku,
            price: item.price,
            msrp: item.msrp,
            description: item.description,
            thumbnail_image: item.thumbnail_image,
            closeup_image: item.closeup_image,
            alternative_images: [],
            shipping_message_id: null,
            country_id: null,
            gender: "",
            metaltype: "",
            weight: item.weight,
            quantity: "",
            related_product_ids: [],
            category_ids: [],
            local_attribute: [],
            global_attribute_ids: [],
            created_by: user_id,
            status: 1,
            created_at: new Date(),
            updated_at: new Date(),
          }));

          await insertManyBulk(
            COLLECTION.PRODUCT,
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

//Add Old Product Link from CSV
router.post(
  API.ADMIN.PRODUCT.ADD_PRODUCT_LINK_FROM_CSV,
  // filesvalidate(universal.importAndExportCsv),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { user_id } = req.body;
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then(async (csvrow) => {
        async function insetEverything(csvrow) {
          let body = await csvrow.map((item) => ({
            filter: {
              sku: item.SKU,
            },
            body: { $set: { product_path: item.URL } },
          }));

          await updateManyBulk(
            COLLECTION.PRODUCT,
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

//Add Old Product Short Order
router.post(
  "/old-product-short-order",
  // filesvalidate(universal.importAndExportCsv),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { user_id } = req.body;
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then(async (csvrow) => {
        async function insetEverything(csvrow) {
          // let body = await csvrow.map((item) => ({
          //   filter: {
          //     old_id: item.PRODUCT_ID,
          //   },
          //   body: {
          //     $set: {
          //       short_order: [],
          //     },
          //     // $push: {
          //     //   short_order: { order: item.ORDER, cat_old_id: item.CAT_ID },
          //     // },
          //   },
          // }));

          let body = await csvrow.map((item) => ({
            filter1: {
              cat_old_id: item.CAT_ID,
            },
            filter2: {
              old_id: item.PRODUCT_ID,
            },
            body: {
              order: item.ORDER,
            },
          }));

          let bulk1 = await server
            .collection(COLLECTION.PRODUCT_CATEGORY)
            .initializeOrderedBulkOp();

          // let categoryBulk = await server
          //   .collection(COLLECTION.CATEGORY)
          //   .initializeOrderedBulkOp();

          // let productBulk = await server
          //   .collection(COLLECTION.PRODUCT)
          //   .initializeOrderedBulkOp();

          // await body.map((item, index) =>
          //   view(
          //     item.filter1,
          //     COLLECTION.CATEGORY,
          //     async (status, message, result) => {
          //       // view(item.filter2,
          //       //   COLLECTION.PRODUCT,
          //       //   async(status1, message1, result1) => {

          //       //   });

          //       if (status) {
          //         await bulk1.insert({
          //           created_at: new Date(),
          //           created_by: user_id,
          //           category_id: result._id,
          //           cat_old_id: item.filter1.old_id,
          //           products: [],
          //           //  $push: {
          //           //    short_order: {
          //           //      category_id: result._id,
          //           //      order: item.body.order,
          //           //    },
          //           //  },
          //         });
          //       }

          //       if (parseInt(body.length - 1) === index) {
          //         await bulk1.execute((err, doc) => {
          //           if (err) {
          //             console.error(err);
          //             return res.json({
          //               status: false,
          //               message: "error occour try again....",
          //               result: err.message,
          //             });
          //           } else {
          //             if (doc) {
          //               return res.json({
          //                 status: true,
          //                 message: RESPONSE.EDIT,
          //                 result: doc,
          //               });
          //             } else {
          //               return res.json({
          //                 status: false,
          //                 message: RESPONSE.NOT_FOUND,
          //                 result: null,
          //               });
          //             }
          //           }
          //         });
          //       }
          //     }
          //   )
          // );

          await body.map((item, index) =>
            view(
              item.filter2,
              COLLECTION.PRODUCT,
              async (status, message, result) => {
                if (status) {
                  await bulk1.find(item.filter1).insert({
                    $push: {
                      products: {
                        product_id: result._id,
                        order: item.body.order,
                      },
                    },
                  });
                }

                if (parseInt(body.length - 1) === index) {
                  await bulk1.execute((err, doc) => {
                    if (err) {
                      console.error(err);
                      return res.json({
                        status: false,
                        message: "error occour try again....",
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
                }
              },
            ),
          );

          // await updateManyBulk(
          //   COLLECTION.PRODUCT,
          //   body,
          //   (status, message, result) => {
          //     return res.json({
          //       status: status,
          //       message: message,
          //       result: result,
          //     });
          //   }
          // );
        }
        insetEverything(csvrow);
      });
  },
);

//Add old product category from csv
router.post(
  API.ADMIN.PRODUCT.ADD_PRODUCT_CATEGORY_FROM_CSV,
  // filesvalidate(universal.importAndExportCsv),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { user_id } = req.body;
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then(async (csvrow) => {
        async function insetEverything(csvrow) {
          let body = await csvrow.map((item) => ({
            filter1: {
              old_id: item.CAT_ID,
            },
            filter2: {
              old_id: item.PRODUCT_ID,
            },
          }));

          await insetIdBulk(
            COLLECTION.CATEGORY,
            COLLECTION.PRODUCT,
            body,
            "category_ids",
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

//Add old product global attribute template from csv
router.post(
  PRODUCT.ADD_GLOBAL_ATTRIBUTE_FROM_CSV,
  // filesvalidate(universal.importAndExportCsv),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { user_id } = req.body;
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then(async (csvrow) => {
        async function insetEverything(csvrow) {
          let body = await csvrow.map((item) => ({
            filter1: {
              old_id: item.TEMPLATE_ID,
            },
            filter2: {
              old_id: item.PRODUCT_ID,
            },
          }));

          await insetIdBulk(
            COLLECTION.TEMPLATE,
            COLLECTION.PRODUCT,
            body,
            "global_attribute_ids",
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

//Add old related products from csv
router.post(
  API.ADMIN.PRODUCT.ADD_RELATED_PRODUCT_FROM_CSV,
  // filesvalidate(universal.importAndExportCsv),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { user_id } = req.body;
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then(async (csvrow) => {
        async function insetEverything(csvrow) {
          let body = await csvrow.map((item) => ({
            filter1: {
              old_id: item.RELPROD_ID,
            },
            filter2: {
              old_id: item.PRODUCT_ID,
            },
          }));

          await insetIdBulk(
            COLLECTION.PRODUCT,
            COLLECTION.PRODUCT,
            body,
            "related_product_ids",
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

//Add old product local attribute from csv
router.post(
  API.ADMIN.PRODUCT.ADD_LOCAL_ATTRIBUTE_FROM_CSV,
  // filesvalidate(universal.importAndExportCsv),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { user_id } = req.body;
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then(async (csvrow) => {
        async function insetEverything(csvrow) {
          let body = await csvrow.map((item) => ({
            filter1: {
              old_id: item.ATTRIBUTE_ID,
            },
            filter2: {
              old_id: item.PRODUCT_ID,
            },
          }));

          await insetIdBulk(
            COLLECTION.LOCAL_ATTRIBUTES,
            COLLECTION.PRODUCT,
            body,
            "local_attribute",
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

//export all products from DB
router.post(
  API.ADMIN.PRODUCT.SEND_PRODUCT_TO_CSV,
  ensureAuthorisedAdmin,
  async (req, res) => {
    viewAll({}, COLLECTION.PRODUCT, async (status, message, result) => {
      const filter = {
        prd_id: { $in: result.map((item) => item._id) },
      };

      findAllCategory(COLLECTION.PRODUCT_META, filter, result, (rows) => {
        if (rows.length > 0) {
          const json2csv = new Parser({
            fields: [
              "product_name",
              "sku",
              "product_path",
              "price",
              "msrp",
              "weight",
              "gender",
              "description",
              "metaltype",
              "meta_keyword",
              "meta_desc",
              "meta_title",
            ],
          });
          const csv = json2csv.parse(rows);
          res.send(csv);
        } else {
          res.send(RESPONSE.NOT_FOUND);
        }
      });
    });
  },
);

//Add Old Product Statistics from CSV
router.post(
  API.ADMIN.PRODUCT.ADD_PRODUCT_STATISTICS_FROM_CSV,
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { csv } = req.files;

    await csvtojson()
      .fromString(csv.data.toString("utf8"))
      .then(async (csvrow) => {
        async function insetEverything(csvrow) {
          let body = await csvrow.map((item) => ({
            filter: {
              old_id: item.PRODUCT_ID,
            },
            body: { $set: { sold: item.SALES } },
          }));

          await updateManyBulk(
            COLLECTION.PRODUCT,
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

// DELETE product attribute
router.post("/delete-product-attribute", async (req, res) => {
  const { attribute_id, attribute_type, product_id } = req.body;

  const body = {
    $pull: {
      attribute: { _id: new ObjectId(attribute_id), type: attribute_type },
    },
  };

  update(
    { product_id: new ObjectId(product_id) },
    body,
    COLLECTION.PRODUCT_ATTRIBUTE,
    (status, message, result) => {
      if (status) {
        if (attribute_type === "local") {
          deleteOne(
            { _id: new ObjectId(attribute_id) },
            COLLECTION.LOCAL_ATTRIBUTES,
            (status1, message1, result1) => {
              if (status1) {
                update(
                  { _id: new ObjectId(product_id) },
                  {
                    $pull: {
                      local_attribute: { $in: [new ObjectId(attribute_id)] },
                    },
                  },
                  COLLECTION.PRODUCT,
                  (status2, message2, result2) => {
                    if (status2) {
                      res.json({ status, message, result });
                    } else {
                      res.json({
                        status: status2,
                        message: message2,
                        result: result2,
                      });
                    }
                  },
                );
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
          update(
            { _id: new ObjectId(product_id) },
            {
              $pull: {
                global_attribute_ids: { $in: [new ObjectId(attribute_id)] },
              },
            },
            COLLECTION.PRODUCT,
            (status2, message2, result2) => {
              if (status2) {
                res.json({ status, message, result });
              } else {
                res.json({
                  status: status2,
                  message: message2,
                  result: result2,
                });
              }
            },
          );
        }
      } else {
        res.json({ status, message, result });
      }
    },
  );
});

module.exports = router;
