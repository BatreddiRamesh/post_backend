const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Post = require('../models/post');

const router = express.Router();

// Setup multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Create a post
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const newPost = new Post({
      title: req.body.title,
      description: req.body.description,
      imageUrl: req.file.path
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find();
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a post by ID
router.get('/:id', async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      res.status(200).json(post);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// Update a post by ID
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      imageUrl: req.file ? req.file.path : req.body.imageUrl
    }, { new: true });
    
    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a post and its associated image
router.delete('/:id', async (req, res) => {
  try {
  
    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }


    const uploadsPath = process.env.UPLOADS_PATH; 

    if (!uploadsPath) {
      return res.status(500).json({ message: 'UPLOADS_PATH environment variable is not set' });
    }

    const imagePath = path.join(uploadsPath, post.imageUrl);  

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath); 
      console.log('Image file deleted successfully');
    } else {
      console.log('Image file not found at:', imagePath);
    }

  
    res.status(200).json({ message: 'Post and image deleted successfully' });
  } catch (err) {
    console.error('Error deleting post and image:', err); 
    res.status(500).json({ error: err.message });  
  }
});

module.exports = router;
