const { Router } = require("express");
const { login, register } = require("../controllers/user.controllers");

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);

module.exports = {
    userRoute: router,
};