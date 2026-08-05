const Listing = require("../models/listing");

module.exports.index = async (req,res) =>{
  try {
    const { q, category } = req.query;
    let queryFilter = {};

    if (category && category !== "Trending") {
        const catRegex = new RegExp(category, "i");
        queryFilter.$or = [
            { category: catRegex },
            { title: catRegex },
            { description: catRegex },
            { location: catRegex },
            { country: catRegex }
        ];
    } else if (q) {
        const searchRegex = new RegExp(q.trim(), "i");
        queryFilter.$or = [
            { title: searchRegex },
            { location: searchRegex },
            { country: searchRegex },
            { description: searchRegex },
            { category: searchRegex }
        ];
    }

    let allListings = await Listing.find(queryFilter).populate("reviews");

    if (category === "Trending") {
        allListings.sort((a, b) => {
            const avgA = a.reviews && a.reviews.length > 0
                ? a.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / a.reviews.length
                : (a.category === "Trending" ? 5 : 0);
            const avgB = b.reviews && b.reviews.length > 0
                ? b.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / b.reviews.length
                : (b.category === "Trending" ? 5 : 0);

            if (avgB !== avgA) {
                return avgB - avgA;
            }
            return (b.reviews ? b.reviews.length : 0) - (a.reviews ? a.reviews.length : 0);
        });
    }

    res.render("listings/index.ejs", { allListings, q, selectedCategory: category });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong");
    res.redirect("/");
  }
};

module.exports.renderNewForm = (req,res) =>{
    res.render("listings/new.ejs");
}

module.exports.showListing = async (req,res) =>{
    let {id}=req.params;
    const listing = await Listing.findById(id)
    .populate({path : "reviews", populate : {
      path : "author",
    }})
    .populate("owner");
    if(!listing){
        req.flash("error", "Listings you requested for does not exist ");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing, currUser: req.user });
}

module.exports.createListing = async (req, res, next) => {
    let url = req.file.path;
    let filename = req.file.filename;
    
    const newListing = new Listing(req.body.listing);

    try {
        const fullAddress = `${req.body.listing.location}, ${req.body.listing.country}`;
        if (process.env.MAP_TOKEN) {
            const geoResponse = await fetch(
                `https://api.maptiler.com/geocoding/${encodeURIComponent(fullAddress)}.json?key=${process.env.MAP_TOKEN}`
            );
            const geoData = await geoResponse.json();
            if (geoData.features && geoData.features.length > 0) {
                newListing.geometry = {
                    type: "Point",
                    coordinates: geoData.features[0].center,
                };
            }
        }
    } catch (err) {
        console.error("Geocoding error on creation:", err);
    }

    if (!newListing.geometry || !newListing.geometry.coordinates || newListing.geometry.coordinates.length === 0) {
        newListing.geometry = {
            type: "Point",
            coordinates: [78.9629, 20.5937],
        };
    }

    newListing.owner = req.user._id;
    newListing.image = {url, filename};
    await newListing.save();
    req.flash("success", "new listing created !! ");
    res.redirect("/listings");
}

module.exports.renderEditForm = async(req,res) =>{
    let {id}=req.params;
    const listing = await Listing.findById(id);

    if(!listing){
        req.flash("error", "Listings you requested for does not exist ");
        return res.redirect("/listings");
    }

    let originalListingUrl = listing.image.url;
    originalListingUrl = originalListingUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", {listing, originalListingUrl});
}

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing requested does not exist!");
        return res.redirect("/listings");
    }

    listing.set(req.body.listing);

    try {
        const fullAddress = `${req.body.listing.location}, ${req.body.listing.country}`;
        if (process.env.MAP_TOKEN) {
            const geoResponse = await fetch(
                `https://api.maptiler.com/geocoding/${encodeURIComponent(fullAddress)}.json?key=${process.env.MAP_TOKEN}`
            );
            const geoData = await geoResponse.json();
            if (geoData.features && geoData.features.length > 0) {
                listing.geometry = {
                    type: "Point",
                    coordinates: geoData.features[0].center,
                };
            }
        }
    } catch (err) {
        console.error("Geocoding error on update:", err);
    }

    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }
    await listing.save();
    req.flash("success", "Listing updated!");
    res.redirect(`/listings/${id}`);
}

module.exports.deleteListing = async(req,res) =>{
    let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "listing deleted successfully !! ");
    res.redirect("/listings");
}

