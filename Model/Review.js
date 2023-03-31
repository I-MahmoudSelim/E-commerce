const { Schema, model } = require("mongoose")

const Product = require("./Product")
const User = require("./User")

const reviewSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    product: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Product"
    },
    rating: {
        type: Number,
        min: 0,
        max: 10
    },
    comment: {
        type: String,
        required: true,
    }
})

reviewSchema.static("create", async function (user, product, comment, rating) {
    const review = {
        user,
        product,
        rating,
        comment
    }
    return await new this(review).save()
})


module.exports = new model("Review", reviewSchema)