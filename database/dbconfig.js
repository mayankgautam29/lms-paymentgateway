import mongoose from "mongoose";

const MAX_RETIRES = 3;
const RETRY_INTERVAL = 5000;

class DatabaseConnection {
  constructor() {
    this.retryCount = 0;
    this.isConnected = false;

    mongoose.set("strictQuery", true);

    mongoose.connection.on("connected", () => {
      console.log("Mongo db connected successfully.");
      this.isConnected = true;
    });
    mongoose.connection.on("error", () => {
      console.log("Error connecting to mongo db.");
      this.isConnected = false;
    });
    mongoose.connection.on("disconnected", () => {
      console.log("Connection to mongo db disconnected.");
      this.handleDisconnection();
    });
    process.on("SIGTERM",this.handleAppTermination.bind(this));
  }

  async connect() {
    try {
      if (!process.env.MONGO_URI) {
        throw new Error("Mongo db URI not unavailable");
      }
      const connectionOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
      };
      if (process.env.NODE_ENV === "development") {
        mongoose.set("debug", true);
      }
      await mongoose.connect(process.env.MONGO_URI, connectionOptions);
      this.retryCount = 0;
    } catch (error) {
        console.error(error.message)
        await this.handleConnectionError()
    }
  }

  async handleConnectionError() {
    if (this.retryCount < MAX_RETIRES) {
      this.retryCount++;
      console.log("Retrying connection with the database");
      await new Promise((resolve) =>
        setTimeout(() => {
          resolve;
        }, RETRY_INTERVAL)
      );
    } else{
        console.error("Failed to connection to database");
        process.exit(1);
    }
  }

  async handleDisconnection(){
    if(!this.isConnected){
        console.log("Attempting to reconnect");
        this.connect();
    }
  }

  async handleAppTermination(){
    try {
        await mongoose.connection.close();
        console.log("Mongoose connection closed");
        process.exit(0);
    } catch (error) {
        console.error("Error occured during database connection");
        process.exit(1);
    }
  }

  getConnectionStatus(){
    return{
        isConnected: this.isConnected,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
    }
  }
}

const dbConnection = new DatabaseConnection();

export default dbConnection.connect.bind(dbConnection);
export const getDBStatus = dbConnection.getConnectionStatus.bind(dbConnection)