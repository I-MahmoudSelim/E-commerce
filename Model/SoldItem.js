const { Schema, model } = require("mongoose")
const MyError = require("../Utils/MyError")

const Product = require("./Product")
const Review = require("./Review")

const soldSchema = Schema({
    seller: {
        type: Schema.Types.ObjectId,
        ref: "Seller",
        required: true,
        immutable: true
    },
    buyer: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        immutable: true
    },
    product: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Product",
        autopopulate: true,
        immutable: true
    },
    coupon: {
        type: Schema.Types.ObjectId,
        ref: "Coupon",
        autopopulate: true,
        immutable: true
    },
    priceWhenSold: {
        type: Number,
        required: true,
        immutable: true
    },
    quantity: {
        type: Number,
        immutable: true
    },
    total: {
        type: Number,
        required: true,
        immutable: true
    },
    date: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    status: {
        type: String,
        default: "Pending"
    }
},
    {
        toJSON: { getter: true, virtuals: true },
        toObject: { getter: true, virtuals: true },
    })

soldSchema.static("create", async function (item, coupon) {
    const product = await Product.findById(item.product._id)

    const discount = 1;
    if (coupon) {
        discount = (coupon.active) ? coupon.value : 1;
    }
    console.log(item.quantity > product.countInStok, "soldSchema ln 51")
    console.log(product.owner, item.buyer, "soldSchema ln 51")

    if (item.quantity > product.countInStoke) {
        // send message to the seller
        throw new MyError(422, `${product.name} is not available in this quantity at this seller, only ${product.countInStoke} is available`)
    }
    const total = product.price * item.quantity * discount
    console.log(total, "soldSchema ln 72")
    const sold = {
        seller: product.owner,
        buyer: item.buyer,
        product,
        coupon,
        priceWhenSold: product.price,
        quantity: item.quantity,
        total,
    }

    return await new this(sold).save()
})

// CHANGE DELIVERY status
soldSchema.method("changeStatues", async function (status) {
    this.status = status
    return await this.save()
})

soldSchema.method("review", async function (body, user) {
    console.log(body)
    return await Review.create(user, this.product, body.comment, body.rating)

})

soldSchema.pre("save", async function () {
    await this.product.buy(this.quantity)
})
module.exports = new model("Sold", soldSchema)