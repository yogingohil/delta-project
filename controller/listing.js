const Listing = require("../models/listing");
const ExpressError = require("../utils/ExpressError.js");

module.exports.index = async (req,res) =>{
    try {
        const allListings = await Listing.find({});
        res.render("listings/index.ejs", { allListings });
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong");
        res.redirect("/");
    }
};

module.exports.renderNewForm = (req,res) =>{
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req,res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({
        path : "reviews",
        populate : {
            path : "author",
        }
    })
    .populate("owner");

    if(!listing){
        req.flash("error", "Listings you requested for does not exist ");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", {listing});
};

module.exports.createListing = async (req, res, next) => {
    if (!req.file) {
        throw new ExpressError(400, "Please upload a listing image.");
    }

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);

    const fullAddress = `${req.body.listing.location}, ${req.body.listing.country}`;

    const geoResponse = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(fullAddress)}.json?key=${process.env.MAP_TOKEN}`
    );
    const geoData = await geoResponse.json();

    if (!geoData.features || geoData.features.length === 0) {
        throw new ExpressError(400, "Could not find coordinates for that location.");
    }

    newListing.geometry = {
        type : "Point",
        coordinates : geoData.features[0].center,
    };

    newListing.owner = req.user._id;
    newListing.image = {url, filename};

    await newListing.save();
    req.flash("success", "new listing created !! ");
    res.redirect("/listings");
};

module.exports.renderEditForm = async(req,res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id);

    if(!listing){
        req.flash("error", "Listings you requested for does not exist ");
        return res.redirect("/listings");
    }

    let originalListingUrl = listing.image.url;
    originalListingUrl = originalListingUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", {listing, originalListingUrl});
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;

    let listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "Listings you requested for does not exist ");
        return res.redirect("/listings");
    }

    listing.set(req.body.listing);

    const fullAddress = `${req.body.listing.location}, ${req.body.listing.country}`;

    const geoResponse = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(fullAddress)}.json?key=${process.env.MAP_TOKEN}`
    );
    const geoData = await geoResponse.json();

    if (!geoData.features || geoData.features.length === 0) {
        throw new ExpressError(400, "Could not find coordinates for that location.");
    }

    listing.geometry = {
        type : "Point",
        coordinates : geoData.features[0].center,
    };

    if (req.file) {
        listing.image = {
            url : req.file.path,
            filename : req.file.filename
        };
    }

    await listing.save();
    req.flash("success", "Listing updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async(req,res) =>{
    let {id} = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "listing deleted successfully !! ");
    res.redirect("/listings");
};
