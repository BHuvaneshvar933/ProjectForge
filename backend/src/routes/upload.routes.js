import express from 'express';
import { storage } from '../services/storage.service.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = storage.getMulterMiddleware();

router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(500).json({ success: false, rawError: String(err), jsonError: JSON.stringify(err) });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: req.file.location,
        filename: req.file.key,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size || 0,
      }
    });
  });
});

export default router;
