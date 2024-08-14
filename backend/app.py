from flask import Flask, jsonify, Response, render_template, request
import requests
import pandas as pd
import xml.etree.ElementTree as ET


app = Flask(__name__)

@app.route('/1', methods=['GET'])
def get_external_csv():
    # Define the URL of the external API
    bus_number = request.args.get('bus_number', default=None, type=str)
    external_api_url = 'https://transport.tallinn.ee/gps.txt'
    # Make a GET request to the external API
    response = requests.get(external_api_url)

    # Check if the request was successful
    if response.status_code == 200:
        # Get the CSV content from the response
        csv_text = response.text
        with open('data.txt', 'w') as file:
            file.write(csv_text)

        # Use StringIO to treat the CSV string as a file
        # csv_file = StringIO(csv_text)

        # Define the column names based on the provided description
        column_names = [
            "transport_type", "line_number", "latitude", "longitude", 
            "speed", "heading", "vehicle_number", "vehicle_type", "some1", "some2"
        ]

        # Read the CSV data into a pandas DataFrame
        df = pd.read_csv('data.txt', sep=",", header=None, names=column_names)


        # Transform latitude and longitude to degrees
        df["latitude"] = df["latitude"] / 1000000
        df["longitude"] = df["longitude"] / 1000000
        transport_type_mapping = {
            1: "trolleybus",
            2: "bus",
            3: "tram",
            7: "night bus"
        }
        df["transport_type"] = df["transport_type"].map(transport_type_mapping)

        df = df.where(pd.notnull(df), None)
        df = df[df['line_number'] ==  bus_number]
        df = df.fillna({'speed': 0})

        # Convert the DataFrame to a list of dictionaries
        data = df.to_dict(orient='records')

        # Return the data as a JSON response
        return jsonify(data)
    else:
        # Return an error message if the request failed
        return Response('Failed to fetch data from external API', status=response.status_code, mimetype='text/plain')
    


@app.route('/2', methods=['GET'])
def get_bus_stops():
    tree = ET.parse('stops.xml')
    root = tree.getroot()
    # Extract data from XML
    data = []
    for stop in root.findall('stop'):
        stop_data = {
            'id': stop.get('id'),
            'id0': stop.get('id0'),
            'name': stop.get('name'),
            'lat': stop.get('lat'),
            'lon': stop.get('lon')
        }
        for route in stop.findall('route'):
            stop_data.update({
                'transport': route.get('transport'),
                'num': route.get('num'),
                'direction': route.get('direction'),
                'directionName': route.get('directionName'),
                'stopNum': route.get('stopNum')
            })
        data.append(stop_data)

    # Convert to DataFrame
    df = pd.DataFrame(data)
    df = df[df['transport'] ==  'bus']
    df = df.dropna()


    # Display the DataFrame
    print(df)

    # Save the DataFrame to a CSV file
    # df.to_csv('/stops.csv', index=False)
    data = df.to_dict(orient='records')

    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
