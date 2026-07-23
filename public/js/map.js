if (typeof mapToken !== "undefined" && mapToken) {
    maptilersdk.config.apiKey = mapToken;
} else {
    console.warn("MapToken is missing!");
}

const map = new maptilersdk.Map({
    container: "map",
    style: maptilersdk.MapStyle.STREETS,
    center: (typeof listing !== "undefined" && listing.geometry && listing.geometry.coordinates && listing.geometry.coordinates.length === 2)
        ? listing.geometry.coordinates
        : [78.9629, 20.5937],
    zoom: 9,
});

async function loadMap() {
    try {
        let coordinates;
        if (typeof listing !== "undefined" && listing.geometry && listing.geometry.coordinates && listing.geometry.coordinates.length === 2) {
            coordinates = listing.geometry.coordinates;
        } else if (typeof listingLocation !== "undefined" && listingLocation && mapToken) {
            const response = await fetch(
                `https://api.maptiler.com/geocoding/${encodeURIComponent(listingLocation)}.json?key=${mapToken}`
            );
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                coordinates = data.features[0].center;
            }
        }

        if (!coordinates) {
            coordinates = [78.9629, 20.5937];
        }

        map.setCenter(coordinates);
        map.setZoom(10);

        new maptilersdk.Marker({ color: "red" })
            .setLngLat(coordinates)
            .setPopup(
                new maptilersdk.Popup({ offset: 25 }).setHTML(
                    `<h5>${typeof listingTitle !== "undefined" ? listingTitle : "Location"}</h5><p>${typeof listingLocation !== "undefined" ? listingLocation : "Exact location provided after booking"}</p>`
                )
            )
            .addTo(map);
    } catch (err) {
        console.log("Map loading error:", err);
    }
}

loadMap();
