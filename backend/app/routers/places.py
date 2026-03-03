"""
Proxy for Google Places Autocomplete — keeps the API key server-side.
Uses location bias + query injection + server-side filtering to
ensure results are scoped to the selected US state.
"""
from __future__ import annotations

import httpx
from fastapi import APIRouter, Query

from app.config import get_settings

router = APIRouter(prefix="/places", tags=["places"])

# Approximate geographic centre (lat, lng) for each US state
STATE_CENTERS: dict[str, tuple[float, float]] = {
    "AL": (32.806671, -86.791130),
    "AK": (61.370716, -152.404419),
    "AZ": (33.729759, -111.431221),
    "AR": (34.969704, -92.373123),
    "CA": (36.116203, -119.681564),
    "CO": (39.059811, -105.311104),
    "CT": (41.597782, -72.755371),
    "DE": (39.318523, -75.507141),
    "FL": (27.766279, -81.686783),
    "GA": (33.040619, -83.643074),
    "HI": (21.094318, -157.498337),
    "ID": (44.240459, -114.478828),
    "IL": (40.349457, -88.986137),
    "IN": (39.849426, -86.258278),
    "IA": (42.011539, -93.210526),
    "KS": (38.526600, -96.726486),
    "KY": (37.668140, -84.670067),
    "LA": (31.169546, -91.867805),
    "ME": (44.693947, -69.381927),
    "MD": (39.063946, -76.802101),
    "MA": (42.230171, -71.530106),
    "MI": (43.326618, -84.536095),
    "MN": (45.694454, -93.900192),
    "MS": (32.741646, -89.678696),
    "MO": (38.456085, -92.288368),
    "MT": (46.921925, -110.454353),
    "NE": (41.125370, -98.268082),
    "NV": (38.313515, -117.055374),
    "NH": (43.452492, -71.563896),
    "NJ": (40.298904, -74.521011),
    "NM": (34.840515, -106.248482),
    "NY": (42.165726, -74.948051),
    "NC": (35.630066, -79.806419),
    "ND": (47.528912, -99.784012),
    "OH": (40.388783, -82.764915),
    "OK": (35.565342, -96.928917),
    "OR": (44.572021, -122.070938),
    "PA": (40.590752, -77.209755),
    "RI": (41.680893, -71.511780),
    "SC": (33.856892, -80.945007),
    "SD": (44.299782, -99.438828),
    "TN": (35.747845, -86.692345),
    "TX": (31.054487, -97.563461),
    "UT": (40.150032, -111.862434),
    "VT": (44.045876, -72.710686),
    "VA": (37.769337, -78.169968),
    "WA": (47.400902, -121.490494),
    "WV": (38.491226, -80.954456),
    "WI": (44.268543, -89.616508),
    "WY": (42.755966, -107.302490),
}

STATE_NAMES: dict[str, str] = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming",
}


@router.get("/autocomplete")
async def autocomplete_cities(
    input: str = Query(..., min_length=2),
    state: str = Query("", max_length=2, description="US state abbreviation"),
):
    settings = get_settings()
    key = settings.google_maps_api_key
    if not key:
        return {"predictions": []}

    state_upper = state.upper().strip()
    state_name = STATE_NAMES.get(state_upper, "")

    params: dict = {
        "input": input,
        "types": "(cities)",
        "components": "country:us",
        "key": key,
    }

    # Add location bias toward the state's centre (300 km radius)
    center = STATE_CENTERS.get(state_upper)
    if center:
        params["location"] = f"{center[0]},{center[1]}"
        params["radius"] = "300000"

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://maps.googleapis.com/maps/api/place/autocomplete/json",
            params=params,
            timeout=5.0,
        )
        data = resp.json()

    # Server-side filter: only keep predictions from the selected state.
    # Google returns structured data we can leverage:
    #   - description: "Bismarck, ND, USA"
    #   - terms: [{"value": "Bismarck"}, {"value": "ND"}, {"value": "USA"}]
    #   - structured_formatting.secondary_text: "ND, USA"
    predictions = []
    for p in data.get("predictions", []):
        if state_upper:
            # Strategy: check terms, secondary_text, and description
            terms_values = [t.get("value", "").upper() for t in p.get("terms", [])]
            secondary = p.get("structured_formatting", {}).get("secondary_text", "").upper()
            desc = p.get("description", "").upper()

            # Match if state abbr or full name appears in terms, secondary text, or description
            state_name_upper = state_name.upper()
            match = (
                state_upper in terms_values
                or state_name_upper in terms_values
                or f", {state_upper}," in f", {desc},"  # word-boundary check
                or f", {state_upper} " in desc
                or state_name_upper in secondary
                or state_name_upper in desc
            )

            if not match:
                continue

        city_name = p.get("structured_formatting", {}).get("main_text", "")
        predictions.append({
            "city": city_name,
            "description": p.get("description", ""),
            "place_id": p.get("place_id", ""),
        })

        if len(predictions) >= 5:
            break

    return {"predictions": predictions}
