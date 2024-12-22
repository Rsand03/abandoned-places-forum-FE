import Map from 'ol/Map.js';
import {defaults as defaultInteractions, Select} from 'ol/interaction';
import {Feature, MapBrowserEvent} from "ol";
import {MutableRefObject, useEffect, useRef} from "react";
import {toLonLat} from "ol/proj";
import VectorSource from "ol/source/Vector";
import {
    BASE_MAP_LAYER,
    DEFAULT_INITIAL_VIEW, DEFAULT_SELECT_INTERACTION,
    generateLocationFeature,
    generateLocationInProgressFeature
} from "./mapUtils.ts";
import {MapLocation, SidebarContent} from "../utils.ts";
import {
    createNewInProgressLocationLayer,
    createPrivateLocationsLayer,
    createPublicLocationsLayer,
    createSelectedLocationsLayer
} from "./mapLayers.ts";
import VectorLayer from "ol/layer/Vector";
import {SelectEvent} from "ol/interaction/Select";


interface MapViewProps {
    globalMapClickCoords: number[]| null;
    setGlobalMapClickCoords: (mapClickCoords: number[]) => void;
    locationsDisplayedOnMap: MapLocation[];
    globalCoordinateSelectionMode: boolean;
    setSelectedLocationInParent: (mapLocation: MapLocation | null) => void;
    setObliqueAeroPhotoCoords: (newObliqueAeroPhotoCoords: number[] | null) => void;
    sideBarContent: SidebarContent;
}

function MapView({
                     locationsDisplayedOnMap,
                     globalMapClickCoords,
                     setSelectedLocationInParent,
                     setGlobalMapClickCoords,
                     setObliqueAeroPhotoCoords,
                     globalCoordinateSelectionMode,
                     sideBarContent,
                 }: MapViewProps) {

    const mapRef: MutableRefObject<Map | null> = useRef<Map | null>(null);

    const publicLocationsVectorSource: MutableRefObject<VectorSource> = useRef(new VectorSource());
    const privateLocationsVectorSource: MutableRefObject<VectorSource> = useRef(new VectorSource());
    const newLocationInProgressVectorSource: MutableRefObject<VectorSource> = useRef(new VectorSource());
    const selectedLocationsVectorSource: MutableRefObject<VectorSource> = useRef(new VectorSource());

    const publicLocationsLayer: MutableRefObject<VectorLayer> = useRef(
        createPublicLocationsLayer(publicLocationsVectorSource.current)
    );
    const privateLocationsLayer: MutableRefObject<VectorLayer> = useRef(
        createPrivateLocationsLayer(privateLocationsVectorSource.current)
    );
    const newLocationInProgressLayer: MutableRefObject<VectorLayer> = useRef(
        createNewInProgressLocationLayer(newLocationInProgressVectorSource.current)
    );
    const selectedLocationsVectorLayer: MutableRefObject<VectorLayer> = useRef(
        createSelectedLocationsLayer(selectedLocationsVectorSource.current)
    );


    function handleMapSelectEvent(event: SelectEvent) {
        const selectedFeatures: Feature[] = event.selected;

        selectedLocationsVectorSource.current.clear();
        setSelectedLocationInParent(null);

        if (selectedFeatures.length && !selectedFeatures[0]?.get("isNewLocationInProgress")) {
            selectedLocationsVectorSource.current.addFeature(selectedFeatures[0]);
            setSelectedLocationInParent(selectedFeatures[0].get("location"));
        }
    }
    const selectInteraction: Select = DEFAULT_SELECT_INTERACTION;
    selectInteraction.on("select", handleMapSelectEvent);


    function initMap(): Map {
        const map = new Map({
            target: "map-element",
            layers: [
                BASE_MAP_LAYER,
                privateLocationsLayer.current,
                publicLocationsLayer.current,
                selectedLocationsVectorLayer.current,
                newLocationInProgressLayer.current
            ],
            view: DEFAULT_INITIAL_VIEW,
            controls: [],
            interactions: defaultInteractions({
                doubleClickZoom: false,
            }),
        });

        map.on('dblclick', (event: MapBrowserEvent<PointerEvent>) => {
            setObliqueAeroPhotoCoords(toLonLat(event.coordinate).reverse());
        });
        map.on('click', (event: MapBrowserEvent<PointerEvent>) => {
            setGlobalMapClickCoords(toLonLat(event.coordinate).reverse());
            setObliqueAeroPhotoCoords(null);
        });

        map.addInteraction(selectInteraction);

        return map;
    }


    function displayLocationsOnMap(locationsDisplayedOnMap: MapLocation[]) {
        locationsDisplayedOnMap.forEach((mapLocation: MapLocation) => {
            const feature = generateLocationFeature(mapLocation);
            if (mapLocation.isPublic) {
                publicLocationsVectorSource.current.addFeature(feature);
            } else {
                privateLocationsVectorSource.current.addFeature(feature);
            }
        });
    }


    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = initMap();

            return () => {
                mapRef.current?.setTarget();
                mapRef.current = null;
            };
        }
    }, []);

    useEffect(() => {
        publicLocationsVectorSource.current.clear();
        privateLocationsVectorSource.current.clear();
        selectedLocationsVectorSource.current.clear();
        newLocationInProgressVectorSource.current.clear();

        displayLocationsOnMap(locationsDisplayedOnMap);
    }, [locationsDisplayedOnMap]);

    useEffect(() => {
        if (sideBarContent !== SidebarContent.ADD_NEW_LOCATION) {
            newLocationInProgressVectorSource.current.clear();
        }
    }, [sideBarContent]);

    useEffect(() => {
        if (globalMapClickCoords !== null && globalCoordinateSelectionMode) {
            newLocationInProgressVectorSource.current.clear();
            newLocationInProgressVectorSource.current.addFeature(generateLocationInProgressFeature(globalMapClickCoords));
        }
    }, [globalMapClickCoords]);


    return (
        <div>
            <div id="map-element" className="absolute top-0 left-0 h-screen w-screen"/>
        </div>
    );
}

export default MapView;
