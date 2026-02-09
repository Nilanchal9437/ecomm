const express = require("express");
const router = express.Router();

const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const fileValidate = require("../../validation/fileValidation");
const validate = require("../../validation");
const { doClient } = require("../../app/digital-ocean");
const { ensureAuthorisedAdmin } = require("../../auth");
const { BUCKET_NAME } = require("../../config/config").DIGITALOCEAN_IMAGE;
const {
  uploadImage,
  uploadImagePath,
  deleteImage,
} = require("../../schema/image");

const uploadToSpaces = async (path, image) => {
  const bucket = {
    Bucket: BUCKET_NAME,
    Key: path + image?.name,
    Body: image?.data,
    ACL: "public-read",
  };

  try {
    const result = await doClient.send(new PutObjectCommand(bucket));
    return {
      status: true,
      message: "image uploaded successfully",
      result: result,
      replace: false,
      url: path + image?.name,
    };
  } catch (err) {
    console.error(err);
    return {
      status: false,
      replace: false,
      message: "can't upload image in digital ocean",
      result: null,
      url: null,
    };
  }
};

router.post(
  "/upload-image",
  fileValidate(uploadImage),
  validate(uploadImagePath),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { image } = req.files;
    const { path } = req.body;

    const read = {
      Bucket: BUCKET_NAME,
      Key: path + image?.name,
    };
    try {
      const data = await doClient.getObject(read);

      if (data.Body) {
        return res.json({
          status: true,
          message: "image already exist!",
          replace: true,
          url: path + image?.name,
        });
      }
    } catch (err) {
      const { status, message, result, url, replace } = await uploadToSpaces(
        path,
        image,
      );
      return res.json({ status, message, result, url, replace });
    }
  },
);

router.post(
  "/replace-image",
  fileValidate(uploadImage),
  validate(uploadImagePath),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { image } = req.files;
    const { path } = req.body;

    const { status, message, result, url, replace } = await uploadToSpaces(
      path,
      image,
    );

    return res.json({ status, message, result, url, replace });
  },
);

router.post(
  "/delete-image",
  validate(deleteImage),
  ensureAuthorisedAdmin,
  async (req, res) => {
    const { path } = req.body;

    const bucket = {
      Bucket: BUCKET_NAME,
      Key: path,
    };

    try {
      const result = await doClient.send(new DeleteObjectCommand(bucket));

      res.json({
        status: true,
        message: "image deleted successfully",
        result: result,
      });
    } catch (err) {
      console.error(err);
      res.json({
        status: false,
        message: "can't delete image from digital ocean",
        result: null,
      });
    }
  },
);

module.exports = router;
