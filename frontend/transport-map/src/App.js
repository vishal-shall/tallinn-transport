import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

// Fixing leaflet's default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
// Create a custom icon
const customIcon = L.icon({
    iconUrl: 'https://img.icons8.com/?size=100&id=41445&format=png&color=000000', // Path to your custom icon in the public directory
    iconSize: [32, 32], // Size of the icon
    iconAnchor: [16, 32], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -32] // Point from which the popup should open relative to the iconAnchor
});

// Initial country boundaries or center and zoom for Estonia
const initialCenter = [59.437, 24.7535]; // Center of Estonia
const initialZoom = 7; // Adjust zoom level as needed

// Component to handle zooming to specific coordinates
const LocationFinder = ({ position }) => {
    const map = useMap();
    
    useEffect(() => {
        if (position) {
            map.setView(position, 15); // Zoom level 15 can be adjusted
            L.marker(position).addTo(map);
        }
    }, [position, map]);

    return null;
};

const App = () => {
    const [transportData, setTransportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busNumber, setBusNumber] = useState('');
    const [stopsData, setStopsData] = useState([]);
    const mapRef = useRef(null);
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    setError(error.message);
                }
            );
        } else {
            setError('Geolocation is not supported by this browser.');
        }
    }, []);

    const fetchData = (busNumber) => {
        const url = busNumber ? `/1?bus_number=${busNumber}` : '/1';
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Raw data:', data); // Log the raw data

                // Filter out entries where latitude or longitude is NaN
                const validData = data.filter(item => !isNaN(item.latitude) && !isNaN(item.longitude));
                console.log('Valid data:', validData); // Log the filtered data

                setTransportData(validData);
                // handleMarkerClick(data.latitude, data.longitude)
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching transport data:', error);
                setLoading(false);
            });
    };

    const fetchBusStopsData = () => {
      const url = '/2';
      fetch(url)
          .then(response => {
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              return response.json();
          })
          .then(data => {
              console.log('Raw data:', data); // Log the raw data

              // Filter out entries where latitude or longitude is NaN
              const validData = data.filter(item => !isNaN(item.lat) && !isNaN(item.lon));
              console.log('Valid data:', validData); // Log the filtered data

              setStopsData(validData);
              // handleMarkerClick(data.latitude, data.longitude)
              setLoading(false);
          })
          .catch(error => {
              console.error('Error fetching transport data:', error);
              setLoading(false);
          });
  };

    useEffect(() => {
        fetchData(busNumber);
        fetchBusStopsData()
    }, [busNumber]);

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchData(busNumber);
    };

    const handleMarkerClick = (latitude, longitude) => {
        alert('hah')
    };

    return (
        <div className="App">
            <h1>Transport Map</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Bus Number:
                    <input
                        type="text"
                        value={busNumber}
                        onChange={(e) => setBusNumber(e.target.value)}
                    />
                </label>
                <button type="submit">Fetch Data</button>
            </form>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <MapContainer
                    center={initialCenter}
                    zoom={initialZoom}
                    style={{ height: '600px', width: '100%' }}
                    whenCreated={mapInstance => mapRef.current = mapInstance}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                    />
                    {transportData.map((item, index) => (
                        <Marker
                            key={index}
                            position={[item.latitude, item.longitude]}
                        >
                            <Popup>
                                <b>{item.transport_type}</b><br />
                                Line: {item.line_number}<br />
                                Speed: {isNaN(item.speed) ? 'N/A' : `${item.speed} km/h`}<br />
                                Heading: {item.heading !== 999 ? item.heading : 'N/A'}
                            </Popup>
                            <LocationFinder position={[item.longitude, item.latitude]} />
                        </Marker>
                        
                    ))}
                    {stopsData.map((item, index) => (
                        <Marker
                            key={index}
                            position={[item.lat, item.lon]}
                        >
                            {/* <Popup>
                                <b>{item.transport_type}</b><br />
                                Line: {item.line_number}<br />
                                Speed: {isNaN(item.speed) ? 'N/A' : `${item.speed} km/h`}<br />
                                Heading: {item.heading !== 999 ? item.heading : 'N/A'}
                            </Popup> */}
                            {/* <Marker position={[location.latitude, location.longitude]} icon={customIcon}>
                        <Popup>
                            You are here.
                        </Popup>
                    </Marker> */}
                            <LocationFinder position={[item.lat, item.lon]} />
                        </Marker>
                        
                    ))}
                    {location ? (
                <MapContainer
                    center={[location.latitude, location.longitude]}
                    zoom={13}
                    style={{ height: '600px', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                    />
                    <Marker position={[location.latitude, location.longitude]} icon={customIcon}>
                        <Popup>
                            You are here.
                        </Popup>
                    </Marker>
                </MapContainer>
            ) : (
                <p>Loading your location...</p>
            )}
                </MapContainer>
            )}

        </div>
    );
};

export default App;
