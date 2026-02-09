const { ObjectId } = require("mongodb");
const { viewAll, AsyncViewAll } = require("../mongo-qury/findAll");

module.exports = {
  findCategory: (collection, filter, csvrow, callBack) => {
    let row = [];

    viewAll(filter, collection, async (status, message, result) => {
      if (
        result !== null &&
        result !== undefined &&
        result !== "" &&
        result.length
      ) {
        row = await csvrow.map((item) =>
          result.find((item2) => item.category_nm === item2.category_nm) !==
          undefined
            ? {
                ...item,
                cat_id: result.find(
                  (item2) => item.category_nm === item2.category_nm
                )._id,
              }
            : { ...item, cat_id: 0 }
        );
        callBack(row);
      } else {
        row = await csvrow.map((item) => ({
          ...item,
          cat_id: 0,
        }));
        callBack(row);
      }
    });
  },

  findProduct: (collection, filter, csvrow, callBack) => {
    let row = [];

    viewAll(filter, collection, async (status, message, result) => {
      if (
        result !== null &&
        result !== undefined &&
        result !== "" &&
        result.length
      ) {
        row = await csvrow.map((item) =>
          result.find((item2) => item.product_nm === item2.product_nm) !==
          undefined
            ? {
                ...item,
                prd_id: result.find(
                  (item2) => item.product_nm === item2.product_nm
                )._id,
              }
            : { ...item, prd_id: 0 }
        );
        callBack(row);
      } else {
        row = await csvrow.map((item) => ({
          ...item,
          prd_id: 0,
        }));
        callBack(row);
      }
    });
  },

  findCountry: (collection, filter, csvrow, callBack) => {
    let row = [];

    viewAll(filter, collection, async (status, message, result) => {
      if (
        result !== null &&
        result !== undefined &&
        result !== "" &&
        result.length
      ) {
        row = await csvrow.map((item) =>
          result.find((item2) => item.country_nm === item2.country_nm) !==
          undefined
            ? {
                ...item,
                country_id: result.find(
                  (item2) => item.country_nm === item2.country_nm
                )._id,
              }
            : { ...item, country_id: 0 }
        );
        callBack(row);
      } else {
        row = await csvrow.map((item) => ({
          ...item,
          country_id: 0,
        }));
        callBack(row);
      }
    });
  },

  findAttribute: (collection, filter, csvrow, callBack) => {
    let row = [];

    viewAll(filter, collection, async (status, message, result) => {
      if (
        result !== null &&
        result !== undefined &&
        result !== "" &&
        result.length
      ) {
        row = await csvrow.map((item) =>
          result.find((item2) => item.attribute_prompt === item2.prompt) !==
          undefined
            ? {
                ...item,
                attr_id: result.find(
                  (item2) => item.attribute_prompt === item2.prompt
                )._id,
              }
            : { ...item, attr_id: 0 }
        );
        callBack(row);
      } else {
        row = await csvrow.map((item) => ({
          ...item,
          attr_id: 0,
        }));
        callBack(row);
      }
    });
  },

  findAllAttribute: (collection, filter, rows, callBack) => {
    let row = [];
    viewAll(filter, collection, async (status, message, result) => {
      if (
        result !== null &&
        result !== undefined &&
        result !== "" &&
        result.length
      ) {
        row = rows.map((item) =>
          result.find(
            (item2) => item.attr_id.toString() == item2._id.toString()
          ) !== undefined
            ? {
                ...item,
                attribute_prompt: result.find(
                  (item2) => item.attr_id.toString() === item2._id.toString()
                ).prompt,
              }
            : {
                ...item,
                attribute_prompt: "",
              }
        );

        callBack(row);
      } else {
        row = rows.map((item) => ({
          ...item,
          attribute_prompt: "",
        }));

        callBack(row);
      }
    });
  },

  findAllCountry: (collection, filter, rows, callBack) => {
    let row = [];
    viewAll(filter, collection, async (status, message, result) => {
      if (
        result !== null &&
        result !== undefined &&
        result !== "" &&
        result.length
      ) {
        row = rows.map((item) =>
          result.find(
            (item2) => item.country_id.toString() === item2._id.toString()
          ) !== undefined
            ? {
                ...item,
                country_nm: result.find(
                  (item2) => item.country_id.toString() === item2._id.toString()
                ).country_nm,
              }
            : {
                ...item,
                country_nm: "",
              }
        );
        callBack(row);
      } else {
        row = rows.map((item) => ({
          ...item,
          country_nm: "",
        }));

        callBack(row);
      }
    });
  },

  findAllCategory: (collection, filter, rows, callBack) => {
    let row = [];
    viewAll(filter, collection, async (status, message, result) => {
      if (Boolean(result && result.length > 0)) {
        rows.map((item) => {
          const data = result.find(
            (item2) => item2.prd_id.toString() == item._id.toString()
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
        callBack(row);
      } else {
        rows.map((item) =>
          row.push({
            ...item,
            meta_keyword: "",
            meta_desc: "",
            meta_title: "",
          })
        );
        callBack(row);
      }
    });
  },

  findAllProduct: (collection, filter, rows, callBack) => {
    let row = [];
    viewAll(filter, collection, async (status, message, result) => {
      if (
        result !== null &&
        result !== undefined &&
        result !== "" &&
        result.length > 0
      ) {
        row = rows.map((item) =>
          result.find(
            (item2) => item.prd_id.toString() == item2._id.toString()
          ) !== undefined
            ? {
                ...item,
                product_nm: result.find(
                  (item2) => item.prd_id.toString() === item2._id.toString()
                ).product_nm,
              }
            : {
                product_nm: "",
                ...item,
              }
        );
        callBack(row);
      } else {
        row = rows.map((item) => ({
          ...item,
          product_nm: "",
        }));
        callBack(row);
      }
    });
  },

  findAllObjectId: async (collection, filter) => {
    let row = new Array();
    try {
      const { status, result } = await AsyncViewAll(filter, collection);

      if (result && result.length && status) {
        result.map((item) => row.push(new ObjectId(item._id)));
        return row;
      } else {
        return row;
      }
    } catch (err) {
      console.error(err);
      return row;
    }
  },

  findObjectId: async (collection, filter) => {
    try {
      const { status, result } = await AsyncViewAll(filter, collection);

      if (result && result.length && status) {
        return new ObjectId(result[0]._id);
      } else {
        return null;
      }
    } catch (err) {
      console.error(err);
      return null;
    }
  },
};
