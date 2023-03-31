require("./mongoose");
const User = require("../Model/User")
const Seller = require("../Model/seller")
const Category = require("../Model/Category")
const Order = require("../Model/Order")
const Product = require("../Model/Product")
const Item = require("../Model/Item")

let users = [
    {
        name: "User One",
        email: "user1@eshop.com",
        password: "Uesr1@Eshop",
        address: [{
            title: "Home",
            street: "user1 st",
            city: "user1 city",
            country: "Egypt",
        }],
        phone: "01001234567",
        age: 25,
        isAdmin: true,
    },
    {
        name: "User Two",
        email: "user2@eshop.com",
        password: "Uesr2@Eshop",
        address: [{
            title: "Home",
            street: "user2 st",
            city: "user2 city",
            country: "Egypt",
        }],
        phone: "01201478523",
        age: 25,
        isAdmin: false,
    }
]

async function userfn() {

    await new Seller(users[0]).save()
    await new User(users[1]).save()
}

async function product() {
    const user = await Seller.findOne({ email: "user1@eshop.com" })
    for (let i = 0; i < 10; i++) {
        const category = await new Category({
            name: `Category ${i + 1}`,
            description: `Category ${i + 1}'s description `,
        }).save();

        for (let y = 0; y < 10; y++) {
            await new Product({
                name: `product ${i + 1}-${y}`,
                description: `description of product ${i + 1}-${y}`,
                richDescription: `rich description of product ${i + 1}-${y}`,
                brand: `brand ${Math.floor(Math.random() * 10 + 1)}`,
                price: Math.floor(Math.random() * 1000 + 1),
                category: category,
                countInStoke: Math.floor(Math.random() * 1000 + 1),
                warningStock: 10,
                owner: user,
                featured: true,
            }).save();

        }
    }

}
// async function orderfn() {
//     const products = await Product.find({}).select("name price").lean()
//     const user = await User.findOne({ email: "user2@eshop.com" })
//     for (let y = 0; y < 5; y++) {

//         let orderItems = [];
//         for (let i = 0; i < Math.floor(Math.random() * 5 + 1); i++) {
//             let product = {
//                 ...products[Math.floor(Math.random() * 90 + 1)],
//                 quantity: Math.floor(Math.random() * 5 + 1)
//             }
//             orderItems.push(product)
//         }
//         console.log(orderItems)
//         let order = {
//             orderItems,
//             customer: user,
//         }

//         order["totalPrice"] = 0;
//         order.orderItems = await Promise.all(order.orderItems.map(async i => {
//             let item = await Item.create(i)
//             order.totalPrice += +item.total;
//             return item._id
//         }))
//         await Order.create({ ...order })

//     }
// }
const aa = async () => {
    await userfn()
    await product()
    // await orderfn()
}
aa()
