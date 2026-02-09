import "dotenv/config";
import express from "express";
import cors from "cors";
import express_fileUpload from "express-fileupload";
import { connect } from "#@/database/connect.js";
import Index from "#@/routes/welcome/index.js";
import AdminRouter from "#@/routes/index.js";
import config from "#@/config/config.js";

const App = express();

App.set("port", config.PORT);

App.use(cors());

connect()
  .then(() => {
    App.listen(App.get("port"), function () {
      console.log("app is running on port " + App.get("port"));
    });
  })
  .catch((err) => {
    console.error("Failed to start server due to DB connection error:", err);
  });

App.use(express.urlencoded({ extended: true }));
App.use(express.json());
App.use(express.raw());
App.use(express_fileUpload());

App.use("/", Index);
App.use("/admin/api", AdminRouter);

export default App;
