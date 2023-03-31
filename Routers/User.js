const express = require("express");
const auth = require("../Middleware/auth");
const MyError = require("../Utils/MyError");
const handler = require("../Utils/asyncHandler");
const router = new express.Router();


// add product to my cart
router.post("/user/me/cart/:id", auth, handler(async (req, res) => {
  let user = req.person;
  const data = await user.addProductToCart(req.params.id, req.body.quantity, req.body.coupon)
  res.status(200).send(data)
}))

// display my cart
router.get("/user/me/cart", auth, handler(async (req, res) => {
  const user = req.person;
  const cart = await user.getMyCart()
  const data = { user, cart } //to make the response uniformed
  res.status(200).send(data)
}))

// update my cart 
router.put("/user/me/cart", auth, handler(async (req, res) => {
  const user = req.person;

  let cart = await user.getMyCart()
  cart = await cart.modifiy(req.body, user)

  const data = { user, cart } //to make the response uniformed
  res.status(200).send(data)
}))

// DELETE product form my cart 
router.delete("/user/me/cart/:id", auth, handler(async (req, res) => {
  const user = req.person;

  let populated = await user.populate("cart", {
    match: { _id: req.params.id }
  })
  const item = populated.cart.items[0];
  await item.deleteOne();

  const cart = await user.getMyCart()

  const data = { user, cart } //to make the response uniformed
  res.status(200).send(data)
}))

// comfirm the purchase process  
router.post("/user/me/cart", auth, handler(async (req, res) => {
  const user = req.person;
  const cart = await user.getMyCart()
  const order = await cart.buy(user)
  res.status(200).send(order)
}))

// display all my purchases process
router.get("/user/me/purchase", auth, handler(async (req, res) => {
  const user = req.person;
  const populated = await user.populate("purchases")
  const purchases = populated.purchases
  if (!purchases) {
    throw new MyError(404, "There is no pruchases yet")
  }
  const data = { user, purchases } //to make the response uniformed
  res.status(200).send(data)
}))

// display all my orders 
router.get("/user/me/order", auth, handler(async (req, res) => {
  const user = req.person;
  const populated = await user.populate("orders")
  const orders = populated.orders
  if (!orders) {
    throw new MyError(404, "There is no pruchases yet")
  }
  const data = { user, orders } //to make the response uniformed
  res.status(200).send(data)
}))

// Reviewing my purchase
router.post("/user/me/purchase/:id/review", auth, handler(async (req, res) => {
  const user = req.person

  const populated = await user.populate("purchases", {
    match: { _id: req.params.id }
  })

  const purchase = populated.purchases[0]

  const review = await purchase.review(req.body.review, user) //sold schema
  res.status(200).send({ user, purchase, review })
}))


module.exports = router;