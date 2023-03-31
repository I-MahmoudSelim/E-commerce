const { Schema, model } = require("mongoose");
const Seller = require("./Seller");

const productSchema = new Schema({
    name: {
        type: String,
        require: true,
        trim: true,
    },
    brand: {
        type: String,
        default: "Genaric Company"
    },
    image: {
        type: Buffer,
    },
    images: [{
        type: Buffer,
    }],
    category: [{
        type: Schema.Types.ObjectId,
        require: true,
        ref: "Category"
    }],
    price: {
        type: Number,
        require: true,
        min: 1,
    },
    description: {
        type: String,
        require: true,
    },
    richDescription: String,
    rating: {
        type: Number,
        max: 10,
        min: 0,
    },
    ratingCounter: {
        type: Number,
        default: 0,
    },
    countInStoke: {
        type: Number,
        require: true,
        min: 0
    },
    warningStock: {
        type: Number,
        require: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        require: true,
        ref: "Seller"
    },
    featured: {
        type: Boolean,
        default: true,
    }

},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },

        statics: {
            async create(user, body) {
                let product = new this({
                    ...body,
                    owner: user
                })
                return await product.save();
            },
        },


        methods: {
            async modifiy(body, user) {
                if (this.owner.toString() != user._id.toString() && !user.admin) {
                    throw new MyError(403, "You are not allowed")
                }
                const modified = Object.keys(body);
                if (modified.length === 0) {
                    throw new MyError(400, "there is no updates")
                };
                const mutables = ["name", "warningStock", "countInStoke", "brand", "richDescription", "featured", "description", "price"]
                const isValid = modified.every(x => mutables.includes(x))
                if (!isValid && !admin) {
                    throw new MyError(403, "unaccepted updates")
                }
                for (const property of modified) {
                    this[property] = body[property]
                }
                return await this.save()
            },

            async delete(user) {
                if (this.owner.toString() != user._id.toString() && !user.admin) {
                    throw new MyError(403, "You are not allowed")
                }
                return await this.deleteOne()
            },

            async uploadImage(image, user) {
                if (this.owner.toString() != user._id.toString() && !user.admin) {
                    throw new MyError(403, "You are not allowed")
                }
                this.image = image;
                return await this.save()
            },

            async deleteImage(user) {
                if (this.owner.toString() != user._id.toString() && !user.admin) {
                    throw new MyError(403, "You are not allowed")
                }
                this.image = undefined;
                return await this.save()
            },

            async uploadGallery(images, user) {
                if (this.owner.toString() != user._id.toString() && !user.admin) {
                    throw new MyError(403, "You are not allowed")
                }
                this.images = images;
                return await this.save()
            },

            async deleteGallery(user) {
                if (this.owner.toString() != user._id.toString() && !user.admin) {
                    throw new MyError(403, "You are not allowed")
                }
                this.images = undefined;
                return await this.save()
            },

            async supply(quantity, user) {
                if (this.owner.toString() != user._id.toString() && !user.admin) {
                    throw new MyError(403, "You are not allowed")
                }
                this.countInStoke = this.countInStoke + quantity
                return await this.save()
            },

            async buy(q) {
                const product = await this.modifiy({ countInStoke: this.countInStoke - q }, { _id: this.owner })
                console.log(product.warningStock >= product.countInStoke, product.countInStoke)
                if (product.warningStock >= product.countInStoke) {
                    if (product.countInStoke === 0) { await product.modifiy({ featured: false }, { _id: this.owner }) }
                    const seller = await Seller.findById(product.owner);
                    await seller.needSupply(product)
                }
            },
            async getProfit() {
                const populated = await this.populate("sales")
                console.log(populated)
                const profit = populated.sales.reduce(
                    (x, order) => x + order.total, 0
                )
                return profit
            }
        }
    })

productSchema.virtual("sales", {
    localField: "_id",
    foreignField: "product",
    ref: "Sold"
})


module.exports = new model("Product", productSchema)