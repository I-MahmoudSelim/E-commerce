const express = require("express");
const auth = require("../Middleware/auth");
const MyError = require("../Utils/MyError");
const handler = require("../Utils/asyncHandler");
const router = new express.Router();

// const Product = require("../Model/Product");
const sharp = require("sharp");
const upload = require("../Middleware/uplaod");

// Add product to my market
router.post("/seller/me/product", auth, handler(async (req, res) => {
    const seller = req.person
    const product = await seller.addProduct(req.body)

    res.status(201).send({ seller: req.person, product })
}))

// Display all my products 
router.get("/seller/me/product", auth, handler(async (req, res) => {
    let seller = req.person
    let populated = await seller.populate("products")
    if (!seller) {
        throw new MyError(500, "Something went wrong")
    }
    let products = populated.products
    res.status(200).send({ seller, products })
}))

// Display one product
router.get("/seller/me/product/:id", auth, handler(async (req, res) => {
    const seller = req.person
    let populated = await seller.populate({
        path: 'products',
        match: { _id: req.params.id }
    })

    if (!populated.products.length) {
        throw new MyError(500, "Something went wrong")
    }

    let product = populated.products[0]
    const profits = await seller.calcSales({ product: req.params.id });
    // const profits = await product.getProfit();

    res.status(200).send({ seller, product, profits })
}))

// Update one product
router.patch("/seller/me/product/:id", auth, handler(async (req, res) => {
    const seller = req.person
    let product = await seller.updateProduct(req.params.id, req.body)
    if (!product) {
        throw new MyError(500, "Something went wrong")
    }

    res.status(200).send({ seller, product })
}))

// Delete my product
router.delete("/seller/me/product/:id", auth, handler(async (req, res) => {
    let seller = req.person
    await seller.deleteProduct(req.params.id)

    res.status(200).send({ seller, succes: true, message: "Product is deleted succesfully" })
}))

// Upload my product image
router.put("/seller/me/product/:id/image", auth, handler(upload.single("image")), handler(async (req, res) => {
    let seller = req.person
    console.log(req.files)
    const image = await sharp(req.file.buffer).png().resize({ width: 300, height: 300 }).toBuffer()
    let product = await seller.updateImage(req.params.id, image)
    if (!product) {
        throw new MyError(500, "Something went wrong")
    }
    res.status(200).send({ seller, product })
}))

// delete my product image
router.delete("/seller/me/product/:id/image", auth, handler(async (req, res) => {
    let seller = req.person
    const product = await seller.deleteImage(req.params.id)
    if (!product) {
        throw new MyError(500, "Something went wrong")
    }
    res.status(200).send({ seller })
}))

// Upload my product images gallery
router.put("/seller/me/product/:id/gallery", auth, handler(upload.array("gallery")), handler(async (req, res) => {
    let seller = req.person
    const images = await Promise.all(req.files.map(async file => await sharp(file.buffer).png().resize({ width: 300, height: 300 }).toBuffer()))
    let product = await seller.updateGallery(req.params.id, images)
    if (!product) {
        throw new MyError(500, "Something went wrong")
    }
    res.status(200).send({ seller, product })

}))

// Delete my product images gallery
router.delete("/seller/me/product/:id/gallery", auth, handler(async (req, res) => {
    let seller = req.person
    const product = await seller.deleteGallery(req.params.id)
    if (!product) {
        throw new MyError(500, "Something went wrong")
    }
    res.status(200).send({ seller })
}))

// Supply My product
router.put("/seller/me/product/:id/supply", auth, handler(async (req, res) => {
    let seller = req.person;
    let quantity = req.body.quantity
    let product = await seller.supplyProduct(req.params.id, quantity)
    if (!product) {
        throw new MyError(500, "Something went wrong")
    }
    res.status(200).send({ seller, product })
}))

// Change delivery status

router.put("/seller/me/sale/:id/delivery", auth, handler(async (req, res) => {
    let seller = req.person;
    const id = req.params.id
    const data = await seller.delivery(id, req.body.status);

    res.status(200).send(data)
}))

// get all sales profit
router.get("/seller/me/profit", auth, handler(async (req, res) => {
    let seller = req.person;

    const profits = await seller.calcSales();
    res.status(200).send({ seller, profits })
}))



module.exports = router;