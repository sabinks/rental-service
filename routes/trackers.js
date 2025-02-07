import _ from 'lodash'
import express from 'express'
import 'dotenv/config';
import { createClient } from 'redis';
import { Tracker } from '../model/tracker.js';
import { Vehicle } from '../model/vehicle.js';
const redisClient = createClient({
    url: process.env.REDIS_URL, // Example: "redis://localhost:6379"
});
redisClient.connect().then(() =>
    console.log("Redis connected")
).catch(err =>
    console.error("Redis Error:", err)
);
const router = express.Router()
router.post('/:vehicleId', async (req, res) => {
    const { latitude, longitude } = req.body;
    const { vehicleId } = req.params

    if (!vehicleId || !latitude || !longitude) return res.status(400).json({ message: "Invalid input" });

    try {
        // Store in Redis (Real-time)
        await redisClient.geoAdd("vehicle_locations", { longitude, latitude, member: `vehicle:${vehicleId}` });

        // Store in MongoDB (Persistent)
        await Tracker.updateOne(
            { vehicleId },
            { $set: { location: { type: "Point", coordinates: [longitude, latitude] } } },
            { upsert: true }
        );
        console.log('Received data: ', req.body);
        res.json({ message: "Vehicle location updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});
router.get("/geo-location/:vehicleId", async (req, res) => {
    const { vehicleId } = req.params;
    // return vehicleId
    try {
        // Check Redis first (Fast)
        const location = await redisClient.geoPos("vehicle_locations", `vehicle:${vehicleId}`);

        if (location && location.length > 0) {
            return res.json({
                vehicleId,
                location: { longitude: location[0]['longitude'], latitude: location[0]['latitude'] },
                source: "Redis (Real-time)",
            });
        }

        // If not in Redis, fallback to MongoDB
        const tracker = await Tracker.findOne({ vehicleId });
        if (!tracker) return res.status(404).json({ message: "Vehicle not found" });

        res.json({
            vehicleId,
            location: { longitude: tracker.location.coordinates[0], latitude: tracker.location.coordinates[1] },
            source: "MongoDB (Fallback)",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});
export default router