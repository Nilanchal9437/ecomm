const yup = require("yup");
const config = require("../../config/config");

module.exports = {
  uploadImage: yup.object({
    image: yup
      .object()
      .shape({
        name: yup.string().trim().required("Please upload a proper file!"),
        size: yup.number().required("Please upload a proper file!"),
      })
      .required("image should not be empty!"),
  }),

  uploadImagePath: yup.object({
    path: yup.string().trim().required("Image path should not be empty!"),
  }),

  deleteImage: yup.object({
    path: yup.string().trim().required("Image path should not be empty!"),
  }),
};
