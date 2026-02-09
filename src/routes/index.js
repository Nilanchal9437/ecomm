import express from "express";
const router = express.Router();

import user from "./user/index.js";
// import product from "./product/index.js";
// import local_attribute from "./local_attribute/index.js";
// import template from "./template/index.js";
// import attribute from "./attributes/index.js";
// import metatype from "./metalType/index.js";
// import category from "./category/index.js";
// import category_meta from "./category_meta/index.js";
// import shortproduct from "./short-product/index.js";
import config from "#@/config/config.js";

router.use(config.ROUTER.USER, user);
// router.use(config.ROUTER.PRODUCT, product);
// router.use(config.ROUTER.LOCAL_ATTRIBUTES, local_attribute);
// router.use(config.ROUTER.TEMPLATE, template);
// router.use(config.ROUTER.ATTRIBUTES, attribute);
// router.use(config.ROUTER.METALTYPE, metatype);
// router.use(config.ROUTER.CATEGORY, category);
// router.use(config.ROUTER.CATEGORY_META, category_meta);
// router.use(config.ROUTER.SHORT_PRODUCT, shortproduct);

export default router;
