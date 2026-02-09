const filesvalidate = (schema) => async (req, res, next) => {
  try {
    req.files = await schema.validate(req.files);
    next();
  } catch (err) {
    if (err.errors != null && err.errors.length > 0) {
      return res.json({ status: false, message: err.errors[0] });
    } else {
      return res.json({ status: false, message: err.message });
    }
  }
};

module.exports = filesvalidate;
