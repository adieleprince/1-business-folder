import dotenv from "dotenv";
import connectDB from "./database.js";
import app from "../app.js";

// Load environment variables from backend/.env
dotenv.config({
    path: ".env"
});

const startServer = async () => {
    try {
        // Connect to MongoDB first
        await connectDB();

        // Start the server after MongoDB connects
        app.listen(process.env.PORT || 5000, () => {
            console.log(
                `Server is running on port ${process.env.PORT || 5000}`
            );
        });

    } catch (error) {
        console.error("Server startup failed:", error);
    }
};

startServer();