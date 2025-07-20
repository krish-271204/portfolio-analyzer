from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta
import yfinance as yf
from collections import defaultdict
import math
from .models import Order
from .auth import get_current_user, get_db
import os
import psycopg2
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta
from collections import defaultdict

router = APIRouter()

# Market cap thresholds (in Indian Rupees crores)
MARKET_CAP_THRESHOLDS = {
    'large_cap': 67000,  # Above ₹67,000 cr.
    'mid_cap': 22000,    # From ₹22,000 - 67,000 cr.
    'small_cap': 22000   # Below ₹22,000 cr.
}

DB_URL = os.getenv('DATABASE_URL')

def get_market_cap_category(market_cap_crores: float) -> str:
    """Categorize stock by market cap (market_cap in Indian Rupees crores)"""
    if market_cap_crores > MARKET_CAP_THRESHOLDS['large_cap']:
        return 'Large Cap'
    elif market_cap_crores > MARKET_CAP_THRESHOLDS['mid_cap']:
        return 'Mid Cap'
    else:
        return 'Small Cap'

@router.get("/portfolio/composition")
def get_portfolio_composition(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get portfolio composition including sector and market cap allocation"""
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.date).all()
    
    if not orders:
        return {
            "sector_allocation": {},
            "market_cap_allocation": {},
            "holdings": []
        }

    # Calculate holdings
    holdings = {}
    for order in orders:
        symbol = order.symbol
        if symbol not in holdings:
            holdings[symbol] = {"quantity": 0, "avg_buy_price": 0, "investment": 0}
        
        if order.type == "buy":
            prev_qty = holdings[symbol]["quantity"]
            prev_investment = holdings[symbol]["investment"]
            new_qty = prev_qty + order.quantity
            new_investment = prev_investment + order.quantity * order.price
            holdings[symbol]["quantity"] = new_qty
            holdings[symbol]["investment"] = new_investment
            holdings[symbol]["avg_buy_price"] = new_investment / new_qty if new_qty else 0
        elif order.type == "sell":
            holdings[symbol]["quantity"] -= order.quantity
            holdings[symbol]["investment"] -= order.quantity * holdings[symbol]["avg_buy_price"]

    # Filter out zero or negative holdings
    current_holdings = {k: v for k, v in holdings.items() if v["quantity"] > 0}

    # Calculate sector allocation
    sector_allocation = defaultdict(float)
    market_cap_allocation = defaultdict(float)
    holdings_with_details = []

    total_portfolio_value = 0

    for symbol, holding in current_holdings.items():
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            # Fetch sector dynamically
            sector = info.get("sector", "Others")
            # Fetch market cap dynamically
            market_cap = info.get("marketCap", None)
            # Try alternative market cap fields
            if market_cap is None or market_cap > 1e12:  # If > 1 trillion USD, likely wrong
                market_cap = info.get("market_cap", None)
            if market_cap is None or market_cap > 1e12:
                market_cap = info.get("marketCap", None)
            # Get current market price
            price_data = ticker.history(period="1d")
            if not price_data.empty:
                current_price = float(price_data["Close"].iloc[-1])
            else:
                current_price = holding["avg_buy_price"]  # Fallback to buy price
            current_value = holding["quantity"] * current_price
            total_portfolio_value += current_value
            # Sector allocation
            sector_allocation[sector] += current_value
            # Market cap allocation (use real market cap if available)
            if market_cap is not None and market_cap < 1e15:  # Sanity check: < 1 quadrillion INR
                # yfinance returns market cap in INR, convert to crores
                market_cap_inr_crores = market_cap / 1e7  # Convert INR to crores
                market_cap_category = get_market_cap_category(market_cap_inr_crores)
            else:
                market_cap_category = "Unknown"
            market_cap_allocation[market_cap_category] += current_value
            holdings_with_details.append({
                "symbol": symbol,
                "quantity": holding["quantity"],
                "avg_buy_price": holding["avg_buy_price"],
                "current_price": current_price,
                "current_value": current_value,
                "sector": sector,
                "market_cap_category": market_cap_category,
                "market_cap": market_cap
            })
        except Exception as e:
            print(f"Error processing {symbol}: {e}")
            continue

    # Convert to percentages
    sector_allocation_pct = {}
    market_cap_allocation_pct = {}
    
    if total_portfolio_value > 0:
        for sector, value in sector_allocation.items():
            sector_allocation_pct[sector] = {
                "value": value,
                "percentage": (value / total_portfolio_value) * 100
            }
        for category, value in market_cap_allocation.items():
            market_cap_allocation_pct[category] = {
                "value": value,
                "percentage": (value / total_portfolio_value) * 100
            }

    return {
        "sector_allocation": sector_allocation_pct,
        "market_cap_allocation": market_cap_allocation_pct,
        "holdings": holdings_with_details,
        "total_portfolio_value": total_portfolio_value
    }

@router.get("/portfolio/performance")
def get_performance_analysis(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get only top gainers and losers for the user's portfolio."""
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.date).all()
    
    if not orders:
        return {
            "top_gainers": [],
            "top_losers": []
        }

    holdings = {}
    for order in orders:
        symbol = order.symbol
        if symbol not in holdings:
            holdings[symbol] = {
                "quantity": 0,
                "avg_buy_price": 0,
                "investment": 0,
                "buy_lots": [],
            }
        if order.type == "buy":
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
            buy_lots = holdings[symbol]["buy_lots"]
            while sell_qty > 0 and buy_lots:
                lot = buy_lots[0]
                lot_qty = lot["quantity"]
                if lot_qty > sell_qty:
                    lot["quantity"] -= sell_qty
                    holdings[symbol]["quantity"] -= sell_qty
                    holdings[symbol]["investment"] -= sell_qty * lot["price"]
                    sell_qty = 0
                else:
                    holdings[symbol]["quantity"] -= lot_qty
                    holdings[symbol]["investment"] -= lot_qty * lot["price"]
                    sell_qty -= lot_qty
                    buy_lots.pop(0)
            holdings[symbol]["avg_buy_price"] = (holdings[symbol]["investment"] / holdings[symbol]["quantity"]) if holdings[symbol]["quantity"] else 0

    # Calculate stock performance
    stock_performance = []
    for symbol, holding in holdings.items():
        if holding["quantity"] <= 0:
            continue
        try:
            ticker = yf.Ticker(symbol)
            price_data = ticker.history(period="1d")
            if price_data.empty:
                current_price = None
            else:
                current_price = float(price_data["Close"].iloc[-1])
            if current_price is None or current_price == 0:
                continue
            investment = holding["quantity"] * holding["avg_buy_price"]
            profit_loss = (holding["quantity"] * current_price) - investment
            return_percentage = (profit_loss / investment) * 100 if investment > 0 else 0
            stock_performance.append({
                "symbol": symbol,
                "investment": investment,
                "profit_loss": profit_loss,
                "return_percentage": return_percentage,
                "current_price": current_price
            })
        except Exception as e:
            print(f"Error processing {symbol}: {e}")
            continue

    # Sort by return percentage
    stock_performance.sort(key=lambda x: x["return_percentage"], reverse=True)
    # Only positive returns in gainers, negative in losers
    top_gainers = [s for s in stock_performance if s["return_percentage"] > 0][:5]
    top_losers = [s for s in reversed(stock_performance) if s["return_percentage"] < 0][:5]

    return {
        "top_gainers": top_gainers,
        "top_losers": top_losers
    }

@router.get("/portfolio/behavior")
def get_transaction_behavior(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get transaction behavior analysis including holding time, win rate, trading frequency"""
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.date).all()
    
    if not orders:
        return {
            "average_holding_time": 0,
            "win_rate": 0,
            "trading_frequency": 0,
            "total_trades": 0
        }

    # Group orders by symbol to calculate holding periods
    symbol_orders = defaultdict(list)
    for order in orders:
        symbol_orders[order.symbol].append(order)

    holding_periods = []
    profitable_trades = 0
    total_trades = 0

    for symbol, symbol_order_list in symbol_orders.items():
        # Sort orders by date
        symbol_order_list.sort(key=lambda x: x.date)
        
        buy_orders = [o for o in symbol_order_list if o.type == "buy"]
        sell_orders = [o for o in symbol_order_list if o.type == "sell"]
        
        # Calculate holding periods for completed trades
        for sell_order in sell_orders:
            # Find corresponding buy orders (FIFO)
            remaining_sell_qty = sell_order.quantity
            sell_price = sell_order.price
            
            for buy_order in buy_orders:
                if remaining_sell_qty <= 0:
                    break
                    
                if buy_order.quantity > 0:
                    trade_qty = min(remaining_sell_qty, buy_order.quantity)
                    holding_period = (sell_order.date - buy_order.date).days
                    
                    if holding_period > 0:
                        holding_periods.append(holding_period)
                        
                        # Calculate if trade was profitable
                        buy_price = buy_order.price
                        profit = (sell_price - buy_price) * trade_qty
                        if profit > 0:
                            profitable_trades += 1
                        total_trades += 1
                    
                    remaining_sell_qty -= trade_qty
                    buy_order.quantity -= trade_qty

    # Calculate metrics
    average_holding_time = sum(holding_periods) / len(holding_periods) if holding_periods else 0
    win_rate = (profitable_trades / total_trades) * 100 if total_trades > 0 else 0
    
    # Trading frequency (trades per month)
    if orders:
        first_order = min(orders, key=lambda x: x.date)
        last_order = max(orders, key=lambda x: x.date)
        days_span = (last_order.date - first_order.date).days
        months_span = days_span / 30.44  # Average days per month
        trading_frequency = total_trades / months_span if months_span > 0 else 0
    else:
        trading_frequency = 0

    return {
        "average_holding_time": round(average_holding_time, 1),
        "win_rate": round(win_rate, 2),
        "trading_frequency": round(trading_frequency, 2),
        "total_trades": total_trades,
        "profitable_trades": profitable_trades
    } 
