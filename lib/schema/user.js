import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String, required:true,unique:true},
    password:{type:String, required:true},
    type:{type:String, enum:['admin','user'], default:'user'},
    address:{ type:String , default:''},
    pincode:{type:Number,default:0},
    phone:{type:Number,default:0},
    photo:{type:String, default:''}
},{timestamps:true });

export const User =mongoose.models.User|| mongoose.model("User",UserSchema);