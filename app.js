require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const createHttpsServer = require("./utils/https");
const authRoutes = require("./routes/authRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use(errorMiddleware);

const server = createHttpsServer(app);

server.listen(process.env.PORT, () => {
    console.log(`HTTPS Server running on port ${process.env.PORT}`);
});