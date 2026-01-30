import requests
import os

url = "http://localhost:8000/upload"
file_path = "test_file.txt"

print(f"Testing upload to {url} with {file_path}...")

if not os.path.exists(file_path):
    print(f"Error: {file_path} not found!")
    exit(1)

try:
    with open(file_path, "rb") as f:
        files = {"file": f}
        response = requests.post(url, files=files)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200 and response.json().get("status") == "success":
        print("✅ TEST PASSED: File uploaded successfully.")
    else:
        print("❌ TEST FAILED: Server returned error.")

except Exception as e:
    print(f"❌ TEST FAILED: Connection error - {e}")
    print("Ensure the backend server is running on port 8000.")
