from app.database import Base, engine
import app.models  # Make sure this imports all your models
from sqlalchemy import inspect

if __name__ == "__main__":
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    print("Tables created! Current tables:", inspector.get_table_names())