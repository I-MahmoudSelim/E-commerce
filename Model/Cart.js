const { Schema, model } = require("mongoose")

const MyError = require("../Utils/MyError")

const Product = require("./Product")
const Coupon = require("./Coupon")
const Item = require("./Item")
const Order = require("./Order")




const cartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    items: [{
        type: Schema.Types.ObjectId,
        ref: "item",
        autopopulate: true
    }],
    coupon: {
        type: Schema.Types.ObjectId,
        ref: "Coupon",
        autopopulate: true
    },
    total: Number,
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

// STATICS
cartSchema.static("create", async function (id, quantity, user) {

    const product = await Product.findById(id)
    console.log(product, "Cart.js ln 40")
    if (!product || !product.featured || quantity > product.countInStoke) { throw new MyError(404, "This product is not available right now") }
    const item = await Item.create(product, quantity, user)
    const items = [item._id]

    return await new this({ user: user._id, items: items }).save()
})

// METHODS

// Add product to user's existing cart
cartSchema.method("addProduct", async function (id, quantity, person) {

    if (this.user.toString() != person._id.toString() && !person.admin) {
        throw new MyError(403, "You are not allowed")
    }

    let item = this.items.find(item => item.product._id.toString() === id)
    if (item) {
        item = await Item.findById(item)
        quantity += item.quantity;
        await item.modifiy(quantity)
        return this
    } else {
        let user = person
        const product = await Product.findById(id)
        if (!product || !product.featured || quantity > product.countInStoke) { throw new MyError(404, "This product is not available right now") }
        const item = await Item.create(product, quantity, user)

        this.items.push(item._id)
        return await this.save()
    }
})

// Remove product form user's cart
cartSchema.method("deleteProduct", async function (id, person) {
    if (this.user.toString() != person._id.toString() && !person.admin) {
        throw new MyError(403, "You are not allowed")
    }

    const product = Product.findById(id)
    if (!product) { throw new MyError(404, "This product is not available right now") }

    const index = this.items.findIndex(x => x.product.toString() === product._id.toString())
    this.items[index] = undefined;



    return await this.save()
})

// Apply coupon to user's cart
cartSchema.method("applyCoupon", async function (code, person) {
    if (this.user.toString() != person._id.toString() && !person.admin) {
        throw new MyError(403, "You are not allowed")
    }

    const coupon = Coupon.findByCode(code)
    if (!coupon) { throw new MyError(404, "This coupon is not available right now") }
    this.coupon = coupon._id

    return await this.save()
})

// Calculate the total price required from customer
cartSchema.method("calcTotal", function () {
    this.total = this.items.reduce(
        (a, item) => a + item.product.price * item.quantity,
        0
    );
    return this
})

// Edit the content of user's cart
cartSchema.method("modifiy", async function (body, person) {
    if (this.user.toString() != person._id.toString() && !person.admin) {
        throw new MyError(403, "You are not allowed")
    }
    let cart = this

    for (const item of body.cart.items) {
        let i = cart.items.findIndex(itemOld => itemOld.product._id.toString() === item.product._id.toString())
        const id = item.product._id
        const quantity = item.quantity
        if (i === -1) {
            const product = await Product.findById(id)
            if (!product) {
                throw new MyError(422, "This product is not exist")
            }
            const item = await Item.create(product, quantity, person)
            // cart.items.push(item._id)
        } else if (cart.items[i].quantity = item.quantity) {
            await cart.items[i].modifiy(item.quantity)
        }
    }
    for (const itemOld of cart.items) {
        let i = body.cart.items.findIndex(item => item.product._id.toString() === itemOld.product._id.toString())
        let item = itemOld
        if (i === -1) {
            await item.deleteOne()
        }
    }
    // cart.items = body.cart.items.map(x => x.product._id)
    await cart.save()
    return this.calcTotal()
})

// comfirm the process
cartSchema.method("buy", async function (person) {
    const cart = this

    if (cart.user.toString() != person._id.toString()) {
        throw new MyError(403, "You are not allowed")
    }

    const order = await Order.create(cart, person)

    if (!order) {
        throw new MyError(500, "There is something wrong, try again later")
    }

    const resault = await cart.deleting(person);
    if (!resault.succes) {
        throw new MyError(500, "There is something wrong, try again later")
    }

    return order;
})

// Delete all the card by buying it or just delete
cartSchema.method("deleting", async function (person) {
    const cart = this
    if (cart.user.toString() != person._id.toString()) {
        throw new MyError(403, "You are not allowed")
    }

    await cart.deleteOne()

    return { succes: "true" }
})

// MIDDLEWARE

cartSchema.post("deleteOne", async () => {
    const cart = this

    for (const item of cart.items) {
        const id = item.product._id
        await item.deleteOne()
    }

})

// PLUGS IN
cartSchema.plugin(require('mongoose-autopopulate'));


module.exports = new model("Cart", cartSchema)