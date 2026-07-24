import express from "express";

const app = express();

// Middleware: allows the backend to read JSON data from Postman/frontend
app.use(express.json());

// Routes import
import userRouter from "./routes/user.route.js";

// Routes declaration
app.use("/api/v1/users", userRouter);

// Example route:
// http://localhost:5000/api/v1/users/register

app.get("/", (req, res) => {
    res.send("Royal Dynasty Fragrance backend is running!");
});

export default app;