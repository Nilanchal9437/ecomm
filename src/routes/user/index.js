import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import router from "#@/app/index.js";
import config from "#@/config/config.js";
import validate from "#@/validation/index.js";
import { signinUser, signupUser } from "#@/schema/user/index.js";
import viewOne from "#@/mongo-qury/viewOne.js";
import insertOne from "#@/mongo-qury/insertOne.js";
import updateOne from "#@/mongo-qury/updateOne.js";
import deleteOne from "#@/mongo-qury/deleteOne.js";
import ensureAuthorisedAdmin from "#@/auth/index.js";

const { SIGNUP_USER, SIGNIN_USER, GET_USER_DETAILS, UPDATE_USER, DELETE_USER } =
  config.API.USER;

const { USER } = config.COLLECTION;
const { LOGIN_SUCCESS, EMAIL_EXISTS, PASSWORDS_DONT_MATCH, FAILED } =
  config.RESPONSE;

//admin Signup User
router.post(SIGNUP_USER, validate(signupUser), async (req, res) => {
  const { name, email, password, mobile } = req.body;

  const user = {
    name,
    email,
    password: await bcrypt.hash(password, 12),
    mobile,
    user_type: "A",
    created_on: new Date(),
    status: true,
  };

  const { status } = await viewOne({ email: email }, USER);

  if (!status) {
    const { status: status2, message: message2 } = await insertOne(user, USER);

    if (status2) {
      const { status: status3 } = await viewOne({ email: email }, USER);
      if (status3) {
        return res.json({
          status: status3,
          message: "Register successfully enjoy now....",
        });
      } else {
        return res.json({
          status: status,
          message: FAILED,
        });
      }
    } else {
      return res.json({
        status: status2,
        message: message2,
      });
    }
  } else {
    return res.json({
      status: false,
      message: EMAIL_EXISTS,
    });
  }
});

//admin Signin User
router.post(SIGNIN_USER, validate(signinUser), async (req, res) => {
  const { email, password } = req.body;

  const { status, result } = await viewOne({ email: email }, USER);

  console.log(status, result);

  if (status) {
    if (bcrypt.compareSync(password, result.password)) {
      return res.json({
        status: status,
        message: LOGIN_SUCCESS,
        result: {
          ...result,
          user_token: jwt.sign({ email }, config.JWT_SECRET, {
            expiresIn: "24h",
          }),
        },
      });
    } else {
      return res.json({
        status: false,
        message: PASSWORDS_DONT_MATCH,
      });
    }
  } else {
    return res.json({
      status: status,
      message: FAILED,
      result: result,
    });
  }
});

//user Get User Details
router.get(GET_USER_DETAILS, ensureAuthorisedAdmin, async (req, res) => {
  const user_id = req.userId;

  const { status, result, message } = await viewOne({ _id: user_id }, USER);

  if (status) {
    return res.json({
      status: status,
      message: message,
      result: {
        _id: result._id,
        email: result.email,
        user_type: result.user_type,
        created_on: result.created_on,
        status: result.status,
      },
    });
  } else {
    return res.json({
      status: status,
      message: "User not found!",
    });
  }
});

//Update User Details
router.put(UPDATE_USER, ensureAuthorisedAdmin, async (req, res) => {
  const user_id = req.userId;

  const { status } = await viewOne({ _id: user_id }, USER);

  if (status) {
    const {
      status: status2,
      result: result2,
      message: message2,
    } = await updateOne(
      { _id: user_id },
      {
        $set: {
          name: req.body.name,
          mobile: req.body.mobile,
          email: req.body.email,
        },
      },
      USER,
    );
    if (status2) {
      return res.json({
        status: status2,
        message: message2,
        result: {
          _id: result2._id,
          email: result2.email,
          status: result2.status,
        },
      });
    } else {
      return res.json({
        status: status2,
        message: message2,
      });
    }
  } else {
    return res.json({
      status: status,
      message: "User not found!",
    });
  }
});

router.delete(DELETE_USER, ensureAuthorisedAdmin, async (req, res) => {
  const user_id = req.userId;

  const { status, message, result } = await deleteOne({ _id: user_id }, USER);

  if (status) {
    return res.json({
      status: status,
      message: message,
      result: result,
    });
  } else {
    return res.json({
      status: status,
      message: "User not found!",
    });
  }
});

export default router;
