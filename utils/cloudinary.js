import {v2 as cloudinary} from "cloudinary";
import dotenv from "dotenv";

dotenv.config({});

cloudinary.config({
    api_key: process.env.API_KEY,
    cloud_name: process.env.CLOUD_NAME,
    api_secret: process.env.API_SECRET
})

export const uploadMedia = async (file) => {
    try {
        const uploadResponse = await cloudinary.uploader.upload(file,{
            resource_type: "auto",

        })
        return uploadResponse;
    } catch (error) {
        console.log("Error uploading data to cloudinary");
        console.log(error.message);
    }
}

export const deleteMedia = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.log(error);
        console.log("Error deleting the media from cloduinary")
    }
}

export const deleteVideoMedia = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId,{resource_type: "video"});
    } catch (error) {
        console.log(error);
        console.log("Error deleting the media from cloduinary")
    }
}