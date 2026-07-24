import { Router } from "express";

import {
    createPost,
    getPosts,
    updatePost,
    deletePost
} from "../controllers/post.controller.js";

const router = Router();

// Create a post
router.route("/create").post(createPost);

// Get all posts
router.route("/getPosts").get(getPosts);

// Update a post
router.route("/update/:id").patch(updatePost);

// Delete a post
router.route("/delete/:id").delete(deletePost);

export default router;