from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from .auth import get_current_user, get_db
from .models import Order
import csv
import uuid
from datetime import datetime
import pandas as pd
import io

router = APIRouter()

# Keyword mapping for schema normalization
KEYWORDS = {
    "symbol": ["symbol", "stock", "security", "ticker"],
    "type": ["type", "buy/sell", "transaction", "side"],
    "quantity": ["quantity", "qty", "shares"],
    "price": ["price", "rate", "buy price", "sell price"],
    "execution_time": ["execution", "trade time", "order time"]
}

NORMALIZED_COLS = ["symbol", "type", "quantity", "price", "execution_time"]


def detect_and_normalize_header(df):
    # Scan first 10 rows for header
    for i in range(min(10, len(df))):
        row = df.iloc[i].astype(str).str.strip().tolist()
        lower_row = [cell.lower() for cell in row]
        col_map = {}
        # Only allow exact match for 'Symbol'
        symbol_idx = None
        for idx, cell in enumerate(row):
            if cell.strip().lower() == "symbol":
                col_map[idx] = "symbol"
                symbol_idx = idx
        if symbol_idx is None:
            continue  # No exact 'Symbol' column in this row
        # Use keyword matching for other fields (not for symbol)
        for idx, cell in enumerate(lower_row):
            if idx == symbol_idx:
                continue
            for norm, keys in KEYWORDS.items():
                if norm == "symbol":
                    continue  # only allow exact match for symbol
                if any(k in cell for k in keys):
                    col_map[idx] = norm
        # If we found at least 3 required columns, treat this as header
        if len(col_map) >= 3 and "symbol" in col_map.values() and "type" in col_map.values():
            # Normalize columns
            norm_cols = [col_map.get(j, None) for j in range(len(row))]
            df = df.iloc[i+1:].reset_index(drop=True)
            df.columns = norm_cols
            # Drop columns that are not mapped
            df = df[[c for c in NORMALIZED_COLS if c in df.columns]]
            return df
    raise HTTPException(status_code=400, detail="Could not detect header row with required columns (exact 'Symbol' column required).")

@router.post("/import")
def import_csv(file: UploadFile = File(...), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    filename = file.filename.lower()
    if filename.endswith('.csv'):
        content = file.file.read()
        df = pd.read_csv(io.StringIO(content.decode('utf-8')), header=None)
    elif filename.endswith('.xlsx'):
        content = file.file.read()
        df = pd.read_excel(io.BytesIO(content), header=None)
    else:
        raise HTTPException(status_code=400, detail="Only CSV and XLSX files are supported.")

    # Detect and normalize header
    df = detect_and_normalize_header(df)

    processed = 0
    imported = 0
    skipped = 0
    errors = []

    for idx, row in df.iterrows():
        processed += 1
        symbol = str(row.get("symbol", "")).strip()
        if symbol:
            symbol = symbol + ".NS"
        type_ = str(row.get("type", "")).strip().lower()
        quantity = row.get("quantity", "")
        price = row.get("price", "")
        exec_time = row.get("execution_time", "")

        # Validation
        if not symbol:
            skipped += 1
            errors.append({"row": idx+2, "error": "Missing symbol"})
            continue
        if type_ not in ("buy", "sell"):
            skipped += 1
            errors.append({"row": idx+2, "error": "Invalid or missing type (must be 'buy' or 'sell')"})
            continue
        try:
            quantity = float(quantity)
        except Exception:
            skipped += 1
            errors.append({"row": idx+2, "error": "Invalid quantity"})
            continue
        try:
            price = float(price)
        except Exception:
            skipped += 1
            errors.append({"row": idx+2, "error": "Invalid price"})
            continue
        # Divide price by quantity
        try:
            price = price / quantity
        except Exception:
            skipped += 1
            errors.append({"row": idx+2, "error": "Division error: price/quantity"})
            continue
        # Robust date/time parsing
        try:
            if exec_time:
                # Try parsing with pandas, dayfirst=True, errors='raise'
                date_obj = pd.to_datetime(str(exec_time).strip(), errors='raise', dayfirst=True, infer_datetime_format=True)
                # If date_obj is a pandas Timestamp, convert to python datetime
                if hasattr(date_obj, 'to_pydatetime'):
                    date_obj = date_obj.to_pydatetime()
            else:
                date_obj = datetime.now()
        except Exception as e:
            skipped += 1
            errors.append({"row": idx+2, "error": f"Invalid execution_time/date format: {exec_time} ({e})"})
            continue

        # Save to DB
        order = Order(
            id=uuid.uuid4(),
            user_id=current_user.id,
            symbol=symbol,
            quantity=quantity,
            price=price,
            date=date_obj,
            type=type_,
        )
        db.add(order)
        imported += 1
    db.commit()

    return {
        "processed": processed,
        "imported": imported,
        "skipped": skipped,
        "errors": errors
    } 