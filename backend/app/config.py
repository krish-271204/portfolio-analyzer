import os

DATABASE_URL = os.environ.get("DATABASE_URL")
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256" 
