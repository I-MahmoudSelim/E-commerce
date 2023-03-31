const { Schema, model } = require("mongoose")

const Cart = require("./Cart");

// Inheriting person schema
const personSchema = require("./Person");
const userSchema = personSchema.clone();

userSchema.add({
    cart: {
        type: Schema.Types.ObjectId,
        ref: "Cart"
    }
})

// METHODS

// ADD  PRODUCT TO EXISTING CART
userSchema.method("addProductToCart", async function (id, quantity, coupon) {
    let cart = undefined;
    if (this.cart) {
        cart = await Cart.findById(this.cart)
        if (cart) {
            cart = await cart.applyCoupon(coupon, this)
            cart = await cart.addProduct(id, quantity, this)
            cart = cart.calcTotal()
            return { user: this, cart }
        }
    }
    return await this.createCartAndAddProduct(id, quantity)
})

// CREATE cart ADD product
userSchema.method("createCartAndAddProduct", async function (id, quantity, coupon = 1) {
    let cart = await Cart.create(id, quantity, this, coupon)
    cart = await cart.applyCoupon(coupon, this)
    cart = cart.calcTotal()
    this.cart = cart
    const user = await this.save()

    return { user, cart }
})

// get my cart
userSchema.method("getMyCart", async function (select) {
    const user = this;
    const populated = await user.populate("cart")
    const cart = populated.cart.calcTotal()
    return cart;
})

// VIRTUALS


userSchema.virtual("purchases", {
    ref: "Sold",
    localField: "_id",
    foreignField: "buyer",
})
userSchema.virtual("orders", {
    ref: "Order",
    localField: "_id",
    foreignField: "buyer",
})

module.exports = new model("User", userSchema);