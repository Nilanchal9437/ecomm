import yup from "yup";
import config from "#@/config/config.js";

const { USER } = config.SCHEMA_MESSAGE;
const { NAME, EMAIL, PASSWORD } = config.REGEXP;

export const signupUser = yup.object({
  name: yup.string().trim().required(USER.NAME).matches(NAME, USER.VALID_NAME),
  mobile: yup
    .string()
    .trim()
    .matches(/^[0-9]+$/, "Must be only digits")
    .min(10, USER.CONTACT_NO)
    .max(10, USER.CONTACT_NO)
    .nullable()
    .required(USER.CONTACT_NO),
  email: yup
    .string()
    .trim()
    .required(USER.EMAIL)
    .matches(EMAIL, USER.VALID_EMAIL),
  password: yup
    .string()
    .trim()
    .required(USER.PASSWORD)
    .matches(PASSWORD, USER.VALID_PASSWORD),
});

export const signinUser = yup.object({
  email: yup
    .string()
    .trim()
    .email(USER.EMAIL)
    .required(USER.EMAIL)
    .matches(EMAIL, USER.VALID_EMAIL),
  password: yup.string().trim().required(USER.PASSWORD),
});

export default { signinUser, signupUser };
