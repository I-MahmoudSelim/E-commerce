const express = require("express");
const app = express()

require("./Database/mongoose");

const personRouters = require("./Routers/Person");
const userRouters = require("./Routers/User");
const sellerRouters = require("./Routers/Seller");
const productRouters = require("./Routers/Product");

const errorHandler = require("./Utils/errorHandler")
//build body parser middelware to parse data 
app.use(express.json())
app.use(express.urlencoded({ "extended": false }));

app.use("/ecommerce", userRouters);
app.use("/ecommerce", sellerRouters);
app.use("/ecommerce", personRouters);
app.use("/ecommerce", productRouters);
app.use(errorHandler)
module.exports = app;