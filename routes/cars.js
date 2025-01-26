import express from 'express'
const router = express.Router()
import { Car, validateCar } from "../model/car.js";
import authMiddleware from '../middleware/authMiddleware.js';
import admin from '../middleware/admin.js';
import { validateReview } from '../model/product.js';
import multer from 'multer';
import fs from 'fs'
import formidable, { errors as formidableErrors } from 'formidable';
import validateObjectID from '../middleware/validateObjectId.js';
import { log } from 'console';
import validate from '../middleware/validate.js';
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + file.originalname)
    }
})

const upload = multer({
    storage: storage,
    limits: { fileSize: 2000000 }, // Limit file size to 2MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image');

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}
router.get('/', async (req, res) => {
    try {
        const cars = await Car.find({ isAvailable: true });
        if (!cars) {
            return res.status(404).send('No record found!')
        }
        res.status(200).send(cars);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch cars.' });
    }
});

router.post('/', [authMiddleware, admin], async (req, res) => {
    const form = formidable({
    });
    let fields;
    let files;

    [fields, files] = await form.parse(req);
    let data = {}
    for (const key in fields) {
        if (key !== 'features') {
            data[key] = fields[key][0]
        } else {
            data[key] = fields[key]
        }
    }
    const { error } = validateCar(data, { abortEarly: false })
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    try {
        const car = new Car(data);
        await car.save();
        // upload(req, res, async (err) => {
        //     if (err) {
        //         res.send(err);
        //     } else {
        //         if (req.file == undefined) {
        //             res.send('No file selected!');
        //         } else {
        //             car.imageUrl = 'uploads/' + req.file.filename,
        //                 await car.save()
        //         }
        //     }
        // });
        // return res.send(files);
        // const tempPath = files[0].filepath;
        // const targetPath = path.join(__dirname, "./uploads/" + files[0].originalFilename);

        // fs.rename(tempPath, targetPath, async err => {
        //     car.imageUrl = targetPath
        //     await car.save()
        // });

        res.status(201).send(car);
    } catch (err) {
        console.log(err);

        res.status(400).send({ error: err.message });
    }
});

router.get('/:id', validateObjectID, async (req, res) => {
    try {
        const { id } = req.params;
        const carExists = await Car.findById(id);
        if (!carExists) {
            return res.status(404).send({ error: 'Record not found.' });
        }
        res.send(carExists).status(200);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
});

router.put('/:id', validateObjectID, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCar = await Car.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedCar) return res.status(404).send({ error: 'Record not found.' });
        res.send(updatedCar);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
});

router.post('/:id/make-available', validateObjectID, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCar = await Car.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedCar) return res.status(404).send({ error: 'Car not found.' });
        res.send(updatedCar);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
})

router.get('/:id/available-history', [authMiddleware, validateObjectID, admin], async (req, res) => {
    try {
        const { id } = req.params;
        const car = await Car.findById(id).select('availabilityHistory');
        if (!car) {
            return res.status(404).send('Car not found');
        }
        res.send(car);
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
})

router.post('/:id/available-history', [authMiddleware, validateObjectID, admin], async (req, res) => {
    try {
        const { id } = req.params;
        const { status, date } = req.body
        const car = await Car.findById(id);
        if (!car) {
            return res.status(404).send('Car not found');
        }
        const historyObj = {
            date: date ? date : (new Date()).toISOString(),
            status
        }
        car.availabilityHistory.push(historyObj)
        await car.save()
        res.send('Record updated!');
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
})

router.delete('/:id/available-history/:historyId', [authMiddleware, validateObjectID, admin], async (req, res) => {
    try {
        const { id, historyId } = req.params;
        const car = await Car.findById(id);
        if (!car) {
            return res.status(404).send('Car not found');
        }
        car.availabilityHistory.pull({ _id: historyId })
        await car.save()
        res.send('Record updated!');
    } catch (err) {
        res.status(500).send({ error: 'Failed to update car.' });
    }
})

router.post('/:id/reviews', validateObjectID, async (req, res) => {
    const { error } = validateReview(req.body, { abortEarly: false })
    if (error) {
        const errors = error.details.map(err => ({
            message: err.message,
            key: err.context.key
        }))
        return res.status(422).send(errors)
    }
    const { id } = req.params
    const { _id } = req.user
    const { rating, comment } = req.body

    const car = await Car.findById(id)
    if (!car) {
        return res.status(400).send('Record not found!')
    }
    const isReviewed = car.reviews.some(review => review.user.toString() === req.user._id.toString())

    if (isReviewed) {
        return res.send('Car already reviewed!')
    }
    const review = {
        userId: _id,
        rating,
        comment,
    }
    product.ratings.push(review)
    product.numReviews = product.reviews.length
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;
    await product.save()
    res
        .send(_.pick(product, ['_id', 'name']));
})

export default router
