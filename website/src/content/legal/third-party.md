# Third-party services, data and software

Author: A097MPRUS.

GPX Viewer's own source code is under the MIT License (see LICENSE). This file lists everything the apps use that is not covered by it.

## What is and is not in this package

- **No map imagery or map data is included.** The apps show maps by requesting tiles from the online services below while they run. Using a service means accepting that service's terms; the apps show each service's attribution on the map and under Credits.
- **No Garmin code or Garmin data is included.** Garmin's FIT SDK and the list of Garmin product names derived from it are not part of this project, because the FIT SDK license (the Garmin FIT Protocol License Agreement) does not allow them to be published or placed under a license that lets others modify them. The apps open GPX files only, and File Info shows a stored Garmin product number as a number. Garmin is a trademark of Garmin Ltd. or its subsidiaries.
- **No API keys are included.** Services that need a key (Thunderforest, Esri ArcGIS, and in both Mac apps Microsoft Azure Maps, TomTom, HERE and Mapbox) use the user's own key, stored in the macOS Keychain.
- **Bundled public data:**
  - `GeoportailCatalogue.json` and its title files are a copy of the public layer catalogue of Geoportail Luxembourg (map.geoportail.lu/jsapilayers), used offline until the live catalogue loads. Published by the Administration du cadastre et de la topographie (ACT) as open data.
  - `Sources/GpxCore/Resources/Regions.json`: simplified region outlines (Luxembourg and neighbouring regions) from OpenStreetMap boundary relations, © OpenStreetMap contributors. This file is under the Open Database License (ODbL 1.0, opendatacommons.org/licenses/odbl/1-0/), not the MIT License; it is used to choose official imagery and terrain sources for a location.
  - `MacLegacy/Resources/TrustAnchors.pem` holds Apple's public root certificates, used only to verify five map services on macOS 10.13 to 12 (see the Intel compatibility documents).

## Apple

The apps use Apple's system frameworks (SwiftUI, AppKit, MapKit, RealityKit, SceneKit, Swift Charts, WebKit). Apple Maps content is shown through MapKit under Apple's terms. Apple, Apple Maps and macOS are trademarks of Apple Inc.

## Map and data services

| Service | Server | Attribution shown | Terms noted for this use |
| --- | --- | --- | --- |
| Terrain Tiles (elevation data) | `s3.amazonaws.com` | Terrain Tiles (Mapzen, AWS Open Data): SRTM, GMTED2010, ETOPO1, EU-DEM (Copernicus) and others | AWS Open Data registry, free to use with attribution. Used for 3D relief and as the worldwide terrain fallback. |
| OpenStreetMap | `tile.openstreetmap.org` | © OpenStreetMap contributors | ODbL data. OSMF tile usage policy: identify the app, cache at least 7 days, no bulk or offline prefetching. |
| OpenTopoMap | `*.tile.opentopomap.org` | Map data © OpenStreetMap contributors, SRTM. Style © OpenTopoMap (CC BY-SA) | CC BY-SA 3.0. Free to use with attribution. |
| CyclOSM | `*.tile-cyclosm.openstreetmap.fr` | © OpenStreetMap contributors. Style CyclOSM, tiles OpenStreetMap France | ODbL data, CC BY-SA style. Hosted by OpenStreetMap France for reasonable use. |
| OpenCycleMap (Thunderforest) | `tile.thunderforest.com` | Maps © Thunderforest, data © OpenStreetMap contributors | Needs your own Thunderforest API key (free hobby tier). Without a key the server returns watermarked tiles, so the app does not request it. Your own key |
| Sentinel-2 cloudless 2016 (EOX) | `tiles.maps.eox.at` | Sentinel-2 cloudless by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2016 and 2017) | CC BY 4.0 (the 2016 edition only; later editions are non-commercial). 10 m resolution, so it is the keyless last resort, not a close-up source. |
| Esri World Imagery | `ibasemaps-api.arcgis.com` | Esri, Vantor, Earthstar Geographics, and the GIS User Community | Needs your own ArcGIS Location Platform API key. Non-commercial use only. Not stored in the disk cache. Your own key |
| Esri roads | `ibasemaps-api.arcgis.com` | Esri, HERE, Garmin, OpenStreetMap contributors | Needs your own ArcGIS Location Platform API key. Non-commercial use only. Your own key |
| Esri place names and borders | `ibasemaps-api.arcgis.com` | Esri, HERE, Garmin, OpenStreetMap contributors | Needs your own ArcGIS Location Platform API key. Non-commercial use only. Your own key |
| Cycle infrastructure (CyclOSM lite) | `*.tile-cyclosm.openstreetmap.fr` | Cycle overlay CyclOSM, © OpenStreetMap contributors | ODbL data, CC BY-SA style. |
| Hiking routes (Waymarked Trails) | `tile.waymarkedtrails.org` | Hiking routes © waymarkedtrails.org, OpenStreetMap contributors (CC BY-SA) | CC BY-SA 3.0. |
| MTB routes (Waymarked Trails) | `tile.waymarkedtrails.org` | MTB routes © waymarkedtrails.org, OpenStreetMap contributors (CC BY-SA) | CC BY-SA 3.0. |
| Signposted cycle routes (Waymarked Trails) | `tile.waymarkedtrails.org` | Cycle routes © waymarkedtrails.org, OpenStreetMap contributors (CC BY-SA) | CC BY-SA 3.0. |
| Geoportail Luxembourg Aerial | `wmts*.geoportail.lu` | Orthophoto © Administration du cadastre et de la topographie (ACT), geoportail.lu | ACT open data WMTS: no fees, no access constraints, CC0 or CC BY depending on layer. |
| Geoportail Luxembourg Aerial (leaf-off) | `wmts*.geoportail.lu` | Orthophoto © Administration du cadastre et de la topographie (ACT), geoportail.lu | ACT open data WMTS: no fees, no access constraints. |
| Geoportail Luxembourg Hybrid | `wmts*.geoportail.lu` | Hybrid map © Administration du cadastre et de la topographie (ACT), geoportail.lu | ACT open data WMTS: no fees, no access constraints. |
| Geoportail Luxembourg Map | `wmts*.geoportail.lu` | Basemap © ACT, geoportail.lu, © OpenStreetMap contributors | ACT open data WMTS: no fees, no access constraints. |
| Geoportail Luxembourg Topographic | `wmts*.geoportail.lu` | Topographic map © ACT, geoportail.lu | ACT open data WMTS: no fees, no access constraints. |
| Geoportail Luxembourg 1:20,000 | `wmts*.geoportail.lu` | Carte topographique 1:20 000 © ACT, geoportail.lu | ACT open data WMTS: no fees, no access constraints. |
| Wallonia Aerial (SPW) | `geoservices.wallonie.be` | Orthophotos © SPW, Service public de Wallonie | SPW open geodata, free reuse with attribution. |
| Flanders Aerial (Digitaal Vlaanderen) | `geo.api.vlaanderen.be` | Orthofoto © Digitaal Vlaanderen | Free service ("Het gebruik van de service is kosteloos"), Modellicentie Gratis Hergebruik. |
| Brussels Aerial (UrbIS) | `geoservices-urbis.irisnet.be` | Orthophoto © UrbIS, paradigm.brussels | UrbIS open data, free reuse with attribution. |
| Belgium Topographic (NGI CartoWeb) | `cartoweb.wmts.ngi.be` | © NGI/IGN Belgium, CartoWeb.be | CartoWeb.be: free for non-commercial use. |
| Belgium roads and names (NGI) | `cartoweb.wmts.ngi.be` | © NGI/IGN Belgium, CartoWeb.be | CartoWeb.be: free for non-commercial use. |
| France Aerial (IGN) | `data.geopf.fr` | © IGN, Geoplateforme | Etalab Open Licence 2.0. |
| France Map (Plan IGN) | `data.geopf.fr` | © IGN, Geoplateforme | Etalab Open Licence 2.0. |
| France roads (IGN) | `data.geopf.fr` | © IGN, Geoplateforme | Etalab Open Licence 2.0. |
| France place names (IGN) | `data.geopf.fr` | © IGN, Geoplateforme | Etalab Open Licence 2.0. |
| Netherlands Aerial (PDOK) | `service.pdok.nl` | Luchtfoto © Beeldmateriaal.nl, PDOK | CC BY 4.0. |
| Netherlands Map (BRT, PDOK) | `service.pdok.nl` | © Kadaster, PDOK | CC BY 4.0. |
| Switzerland Aerial (swisstopo SWISSIMAGE) | `wmts.geo.admin.ch` | © swisstopo | Swiss federal open government data: free use with source attribution. |
| Switzerland National Map (swisstopo) | `wmts.geo.admin.ch` | © swisstopo | Swiss federal open government data: free use with source attribution. |
| Switzerland cycle routes (SwitzerlandMobility) | `wmts.geo.admin.ch` | Cycle routes © FEDRO, SwitzerlandMobility, swisstopo | Swiss federal open government data: free use with source attribution. |
| Austria Aerial (basemap.at) | `mapsneu.wien.gv.at` | Datenquelle: basemap.at | CC BY 4.0. |
| Austria roads and names (basemap.at) | `mapsneu.wien.gv.at` | Datenquelle: basemap.at | CC BY 4.0. |
| Austria Map (basemap.at) | `mapsneu.wien.gv.at` | Datenquelle: basemap.at | CC BY 4.0. |
| Germany Map (basemap.de) | `sgx.geodatenzentrum.de` | © basemap.de / BKG | CC BY 4.0. |
| Rhineland-Palatinate Aerial (DOP20) | `geo4.service24.rlp.de` | © GeoBasis-DE / LVermGeoRP, dl-de/by-2-0 | Datenlizenz Deutschland Namensnennung 2.0. |
| Saarland Aerial (DOP20) | `geoportal.saarland.de` | © GeoBasis DE/LVGL-SL | Free WMS ("freewms"), service states no fees and no limitations. |
| North Rhine-Westphalia Aerial (DOP) | `www.wms.nrw.de` | © Geobasis NRW, dl-de/zero-2-0 | Datenlizenz Deutschland Zero 2.0. |
| Bavaria Aerial (DOP40) | `geoservices.bayern.de` | © Bayerische Vermessungsverwaltung, CC BY 4.0 | Bavarian open data, CC BY 4.0. |
| Geoportail Luxembourg layers (catalogue of about 900 layers, including orthophotos, topographic maps and LiDAR) | `wmts*.geoportail.lu`, `map.geoportail.lu` | © Administration du cadastre et de la topographie, Luxembourg (per layer) | ACT open data; some layers need a Geoportail account. |

## Commercial map services with your own key (both Mac apps)

These are offered only after you add your own key from the provider in Settings, Map Providers. Your use is under your own account with that provider, under its terms, and may be billed by the provider beyond its free allowance. The author has no agreement with any of them.

| Service | Server | Attribution shown | Terms and notes |
| --- | --- | --- | --- |
| Microsoft Azure Maps (road, dark grey, aerial, aerial with labels, shaded relief, labels, live traffic, weather radar and infrared) | `atlas.microsoft.com` | Credit returned by Azure Maps for the area on screen, "© Microsoft" until it arrives | Microsoft Azure terms. Replaces Bing Maps, whose keys Microsoft no longer issues. Not stored in the disk cache. |
| TomTom (road, night, Orbis street maps, satellite, satellite with roads and labels, labels, hillshade from TomTom elevation, live traffic flow and incidents) | `api.tomtom.com` | © TomTom; satellite imagery © Maxar | TomTom developer terms. Not stored in the disk cache. |
| HERE (map, lite, topographic and their night styles, satellite, satellite with labels, truck maps, zone and truck layers, hillshade from HERE elevation, live traffic flow) | `maps.hereapi.com` | © year HERE plus the supplier credits HERE returns for the area | HERE terms and supplier notices (legal.here.com). Map tiles kept at most 24 hours, as HERE's caching guide allows; live traffic never cached. Truck maps and truck layers are billed at HERE's Advanced Raster Tile rate. |
| Mapbox (Streets, Outdoors, Light, Dark, Satellite, Satellite Streets, Navigation Day and Night) | `api.mapbox.com` | © Mapbox © OpenStreetMap, with "Improve this map" in the credits; satellite imagery © Maxar and others | Mapbox terms of service. Public tokens only. Not stored in the disk cache. |

## Other online services

| Service | Used for | Terms |
| --- | --- | --- |
| Geoportail Luxembourg APIs (`apiv4.geoportail.lu`, `wms.inspire.geoportail.lu`, `features.geoportail.lu`) | Terrain elevation and profiles, search, addresses, land cover (LIS-L, INSPIRE), national cycle network | ACT open data |
| IGN Géoplateforme (`data.geopf.fr`) | Terrain elevation in France | Etalab Open Licence 2.0 |
| Terrain Tiles (`s3.amazonaws.com`) | Worldwide terrain elevation, 3D relief, hillshade | AWS Open Data, attribution |
| Overpass API (`overpass-api.de`, fallback `overpass.private.coffee`) | Roads, paths and surfaces along a route; points of interest | OpenStreetMap data, ODbL; public instance usage policy |
| BRouter (`brouter.de`) | Route planning | OpenStreetMap data, ODbL |

Notes for users: the Belgian NGI maps (CartoWeb.be) are free for non-commercial use; Esri layers through a free ArcGIS key are for non-commercial use; the OpenStreetMap tile servers allow normal interactive use with attribution but no bulk downloading, which the apps do not do.

## Test data

Test GPX files are synthetic or written for this project. The GPX 1.1 schema (`gpx11.xsd`, Topografix) is included as a public XML schema for validation tests.
