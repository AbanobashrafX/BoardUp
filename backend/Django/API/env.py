import os

import environ
from django.core.exceptions import ImproperlyConfigured

# Initialize environment variables
env = environ.Env()

# Set the project base directory
BASE_DIR = environ.Path(__file__) - 2

# Take environment variables from .env file if it exists
env.read_env(os.path.join(BASE_DIR, ".env"))

# Don't override env file if ENV_PATH is specified
if "ENV_PATH" in os.environ:
    env.read_env(env.str("ENV_PATH"))


def env_to_enum(enum_cls, value):
    """Convert environment variable to enum"""
    for x in enum_cls:
        if x.value == value:
            return x
    raise ImproperlyConfigured(
        f"Env value {repr(value)} could not be found in {repr(enum_cls)}"
    )
