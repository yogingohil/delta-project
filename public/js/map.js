maptilersdk.config.apiKey = mapToken;

const map = new maptilersdk.Map({
    container: "map",
    style: maptilersdk.MapStyle.STREETS,
    center: [78.9629, 20.5937],
    zoom: 4,
});

async function loadMap() {
    try {
        const response = await fetch(
            `https://api.maptiler.com/geocoding/${encodeURIComponent(listingLocation)}.json?key=${mapToken}`
        );
        const data = await response.json();

        if (!data.features || data.features.length === 0) {
            document.getElementById("map").innerHTML =
                "<p style='padding:20px;'>Location not found on map.</p>";
            return;
        }

        const coordinates = data.features[0].center;

        map.setCenter(coordinates);
        map.setZoom(10);

        new maptilersdk.Marker({ color: "red" })
            .setLngLat(coordinates)
            .setPopup(
                new maptilersdk.Popup({ offset: 25 }).setHTML(
                    `<h5>${listingTitle}</h5><p>${listingLocation}</p>`
                )
            )
            .addTo(map);
    } catch (err) {
        console.log("Map loading error:", err);
        document.getElementById("map").innerHTML =
            "<p style='padding:20px;'>Map could not be loaded.</p>";
    }
}

loadMap();
