const express = require("express");
const auth = require("../Middleware/auth");
const MyError = require("../Utils/MyError");
const handler = require("../Utils/asyncHandler");
const router = new express.Router();

const User = require("../Model/User");
const Seller = require("../Model/Seller");
let Person = undefined
const sharp = require("sharp");
const upload = require("../Middleware/uplaod");

router.use((req, res, next) => {
    if (req.path.match(/^\/user/)) {
        Person = require("../Model/User");
        req.who = "user"
    } else if (req.path.match(/^\/seller/)) {
        Person = require("../Model/Seller");
        req.who = "seller"
    }
    next()
})


router.post(["/seller", "/user"], handler(async (req, res) => {
    const { person, token } = await Person.signUp(req.body)
    res.status(201).send({ person, token })
}))

router.post(["/seller/login", "/user/login"], handler(async (req, res) => {
    console.log("dsd")
    const { person, token } = await Person.logIn(req.body.email, req.body.password)
    res.status(200).send({ person, token })
}))

router.get(["/seller/me", "/user/me"], auth, handler(async (req, res) => {
    console.log("dsd")

    const person = req.person;
    res.status(200).send({ person })
}))

router.patch(["/seller/me", "/user/me"], auth, handler(async (req, res) => {
    const person = req.person;
    person = await person.modifiy(req.body);
    if (!person) {
        throw new MyError(500, "something wrong ")
    }
    res.status(200).send({ person })
}))

router.delete(["/seller/me", "/user/me"], auth, handler(async (req, res) => {
    await Person.findByIdAndDelete(req.person._id)
    res.status(200).send("good bye")
}))

router.patch(["/seller/me/payment", "/user/me/payment"], auth, handler(async (req, res) => {
    let person = req.person
    person = person.modifiyPayment(req.body);
    person = await person.save();
    if (!person) {
        throw new MyError(500, "something wrong ")
    }
    res.status(200).send({ person })
}))

router.delete(["/seller/me/payment", "/user/me/payment"], auth, handler(async (req, res) => {
    let person = req.person;
    const { user, deletedMethodsCount, alreadyDeleted } = person.deletePayment(req.body)
    if (deletedMethodsCount > 0) {
        person = await user.save()
    }
    res.status(200).send({ person: user.toJSON(), deletedMethodsCount, alreadyDeleted })
}))

router.patch(["/seller/me/address", "/user/me/address"], auth, handler(async (req, res) => {
    let person = req.person
    person = person.modifiyAddress(req.body);
    person = await person.save();
    if (!person) {
        throw new MyError(500, "something wrong ")
    }
    res.status(200).send({ person })
}))

router.delete(["/seller/me/address", "/user/me/address"], auth, handler(async (req, res) => {
    let person = req.person;
    const { user, deletedAddressCount, alreadyDeleted } = person.deleteAddress(req.body)
    if (deletedAddressCount > 0) {
        person = await user.save()
    }
    res.status(200).send({ person: person.toJSON(), deletedAddressCount, alreadyDeleted })
}))

// router to upload person avatar 

router.post(["/seller/me/avatar", "/user/me/avatar"], auth, handler(upload.single("avatar")), handler(async (req, res) => {
    const avatar = await sharp(req.file).png().resize(300, 300).toBuffer();
    let person = req.person
    person.avatar = avatar;
    person = await person.save();
    res.status(201).send({ person });
}))

//   router to remove person avatar
router.delete(["/seller/me/avatar", "/user/me/avatar"], auth, handler(async (req, res) => {
    let person = req.person
    person.avatar = undefined;
    person = await person.save();
    res.status(201).send({ person });
}))





module.exports = router;