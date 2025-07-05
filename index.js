import dotenv from "dotenv"
import express from "express"
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import cors from "cors";
import healthRoute from "./routes/health.routes.js"
import userRoute from "./routes/user.route.js";
import courseRoute from "./routes/course.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
import razorpayRoute from "./routes/razorpay.route.js";
import mediaRoute from "./routes/media.route.js";
import dbConnection from "./database/dbconfig.js";

dotenv.config();

await dbConnection();

const PORT = process.env.PORT;
const ENV_NODE = process.env.NODE_ENV;
const app = express();

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100, 
    message: "Too many requests from this IP address , please try again later!"
})

app.use(helmet());
app.use(hpp());
app.use(cookieParser());
app.use(mongoSanitize());
app.use("/api",limiter);


if(ENV_NODE==="development"){
    app.use(morgan("dev"))
}

app.use(express.json({limit: '10kb'}))
app.use(express.urlencoded({extended: true, limit: '10kb'}))


app.use((err,req,res,next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status: "error",
        message: err.message || "Internal server error",
        ...(ENV_NODE === "development" && {stack: err.stack})
    })
})

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET","POST","PUT","DELETE","PATCH","HEAD","OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "device-remember-token",
        "Access-Control-Allow-Origin",
        "Origin",
        "Accept"
    ]
}));

app.use("/health",healthRoute);
app.use("/api/v1/user",userRoute);
app.use("/api/v1/course",courseRoute);
app.use("/api/v1/progress",courseProgressRoute);
app.use("/api/v1/razorpay",razorpayRoute);
app.use("/api/v1/media",mediaRoute);

app.use((req,res) => {
    res.status(404).json({
        status: "error",
        message: "Route not found"
    })
})
app.listen(PORT,() => {
    console.log(`Listening on ${PORT} with ${ENV_NODE} mode`);
})