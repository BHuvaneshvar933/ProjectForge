import express from 'express';
import { upload } from '../config/cloudinary.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  res.status(200).json({
    success: true,
    message: 'File uploaded successfully',
    data: {
      url: req.file.path,
      filename: req.file.filename,
    }
  });
});

export default router;
