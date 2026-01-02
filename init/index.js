const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';

main()
    .then(()=>{
        console.log("connected to DB");
    })
    .catch((err)=>{
        console.log(err);
    });
async function main() {
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});

  // find any one user
  const user = await User.findOne();
    console.log(user._id);

    initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "6954d2131d17e95ab2cfc5d6",   // ObjectId automatically
  }));

  await Listing.insertMany(initData.data);
  console.log("data was initialized...");


};


initDB();