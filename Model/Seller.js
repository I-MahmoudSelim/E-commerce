const mongoose = require("mongoose");
const personSchema = require("./Person")
const sellerSchema = personSchema.clone();

const Product = require("./Product")

sellerSchema.set('toJSON', { virtuals: false });
sellerSchema.set('toObject', { virtuals: false });

sellerSchema.add({
    scarce: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Product"
    }]
})

// METHODS

// ADD product to my account
sellerSchema.method("addProduct", async function (body) {
    return await Product.create(this, body)
})

// Update my product
sellerSchema.method("updateProduct", async function (id, body) {
    const product = await Product.findById(id)
    return await product.modifiy(body, this)
})

// DELETE my product
sellerSchema.method("deleteProduct", async function (id, body) {
    const product = await Product.findById(id)
    return await product.delete(this)
})

// Upload my product image
sellerSchema.method("updateImage", async function (id, image) {
    const product = await Product.findById(id)
    return await product.uploadImage(image, this)
})

// Delete my product image
sellerSchema.method("deleteImage", async function (id) {
    const product = await Product.findById(id)
    return await product.deleteImage(this)

})

// Upload my product Gallery
sellerSchema.method("updateGallery", async function (id, images) {
    const product = await Product.findById(id)
    return await product.uploadGallery(images, this)
})

// Delete my product Gallery
sellerSchema.method("deleteGallery", async function (id) {
    const product = await Product.findById(id)
    return await product.deleteGallery(this)

})

// Supply products
sellerSchema.method("supplyProduct", async function (id, quantity) {
    const product = await Product.findById(id)
    return await product.supply(quantity, this)
})

// Send warning
sellerSchema.method("needSupply", async function (product) {
    this.scarce.push(product)
    await this.save()
})

// Change delivery status
sellerSchema.method("delivery", async function (id, status) {
    const populated = await this.populate({ path: "sales", match: { _id: id } })
    let sale = populated.sales[0]
    // console.log(sale, "Model/Seller.js 78")
    sale = await sale.changeStatues(status)
    return { seller: this, sale }
})

// calculate sales
sellerSchema.method("calcSales", async function (match) {
    const populated = await this.populate({
        path: "sales",
        match,
        select: "total"
    })
    let sales = populated.sales
    console.log(sales)
    const profits = sales.reduce(
        (x, sale) => x + sale.total
        , 0)

    return profits
})

// VIRTUALS

sellerSchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: "owner"
})

sellerSchema.virtual('sales', {
    ref: "Sold",
    localField: "_id",
    foreignField: "seller"
})

module.exports = new mongoose.model("Seller", sellerSchema)