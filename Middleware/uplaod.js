const multer = require("multer")

//  middleware to check the uploading picture
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new myError(400, "file must be picture(jpg,jepg,png)"))
        }
        cb(undefined, true)
    }
})

module.exports = upload