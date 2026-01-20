#!/usr/bin/env python3
"""
ByteBattle API Test Script
Tests all API endpoints to verify the backend is working correctly.

Requirements: pip install requests websockets
Run: python test_api.py
"""

import requests
import json
import time

BASE_URL = "http://localhost:3000/api"
WS_URL = "ws://localhost:3001"

# Store session cookie
session = requests.Session()


def print_result(name: str, success: bool, details: str = ""):
    status = "[PASS]" if success else "[FAIL]"
    print(f"{status} {name}")
    if details:
        print(f"       {details}")


def test_auth_register():
    """Test user registration"""
    username = f"testuser_{int(time.time())}"
    resp = session.post(f"{BASE_URL}/auth/register", json={
        "username": username,
        "password": "test1234"
    })
    success = resp.status_code == 200 and resp.json().get("success")
    print_result("Register", success, f"Username: {username}")
    return success, username


def test_auth_logout():
    """Test logout"""
    resp = session.post(f"{BASE_URL}/auth/logout")
    success = resp.status_code == 200
    print_result("Logout", success)
    return success


def test_auth_login(username: str):
    """Test login"""
    resp = session.post(f"{BASE_URL}/auth/login", json={
        "username": username,
        "password": "test1234"
    })
    success = resp.status_code == 200 and resp.json().get("success")
    print_result("Login", success)
    return success


def test_auth_me():
    """Test get current user"""
    resp = session.get(f"{BASE_URL}/auth/me")
    user = resp.json().get("user")
    success = resp.status_code == 200 and user is not None
    print_result("Get Current User", success, f"User: {user.get('username') if user else 'None'}")
    return success


def test_get_questions():
    """Test fetching questions"""
    resp = session.get(f"{BASE_URL}/questions", params={"category": "PSI", "count": "2"})
    data = resp.json()
    questions = data.get("questions", [])
    success = resp.status_code == 200 and len(questions) > 0
    print_result("Get Questions", success, f"Got {len(questions)} question(s)")
    return success, questions[0] if questions else None


def test_create_room():
    """Test creating a room"""
    resp = session.post(f"{BASE_URL}/rooms")
    data = resp.json()
    success = resp.status_code == 200 and data.get("success")
    room_code = data.get("room", {}).get("code")
    print_result("Create Room", success, f"Room Code: {room_code}")
    return success, room_code


def test_get_room(code: str):
    """Test getting room details"""
    resp = session.get(f"{BASE_URL}/rooms/{code}")
    data = resp.json()
    success = resp.status_code == 200 and data.get("room") is not None
    players = data.get("room", {}).get("players", [])
    print_result("Get Room Details", success, f"Players: {len(players)}")
    return success


def test_list_rooms():
    """Test listing user's rooms"""
    resp = session.get(f"{BASE_URL}/rooms")
    data = resp.json()
    rooms = data.get("rooms", [])
    success = resp.status_code == 200
    print_result("List Rooms", success, f"Found {len(rooms)} room(s)")
    return success


def test_leave_room(code: str):
    """Test leaving a room"""
    resp = session.delete(f"{BASE_URL}/rooms/{code}")
    success = resp.status_code == 200
    print_result("Leave Room", success)
    return success


def test_websocket():
    """Test WebSocket connection (basic check)"""
    try:
        import websockets
        import asyncio
        
        async def check_ws():
            try:
                async with websockets.connect(WS_URL) as ws:
                    return True
            except Exception:
                return False
        
        success = asyncio.run(check_ws())
        print_result("WebSocket Connection", success, f"Connected to {WS_URL}")
        return success
    except ImportError:
        print_result("WebSocket Connection", False, "websockets not installed (pip install websockets)")
        return False
    except Exception as e:
        print_result("WebSocket Connection", False, str(e))
        return False


def main():
    print("\n" + "="*50)
    print("  ByteBattle API Test Suite")
    print("="*50 + "\n")
    
    results = []
    
    # Auth Tests
    print("--- Authentication Tests ---")
    success, username = test_auth_register()
    results.append(success)
    
    results.append(test_auth_logout())
    results.append(test_auth_login(username))
    results.append(test_auth_me())
    
    print()
    
    # Questions Test
    print("--- Questions API ---")
    success, question = test_get_questions()
    results.append(success)
    
    print()
    
    # Room Tests
    print("--- Room Management ---")
    success, room_code = test_create_room()
    results.append(success)
    
    if room_code:
        results.append(test_get_room(room_code))
        results.append(test_list_rooms())
        results.append(test_leave_room(room_code))
    
    print()
    
    # WebSocket Test
    print("--- WebSocket ---")
    results.append(test_websocket())
    
    # Summary
    print("\n" + "="*50)
    passed = sum(results)
    total = len(results)
    print(f"  Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("  All tests passed! API is working correctly.")
    else:
        print("  Some tests failed. Check the output above.")
    print("="*50 + "\n")


if __name__ == "__main__":
    main()
