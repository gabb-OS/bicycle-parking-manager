import click
import json
import os
from flask import current_app
from flask.cli import with_appcontext
from flaskr.extensions import db
from flaskr.models.users import User
from flaskr.models.parking_areas import ParkingArea  # Import your Parking model
from datetime import datetime
from shapely.geometry import shape  # Required to parse GeoJSON geometry
from geoalchemy2.elements import WKTElement

@click.command("seed-db")
@with_appcontext
def seed_db_command():
    """Seeds the database with initial data (Users & Parking Areas)."""
    
    seed_users()
    seed_parking_areas()


def seed_users():
    """Logic to seed users."""
    json_path = os.path.join(current_app.root_path, 'seeds', 'users_data.json')

    if not os.path.exists(json_path):
        print(f"⚠️  Users seed file not found at: {json_path}")
        return

    print(f"🌱 Seeding Users from {json_path}...")

    try:
        with open(json_path, 'r') as f:
            users_data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading Users JSON: {e}")
        return

    added_count = 0
    skipped_count = 0

    for user_json in users_data:
        username = user_json.get('username')
        created_at_str = user_json.get('created_at')

        if User.query.filter_by(username=username).first():
            skipped_count += 1
            continue

        try:
            dt_object = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
            date_only = dt_object.date()
        except ValueError:
            print(f"❌ Date format error for user {username}")
            continue

        new_user = User(username=username, created_at=date_only)
        db.session.add(new_user)
        added_count += 1

    try:
        db.session.commit()
        print(f"✅ Users Seeding: {added_count} added, {skipped_count} skipped.")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Database error (Users): {e}")


def seed_parking_areas():
    """Logic to seed Parking Areas from GeoJSON."""
    # 1. Path to your new geojson file
    json_path = os.path.join(current_app.root_path, 'seeds', 'parkingAreas_data.geojson')

    if not os.path.exists(json_path):
        print(f"⚠️  Parking seed file not found at: {json_path}")
        return

    print(f"🌱 Seeding Parking Areas from {json_path}...")

    try:
        with open(json_path, 'r') as f:
            geojson_data = json.load(f)
    except Exception as e:
        print(f"❌ Error reading Parking GeoJSON: {e}")
        return

    added_count = 0
    skipped_count = 0

    # 2. Iterate over GeoJSON Features
    features = geojson_data.get('features', [])
    
    for feature in features:
        props = feature.get('properties', {})
        geometry = feature.get('geometry')
        
        name = props.get('name')
        max_cap = props.get('max_capacity')
        res_cap = props.get('residual_capacity')

        # Idempotency Check: Skip if name exists
        if ParkingArea.query.filter_by(name=name).first():
            skipped_count += 1
            continue

        # 3. Convert GeoJSON Geometry to WKT (Well Known Text)
        # Shapely's 'shape' function takes a GeoJSON dict and makes a Python object
        try:
            shapely_geom = shape(geometry)
            # Convert to WKT format that PostGIS/GeoAlchemy accepts easily
            wkt_geom = WKTElement(shapely_geom.wkt, srid=4326)
        except Exception as e:
            print(f"❌ Geometry error for {name}: {e}")
            continue

        # 4. Create Model Instance
        new_area = ParkingArea(
            name=name,
            location_area=wkt_geom,
            max_capacity=max_cap,
            residual_capacity=res_cap
        )

        db.session.add(new_area)
        added_count += 1

    try:
        db.session.commit()
        print(f"✅ Parking Seeding: {added_count} added, {skipped_count} skipped.")
    except Exception as e:
        db.session.rollback()
        print(f"❌ Database error (Parking): {e}")