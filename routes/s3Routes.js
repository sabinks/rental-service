import express from 'express'
import multer from 'multer'
import s3Client from '../model/s3Client.js'
import { DeleteObjectCommand, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'
import path from 'path'
const router = express.Router()
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a file' });
        }

        const fileName = `uploads/${crypto.randomUUID()}${path.extname(req.file.originalname)}`;
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        };

        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        res.json({
            message: 'File uploaded successfully',
            fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/files', async (req, res) => {
    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.AWS_BUCKET_NAME,
        });

        const data = await s3Client.send(command);
        const files = data.Contents?.map((file) => ({
            key: file.Key,
            url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`,
        })) || [];

        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// **Generate Presigned URL for Download**
router.get('/download/*', async (req, res) => {

    try {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: req.params[0], // File key from the request URL
        };

        const command = new GetObjectCommand(params);
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        res.json({ downloadUrl: url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// **Delete File from S3**
router.delete('/delete/*', async (req, res) => {
    try {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: req.params[0], // File key from the request URL
        };

        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);

        res.json({ message: 'File deleted successfully', fileKey: req.params.key });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router