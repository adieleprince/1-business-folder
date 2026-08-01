import { Post } from "../models/post.model.js";

// Create a post
const createPost = async (req, res) => {
    try {
        const { name, description, age } = req.body;

        // Check if all fields were provided
        if (!name || !description || !age) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Create the post
        const post = await Post.create({
            name,
            description,
            age
        });

        // Send success response
        res.status(201).json({
            message: "Post created successfully",
            post
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};


// Get all posts
const getPosts = async (req, res) => {
    try {
        // Find all posts in the database
        const posts = await Post.find();

        // Send all posts back to the client
        res.status(200).json({
            message: "Posts retrieved successfully",
            posts
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};


// Update a post
const updatePost = async (req, res) => {
    try {
        // Check if the request body is empty
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                message: "No data provided for update"
            });
        }

        const post = await Post.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        res.status(200).json({
            message: "Post updated successfully",
            post
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};


// Delete a post
const deletePost = async (req, res) => {
    try {
        const deleted = await Post.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        res.status(200).json({
            message: "Post successfully deleted"
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error.message
        });
    }
};


export {
    createPost,
    getPosts,
    updatePost,
    deletePost
};