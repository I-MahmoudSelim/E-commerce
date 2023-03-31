const express = require("express");
const router = new express.Router();
const handler = require("../Utils/asyncHandler");
const MyError = require("../Utils/MyError");
const auth = require("../Middleware/auth");
const Product = require("../Model/Product");
const Category = require("../Model/Category");

router.get("/product", handler(async (req, res) => {
    const filter = {};
    const sortBy = {};
    let limit = req.query.limit || 10;
    let skip = req.query.skip || 0;

    if (!req.query) { throw new MyError(400, "There is no products ,if there is no queries") }

    if (req.query.name) { filter.name = req.query.name }
    if (req.query.category) {
        const category = await Category.exists({ name: req.query.category }) //return the id of that category
        filter.category = category._id
    }
    if (req.query.brand) { filter.brand = req.query.brand }
    if (req.query.maxPrice) {
        filter.price = {}
        filter.price["$lte"] = req.query.maxPrice
    }
    if (req.query.minPrice) {
        if (!filter.price) {
            filter.price = {}
        }
        filter.price["$gte"] = req.query.minPrice
    }

    if (req.query.sortBy1) {
        const sort = req.query.sortBy1.split(":")
        sortBy[sort[0]] = sort[1] === "des" ? -1 : 1
    }

    if (req.query.sortBy2) {
        const sort = req.query.sortBy2.split(":")
        sortBy[sort[0]] = sort[1] === "des" ? -1 : 1
    }
    const products = await Product.find(filter)
        .sort(sortBy)
        .select("name brand price").limit(+limit).skip(+skip * +limit)
    if (!products || !products.length) {
        throw new MyError(404, "There is no product with this criteria")
    }
    res.status(200).send({ products })

}))

router.get("/product/:id", handler(async (req, res) => {
    const product = await Product.findById(req.params.id)
    if (!product) {
        throw new MyError(404, "This product is not founded")
    }
    res.status(200).send({ product })
}))

router.get("/product/:id/category", handler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate("category")
    if (!product.category) {
        throw new MyError(404, "category is not founded")
    }
    res.status(200).send({ product, category: product.category })
}))

router.get("/product/:id/image", handler(async (req, res) => {
    const product = await Product.findById(req.params.id)
    if (!product.image) {
        throw new MyError(404, "Product does not have image")
    }
    res.status(200).send({ product, image: product.image })
}))


module.exports = router;