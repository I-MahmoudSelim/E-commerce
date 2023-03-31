const { Schema, model } = require("mongoose")
const MyError = require("../Utils/MyError")


const itemSchema = new Schema({
    seller: {
        type: Schema.Types.ObjectId,
        ref: "Seller",
        required: true
    },
    buyer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    product: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Product",
        autopopulate: true
    },
    quantity: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
},
    {
        toJSON: { getter: true, virtuals: true },
        toObject: { getter: true, virtuals: true },
    })
/**************************************************************************************/
// VIRTUALS

/**************************************************************************************/
// STATICS
itemSchema.static("create", async function (product, quantity, buyer) {

    if (quantity > product.countInStoke) {
        // send message to the seller
        throw new MyError(422, "This amount is not available at this seller")
    }
    const item = {
        seller: product.owner,
        buyer,
        product,
        quantity
    }
    return await new this(item).save()
})

/**************************************************************************************/
// METHODS
itemSchema.method("modifiy", async function (quantity) {
    if (quantity > this.product.countInStoke) {
        // send message to the seller
        throw new MyError(422, "This amount is not available at this seller")
    }
    this.quantity = quantity
    return await this.save()
})

itemSchema.method("delete", async function (quantity) {
    await this.deleteOne()
    return { succes: true, message: "item is deleted succefully" }
})

/**************************************************************************************/
// PLUGIN
itemSchema.plugin(require('mongoose-autopopulate'))

module.exports = new model("item", itemSchema)