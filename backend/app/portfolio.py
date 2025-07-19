from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime
import uuid
from .models import Order
from .database import SessionLocal
from .auth import get_current_user, get_db

router = APIRouter()

# Pydantic Schemas
class OrderBase(BaseModel):
    symbol: str = Field(..., example="INFY.NS")
    quantity: float
    price: float
    date: datetime
    type: str = Field(..., example="buy")  # 'buy' or 'sell'

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    quantity: float | None = None
    price: float | None = None
    date: datetime | None = None
    type: str | None = None

class OrderOut(OrderBase):
    id: uuid.UUID
    class Config:
        orm_mode = True

# Add order
@router.post("/orders/add", response_model=OrderOut)
def add_order(order_in: OrderCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    order = Order(
        id=uuid.uuid4(),
        user_id=current_user.id,
        symbol=order_in.symbol,
        quantity=order_in.quantity,
        price=order_in.price,
        date=order_in.date,
        type=order_in.type,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

# Get all orders for user
@router.get("/orders", response_model=List[OrderOut])
def get_orders(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    orders = db.query(Order).filter(Order.user_id == current_user.id).all()
    return orders

# Update order
@router.put("/orders/update/{order_id}", response_model=OrderOut)
def update_order(order_id: uuid.UUID, order_in: OrderUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this order")
    if order_in.quantity is not None:
        order.quantity = order_in.quantity
    if order_in.price is not None:
        order.price = order_in.price
    if order_in.date is not None:
        order.date = order_in.date
    if order_in.type is not None:
        order.type = order_in.type
    db.commit()
    db.refresh(order)
    return order

# Delete order
@router.delete("/orders/delete/{order_id}", status_code=204)
def delete_order(order_id: uuid.UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this order")
    db.delete(order)
    db.commit()
    return None

@router.delete("/orders/all")
def delete_all_orders(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db.query(Order).filter(Order.user_id == current_user.id).delete()
    db.commit()
    return {"message": "All orders deleted successfully."} 