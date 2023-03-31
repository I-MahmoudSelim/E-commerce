const { Schema, model } = require("mongoose")

const MyError = require("../Utils/MyError");
const SoldItem = require("./SoldItem")
const Product = require("./Product")


const orderSchema = Schema({
    items: [{
        type: Schema.Types.ObjectId,
        ref: "Sold",
        required: true,
        immutable: true,
        autopopulate: true

    }],
    totalPrice: {
        type: Number,
        immutable: true
    },
    buyer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        immutable: true
    },
    dateOrderd: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    coupon: {
        type: Schema.Types.ObjectId,
        ref: "Coupon",
        immutable: true
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

// METHODS

// CONFIRM purchase CREATE order
orderSchema.static("create", async function (cart, buyer) {
    const items = []
    const coupon = cart.coupon || undefined;
    let totalPrice = 0;

    for (let item of cart.items) {
        console.log(item)
        const product = await Product.findById(item.product._id)
        if (!product || !product.featured || item.quantity > product.countInStoke) {
            throw new MyError(404, "This product is not available right now")
        }
        item = await SoldItem.create(item, cart.coupon)
        items.push(item)
        totalPrice = item.total
    }

    let order = {
        items,
        totalPrice,
        buyer,
        coupon,
    }

    order = await new this(order).save()

    return order
})

orderSchema.plugin(require('mongoose-autopopulate'))


module.exports = new model("Order", orderSchema)