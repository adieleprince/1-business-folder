import dotenv from "dotenv";
dotenv.config();

import connectDB from "./src/config/database.js";
import app from "./src/app.js";
import bcrypt from "bcryptjs"; // <--- Add this import
import User from "./src/models/user.model.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // 1. Connect to the database
        await connectDB();

        // 2. Create the specific admin user (Only runs if they don't exist)
        const createAdmin = async () => {
            try {
                // Check if the user already exists in the database
                const existingAdmin = await User.findOne({ email: "royaldynastyfragrances@gmail.com" });
                
                if (!existingAdmin) {
                    // Hash the password from the .env file (Adiele3566)
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash("Adiele3566", 10);

                    // Create the new admin with your requested details
                    const newAdmin = new User({
                        username: "royaldynastyfragrances",
                        email: "royaldynastyfragrances@gmail.com",
                        password: hashedPassword,
                        isAdmin: true
                    });

                    await newAdmin.save();
                    console.log(`✅ Admin user successfully created: royaldynastyfragrances@gmail.com`);
                } else {
                    console.log(`ℹ️ Admin user already exists. Skipping creation.`);
                }
            } catch (error) {
                console.error("❌ Error creating admin user:", error);
            }
        };

        // 3. Run the admin creation function
        await createAdmin();

        // 4. Start the server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};

startServer();