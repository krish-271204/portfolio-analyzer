from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import yfinance as yf
from .models import Order
from .auth import get_current_user, get_db

router = APIRouter()

@router.get("/portfolio/analysis")
def analyze_portfolio(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.date).all()
    if not orders:
        return {
            "total_investment": 0,
            "total_current_value": 0,
            "total_profit_loss": 0,
            "realized_profit": 0,
            "unrealized_profit": 0,
            "holdings": [],
            "orders": [],
        }

    # 1. Calculate holdings and realized profit
    holdings = {}  # symbol -> {quantity, avg_buy_price, investment}
    realized_profit = 0
    order_history = []

    for order in orders:
        symbol = order.symbol
        if symbol not in holdings:
            holdings[symbol] = {
                "quantity": 0,
                "avg_buy_price": 0,
                "investment": 0,
                "buy_lots": [],  # For FIFO realized P&L
            }
        if order.type == "buy":
            # Add to holdings
            prev_qty = holdings[symbol]["quantity"]
            prev_investment = holdings[symbol]["investment"]
            new_qty = prev_qty + order.quantity
            new_investment = prev_investment + order.quantity * order.price
            holdings[symbol]["quantity"] = new_qty
            holdings[symbol]["investment"] = new_investment
            holdings[symbol]["avg_buy_price"] = new_investment / new_qty if new_qty else 0
            holdings[symbol]["buy_lots"].append({"quantity": order.quantity, "price": order.price})
        elif order.type == "sell":
            sell_qty = order.quantity
            sell_price = order.price
            # FIFO: match sell with buy lots
            buy_lots = holdings[symbol]["buy_lots"]
            while sell_qty > 0 and buy_lots:
                lot = buy_lots[0]
                lot_qty = lot["quantity"]
                if lot_qty > sell_qty:
                    realized_profit += (sell_price - lot["price"]) * sell_qty
                    lot["quantity"] -= sell_qty
                    holdings[symbol]["quantity"] -= sell_qty
                    holdings[symbol]["investment"] -= sell_qty * lot["price"]
                    sell_qty = 0
                else:
                    realized_profit += (sell_price - lot["price"]) * lot_qty
                    holdings[symbol]["quantity"] -= lot_qty
                    holdings[symbol]["investment"] -= lot_qty * lot["price"]
                    sell_qty -= lot_qty
                    buy_lots.pop(0)
            # If more sold than held, ignore extra (or could error)
            holdings[symbol]["avg_buy_price"] = (holdings[symbol]["investment"] / holdings[symbol]["quantity"]) if holdings[symbol]["quantity"] else 0
        order_history.append({
            "id": str(order.id),
            "symbol": order.symbol,
            "quantity": order.quantity,
            "price": order.price,
            "date": order.date.strftime("%Y-%m-%d"),
            "type": order.type,
        })

    # 2. Calculate unrealized profit and fetch market prices
    total_investment = 0
    total_current_value = 0
    unrealized_profit = 0
    holdings_list = []
    for symbol, h in holdings.items():
        if h["quantity"] <= 0:
            continue
        try:
            ticker = yf.Ticker(symbol)
            price_data = ticker.history(period="1d")
            if price_data.empty:
                market_price = None
            else:
                market_price = float(price_data["Close"].iloc[-1])
            # Fetch day change percent
            info = ticker.info
            day_change_percent = None
            if "regularMarketChangePercent" in info and info["regularMarketChangePercent"] is not None:
                day_change_percent = info["regularMarketChangePercent"]
            elif not price_data.empty and "Open" in price_data.columns and price_data["Open"].iloc[-1] != 0:
                day_change_percent = ((price_data["Close"].iloc[-1] - price_data["Open"].iloc[-1]) / price_data["Open"].iloc[-1]) * 100
            else:
                day_change_percent = 0
        except Exception:
            market_price = None
            day_change_percent = 0
        investment = h["quantity"] * h["avg_buy_price"]
        current_value = h["quantity"] * (market_price if market_price is not None else 0)
        unrealized = current_value - investment
        total_investment += investment
        total_current_value += current_value
        unrealized_profit += unrealized
        holdings_list.append({
            "symbol": symbol,
            "quantity": h["quantity"],
            "avg_buy_price": h["avg_buy_price"],
            "investment": investment,
            "market_price": market_price,
            "current_value": current_value,
            "unrealized_profit": unrealized,
            "day_change_percent": day_change_percent,
            # allocation_percent will be added after total_current_value is known
        })
    # Add allocation_percent to each holding
    for h in holdings_list:
        h["allocation_percent"] = (h["current_value"] / total_current_value * 100) if total_current_value else 0

    total_profit_loss = total_current_value + realized_profit - total_investment

    return {
        "total_investment": total_investment,
        "total_current_value": total_current_value,
        "total_profit_loss": total_profit_loss,
        "realized_profit": realized_profit,
        "unrealized_profit": unrealized_profit,
        "holdings": holdings_list,
        "orders": order_history,
    } 
