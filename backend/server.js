import dotenv from "dotenv";
dotenv.config();

import connectDB from "./src/config/database.js";
import app from "./src/app.js";
import User from "./src/models/user.model.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // 1. Connect to the database
        await connectDB();

        // 2. Create the admin user from environment variables (only runs if they don't exist yet)
        const createAdmin = async () => {
            const adminEmail = process.env.ADMIN_EMAIL;
            const adminPassword = process.env.ADMIN_PASSWORD;

            if (!adminEmail || !adminPassword) {
                console.warn("⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not set in .env — skipping automatic admin account setup.");
                return;
            }

            try {
                // Check if the user already exists in the database
                const normalizedEmail = adminEmail.toLowerCase().trim();
                const existingAdmin = await User.findOne({ email: normalizedEmail });

                if (!existingAdmin) {
                    // ADMIN_USERNAME is optional — falls back to the part of the email before the "@"
                    const adminUsername = process.env.ADMIN_USERNAME || normalizedEmail.split("@")[0];

                    const newAdmin = new User({
                        username: adminUsername,
                        email: adminEmail,
                        password: adminPassword,
                        isAdmin: true
                    });

                    await newAdmin.save();
                    console.log(`✅ Admin user successfully created: ${normalizedEmail}`);
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