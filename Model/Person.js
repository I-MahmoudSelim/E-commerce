const mongoose = require("mongoose");
const validator = require("validator");
const MyError = require("../Utils/MyError");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const personSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowerCase: true,
            unique: true,
            validate(value) {
                if (!validator.isEmail(value)) {
                    throw new MyError(422, "e-mail is not valid");
                }
            },
        },
        password: {
            type: String,
            required: true,
            trim: true,
            minLength: 7,
            select: false,
            validate(v) {
                if (!validator.isStrongPassword(v)) {
                    throw new MyError(422, "password cannot contain password");
                }
            },
        },
        address: [{
            title: {
                type: String,
                trim: true,
            },
            description: {
                type: String,
                trim: true,
            },
        }],
        phone: {
            type: String,
            unique: true,
            validate(v) {
                if (!validator.isMobilePhone(v, "ar-EG")) {
                    throw new MyError(422, "Mobile phone is invalid");
                }
            },
        },
        age: {
            type: Number,
            min: 21,
            rquire: true,
        },
        payment: [{
            method: {
                type: String,
                enum: ["Bank Card", "Online Wallet"],
                required: function () {
                    if (this._id) {
                        return true;
                    }
                    return false;
                },
            },
            holderName: {
                type: String,
                required: function () {
                    if (this.method) {
                        return true;
                    }
                    return false;
                },
                trim: true,
            },
            cardNumber: {
                type: String,
                alias: "walletNumber",
                required: function () {
                    if (this.method) {
                        return true;
                    }
                    return false;
                },
                trim: true,
                maxlength: 16,
                minlength: 16,
                validate(v) {
                    if (this.method === "Bank Card" && !validator.isInt(v)) {
                        if (this.method === "Online Wallet" && !validator.isMobilePhone(v, "ar-EG")) {
                            throw new MyError(422, "Mobile phone is invalid");
                        }
                        throw new MyError(422, "Bank Card number is invalid")
                    }
                }
            },
            CVV: {
                type: String,
                select: false,
                required: function () {
                    if (this.method === "Bank Card") {
                        return true;
                    }
                    return false;
                },
                maxlength: 3,
                minlength: 3,
                validate(v) {
                    if (!validator.isInt(v)) {
                        throw new MyError(422, "CVV must be a number")
                    }
                }
            },
            expireDate: {
                type: String,
                trim: true,
                required: function () {
                    if (this.method === "Bank Card") {
                        return true;
                    }
                    return false;
                },
                maxlength: 5,
                minlength: 5,
                validate(v) {
                    if (!validator.isDate("19" + v + "/12", { format: "YYYY/MM/DD" })) {
                        throw new MyError(422, "expiry date is invalid")
                    }
                }
            },

        }],
        tokens: [{
            token: {
                type: String,
                required: true,
            }
        }],
        avatar: Buffer,
        balance: {
            type: Number,
            min: 0,
            default: 9999999999
        }
    },
    {

        timestamps: true,


        statics: {

            async signUp(body) {
                const person = new this(body);
                const token = person.getJWT();
                person.tokens.push({ token });
                await person.save();
                return { person, token };
            },

            async logIn(email, password) {
                if (validator.isEmail(email)) {
                    let person = await this.findOne({ email }).select({ name: 1, email: 1, password: 1, age: 1, phone: 1, address: 1, });
                    if (person) {
                        if (await bcrypt.compare(password, person.password)) {
                            person = await this.findById(person._id)
                            const token = person.getJWT();
                            person.tokens.push({ token });
                            await person.save()
                            return { person, token };
                        }
                    }
                }
                throw new MyError(422, "email or password is wrong, try again");
            },
        },


        methods: {

            async modifiy(body) {
                const properties = Object.keys(body);

                if (properties.length === 0) {
                    throw new MyError(400, "invalid data")
                }
                let person = this
                const variables = ["name", "email", "password", "age", "phone", "address", "payment"];
                const isvalidated = properties.filter((property) => variables.includes(property));

                for (const property of isvalidated) {

                    if (property === "address") {
                        person.modifiyAdress(body) // edit the address array go to ln:188
                    } else if (property === "payment") {
                        person.modifiyPayment(body)// edit the payment array go to ln:174
                    } else {
                        person[property] = body[property];
                    }
                }

                person = await person.save();
                return person;
            },

            modifiyPayment(body) {
                try {
                    let person = this;
                    for (const i of body.payment) {
                        let index = person.payment.findIndex((x) => x._id.equals(i._id));
                        if (index == -1) {
                            person.payment.push(i);
                        } else {
                            for (const key in i) {
                                if (Object.hasOwnProperty.call(person.payment[index].toObject(), key)) {
                                    person.payment[index][key] = i[key]
                                }
                            }
                        }
                    }
                    return person;
                } catch (error) {
                    throw new MyError(422, error.message)
                }
            },

            modifiyAdress(body) {
                try {
                    person = this;

                    for (const i of body.address) {
                        let index = person.address.findIndex((x) => x._id.equals(i._id));
                        if (index == -1) {
                            person.address.push(i);
                        } else {
                            person.address[index].title = i.title;
                            person.address[index].description = i.description;
                        }
                    }
                    return person;
                } catch (error) {
                    throw new MyError(422, error.message)
                }
            },

            deletePayment(body) {
                try {
                    let person = this;
                    let deletedMethodsCount = 0;
                    let alreadyDeleted = [];
                    let methods = [...person.payment];
                    for (const i of [...body.payment]) {
                        let index = methods.findIndex((x) => x._id.equals(i._id));
                        if (index == -1) {
                            alreadyDeleted.push(i)
                        } else {
                            methods.splice(index, 1)
                            deletedMethodsCount += 1;
                        }
                    }
                    person.payment = methods;
                    return { person, deletedMethodsCount, alreadyDeleted };
                } catch (error) {
                    throw new MyError(422, error.message)
                }
            },

            deleteAdress(body) {
                try {
                    let person = this;
                    let deletedAddressCount = 0;
                    let alreadyDeleted = [];
                    let addresses = [...person.address];
                    for (const i of [...body.address]) {
                        let index = addresses.findIndex((x) => x._id.equals(i._id));
                        if (index == -1) {
                            alreadyDeleted.push(i)
                        } else {
                            addresses.splice(index, 1)
                            deletedAddressCount += 1;
                        }
                    }
                    person.address = addresses;
                    return { person, deletedAddressCount, alreadyDeleted };
                } catch (error) {
                    throw new MyError(422, error.message)
                }
            },

            securePayment() {
                for (let card of this.payment) {
                    if (card.method === "Bank Card") {
                        card.cardNumber = "Ends with " + card.cardNumber.slice(-4)
                    }
                }
            },

            getJWT() {
                const token = JWT.sign({ id: this._id }, process.env.JWT_SECRET);
                return token;

            },

            toJSON() {
                this.securePayment()
                let person = this.toObject();
                delete person.password;
                delete person.tokens;
                delete person.__v;
                return person;
            }
        }
    }
)

personSchema.pre("save", async function () {
    const person = this;
    if (person.isModified("password")) {
        person.password = await bcrypt.hash(person.password, 8);
    } else if (person.isModified("payment")) {
        person.payment.CVV = await bcrypt.hash(person.payment.CVV, 8);
    }
});

module.exports = personSchema;

