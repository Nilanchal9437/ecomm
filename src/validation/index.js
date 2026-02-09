const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.validate(req.body);
    next();
  } catch (err) {
    if (err.errors != null && err.errors.length > 0) {
      return res.json({ status: false, message: err.errors[0] });
    } else {
      return res.json({ status: false, message: err.message });
    }
  }
};

export default validate;
