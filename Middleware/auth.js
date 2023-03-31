const JWT = require("jsonwebtoken");
const secret = process.env.JWT_SECRET
let Person = undefined

const auth = async (req, res, next) => {
    try {
        if (req.path.match(/^\/user/)) {
            Person = require("../Model/User")

        } else if (req.path.match(/^\/seller/)) {
            Person = require("../Model/Seller")
        }

        const token = req.header("Authorization").replace("Bearer ", "");
        const decoded = JWT.verify(token, secret);
        let person = await Person.findOne({ _id: decoded.id, 'tokens.token': token });

        if (!person) {
            throw new MyError(402, "unauthentcated request1")
        }

        req.token = token;
        req.person = person;
        next()
    } catch (error) {
        res.status(401).send("unauthentcated request")
    }
}

module.exports = auth