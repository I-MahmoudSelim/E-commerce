const { Schema, model } = require("mongoose")
const MyError = require("../Utils/MyError")

const couponSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        min: 0,
        max: 1,
        required: true
    },
    active: {
        type: Boolean,
        default: false
    }
}, {
    statics: {
        async create(body, admin) {
            if (!admin.admin) {
                throw new MyError(403, "You are not allowed")
            }
            await new this(body).save()
        },
        async findByCode(code) {
            return await this.findOne({ code })
        }
    }
})


module.exports = new model("Coupon", couponSchema)