const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./reviews.js");

const listingScehma = new Schema({
    title :{
    type : String,
    required : true,
    },
    description : String,
    image : {
    url : String,
    filename : String,
    },   
    price : Number,
    location : String,
    country : String,
    reviews : [
        {
        type : Schema.Types.ObjectId,
        ref : "Review"
        }
    ],
    owner :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
    },
});

listingScehma.post("findOneAndDelete" , async(listing)=>{
    if(listing){
        await Review.deleteMany({_id: {$in : listing.reviews}})
    }
})

const Listing = mongoose.model("listing", listingScehma);
module.exports=Listing;