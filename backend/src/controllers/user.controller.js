import { User } from "../models/user.model.js";

const registerUser = async (req, res) => {
    try {
        // Check what data is being received from Postman/frontend
        console.log("BODY RECEIVED:", req.body);

        const { username, email, password } = req.body;

        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // Check if the user already exists
        const existing = await User.findOne({
            email: email.toLowerCase()
        });

        if (existing) {
            return res.status(400).json({
                message: "User already exists!"
            });
        }

        // Create user
        const user = await User.create({
            username,
            email: email.toLowerCase(),
            password
        });

        res.status(201).json({
            message: "User registered",
            user: {
  id: user._id,
  username: user.username,
  email: user.email
}
        });

    } catch (error) {
    console.error("REGISTER ERROR:", error);

    res.status(500).json({
        message: "Internal server error",
        error: error.message
    });
}
};

const loginUser = async (req, res) => {
    try {
        // Get login details from the request
        const { email, password } = req.body;

        // Check if all fields were provided
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Find the user by email
        const user = await User.findOne({
            email: email.toLowerCase()
        });

        // Check if user exists
        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        // Compare the entered password with the stored password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        // Login successful
        res.status(200).json({
            message: "User logged in",
            user: {
  id: user._id,
  username: user.username,
  email: user.email
}
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

const logoutuser = async (req, res) =>{
    try {
        const { email } = req.body;

        const user = await User.findOne({
            email
        });

        if(!user) return res.status(404).json({
            message: "User not found"
        });

        res.status(200).json({
            message: "Logout successful"
        });


    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error", error
        });
    }
}

export {
    registerUser,
    loginUser,
    logoutuser
};