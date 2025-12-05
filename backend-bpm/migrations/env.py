import logging
from logging.config import fileConfig

from flask import current_app

from alembic import context
from geoalchemy2 import alembic_helpers

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name)
logger = logging.getLogger('alembic.env')

# Tables to exclude from migrations
EXCLUDED_TABLES = {
    # PostGIS System Tables
    'spatial_ref_sys', 'geometry_columns', 'geography_columns', 
    'raster_columns', 'raster_overviews',
    
    # Tiger Geocoder System & Lookup Tables
    'place_lookup', 'layers', 'topology', 'zip_lookup', 'geocode_settings', 
    'loader_lookups', 'loader_platform', 'loader_variables', 'pagc_gaz', 
    'pagc_lex', 'pagc_rules', 'street_type_lookup', 'direction_lookup', 
    'secondary_unit_lookup', 'state_lookup', 'county_lookup', 'countysub_lookup', 
    'zip_lookup_base', 'zip_state', 'zip_state_loc',
    
    # Tiger Data Tables
    'place', 'tract', 'county', 'featnames', 'bg', 'geocode_settings_default',
    'tabblock20', 'zcta5', 'faces', 'edges', 'tabblock', 'addrfeat',
    'loader_lookuptables', 'layer', 'cousub', 'state', 'addr', 'zip_lookup_all'
}

def include_object(object, name, type_, reflected, compare_to):
    """
    Determines if a database object should be included in the migration.
    Combines custom filtering with GeoAlchemy2's include_object helper.
    """
    # First, apply GeoAlchemy2's filter
    if not alembic_helpers.include_object(object, name, type_, reflected, compare_to):
        return False
    
    # Then, apply our custom PostGIS/Tiger table filter
    if type_ == "table" and name in EXCLUDED_TABLES:
        return False
        
    return True


def get_engine():
    try:
        # this works with Flask-SQLAlchemy<3 and Alchemical
        return current_app.extensions['migrate'].db.get_engine()
    except (TypeError, AttributeError):
        # this works with Flask-SQLAlchemy>=3
        return current_app.extensions['migrate'].db.engine


def get_engine_url():
    try:
        return get_engine().url.render_as_string(hide_password=False).replace(
            '%', '%%')
    except AttributeError:
        return str(get_engine().url).replace('%', '%%')


# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
config.set_main_option('sqlalchemy.url', get_engine_url())
target_db = current_app.extensions['migrate'].db


def get_metadata():
    if hasattr(target_db, 'metadatas'):
        return target_db.metadatas[None]
    return target_db.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=get_metadata(),
        literal_binds=True,
        include_object=include_object,
        process_revision_directives=alembic_helpers.writer,
        render_item=alembic_helpers.render_item,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""

    def process_revision_directives(context, revision, directives):
        if getattr(config.cmd_opts, 'autogenerate', False):
            script = directives[0]
            if script.upgrade_ops.is_empty():
                directives[:] = []
                logger.info('No changes in schema detected.')
        # Call GeoAlchemy2's writer
        alembic_helpers.writer(context, revision, directives)

    connectable = get_engine()

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=get_metadata(),
            include_object=include_object,
            process_revision_directives=process_revision_directives,
            render_item=alembic_helpers.render_item,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
