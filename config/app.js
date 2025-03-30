const express = require("express");
const cors = require("cors");
const app = express();
require("./../db/mongo.js");    

const IMAGES_FOLDER = String(process.env.IMAGES_FOLDER);  
app.use(cors());
app.use(express.json());
app.use("/" + process.env.IMAGES_PUBLIC_URL, express.static(IMAGES_FOLDER));


module.exports = { app };