import requests
import json

def check_api_anomaly():
    url = "http://localhost:3000/people/v2/people?per_page=100"
    try:
        response = requests.get(url)
        data = response.json()
        people = data.get('data', [])

        anomaly_found = False

        # Build map of households
        households = {}
        for p in people:
            hid = p['attributes'].get('household_id')
            if hid:
                if hid not in households:
                    households[hid] = []
                households[hid].append(p)

        for hid, members in households.items():
            parents = [m for m in members if not m['attributes']['child']]
            children = [m for m in members if m['attributes']['child']]

            for child in children:
                child_dob = int(child['attributes']['birthdate'].split('-')[0])
                for parent in parents:
                    parent_dob = int(parent['attributes']['birthdate'].split('-')[0])

                    # Parent should be older (smaller year) than child
                    # If child year is smaller than parent year, child is older.
                    if child_dob < parent_dob:
                        print(f"Anomaly Found! Household {hid}")
                        print(f"Parent: {parent['attributes']['name']} ({parent_dob})")
                        print(f"Child: {child['attributes']['name']} ({child_dob})")
                        anomaly_found = True

        if not anomaly_found:
            print("No anomalies found in API data.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_api_anomaly()
